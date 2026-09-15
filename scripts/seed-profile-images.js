// Seed profile_images from public/images/profiles/*.jpeg
// Idempotent: upserts on filename. Re-run any time the inventory changes.
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; }));
const sql = neon(env.DATABASE_URL);

const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'profiles');

(async () => {
  const files = fs.readdirSync(IMAGE_DIR)
    .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort((a, b) => {
      // natural sort so 2.jpeg comes before 10.jpeg
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

  console.log(`Found ${files.length} images in public/images/profiles/`);

  let inserted = 0, updated = 0;
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const webPath = `/images/profiles/${filename}`;
    const res = await sql`
      INSERT INTO profile_images (filename, path, sort_order)
      VALUES (${filename}, ${webPath}, ${i})
      ON CONFLICT (filename)
      DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order
      RETURNING (xmax = 0) AS inserted
    `;
    if (res[0]?.inserted) inserted++; else updated++;
  }

  const total = await sql`SELECT COUNT(*)::int AS n FROM profile_images`;
  console.log(`Done. inserted: ${inserted}, updated: ${updated}, total in DB: ${total[0].n}`);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
