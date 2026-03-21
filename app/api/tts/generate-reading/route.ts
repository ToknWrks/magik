import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { Pool } from '@neondatabase/serverless';
import { generateTTS } from '@/lib/tts';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

const CREDIT_COST = 50;

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    // Check and deduct credits
    const creditResult = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );
    const balance = creditResult.rows[0]?.balance ?? 0;
    if (balance < CREDIT_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This reading costs ${CREDIT_COST} credits. You have ${balance}.` },
        { status: 402 }
      );
    }

    // Deduct credits
    await pool.query(
      'UPDATE user_credits SET balance = balance - $1 WHERE user_id = $2',
      [CREDIT_COST, userId]
    );
    await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)`,
      [userId, -CREDIT_COST, 'reading_audio', 'Audio reading generation']
    );

    // Generate audio (handles <break> SSML tags)
    const tts = await generateTTS(text, 'Meditation Female');

    const blob = await put(`tts/readings/${userId}-${Date.now()}.${tts.ext}`, tts.buffer, {
      access: 'public',
      contentType: tts.contentType,
      addRandomSuffix: false,
    });

    const newBalance = balance - CREDIT_COST;
    return NextResponse.json({ audioUrl: blob.url, balance: newBalance });
  } catch (error) {
    console.error('Reading TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
