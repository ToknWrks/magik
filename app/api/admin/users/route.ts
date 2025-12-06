// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET(request: NextRequest) {
  try {
    // Verify admin using user_id cookie
    const userId = request.cookies.get('user_id')?.value;
    console.log('Users API - user_id:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    console.log('Users API - user result:', userResult.rows);

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Simpler query first to test
    const result = await pool.query(`
      SELECT 
        id,
        email,
        username,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log('Users API - found users:', result.rows.length);

    // Add order stats separately
    const usersWithStats = await Promise.all(
      result.rows.map(async (user) => {
        try {
          const orderStats = await pool.query(`
            SELECT 
              COUNT(id) as order_count,
              COALESCE(SUM(total), 0) as total_spent,
              MAX(created_at) as last_order_date,
              COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refund_count
            FROM orders
            WHERE user_id = $1
          `, [user.id]);

          const lastOrder = await pool.query(`
            SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
          `, [user.id]);

          return {
            ...user,
            order_count: orderStats.rows[0]?.order_count || '0',
            total_spent: orderStats.rows[0]?.total_spent || '0',
            last_order_date: orderStats.rows[0]?.last_order_date || null,
            last_order_id: lastOrder.rows[0]?.id || null,
            refund_count: orderStats.rows[0]?.refund_count || '0',
          };
        } catch (err) {
          console.error('Error getting stats for user:', user.id, err);
          return {
            ...user,
            order_count: '0',
            total_spent: '0',
            last_order_date: null,
            last_order_id: null,
            refund_count: '0',
          };
        }
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId: targetUserId, role } = await request.json();

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

    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, targetUserId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

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

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [targetUserId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}