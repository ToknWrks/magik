// app/api/conspiracies/generate/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';

// Inline database functions to avoid import issues
async function getConspiracyTemplate(slug: string, pool: Pool) {
  try {
    const result = await pool.query(
      'SELECT * FROM conspiracy_templates WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching conspiracy template:', error);
    return null;
  }
}

async function saveGeneratedContent(templateId: string, content: string, debunking: string, sources: string[], pool: Pool) {
  try {
    const result = await pool.query(
      `INSERT INTO generated_content (template_id, content, debunking_content, sources, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
       RETURNING *`,
      [templateId, content, debunking, sources]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving generated content:', error);
    return null;
  }
}

async function getCachedContent(templateId: string, pool: Pool) {
  try {
    const result = await pool.query(
      'SELECT * FROM generated_content WHERE template_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [templateId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching cached content:', error);
    return null;
  }
}

async function incrementViewCount(templateId: string, pool: Pool) {
  try {
    await pool.query(
      'UPDATE conspiracy_templates SET view_count = view_count + 1 WHERE id = $1',
      [templateId]
    );
  } catch (error) {
    console.error('Error updating view count:', error);
  }
}

// Inline AI service to avoid import issues
class ConspiracyAIService {
  private anthropic: Anthropic;

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
  }

  async generateConspiracyContent(template: any) {
    try {
      const prompt = `You are a spiritual teacher, wisdom keeper, researcher on mysteries occult and conspiracy theories. Write an enlightening article about "${template.title}".
  based on the best available information.'
${template.key_facts?.join('\n') || 'No specific facts provided'}
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
(A welcoming introduction to the theory)

## Historical Context
(Conspiratorial and historical / factual background)

## Scientific Perspective
(The main principles and insights)

## Spiritual / Esoteric perspective 
(Events metaphysical and spiritual significance)

## Critical Thinking
(A thoughtful analysis of different viewpoints)

## Reflection
(A closing thought or contemplation)`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',  // Updated to latest model
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : 'Error generating content';
    } catch (error) {
      console.error('Anthropic API error:', error);
      return 'Error generating conspiracy content';
    }
  }

  async generateDebunkingContent(template: any) {
    try {
      const prompt = `
Provide Sources related to  "${template.title}".
${template.debunking_points?.join('\n') || 'No debunking points provided'}

Structure the response as a list of sources with links in Markdown format. Verify source links are working.
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',  // Updated to latest model
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : 'Error generating debunking';
    } catch (error) {
      console.error('Anthropic API error:', error);
      return 'Error generating debunking content';
    }
  }
}

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

    const aiService = new ConspiracyAIService(anthropic);

    const { slug } = await params;

    // Get template from database
    const template = await getConspiracyTemplate(slug, pool);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check cache first
    const cached = await getCachedContent(template.id, pool);
    if (cached) {
      return NextResponse.json({
        id: cached.id,
        template_id: template.id,
        title: template.title,
        body: cached.content,
        debunking: cached.debunking_content,
        sources: cached.sources || template.sources,
        created_at: cached.created_at,
        cached: true
      });
    }

    // Generate new content
    const content = await aiService.generateConspiracyContent(template);
    const debunking = await aiService.generateDebunkingContent(template);

    // Save to cache
    const saved = await saveGeneratedContent(template.id, content, debunking, template.sources, pool);

    // Update view count
    await incrementViewCount(template.id, pool);

    return NextResponse.json({
      id: saved?.id,
      template_id: template.id,
      title: template.title,
      body: content,
      debunking: debunking,
      sources: template.sources,
      created_at: saved?.created_at,
      cached: false
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: 'Generation failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}