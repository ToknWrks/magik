// app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const data = await request.json();
    console.log('Order data received:', JSON.stringify(data, null, 2));

    // Get user ID from cookie if logged in
    let userId: string | null = request.cookies.get('user_id')?.value || null;
    console.log('User ID from cookie:', userId);

    // Create account if requested and not logged in
    if (!userId && data.createAccount && data.password) {
      console.log('Creating new account for:', data.email);
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please sign in.' 
        }, { status: 400 });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const username = data.name ? data.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000) : 'user' + Math.floor(Math.random() * 10000);
      
      const userResult = await pool.query(
        'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [data.email, hashedPassword, username, 'member']
      );
      
      userId = userResult.rows[0].id;
      console.log('Created new user:', userId);
    }

    // Validate required fields
    if (!data.email || !data.name || !data.address1 || !data.city || !data.state || !data.zip || !data.country) {
      console.log('Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required shipping information' 
      }, { status: 400 });
    }

    if (!data.items || data.items.length === 0) {
      console.log('No items in order');
      return NextResponse.json({ 
        success: false, 
        error: 'No items in order' 
      }, { status: 400 });
    }

    console.log('Inserting order into database with userId:', userId);

    // Save order to database
    const orderResult = await pool.query(
      `INSERT INTO orders (
        user_id, user_email, shipping_name, shipping_address1, shipping_address2, 
        shipping_city, shipping_state, shipping_zip, shipping_country, 
        shipping_method,
        total, items, status, stripe_payment_id, paypal_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id`,
      [
        userId,
        data.email,
        data.name,
        data.address1,
        data.address2 || '',
        data.city,
        data.state,
        data.zip,
        data.country,
        data.shippingMethod || 'STANDARD',
        data.total,
        JSON.stringify(data.items),
        data.cryptoPayment ? 'awaiting_payment' : 'submitted',
        data.stripePaymentId || null,
        data.paypalOrderId || null,
      ]
    );

    const orderId = orderResult.rows[0].id;
    console.log('Order created:', orderId);

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      orderId,
      accountCreated: !!(data.createAccount && userId),
    });

    // Set user_id cookie if new account was created
    if (data.createAccount && userId) {
      response.cookies.set('user_id', userId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    }, { status: 500 });
  }
}