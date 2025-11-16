// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { updateConspiracyTemplate, deleteConspiracyTemplate } from '@/lib/db';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

// Skip authentication for now
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    console.log('Updating template:', id, data);  // Add logging
    const template = await updateConspiracyTemplate(id, data);
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update template' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { is_active } = await request.json();
    const template = await updateConspiracyTemplate(id, { is_active });
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template patch error:', error);
    return NextResponse.json({ 
      error: 'Failed to update template' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteConspiracyTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete template' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await validateSession(token);
    if (!sessionData || sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    
    // Insert new template
    const result = await pool.query(`
      INSERT INTO conspiracy_templates 
      (title, slug, category, status, key_facts, debunking_points, sources, difficulty_level, is_active, article_content)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.title,
      data.slug,
      data.category,
      data.status,
      data.key_facts,
      data.debunking_points,
      data.sources,
      data.difficulty_level || 'medium',
      data.is_active ?? true,
      data.article_content, // Add this field
    ]);

    return NextResponse.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create template' 
    }, { status: 500 });
  }
}
async function validateSession(token: string) {
  try {
    // Simulate session validation by decoding the token
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    const sessionData = await response.json();
    return sessionData;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
