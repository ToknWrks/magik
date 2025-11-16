// lib/seed.ts
import { pool } from './db';

export async function seedDatabase() {
  try {
    // Insert conspiracy templates
    const templates = [
      {
        title: 'The Illuminati',
        slug: 'illuminati',
        category: 'Secret Societies',
        status: 'Partially Debunked',
        prompt_template: 'Generate detailed Illuminati conspiracy theory content',
        key_facts: ['Founded in 1776', 'Banned in 1784', 'Modern conspiracy claims'],
        debunking_points: ['Historical society dissolved', 'No evidence of continuation', 'Modern claims are unfounded'],
        sources: ['Bavarian archives', 'Historical records', 'Weishaupt writings'],
        difficulty_level: 'medium'
      },
      // Add more templates...
    ];

    for (const template of templates) {
      await pool.query(`
        INSERT INTO conspiracy_templates 
        (title, slug, category, status, prompt_template, key_facts, debunking_points, sources, difficulty_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO NOTHING
      `, [
        template.title,
        template.slug,
        template.category,
        template.status,
        template.prompt_template,
        template.key_facts,
        template.debunking_points,
        template.sources,
        template.difficulty_level
      ]);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}