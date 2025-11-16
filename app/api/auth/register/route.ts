// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const user = await createUser(email, password);
    
    return NextResponse.json({ 
      success: true, 
      user: { email: user.email } 
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 400 });
  }
}