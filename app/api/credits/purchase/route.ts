import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import Stripe from 'stripe';

const PACKAGES: Record<string, { credits: number; amount: number; label: string }> = {
  single:   { credits: 100, amount: 500,  label: 'Single Session (100 credits)' },
  standard: { credits: 300, amount: 1200, label: '3-Pack (300 credits)' },
  premium:  { credits: 600, amount: 2000, label: '6-Pack (600 credits)' },
};

export async function POST(request: NextRequest) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { paymentIntentId, packageId } = await request.json();
    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev || paymentIntentId !== 'dev_bypass') {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
      }
      if (intent.amount !== pkg.amount) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }
    }

    await pool.query(`
      INSERT INTO user_credits (user_id, balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = user_credits.balance + $2, updated_at = NOW()
    `, [userId, pkg.credits]);

    await pool.query(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'purchase', $3)
    `, [userId, pkg.credits, pkg.label]);

    const result = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({ success: true, balance: result.rows[0].balance, creditsAdded: pkg.credits });
  } catch (error) {
    console.error('Credits purchase error:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}
