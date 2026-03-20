import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'free_reading',
      max_uses INTEGER NOT NULL DEFAULT 1,
      uses INTEGER NOT NULL DEFAULT 0,
      credits INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0`);
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (user.rows[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureTable();

    const { code, description, type = 'free_reading', maxUses = 1, credits = 0, expiresAt } = await request.json();

    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO invite_codes (code, description, type, max_uses, credits, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5, $6)
       RETURNING *`,
      [code.trim(), description || null, type, maxUses, credits, expiresAt || null]
    );

    return NextResponse.json({ code: result.rows[0] });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }
    console.error('Invite create error:', error);
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (user.rows[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureTable();

    const result = await pool.query(
      `SELECT id, code, description, type, max_uses, uses, credits, expires_at, created_at
       FROM invite_codes
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ codes: result.rows });
  } catch (error) {
    console.error('Invite list error:', error);
    return NextResponse.json({ error: 'Failed to list codes' }, { status: 500 });
  }
}
