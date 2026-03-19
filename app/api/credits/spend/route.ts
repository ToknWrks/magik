import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, description } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    // Deduct only if sufficient balance (atomic)
    const result = await pool.query(`
      UPDATE user_credits
      SET balance = balance - $1, updated_at = NOW()
      WHERE user_id = $2 AND balance >= $1
      RETURNING balance
    `, [amount, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    await pool.query(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'spend', $3)
    `, [userId, -amount, description || 'Credit spend']);

    return NextResponse.json({ success: true, balance: result.rows[0].balance });
  } catch (error) {
    console.error('Credits spend error:', error);
    return NextResponse.json({ error: 'Failed to spend credits' }, { status: 500 });
  }
}
