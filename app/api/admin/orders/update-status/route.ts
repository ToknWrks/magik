// app/api/admin/orders/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function POST(request: NextRequest) {
  try {
    const { orderId, status, action } = await request.json();

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

    // Add note based on action
    let note = null;
    const timestamp = new Date().toISOString();
    
    if (action === 'payment_received') {
      note = `[${timestamp}] Payment marked as received by admin`;
    } else {
      note = `[${timestamp}] Status changed to ${status} by admin`;
    }

    // Update order status and append note
    await pool.query(
      `UPDATE orders 
       SET status = $1, 
           notes = CASE 
             WHEN notes IS NULL THEN $2 
             ELSE notes || E'\n' || $2 
           END 
       WHERE id = $3`,
      [status, note, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}