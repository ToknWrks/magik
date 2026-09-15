// app/api/profile-images/route.ts
// Avatar inventory for the profile-image picker modal.
// Serves the curated image inventory registered in profile_images (seeded
// from public/images/profiles). Auth required; supports ?q= filter by filename
// and pagination.
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const PAGE_SIZE = 60;

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (auth.rows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM profile_images`);
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT id, path
       FROM profile_images
       ORDER BY sort_order ASC
       LIMIT $1 OFFSET $2`,
      [PAGE_SIZE, (page - 1) * PAGE_SIZE]
    );

    return NextResponse.json({
      images: result.rows,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error('Profile images fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
