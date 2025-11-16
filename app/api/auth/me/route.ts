// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    console.log('Auth check - user_id cookie:', userId);
    
    if (!userId) {
      console.log('No user_id cookie found');
      return NextResponse.json({ user: null });
    }
    
    const result = await pool.query('SELECT email, role FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    console.log('User found in database:', !!user);
    
    return NextResponse.json({ user: user ? { email: user.email, role: user.role } : null });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      user: null,
      error: 'Failed to validate session'
    });
  }
}