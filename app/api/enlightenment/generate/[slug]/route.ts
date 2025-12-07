// app/api/enlightenment/generate/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEnlightenmentTemplate } from '@/lib/db';
import { Pool } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const template = await getEnlightenmentTemplate(slug);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.is_active) {
      return NextResponse.json({ error: 'This teaching is not active' }, { status: 403 });
    }

    // Check for cached content in enlightenment_content table
    const cachedResult = await pool.query(
      `SELECT * FROM enlightenment_content 
       WHERE template_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [template.id]
    );

    if (cachedResult.rows.length > 0) {
      const cached = cachedResult.rows[0];
      return NextResponse.json({
        cached: true,
        title: template.title,
        body: cached.content,
        sources: template.sources,
      });
    }

    // Generate new content with AI
    const prompt = `You are a spiritual teacher and wisdom keeper. Write an enlightening article about "${template.title}".

${template.description ? `Context: ${template.description}` : ''}

${template.key_teachings?.length ? `Key Teachings to explore:
${template.key_teachings.map((t: string) => `- ${t}`).join('\n')}` : ''}

${template.spiritual_practices?.length ? `Spiritual Practices to include:
${template.spiritual_practices.map((p: string) => `- ${p}`).join('\n')}` : ''}

Write in a warm, wise, and accessible tone.

IMPORTANT FORMATTING RULES:
- Use ## for main section headings (not #)
- Use ### for sub-headings
- Use **bold text** for emphasis
- Leave a blank line between paragraphs
- Use > for inspirational quotes
- Use bullet points with - for lists
- Do NOT include any meta-commentary about formatting
- Do NOT start with "Here is" or similar phrases
- Start directly with the content

Include these sections:
## Introduction
(A welcoming introduction to the teaching)

## Historical Context
(Traditional and historical background)

## Core Wisdom
(The main principles and insights)

## Living the Teaching
(Practical applications for daily life)

## Practice
(A guided exercise or meditation)

## Reflection
(A closing thought or contemplation)`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const generatedContent = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Cache in enlightenment_content table
    await pool.query(
      `INSERT INTO enlightenment_content (template_id, content)
       VALUES ($1, $2)`,
      [template.id, generatedContent]
    );

    return NextResponse.json({
      title: template.title,
      body: generatedContent,
      sources: template.sources,
    });
  } catch (error) {
    console.error('Enlightenment generate error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}