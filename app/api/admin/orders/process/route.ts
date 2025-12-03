// app/api/admin/orders/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    console.log('Process order - orderId:', orderId);

    // Verify admin using user_id cookie
    const userId = request.cookies.get('user_id')?.value;
    console.log('Process order - user_id cookie:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get order details
    console.log('Fetching order:', orderId);
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];
    console.log('Order found:', order.id, 'Status:', order.status);
    console.log('Order items:', JSON.stringify(order.items));

    if (order.status !== 'submitted') {
      return NextResponse.json({ 
        error: `Order not ready. Current status: ${order.status}` 
      }, { status: 400 });
    }

    // Validate items have variantId
    if (!order.items || !Array.isArray(order.items)) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    const invalidItems = order.items.filter((item: any) => !item.variantId);
    if (invalidItems.length > 0) {
      console.log('Invalid items (missing variantId):', invalidItems);
      return NextResponse.json({ 
        error: 'Some items are missing variantId',
        invalidItems 
      }, { status: 400 });
    }

    // Build Printful order
    const printfulOrder = {
      recipient: {
        name: order.shipping_name,
        address1: order.shipping_address1,
        address2: order.shipping_address2 || '',
        city: order.shipping_city,
        state_code: order.shipping_state,
        zip: order.shipping_zip,
        country_code: order.shipping_country,
        email: order.user_email,
      },
      items: order.items.map((item: any) => ({
        sync_variant_id: parseInt(item.variantId),
        quantity: item.quantity,
      })),
      shipping: order.shipping_method || 'STANDARD', // Add this
    };

    console.log('Printful order payload:', JSON.stringify(printfulOrder, null, 2));

    // Check if Printful API key exists
    if (!process.env.PRINTFUL_API_KEY) {
      console.error('PRINTFUL_API_KEY not set');
      return NextResponse.json({ error: 'Printful API key not configured' }, { status: 500 });
    }

    // Send order to Printful
    console.log('Sending to Printful...');
    const printfulRes = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printfulOrder),
    });

    const printfulData = await printfulRes.json();
    console.log('Printful response code:', printfulData.code);
    console.log('Printful response:', JSON.stringify(printfulData, null, 2));

    if (printfulData.code !== 200) {
      const timestamp = new Date().toISOString();
      const errorMessage = printfulData.result || printfulData.error?.message || 'Unknown error';
      
      await pool.query(
        `UPDATE orders SET notes = COALESCE(notes || E'\n', '') || $1 WHERE id = $2`,
        [`[${timestamp}] Printful error: ${JSON.stringify(errorMessage)}`, orderId]
      );
      
      return NextResponse.json({ 
        error: 'Printful order failed', 
        details: errorMessage
      }, { status: 500 });
    }

    // Update order with Printful order ID and status
    const timestamp = new Date().toISOString();
    await pool.query(
      `UPDATE orders SET 
        printful_order_id = $1, 
        status = 'processing',
        notes = COALESCE(notes || E'\n', '') || $2
       WHERE id = $3`,
      [
        printfulData.result.id.toString(),
        `[${timestamp}] Sent to Printful. Order ID: ${printfulData.result.id}`,
        orderId
      ]
    );

    console.log('Order processed successfully. Printful ID:', printfulData.result.id);

    return NextResponse.json({ 
      success: true, 
      printfulOrderId: printfulData.result.id 
    });
  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}