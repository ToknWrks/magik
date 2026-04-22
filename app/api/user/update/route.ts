import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, avatar_url, bio } = await request.json();

    if (!username && avatar_url === undefined && bio === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (username) {
      if (username.length < 2 || username.length > 30) {
        return NextResponse.json({ error: 'Username must be 2–30 characters' }, { status: 400 });
      }
      updates.push(`username = $${idx++}`);
      values.push(username.trim());
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${idx++}`);
      values.push(bio);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, username, role, avatar_url, bio`,
      values
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
