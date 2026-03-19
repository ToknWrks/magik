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
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ valid: false, error: 'No code provided' });

    await ensureTable();

    const result = await pool.query(
      `SELECT id, type, max_uses, uses, expires_at, description
       FROM invite_codes
       WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid code' });
    }

    const row = result.rows[0];

    if (row.uses >= row.max_uses) {
      return NextResponse.json({ valid: false, error: 'This code has already been used' });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This code has expired' });
    }

    return NextResponse.json({ valid: true, type: row.type, description: row.description });
  } catch (error) {
    console.error('Invite validate error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate code' });
  }
}
