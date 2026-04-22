// app/api/admin/orders/sync-printful/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { orderId, printfulOrderId } = await request.json();

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

    // Fetch order status from Printful
    const res = await fetch(`https://api.printful.com/orders/${printfulOrderId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });

    const data = await res.json();
    console.log('Printful order data:', data);

    if (data.code !== 200) {
      return NextResponse.json({ error: 'Failed to fetch from Printful' }, { status: 500 });
    }

    const printfulOrder = data.result;
    const shipments = printfulOrder.shipments || [];
    const firstShipment = shipments[0];

    // Determine our status based on Printful status
    let newStatus = 'processing';
    if (printfulOrder.status === 'fulfilled') {
      newStatus = 'shipped';
    } else if (printfulOrder.status === 'canceled') {
      newStatus = 'cancelled';
    }

    // Update order with Printful data
    await pool.query(
      `UPDATE orders SET 
        printful_status = $1,
        status = $2,
        tracking_number = $3,
        tracking_url = $4,
        carrier = $5
       WHERE id = $6`,
      [
        printfulOrder.status,
        newStatus,
        firstShipment?.tracking_number || null,
        firstShipment?.tracking_url || null,
        firstShipment?.carrier || null,
        orderId,
      ]
    );

    return NextResponse.json({ 
      success: true,
      printfulStatus: printfulOrder.status,
      tracking: firstShipment,
    });
  } catch (error) {
    console.error('Sync Printful error:', error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}