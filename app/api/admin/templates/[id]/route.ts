// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateConspiracyTemplate, deleteConspiracyTemplate } from '@/lib/db';

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