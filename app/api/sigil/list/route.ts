import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

// GET /api/sigil/list — the user's saved sigils (their own only)
// DELETE /api/sigil/list?id=<id> — release a sigil: row + blob deleted, gone forever

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 60, 100);
    const offset = Number(url.searchParams.get('offset')) || 0;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const result = await pool.query(
      `SELECT id, intention, consonants, base_form, blob_url, created_at
       FROM saved_sigils WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return NextResponse.json({ sigils: result.rows });
  } catch (error) {
    console.error('Sigil list error:', error);
    return NextResponse.json({ error: 'Failed to list sigils' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing sigil id' }, { status: 400 });

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

    // Only the owner can release their sigil
    const owned = await pool.query(
      'SELECT blob_pathname FROM saved_sigils WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Sigil not found' }, { status: 404 });
    }

    // Delete the blob — gone forever
    try {
      const { del } = await import('@vercel/blob');
      await del(owned.rows[0].blob_pathname);
    } catch (blobErr) {
      // Log but don't fail the release if the blob is already gone
      console.error('Blob delete error:', blobErr);
    }

    await pool.query('DELETE FROM saved_sigils WHERE id = $1 AND user_id = $2', [id, userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sigil release error:', error);
    return NextResponse.json({ error: 'Failed to release sigil' }, { status: 500 });
  }
}
