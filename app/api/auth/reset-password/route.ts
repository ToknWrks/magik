// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { pool } from '@/lib/db'; // Adjust import
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MAX_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email } = await request.json();
  const ip = getClientIp(request);
  const genericResponse = NextResponse.json({ success: true });

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Throttle by email AND by IP so no single account (or attacker) can flood Resend.
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const recent = await pool.query(
    'SELECT COUNT(*) FROM password_resets WHERE (email = $1 OR requested_ip = $2) AND created_at > $3',
    [email, ip, windowStart]
  );
  if (Number(recent.rows[0].count) >= MAX_PER_WINDOW) {
    return genericResponse; // same response as success — no oracle for attacker
  }

  const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) {
    return genericResponse; // don't reveal whether the account exists, don't email
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  try {
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at, created_at, requested_ip) VALUES ($1, $2, $3, NOW(), $4)',
      [email, resetToken, expiresAt, ip]
    );
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
    return genericResponse;
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { token, password } = await request.json();
  // Verify token and update password
  const result = await pool.query('SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()', [token]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const email = result.rows[0].email;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

  // Delete used token
  await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);

  return NextResponse.json({ success: true });
}