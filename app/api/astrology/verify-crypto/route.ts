import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Log } from 'viem';
import { base } from 'viem/chains';
import { Pool } from '@neondatabase/serverless';
import { CHAINS, getPurchaseToken, getTreasuryAddress } from '@/lib/token';
import { READING_CRYPTO_USD } from '@/lib/reading-pricing';

// POST /api/astrology/verify-crypto
// Body: { txHash, chainId, readingType: 'transit' | 'birthchart' }
// Verifies an on-chain USDC transfer user → treasury for the crypto reading
// price, then returns a payment reference the reading APIs accept. The actual
// reading row is created when the client immediately calls the reading API
// with `cryptoPaymentId` — so verification and generation are one user flow
// but the payment check stays server-side and idempotent.

const CHAIN_BY_ID: Record<number, typeof base> = {
  [base.id]: base,
};

const MIN_CONFIRMATIONS = 12;

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { txHash, chainId, readingType } = await request.json();
    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 });
    }
    if (readingType !== 'transit' && readingType !== 'birthchart') {
      return NextResponse.json({ error: 'Invalid reading type' }, { status: 400 });
    }

    const wagmiChain = CHAIN_BY_ID[chainId];
    const chainConfig = CHAINS[chainId];
    if (!wagmiChain || !chainConfig?.enabled) {
      return NextResponse.json({ error: 'Purchase rail not enabled on this chain' }, { status: 400 });
    }

    const treasury = getTreasuryAddress();
    if (!treasury) return NextResponse.json({ error: 'Treasury not configured' }, { status: 500 });

    const token = getPurchaseToken(chainId);
    if (!token) return NextResponse.json({ error: 'Purchase token not configured' }, { status: 500 });

    const publicClient = createPublicClient({ chain: wagmiChain, transport: http() });

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 400 });
    }

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

    let totalRaw = 0n;
    for (const log of transferLogs) totalRaw += BigInt(log.data);
    const amountUsdc = Number(totalRaw) / 10 ** token.decimals;

    // Method-specific crypto price — exact amount required
    const expected = READING_CRYPTO_USD;
    if (amountUsdc + 1e-9 < expected) {
      return NextResponse.json(
        { error: `Amount too low — ${readingType === 'transit' ? 'Transit' : 'Birth Chart'} reading costs ${expected} ${token.symbol}` },
        { status: 400 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

    // Idempotency: one verification per tx hash, ever
    const seen = await pool.query(
      `SELECT id FROM reading_crypto_payments WHERE tx_hash = $1 LIMIT 1`,
      [txHash]
    );
    if (seen.rows.length > 0) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 });
    }

    const cryptoPaymentId = `crypto_${readingType}_${crypto.randomUUID()}`;
    await pool.query(
      `INSERT INTO reading_crypto_payments (id, user_id, tx_hash, chain_id, amount_usdc, reading_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cryptoPaymentId, userId, txHash, chainId, amountUsdc, readingType]
    );

    return NextResponse.json({
      success: true,
      cryptoPaymentId,
      amountUsdc,
      readingType,
    });
  } catch (error) {
    console.error('Crypto reading verification error:', error);
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 });
  }
}

function padAddress(addr: string): string {
  return ('0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0')) as `0x${string}`;
}
