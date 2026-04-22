import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function PATCH(request: NextRequest) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, title } = await request.json();
    if (!id) return NextResponse.json({ error: 'Reading ID required' }, { status: 400 });

    await pool.query(
      `UPDATE astrology_readings SET title = $1 WHERE id = $2 AND user_id = $3`,
      [title, id, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update reading error:', error);
    return NextResponse.json({ error: 'Failed to update reading' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Reading ID required' }, { status: 400 });

    await pool.query(
      `DELETE FROM astrology_readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reading error:', error);
    return NextResponse.json({ error: 'Failed to delete reading' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS reading_type TEXT DEFAULT 'transit'`);
    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS audio_url TEXT`);
    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS title TEXT`);

    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS co2_grams NUMERIC`);
    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS regen_contribution_cents INT`);
    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS regen_retired_at TIMESTAMPTZ`);

    const result = await pool.query(
      `SELECT id, birth_date, birth_time, birth_location, focus, report, reading_type, audio_url, title, co2_grams, regen_contribution_cents, regen_retired_at, created_at
       FROM astrology_readings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ readings: result.rows });
  } catch (error) {
    console.error('Fetch readings error:', error);
    return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 });
  }
}
