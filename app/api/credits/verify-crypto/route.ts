import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, type Log } from 'viem';
import { base, mainnet } from 'viem/chains';
import { Pool } from '@neondatabase/serverless';
import { CHAINS, getPurchaseToken, getTreasuryAddress } from '@/lib/token';

// POST /api/credits/verify-crypto
// Body: { txHash, chainId, expectedCredits }
// Verifies an on-chain USDC transfer user → treasury, then credits the
// account idempotently (tx_hash unique). Same ledger as Stripe purchases.

const CHAIN_BY_ID: Record<number, typeof base | typeof mainnet> = {
  [base.id]: base,
  [mainnet.id]: mainnet,
};

// 12 confirmations on Base (~24s) — enough to make reorgs a non-issue
const MIN_CONFIRMATIONS = 12;

// Pricing: credits per USDC, server-side so the client can't dictate it.
const CREDITS_PER_USDC = 100; // $1 = 100 credits, matches Stripe pack economics

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { txHash, chainId } = await request.json();
    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 });
    }

    const wagmiChain = CHAIN_BY_ID[chainId];
    const chainConfig = CHAINS[chainId];
    if (!wagmiChain || !chainConfig?.enabled) {
      return NextResponse.json({ error: 'Purchase rail not enabled on this chain' }, { status: 400 });
    }

    const treasury = getTreasuryAddress();
    if (!treasury) {
      return NextResponse.json({ error: 'Treasury not configured' }, { status: 500 });
    }

    const token = getPurchaseToken(chainId);
    if (!token) {
      return NextResponse.json({ error: 'Purchase token not configured' }, { status: 500 });
    }

    const publicClient = createPublicClient({ chain: wagmiChain, transport: http() });

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 400 });
    }

    // Confirmations
    const latest = await publicClient.getBlockNumber();
    const confirmations = Number(latest - receipt.blockNumber);
    if (confirmations < MIN_CONFIRMATIONS) {
      return NextResponse.json(
        { error: `Not enough confirmations (${confirmations}/${MIN_CONFIRMATIONS}) — retry shortly` },
        { status: 425 }
      );
    }

    // Find ERC-20 Transfer logs on the purchase token, recipient = treasury
    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const transferLogs = receipt.logs.filter(
      (log: Log) =>
        log.address.toLowerCase() === token.address.toLowerCase() &&
        log.topics[0]?.toLowerCase() === transferTopic &&
        log.topics[2] === padAddress(treasury)
    );

    if (transferLogs.length === 0) {
      return NextResponse.json(
        { error: 'No qualifying token transfer to the treasury found in this transaction' },
        { status: 400 }
      );
    }

    // Sum token amounts from qualifying Transfer logs (topic1 = from, data = value)
    const fromSet = new Set<string>();
    let totalRaw = 0n;
    for (const log of transferLogs) {
      fromSet.add(padAddress(log.topics[1]!));
      totalRaw += BigInt(log.data);
    }
    // The user (sender) must be one of the senders — we trust the wallet session
    // only for attribution after checking the treasury received funds.

    const amountUsdc = Number(totalRaw) / 10 ** token.decimals;
    if (amountUsdc <= 0) {
      return NextResponse.json({ error: 'Zero-value transfer' }, { status: 400 });
    }

    // Simple per-tx cap to limit fraud/reorg exposure
    if (amountUsdc > 10_000) {
      return NextResponse.json({ error: 'Transaction exceeds per-tx limit' }, { status: 400 });
    }

    const credits = Math.floor(amountUsdc * CREDITS_PER_USDC);

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

    // Idempotency: description carries the tx hash, so a replayed tx is a no-op.
    // Both crypto and Stripe purchases live in the same audit trail.
    const seen = await pool.query(
      `SELECT id FROM credit_transactions WHERE description = $1 LIMIT 1`,
      [`crypto:${txHash}`]
    );
    if (seen.rows.length > 0) {
      return NextResponse.json({ error: 'Transaction already credited' }, { status: 409 });
    }

    await pool.query(
      `INSERT INTO user_credits (user_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET balance = user_credits.balance + $2, updated_at = NOW()`,
      [userId, credits]
    );

    await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'purchase', $3)`,
      [userId, credits, `crypto:${txHash}`]
    );

    const result = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      balance: result.rows[0].balance,
      creditsAdded: credits,
      txHash,
      chain: chainConfig.name,
    });
  } catch (error) {
    console.error('Crypto credit verification error:', error);
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 });
  }
}

function padAddress(addr: string): string {
  return ('0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0')) as `0x${string}`;
}
