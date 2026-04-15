// app/api/leads/setup/route.ts
// Run once to create the x_leads table
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS x_leads (
        id                SERIAL PRIMARY KEY,
        twitter_user_id   TEXT UNIQUE NOT NULL,
        username          TEXT NOT NULL,
        display_name      TEXT,
        bio               TEXT,
        followers_count   INT DEFAULT 0,
        following_count   INT DEFAULT 0,
        tweet_count       INT DEFAULT 0,
        relevance_score   INT DEFAULT 0,
        relevance_reason  TEXT,
        source_tweet_id   TEXT,
        source_tweet_text TEXT,
        status            TEXT DEFAULT 'discovered',
        liked_at          TIMESTAMPTZ,
        followed_at       TIMESTAMPTZ,
        replied_at        TIMESTAMPTZ,
        reply_tweet_id    TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS x_leads_status_idx ON x_leads (status);
      CREATE INDEX IF NOT EXISTS x_leads_score_idx  ON x_leads (relevance_score DESC);
    `);

    return NextResponse.json({ success: true, message: 'x_leads table ready' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 },
    );
  }
}
