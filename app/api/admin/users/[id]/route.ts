import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) return null;
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (result.rows[0]?.role !== 'admin') return null;
  return userId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.role, u.created_at,
              COALESCE(uc.balance, 0) AS credit_balance
       FROM users u
       LEFT JOIN user_credits uc ON uc.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const { email, username, role } = await request.json();

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (email !== undefined)    { fields.push(`email = $${idx++}`);    values.push(email); }
    if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
    if (role !== undefined)     { fields.push(`role = $${idx++}`);     values.push(role); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, username, role`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
