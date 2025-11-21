// app/api/admin/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllConspiracyTemplates, insertConspiracyTemplate } from '@/lib/db';
import { updateConspiracyTemplate, deleteConspiracyTemplate } from '@/lib/db';

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
    // Process arrays
    const data = await request.json();
    console.log('Raw data:', data);
    interface ConspiracyTemplateProcessed {
      key_facts: string[];
      debunking_points: string[];
      sources: string[];
      [key: string]: any;
    }

    const processedData: ConspiracyTemplateProcessed = {
      ...data,
      key_facts: data.key_facts.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
      debunking_points: data.debunking_points.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
      sources: data.sources.split('\n').map((s: string) => s.trim()).filter((s: string) => s),
    };
    console.log('Processed data:', processedData);
    
    const template = await insertConspiracyTemplate(processedData);
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create template' 
    }, { status: 500 });
  }
}
