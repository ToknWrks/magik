import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import { createUserAccount, createSession } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

const PACKAGES: Record<string, { credits: number; amount: number; label: string }> = {
  single:   { credits: 100, amount: 500,  label: 'Solomon Starter — 100 tokens' },
  standard: { credits: 300, amount: 1200, label: 'Solomon 3-Pack — 300 tokens' },
  premium:  { credits: 600, amount: 2000, label: 'Solomon 6-Pack — 600 tokens' },
};

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, packageId, email, password } = await request.json();

    if (!email || !packageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const isDev = process.env.NODE_ENV === 'development';
    const devBypass = isDev && paymentIntentId === 'dev_bypass';

    if (!devBypass) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }
      if (intent.amount !== pkg.amount) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }
    }

    // Get or create user
    const existingUserId = request.cookies.get('user_id')?.value;
    let user = existingUserId
      ? (await pool.query('SELECT * FROM users WHERE id = $1', [existingUserId])).rows[0]
      : null;

    let sessionToken: string | null = null;
    let accountCreated = false;

    if (!user) {
      user = await createUserAccount(email, password);
      sessionToken = await createSession(user.id);
      accountCreated = true;
    }

    // Grant tokens
    await pool.query(`
      INSERT INTO user_credits (user_id, balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = user_credits.balance + $2, updated_at = NOW()
    `, [user.id, pkg.credits]);

    await pool.query(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'purchase', $3)
    `, [user.id, pkg.credits, pkg.label]);

    const balanceResult = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [user.id]
    );

    const res = NextResponse.json({
      success: true,
      accountCreated,
      balance: balanceResult.rows[0].balance,
    });

    res.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Solomon signup error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to complete signup', details: msg }, { status: 500 });
  }
}
