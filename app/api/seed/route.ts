// app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../lib/seed';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully!' 
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}