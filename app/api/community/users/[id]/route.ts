// app/api/community/users/[id]/route.ts
// Public member profile: any authenticated user can view another member's
// public profile (username, avatar, bio, wallet short-form, joined date, counts).
// NO email, NO credits balance, NO role.
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUserId = request.cookies.get('user_id')?.value;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // UUID format check to avoid Postgres cast errors on garbage input
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT
         u.id,
         COALESCE(NULLIF(u.username, ''), 'Anonymous Seeker') AS username,
         u.avatar_url,
         u.bio,
         u.wallet_address,
         u.created_at,
         (SELECT COUNT(*)::int FROM saved_sigils WHERE user_id = u.id) AS sigil_count,
         (SELECT COUNT(*)::int FROM astrology_readings WHERE user_id::text = u.id::text) AS reading_count,
         (SELECT COUNT(*)::int FROM coaching_sessions WHERE user_id::text = u.id::text) AS session_count
       FROM users u
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Community member fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}
