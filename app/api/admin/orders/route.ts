// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET(request: NextRequest) {
  try {
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

    // Get all orders with new fields
    const result = await pool.query(
      `SELECT id, user_id, user_email, shipping_name, shipping_address1, shipping_address2,
              shipping_city, shipping_state, shipping_zip, shipping_country, 
              total, status, printful_order_id, printful_status,
              tracking_number, tracking_url, carrier,
              stripe_payment_id, paypal_order_id,
              items, notes, created_at 
       FROM orders 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ orders: result.rows });
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}