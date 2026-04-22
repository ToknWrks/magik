// app/api/admin/orders/add-note/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { orderId, note } = await request.json();

    // Verify admin
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Append note with timestamp
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;

    await pool.query(
      `UPDATE orders SET notes = CASE 
        WHEN notes IS NULL THEN $1 
        ELSE notes || E'\n' || $1 
       END WHERE id = $2`,
      [newNote, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}