// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  // Generate a reset token (in a real app, store it in DB)
  const resetToken = Math.random().toString(36).substring(2);
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