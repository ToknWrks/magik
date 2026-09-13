import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

// POST /api/sigil/save
// Body: { url (grok temp url), intention, consonants, baseForm }
// Fetches the (expiring) xAI image, re-hosts it in our blob store, records it.
// Saving is free — generation/refinement already cost tokens.

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url, intention, consonants, baseForm } = await request.json();
    if (!url || !intention) {
      return NextResponse.json({ error: 'Missing url or intention' }, { status: 400 });
    }

    // Fetch the temporary xAI image and re-upload to permanent storage
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Could not fetch sigil image (it may have expired — generate a new one)' }, { status: 400 });
    }
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png';
    const pathname = `sigils/${userId}/${crypto.randomUUID()}.${ext}`;
    const blob = await put(pathname, buffer, {
      contentType,
      access: 'public',
      addRandomSuffix: false,
    });

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const result = await pool.query(
      `INSERT INTO saved_sigils (user_id, intention, consonants, base_form, blob_url, blob_pathname)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, intention, blob_url, created_at`,
      [userId, String(intention).slice(0, 500), String(consonants || '').slice(0, 100), String(baseForm || '').slice(0, 200), blob.url, blob.pathname]
    );

    return NextResponse.json({
      success: true,
      sigil: result.rows[0],
    });
  } catch (error) {
    console.error('Sigil save error:', error);
    return NextResponse.json({ error: 'Failed to save sigil' }, { status: 500 });
  }
}
