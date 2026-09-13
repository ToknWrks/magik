// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  try {
    const userId = request.cookies.get('user_id')?.value;
    console.log('Auth check - user_id cookie:', userId);
    
    if (!userId) {
      console.log('No user_id cookie found');
      return NextResponse.json({ user: null });
    }
    
    const result = await pool.query(
      'SELECT id, email, username, role, avatar_url, bio, wallet_address FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    console.log('User found in database:', !!user);
    
    if (!user) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url || null,
        bio: user.bio || null,
        wallet_address: user.wallet_address || null,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null });
  }
}