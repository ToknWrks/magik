// app/api/admin/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllConspiracyTemplates, pool, insertConspiracyTemplate } from '@/lib/db';

// For now, skip authentication since we're using localStorage
export async function GET(request: NextRequest) {
  try {
    const templates = await getAllConspiracyTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch templates' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const template = await insertConspiracyTemplate(data);
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create template' 
    }, { status: 500 });
  }
}