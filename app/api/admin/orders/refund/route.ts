// app/api/admin/orders/refund/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { orderId } = await request.json();

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

    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // TODO: Implement actual refund via PayPal/Stripe API
    // For now, just mark as refunded
    
    // If PayPal, use PayPal refund API
    // If Stripe, use Stripe refund API

    await pool.query(
      `UPDATE orders SET status = 'refunded', notes = COALESCE(notes || E'\n', '') || $1 WHERE id = $2`,
      [`[${new Date().toISOString()}] Order refunded by admin`, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: 'Failed to refund' }, { status: 500 });
  }
}