// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateConspiracyTemplate } from '@/lib/db';
import { Pool } from '@neondatabase/serverless';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    interface RawTemplateData {
      key_facts?: string | string[];
      debunking_points?: string | string[];
      sources?: string | string[];
      [key: string]: any;
    }

    interface ProcessedTemplateData {
      key_facts: string[];
      debunking_points: string[];
      sources: string[];
      [key: string]: any;
    }
        const processedData: ProcessedTemplateData = {
          ...data,
          prompt_template: data.prompt_template || 'Default prompt',
          key_facts: Array.isArray(data.key_facts) ? data.key_facts : data.key_facts.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
          debunking_points: Array.isArray(data.debunking_points) ? data.debunking_points : data.debunking_points.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
          sources: Array.isArray(data.sources) ? data.sources : data.sources.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
        };
    const template = await updateConspiracyTemplate(id, processedData);
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
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const { id } = await params;
    console.log('=== DELETE TEMPLATE ===');
    console.log('Template ID:', id);

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

    // Check if template exists
    const checkResult = await pool.query(
      'SELECT id, title FROM conspiracy_templates WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // First, delete related generated_content
    console.log('Deleting related generated content...');
    const deleteContentResult = await pool.query(
      'DELETE FROM generated_content WHERE template_id = $1',
      [id]
    );
    console.log('Deleted generated content rows:', deleteContentResult.rowCount);

    // Now delete the template
    console.log('Deleting template...');
    const result = await pool.query(
      'DELETE FROM conspiracy_templates WHERE id = $1 RETURNING id',
      [id]
    );

    console.log('Delete result rowCount:', result.rowCount);

    return NextResponse.json({ 
      success: true,
      deletedContentRows: deleteContentResult.rowCount,
    });
  } catch (error) {
    console.error('=== DELETE ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}