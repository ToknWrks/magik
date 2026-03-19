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

    // Ensure optional tables exist so the JOIN doesn't fail (separate queries — serverless driver doesn't support multi-statement)
    await pool.query(`CREATE TABLE IF NOT EXISTS user_credits (user_id UUID PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS astrology_readings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, stripe_payment_id TEXT, birth_date TEXT, birth_location TEXT, report TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS coaching_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT, transcript JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const result = await pool.query(`
      SELECT
        u.id, u.email, u.username, u.role, u.created_at,
        COALESCE(uc.balance, 0) AS credit_balance,
        (SELECT COUNT(*) FROM astrology_readings WHERE user_id::text = u.id::text) AS reading_count,
        (SELECT COUNT(*) FROM coaching_sessions WHERE user_id::text = u.id::text) AS session_count
      FROM users u
      LEFT JOIN user_credits uc ON uc.user_id = u.id::text
      ${search ? `WHERE u.email ILIKE $1 OR u.username ILIKE $1` : ''}
      ORDER BY u.created_at DESC
      LIMIT 200
    `, search ? [`%${search}%`] : []);

    return NextResponse.json({ users: result.rows });
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