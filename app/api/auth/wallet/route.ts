import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { createPublicClient, http, verifyMessage } from 'viem';
import { base, mainnet } from 'viem/chains';
import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

// POST /api/auth/wallet
// Body: { message, signature, chainId }
// Verifies an SIWE message, then upserts a user keyed by wallet_address
// and creates a session — same session shape as email login.

const CHAIN_BY_ID: Record<number, typeof base | typeof mainnet> = {
  [base.id]: base,
  [mainnet.id]: mainnet,
};

export async function POST(request: NextRequest) {
  try {
    const { message, signature, chainId } = await request.json();
    if (!message || !signature) {
      return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
    }

    const siwe = new SiweMessage(message);

    // Domain + nonce checks are done client-side at message construction;
    // here we verify the signature actually signs this message.
    const wagmiChain = CHAIN_BY_ID[siwe.chainId ?? chainId] ?? base;
    const publicClient = createPublicClient({ chain: wagmiChain, transport: http() });

    const valid = await publicClient.verifyMessage({
      address: siwe.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const walletAddress = siwe.address.toLowerCase();
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

    // Upsert user by wallet address. Links to an existing email account
    // only if that account has no wallet yet AND the SIWE statement requested linking.
    let user = await pool.query(
      'SELECT id, email, role FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      // Statement may carry an email to link: "link:<email>"
      const linkMatch = siwe.statement?.match(/^link:(.+)$/);
      if (linkMatch) {
        const email = linkMatch[1].toLowerCase();
        const linked = await pool.query(
          `UPDATE users SET wallet_address = $1, updated_at = NOW()
           WHERE email = $2 AND wallet_address IS NULL
           RETURNING id, email, role`,
          [walletAddress, email]
        );
        if (linked.rows.length > 0) {
          user = linked;
        }
      }
    }

    if (user.rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO users (id, username, wallet_address, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         RETURNING id, email, role`,
        [randomUUID(), `0x${walletAddress.slice(2, 6)}…${walletAddress.slice(-4)}`, walletAddress]
      );
      user = created;
    }

    const userId = user.rows[0].id;

    // Session — same shape/flow as email login (sessions table + httpOnly cookie).
    const sessionToken = randomUUID() + randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      `INSERT INTO sessions (user_id, session_token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, sessionToken, expiresAt]
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.rows[0].email,
        role: user.rows[0].role,
        wallet_address: walletAddress,
      },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });
    // Some legacy routes read user_id directly from cookies
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json({ error: 'Wallet authentication failed' }, { status: 500 });
  }
}
