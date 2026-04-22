// app/api/admin/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
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

    const mappings = await pool.query(`
      SELECT * FROM keyword_mappings ORDER BY keyword ASC
    `);

    return NextResponse.json({ mappings: mappings.rows });
  } catch (error) {
    console.error('GET keywords error:', error);
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const data = await request.json();

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

    const result = await pool.query(
      `INSERT INTO keyword_mappings (keyword, target_slug, target_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.keyword, data.target_slug, data.target_type]
    );

    return NextResponse.json({ mapping: result.rows[0] });
  } catch (error) {
    console.error('POST keywords error:', error);
    return NextResponse.json({ 
      error: 'Failed to create keyword mapping',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}