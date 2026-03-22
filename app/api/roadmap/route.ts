import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roadmap_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function adminCheck(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return null;
  const result = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!result.rows[0] || result.rows[0].role !== 'admin') return null;
  return userId;
}

// GET /api/roadmap
export async function GET(request: NextRequest) {
  const userId = await adminCheck(request);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureSchema();

  const result = await pool.query(
    `SELECT * FROM roadmap_items ORDER BY sort_order ASC, created_at ASC`
  );
  return NextResponse.json(result.rows);
}

// POST /api/roadmap
export async function POST(request: NextRequest) {
  const userId = await adminCheck(request);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureSchema();

  const body = await request.json();
  const { title, description, status = 'backlog', priority = 'medium', category } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const maxOrder = await pool.query(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM roadmap_items`);
  const sort_order = (maxOrder.rows[0].m as number) + 1;

  const result = await pool.query(
    `INSERT INTO roadmap_items (title, description, status, priority, category, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title.trim(), description || null, status, priority, category || null, sort_order]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}

// PATCH /api/roadmap
export async function PATCH(request: NextRequest) {
  const userId = await adminCheck(request);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureSchema();

  const body = await request.json();
  const { id, title, description, status, priority, category } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const result = await pool.query(
    `UPDATE roadmap_items
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         status = COALESCE($4, status),
         priority = COALESCE($5, priority),
         category = COALESCE($6, category),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, title ?? null, description ?? null, status ?? null, priority ?? null, category ?? null]
  );
  if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

// DELETE /api/roadmap
export async function DELETE(request: NextRequest) {
  const userId = await adminCheck(request);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await pool.query(`DELETE FROM roadmap_items WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
