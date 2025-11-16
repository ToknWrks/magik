// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Find existing user (don't create new one!)
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    console.log('User found:', !!user);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }
    
    // Check password
    console.log('Checking password...');
    let isValidPassword = false;
    
    if (user.password_hash.startsWith('$2')) {
      // Already hashed
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } else {
      // Plain text (migration) - check and update
      if (user.password_hash === password) {
        isValidPassword = true;
        // Hash the password for future logins
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);
      }
    }
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }
    
    // Return user data for localStorage
    const response = NextResponse.json({ 
      success: true, 
      user: { email: user.email, role: user.role, id: user.id }
    });

    // Set cookie as backup
    response.cookies.set('user_id', user.id, {
      httpOnly: false, // Must be false for browser to send
      secure: false, // Must be false for HTTP
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/' // Must include path
    });

    console.log('Login successful');
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500 });
  }
}