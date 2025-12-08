// app/api/keywords/route.ts
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET() {
  try {
    // Get manual keyword mappings
    const mappings = await pool.query(`
      SELECT keyword, target_slug, target_type 
      FROM keyword_mappings
    `);

    // Get all active templates for title matching
    const [mysteries, enlightenment, conspiracies] = await Promise.all([
      pool.query(`
        SELECT title, slug, 'mystery' as type 
        FROM conspiracy_templates 
        WHERE is_active = true
      `),
      pool.query(`
        SELECT title, slug, 'enlightenment' as type 
        FROM enlightenment_templates 
        WHERE is_active = true
      `),
      pool.query(`
        SELECT title, slug, 'conspiracy' as type 
        FROM conspiracy_templates 
        WHERE is_active = true
      `),
    ]);

    const keywordsList: { keyword: string; slug: string; type: 'mystery' | 'enlightenment' | 'conspiracy' }[] = [];

    // Add manual mappings first (highest priority)
    mappings.rows.forEach((r) => {
      keywordsList.push({
        keyword: r.keyword,
        slug: r.target_slug,
        type: r.target_type as 'mystery' | 'enlightenment' | 'conspiracy',
      });
    });

    // Add template titles (lower priority, only if not already mapped)
    [...mysteries.rows, ...enlightenment.rows, ...conspiracies.rows].forEach((r) => {
      const path = r.type === 'enlightenment' ? '/enlightenment/' : '/mysteries/';
      const fullSlug = path + r.slug;
      
      // Only add title if not already mapped to this slug
      if (!keywordsList.find(k => k.slug === fullSlug)) {
        keywordsList.push({
          keyword: r.title,
          slug: fullSlug,
          type: r.type as 'mystery' | 'enlightenment' | 'conspiracy',
        });
      }
    });

    // Sort by keyword length (longest first) to prioritize longer matches
    keywordsList.sort((a, b) => b.keyword.length - a.keyword.length);

    return NextResponse.json({ keywords: keywordsList });
  } catch (error) {
    console.error('Keywords fetch error:', error);
    return NextResponse.json({ keywords: [] });
  }
}