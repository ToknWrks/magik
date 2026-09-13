// One-off migration: create saved_sigils table
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; }));
const sql = neon(env.DATABASE_URL);
(async () => {
  await sql`CREATE TABLE IF NOT EXISTS saved_sigils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    intention TEXT NOT NULL,
    consonants TEXT NOT NULL DEFAULT '',
    base_form TEXT NOT NULL DEFAULT '',
    blob_url TEXT NOT NULL,
    blob_pathname TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_saved_sigils_user ON saved_sigils (user_id, created_at DESC)`;
  const check = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='saved_sigils' ORDER BY ordinal_position`;
  console.log('saved_sigils columns:', check.map(c => c.column_name).join(', '));
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
