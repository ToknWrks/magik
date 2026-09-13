const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; }));
const sql = neon(env.DATABASE_URL);
async function main() {
  const users = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`;
  console.log('USERS:', users.map(c => `${c.column_name}:${c.data_type}`).join(', '));
  const sess = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sessions' ORDER BY ordinal_position`;
  console.log('SESSIONS:', sess.map(c => `${c.column_name}:${c.data_type}`).join(', '));
  const ct = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='credit_transactions' ORDER BY ordinal_position`;
  console.log('CREDIT_TX:', ct.map(c => `${c.column_name}:${c.data_type}`).join(', '));
  const uc = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='user_credits' ORDER BY ordinal_position`;
  console.log('USER_CREDITS:', uc.map(c => `${c.column_name}:${c.data_type}`).join(', '));
}
main().then(() => process.exit(0)).catch(e => { console.error('FAIL:', e.message); process.exit(1); });
