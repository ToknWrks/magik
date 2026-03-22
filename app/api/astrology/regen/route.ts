import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS regen_retirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      retired_at TIMESTAMPTZ DEFAULT NOW(),
      reading_count INT NOT NULL,
      co2_grams NUMERIC NOT NULL,
      contribution_cents INT NOT NULL,
      tx_hash TEXT,
      credit_class TEXT,
      notes TEXT,
      created_by TEXT
    )
  `);
  await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS regen_retirement_id UUID REFERENCES regen_retirements(id)`);
}

// GET /api/astrology/regen — admin stats
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Basic admin check
  const user = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!user.rows[0] || user.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureSchema();

  const [readingTotals, sessionTotals, unretiredReadings, unretiredSessions, retirements, recentReadings, recentSessions] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(co2_grams), 0) AS total_co2_grams,
        COALESCE(SUM(regen_contribution_cents), 0) AS total_contribution_cents
      FROM astrology_readings
      WHERE regen_contribution_cents IS NOT NULL
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(co2_grams), 0) AS total_co2_grams,
        COALESCE(SUM(regen_contribution_cents), 0) AS total_contribution_cents
      FROM coaching_sessions
      WHERE regen_contribution_cents IS NOT NULL
    `).catch(() => ({ rows: [{ total_count: '0', total_co2_grams: '0', total_contribution_cents: '0' }] })),
    pool.query(`
      SELECT
        COUNT(*) AS reading_count,
        COALESCE(SUM(co2_grams), 0) AS co2_grams,
        COALESCE(SUM(regen_contribution_cents), 0) AS contribution_cents
      FROM astrology_readings
      WHERE regen_contribution_cents IS NOT NULL
        AND regen_retirement_id IS NULL
    `),
    pool.query(`
      SELECT
        COUNT(*) AS reading_count,
        COALESCE(SUM(co2_grams), 0) AS co2_grams,
        COALESCE(SUM(regen_contribution_cents), 0) AS contribution_cents
      FROM coaching_sessions
      WHERE regen_contribution_cents IS NOT NULL
    `).catch(() => ({ rows: [{ reading_count: '0', co2_grams: '0', contribution_cents: '0' }] })),
    pool.query(`SELECT * FROM regen_retirements ORDER BY retired_at DESC LIMIT 20`),
    pool.query(`
      SELECT id, created_at, reading_type AS source_type, co2_grams, regen_contribution_cents, regen_retirement_id
      FROM astrology_readings
      WHERE regen_contribution_cents IS NOT NULL
      ORDER BY created_at DESC LIMIT 30
    `),
    pool.query(`
      SELECT id, created_at, 'session' AS source_type, co2_grams, regen_contribution_cents, NULL AS regen_retirement_id
      FROM coaching_sessions
      WHERE regen_contribution_cents IS NOT NULL
      ORDER BY created_at DESC LIMIT 20
    `).catch(() => ({ rows: [] })),
  ]);

  const rTotals = readingTotals.rows[0];
  const sTotals = sessionTotals.rows[0];
  const totals = {
    total_count: parseInt(rTotals.total_count) + parseInt(sTotals.total_count),
    total_co2_grams: (parseFloat(rTotals.total_co2_grams) + parseFloat(sTotals.total_co2_grams)).toFixed(2),
    total_contribution_cents: parseInt(rTotals.total_contribution_cents) + parseInt(sTotals.total_contribution_cents),
    reading_count: parseInt(rTotals.total_count),
    session_count: parseInt(sTotals.total_count),
  };

  const uR = unretiredReadings.rows[0];
  const uS = unretiredSessions.rows[0];
  const unretired = {
    reading_count: parseInt(uR.reading_count) + parseInt(uS.reading_count),
    co2_grams: (parseFloat(uR.co2_grams) + parseFloat(uS.co2_grams)).toFixed(2),
    contribution_cents: parseInt(uR.contribution_cents) + parseInt(uS.contribution_cents),
  };

  // Merge and sort recent activity
  const recentActivity = [...recentReadings.rows, ...recentSessions.rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  return NextResponse.json({
    totals,
    unretired,
    retirements: retirements.rows,
    recentReadings: recentActivity,
  });
}

// POST /api/astrology/regen — record a retirement batch
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!user.rows[0] || user.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureSchema();

  const { tx_hash, credit_class, notes } = await request.json();

  // Gather all unretired readings and sessions
  const [unretiredReadings, unretiredSessions] = await Promise.all([
    pool.query(`
      SELECT id, co2_grams, regen_contribution_cents FROM astrology_readings
      WHERE regen_contribution_cents IS NOT NULL AND regen_retirement_id IS NULL
    `),
    pool.query(`
      SELECT id, co2_grams, regen_contribution_cents FROM coaching_sessions
      WHERE regen_contribution_cents IS NOT NULL
    `).catch(() => ({ rows: [] })),
  ]);

  const allRows = [...unretiredReadings.rows, ...unretiredSessions.rows];
  if (allRows.length === 0) {
    return NextResponse.json({ error: 'No unretired items' }, { status: 400 });
  }

  const totalCo2 = allRows.reduce((s: number, r: any) => s + parseFloat(r.co2_grams || 0), 0);
  const totalCents = allRows.reduce((s: number, r: any) => s + (r.regen_contribution_cents || 0), 0);
  const readingIds = unretiredReadings.rows.map((r: any) => r.id);

  // Create retirement record
  const retirement = await pool.query(`
    INSERT INTO regen_retirements (reading_count, co2_grams, contribution_cents, tx_hash, credit_class, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [allRows.length, totalCo2.toFixed(2), totalCents, tx_hash || null, credit_class || null, notes || null, userId]);

  // Mark readings as retired
  if (readingIds.length > 0) {
    await pool.query(`
      UPDATE astrology_readings
      SET regen_retirement_id = $1, regen_retired_at = NOW()
      WHERE id = ANY($2::uuid[])
    `, [retirement.rows[0].id, readingIds]);
  }

  return NextResponse.json({ retirement: retirement.rows[0], itemCount: allRows.length });
}
