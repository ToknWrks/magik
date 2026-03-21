import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

export async function DELETE(request: NextRequest) {
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
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS reading_type TEXT DEFAULT 'transit'`);
    await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS audio_url TEXT`);

    const result = await pool.query(
      `SELECT id, birth_date, birth_time, birth_location, focus, report, reading_type, audio_url, created_at
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
