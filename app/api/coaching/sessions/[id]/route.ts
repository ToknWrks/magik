import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await pool.query(
      `SELECT id, transcript, summary, duration_seconds, credits_used, created_at
       FROM coaching_sessions
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ session: result.rows[0] });
  } catch (error) {
    console.error('Fetch session error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await pool.query(
      `DELETE FROM coaching_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
