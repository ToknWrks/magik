import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

async function assertAdmin(pool: Pool, request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return false;
  const r = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return r.rows[0]?.role === 'admin';
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  if (!(await assertAdmin(pool, request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await pool.query('DELETE FROM meditations WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  if (!(await assertAdmin(pool, request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { audio_url } = await request.json();
  const result = await pool.query(
    'UPDATE meditations SET audio_url = $1 WHERE id = $2 RETURNING *',
    [audio_url, id]
  );
  return NextResponse.json({ meditation: result.rows[0] });
}
