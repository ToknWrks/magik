// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { pool } from '@/lib/db'; // Adjust import
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email } = await request.json();
  // Generate a reset token and store in DB
  const resetToken = Math.random().toString(36).substring(2);
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  try {
    await pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)', [
      email,
      resetToken,
      expiresAt,
    ]);
    console.log('Token stored:', resetToken);

    // Verify insert
    const verify = await pool.query('SELECT * FROM password_resets WHERE token = $1', [resetToken]);
    console.log('Verify insert:', verify.rows);
  } catch (error) {
    console.error('DB insert error:', error);
    return NextResponse.json({ error: 'Failed to store token' }, { status: 500 });
  }

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: 'noreply@illuminati.earth',
      to: email,
      subject: 'Reset your password',
      html: `<div>
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
      </div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { token, password } = await request.json();
  console.log('Received token:', token);
  // Verify token and update password
  const result = await pool.query('SELECT * FROM password_resets WHERE token = $1', [token]);

  console.log('Query result:', result.rows);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const email = result.rows[0].email;
  // Hash password and update user
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Updating password for email:', email);
  const updateResult = await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
  console.log('Update result:', updateResult.rowCount);

  // Delete used token
  await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);

  return NextResponse.json({ success: true });
}