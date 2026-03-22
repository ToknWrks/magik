import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';
import { estimateSessionFootprintGrams, REGEN_CONTRIBUTION_CENTS_SESSION } from '@/lib/regen-footprint';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coaching_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      transcript JSONB NOT NULL,
      summary TEXT,
      duration_seconds INTEGER,
      credits_used INTEGER,
      hume_chat_group_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS hume_chat_group_id TEXT`);
  await pool.query(`ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS co2_grams NUMERIC`);
  await pool.query(`ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS regen_contribution_cents INTEGER`);
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transcript, durationSeconds, creditsUsed, chatGroupId } = await request.json();
    if (!transcript?.length) return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });

    await ensureTable();

    // Format transcript for Claude
    const formatted = transcript
      .filter((m: any) => m.type === 'user_message' || m.type === 'assistant_message')
      .map((m: any) => `${m.message.role === 'user' ? 'You' : 'Solomon'}: ${m.message.content}`)
      .join('\n\n');

    // Generate summary with Claude
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are reviewing a spiritual coaching session transcript between a user and Solomon, a transpersonal coach. Generate a warm, insightful post-session reflection with these sections:

**Key Themes** — 2–3 core themes that emerged
**Insights** — What the user seemed to discover or move toward
**Invitation** — One gentle next step or practice to carry forward

Keep it personal, concise, and encouraging. Write directly to the user as "you".

Transcript:
${formatted}`,
      }],
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';

    const co2Grams = estimateSessionFootprintGrams(formatted, summary);

    const result = await pool.query(
      `INSERT INTO coaching_sessions (user_id, transcript, summary, duration_seconds, credits_used, hume_chat_group_id, co2_grams, regen_contribution_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at, co2_grams, regen_contribution_cents`,
      [userId, JSON.stringify(transcript), summary, durationSeconds, creditsUsed, chatGroupId ?? null, co2Grams, REGEN_CONTRIBUTION_CENTS_SESSION]
    );

    return NextResponse.json({ session: { ...result.rows[0], summary } });
  } catch (error) {
    console.error('Save coaching session error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTable();

    const result = await pool.query(
      `SELECT id, summary, duration_seconds, credits_used, hume_chat_group_id, co2_grams, regen_contribution_cents, created_at
       FROM coaching_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({ sessions: result.rows });
  } catch (error) {
    console.error('Fetch coaching sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
