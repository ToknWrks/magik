// app/api/keywords/route.ts
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET() {
  try {
    // Get all active templates
    const [mysteries, enlightenment] = await Promise.all([
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
    ]);

    const keywords: { keyword: string; slug: string; type: 'mystery' | 'enlightenment' }[] = [];

    // Add mystery keywords
    mysteries.rows.forEach((r) => {
      // Add full title
      keywords.push({
        keyword: r.title,
        slug: r.slug,
        type: 'mystery',
      });
      
      // Extract key terms from title (words with 6+ characters, excluding common words)
      const commonWords = ['the', 'and', 'that', 'with', 'from', 'they', 'are', 'was', 'were', 'have', 'has', 'been', 'being', 'through', 'about', 'into', 'over', 'after', 'before'];
      const words = r.title.split(/\s+/);
      words.forEach((word: string) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length >= 6 && !commonWords.includes(cleanWord.toLowerCase())) {
          // Avoid duplicates
          if (!keywords.find(k => k.keyword.toLowerCase() === cleanWord.toLowerCase())) {
            keywords.push({
              keyword: cleanWord,
              slug: r.slug,
              type: 'mystery',
            });
          }
        }
      });
    });

    // Add enlightenment keywords
    enlightenment.rows.forEach((r) => {
      // Add full title
      keywords.push({
        keyword: r.title,
        slug: r.slug,
        type: 'enlightenment',
      });
      
      // Extract key terms
      const commonWords = ['the', 'and', 'that', 'with', 'from', 'they', 'are', 'was', 'were', 'have', 'has', 'been', 'being', 'through', 'about', 'into', 'over', 'after', 'before', 'teachings', 'concepts', 'benefits', 'core'];
      const words = r.title.split(/\s+/);
      words.forEach((word: string) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length >= 5 && !commonWords.includes(cleanWord.toLowerCase())) {
          if (!keywords.find(k => k.keyword.toLowerCase() === cleanWord.toLowerCase())) {
            keywords.push({
              keyword: cleanWord,
              slug: r.slug,
              type: 'enlightenment',
            });
          }
        }
      });
    });

    // Sort by keyword length (longest first) to prioritize full matches
    keywords.sort((a, b) => b.keyword.length - a.keyword.length);

    console.log('Keywords count:', keywords.length);
    console.log('Sample keywords:', keywords.slice(0, 10).map(k => k.keyword));

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('Keywords fetch error:', error);
    return NextResponse.json({ keywords: [] });
  }
}