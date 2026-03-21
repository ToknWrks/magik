import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { Pool } from '@neondatabase/serverless';
import { generateTTS } from '@/lib/tts';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

export const HUME_VOICES = ['Meditation Female', 'Meditation Male'];

async function ensureAudioColumns() {
  await pool.query(`ALTER TABLE enlightenment_templates ADD COLUMN IF NOT EXISTS audio_url TEXT`);
  await pool.query(`ALTER TABLE conspiracy_templates ADD COLUMN IF NOT EXISTS audio_url TEXT`);
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { text, contentId, contentType, voice = 'Meditation Female', filename } = await request.json();

    if (!text || !contentType) {
      return NextResponse.json({ error: 'text and contentType are required' }, { status: 400 });
    }

    await ensureAudioColumns();

    // Generate audio via Hume eTTS (handles <break> SSML tags)
    const tts = await generateTTS(text, voice);

    const baseName = filename ?? `${contentId ?? Date.now()}`;
    const blobName = `tts/${contentType}/${baseName}.${tts.ext}`;

    const blob = await put(blobName, tts.buffer, {
      access: 'public',
      contentType: tts.contentType,
      addRandomSuffix: false,
    });

    // Persist audio_url to DB if a content record was given
    if (contentId) {
      const table =
        contentType === 'enlightenment' ? 'enlightenment_templates' :
        contentType === 'mystery'       ? 'conspiracy_templates' :
        null;

      if (table) {
        await pool.query(`UPDATE ${table} SET audio_url = $1 WHERE id = $2`, [blob.url, contentId]);
      } else if (contentType === 'meditation') {
        await pool.query(`UPDATE meditations SET audio_url = $1 WHERE id = $2`, [blob.url, contentId]);
      }
    }

    return NextResponse.json({ audioUrl: blob.url });
  } catch (error) {
    console.error('TTS generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
