// app/api/admin/enlightenment/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { updateEnlightenmentTemplate, deleteEnlightenmentTemplate } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { id } = await params;
    const data = await request.json();
    console.log('PUT data received:', data);

    // Verify admin
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // The database function will handle array processing
    const template = await updateEnlightenmentTemplate(id, data);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('PUT enlightenment error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { id } = await params;

    // Verify admin
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete related generated content first
    await pool.query(
      `DELETE FROM generated_content WHERE template_id = $1`,
      [id]
    );

    const deleted = await deleteEnlightenmentTemplate(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE enlightenment error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { is_active } = await request.json();

    // Verify admin
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await updateEnlightenmentTemplate(id, { is_active });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('PATCH enlightenment error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}