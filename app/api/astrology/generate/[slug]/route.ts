// app/api/astrology/generate/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAstrologyTemplate } from '@/lib/db';
import { Pool } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { slug } = await params;
    const template = await getAstrologyTemplate(slug);

    if (!template) {
      return NextResponse.json({ error: 'Astrology combination not found' }, { status: 404 });
    }

    if (!template.is_active) {
      return NextResponse.json({ error: 'This astrology combination is not active' }, { status: 403 });
    }

    // Check for cached content
    const cachedResult = await pool.query(
      `SELECT * FROM astrology_content 
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
      });
    }

    // Generate new content with AI
    const prompt = `You are an expert astrologer specializing in archetypal astrology. Write a comprehensive analysis of the "${template.title}" planetary combination.

${template.description ? `Context: ${template.description}` : ''}

${template.archetypal_themes?.length ? `Archetypal Themes to explore:
${template.archetypal_themes.map((t: string) => `- ${t}`).join('\n')}` : ''}

${template.evidence_points?.length ? `Evidence Points to include:
${template.evidence_points.map((p: string) => `- ${p}`).join('\n')}` : ''}

${template.counterarguments?.length ? `Counterarguments to address:
${template.counterarguments.map((a: string) => `- ${a}`).join('\n')}` : ''}

Write in a scholarly yet accessible tone.

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
(Overview of the planetary combination and its significance)

## Archetypal Dynamics
(The fundamental energies and their interaction)

## Manifestation in Life
(How this combination appears in personality, relationships, and life events)

## Evolutionary Purpose
(The spiritual growth potential of this combination)

## Practical Applications
(How to work with this combination constructively)

## Integration
(Ways to harmonize these planetary energies)`;

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

    // Cache the generated content
    await pool.query(
      `INSERT INTO astrology_content (template_id, content)
       VALUES ($1, $2)`,
      [template.id, generatedContent]
    );

    return NextResponse.json({
      title: template.title,
      body: generatedContent,
    });
  } catch (error) {
    console.error('Astrology generate error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate astrology content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}