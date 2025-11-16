// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      await destroySession(token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}