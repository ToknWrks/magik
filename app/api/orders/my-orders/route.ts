// app/api/orders/my-orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    console.log('My orders - user_id cookie:', userId)

    // Strict check - must have valid user_id
    if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
      console.log('No valid user_id cookie')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      console.log('User not found in database:', userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch orders for this user
    const result = await pool.query(
      `SELECT id, total, status, items, created_at, 
              shipping_name, shipping_address1, shipping_address2,
              shipping_city, shipping_state, shipping_zip, shipping_country,
              printful_order_id
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    )

    console.log('Orders found:', result.rows.length)
    return NextResponse.json({ orders: result.rows })
  } catch (error) {
    console.error('My orders error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}