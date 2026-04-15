// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;
    const minScore = parseInt(searchParams.get('min_score') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const conditions: string[] = ['relevance_score >= $1'];
    const params: (string | number)[] = [minScore];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await pool.query(
      `SELECT * FROM x_leads ${where} ORDER BY relevance_score DESC, created_at DESC LIMIT $${params.length + 1}`,
      [...params, limit],
    );

    const stats = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE status = 'discovered')    AS discovered,
        COUNT(*) FILTER (WHERE status = 'liked')         AS liked,
        COUNT(*) FILTER (WHERE status = 'followed')      AS followed,
        COUNT(*) FILTER (WHERE status = 'replied')       AS replied,
        ROUND(AVG(relevance_score))                      AS avg_score
      FROM x_leads
    `);

    return NextResponse.json({ leads: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error('GET /api/leads error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, leads: [], stats: null }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await pool.query('DELETE FROM x_leads WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
