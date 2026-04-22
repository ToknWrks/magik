import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await pool.query(`
      SELECT id, amount, type, description, created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    return NextResponse.json({ transactions: result.rows });
  } catch (error) {
    console.error('Credits history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
