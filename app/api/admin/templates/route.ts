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

// Update POST and PUT to handle keywords

// In the processArray helper, add handling for keywords:
const processArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(s => s && s.trim());
  return value.split('\n').map(s => s.trim()).filter(s => s);
};

export async function POST(request: NextRequest) {
  try {
    // Process arrays
    const data = await request.json();
    console.log('Raw data:', data);
    interface ConspiracyTemplateProcessed {
      key_facts: string[];
      debunking_points: string[];
      sources: string[];
      keywords: string[];  // Add this
      [key: string]: any;
    }

    const processedData: ConspiracyTemplateProcessed = {
      ...data,
      key_facts: processArray(data.key_facts),
      debunking_points: processArray(data.debunking_points),
      sources: processArray(data.sources),
      keywords: processArray(data.keywords),  // Add this
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
