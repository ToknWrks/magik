import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const adminId = request.cookies.get('user_id')?.value;
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
    if (adminCheck.rows[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { amount, description } = await request.json();

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Amount must be a non-zero number' }, { status: 400 });
    }

    // Ensure user_credits row exists
    await pool.query(
      `INSERT INTO user_credits (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [id]
    );

    // Adjust balance (allow negative for deductions, but floor at 0 if needed)
    const result = await pool.query(
      `UPDATE user_credits
       SET balance = GREATEST(0, balance + $1)
       WHERE user_id = $2
       RETURNING balance`,
      [amount, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newBalance = result.rows[0].balance;

    // Log transaction
    await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, type, description)
       VALUES ($1, $2, $3, $4)`,
      [id, amount, 'admin_adjustment', description || (amount > 0 ? 'Admin credit' : 'Admin deduction')]
    );

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Admin credits error:', error);
    return NextResponse.json({ error: 'Failed to adjust credits' }, { status: 500 });
  }
}
