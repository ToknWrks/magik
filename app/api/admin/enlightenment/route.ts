// app/api/admin/enlightenment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { 
  getAllEnlightenmentTemplates, 
  createEnlightenmentTemplate 
} from '@/lib/db';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET(request: NextRequest) {
  try {
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

    // Get all templates (including inactive for admin)
    const result = await pool.query(
      `SELECT * FROM enlightenment_templates ORDER BY created_at DESC`
    );

    return NextResponse.json({ templates: result.rows });
  } catch (error) {
    console.error('GET enlightenment error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST data received:', data);

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
    const template = await createEnlightenmentTemplate(data);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('POST enlightenment error:', error);
    return NextResponse.json({ 
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}