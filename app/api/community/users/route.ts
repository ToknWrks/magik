// app/api/community/users/route.ts
// Member directory: list real user accounts (auth required — any logged-in user).
// Exposes NO emails or password material; only public profile fields.
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requester exists (cheap check — same session shape as the rest of the app)
    const auth = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (auth.rows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const where = q ? `WHERE u.username ILIKE $1 OR u.wallet_address ILIKE $1` : '';
    const params: any[] = q ? [`%${q}%`] : [];

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${where}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT
         u.id,
         COALESCE(NULLIF(u.username, ''), 'Anonymous Seeker') AS username,
         u.avatar_url,
         u.bio,
         u.wallet_address,
         u.role,
         u.created_at
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
    );

    return NextResponse.json({
      users: result.rows,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error('Community users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
