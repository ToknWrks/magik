import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { Pool } from '@neondatabase/serverless';
import { generateTTS } from '@/lib/tts';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

export const HUME_VOICES = ['Meditation Female', 'Meditation Male'];

// Allow up to 5 minutes for long multi-chunk TTS generation
export const maxDuration = 300;

async function ensureAudioColumns() {
  await pool.query(`ALTER TABLE enlightenment_templates ADD COLUMN IF NOT EXISTS audio_url TEXT`);
  await pool.query(`ALTER TABLE conspiracy_templates ADD COLUMN IF NOT EXISTS audio_url TEXT`);
}

async function fetchContentFromDB(contentId: string, contentType: string): Promise<string | null> {
  if (contentType === 'enlightenment') {
    const r = await pool.query(
      `SELECT article_content, description, title FROM enlightenment_templates WHERE id = $1`,
      [contentId]
    );
    const row = r.rows[0];
    if (!row) return null;
    // Manual content is in article_content; AI-generated content is in enlightenment_content
    if (row.article_content) return row.article_content;
    const cached = await pool.query(
      `SELECT content FROM enlightenment_content WHERE template_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [contentId]
    );
    return cached.rows[0]?.content || row.description || row.title || null;
  }
  if (contentType === 'mystery') {
    const r = await pool.query(
      `SELECT article_content, title FROM conspiracy_templates WHERE id = $1`,
      [contentId]
    );
    const row = r.rows[0];
    return row ? (row.article_content || row.title) : null;
  }
  if (contentType === 'meditation') {
    const r = await pool.query(
      `SELECT script, title FROM meditations WHERE id = $1`,
      [contentId]
    );
    const row = r.rows[0];
    return row ? (row.script || row.title) : null;
  }
  return null;
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

    const { contentId, contentType, voice = 'Meditation Female', filename } = await request.json();

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'contentId and contentType are required' }, { status: 400 });
    }

    await ensureAudioColumns();

    // Always read full content from DB — never rely on client-sent text
    const text = await fetchContentFromDB(contentId, contentType);
    if (!text) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Generate audio via Hume eTTS (handles <break> SSML tags)
    const tts = await generateTTS(text, voice);

    const baseName = filename ?? `${contentId ?? 'audio'}-${Date.now()}`;
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
