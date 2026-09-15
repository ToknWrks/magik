// One-off migration: create profile_images table (avatar inventory registry)
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; }));
const sql = neon(env.DATABASE_URL);
(async () => {
  await sql`CREATE TABLE IF NOT EXISTS profile_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT UNIQUE NOT NULL,
    path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_profile_images_sort ON profile_images (sort_order)`;
  const check = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='profile_images' ORDER BY ordinal_position`;
  console.log('profile_images columns:', check.map(c => c.column_name).join(', '));
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
