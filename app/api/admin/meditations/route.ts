import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meditations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      script TEXT NOT NULL,
      voice TEXT NOT NULL DEFAULT 'KORA',
      audio_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function assertAdmin(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return false;
  const r = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return r.rows[0]?.role === 'admin';
}

export async function GET(request: NextRequest) {
  if (!(await assertAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTable();
  const result = await pool.query('SELECT * FROM meditations ORDER BY created_at DESC');
  return NextResponse.json({ meditations: result.rows });
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTable();
  const { title, script, voice = 'Meditation Female' } = await request.json();
  if (!title || !script) return NextResponse.json({ error: 'title and script are required' }, { status: 400 });
  const result = await pool.query(
    'INSERT INTO meditations (title, script, voice) VALUES ($1, $2, $3) RETURNING *',
    [title, script, voice]
  );
  return NextResponse.json({ meditation: result.rows[0] });
}
