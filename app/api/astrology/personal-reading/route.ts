import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import { createUserAccount, createSession } from '@/lib/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS astrology_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      stripe_payment_id TEXT NOT NULL UNIQUE,
      birth_date TEXT NOT NULL,
      birth_time TEXT,
      birth_location TEXT NOT NULL,
      focus TEXT,
      report TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(request: NextRequest) {
  try {
    const {
      paymentIntentId,
      couponCode,
      birthDate,
      birthTime,
      birthLocation,
      focus,
      email,
      password,
      transits,
    } = await request.json();

    const isDev = process.env.NODE_ENV === 'development';
    const devBypass = isDev && paymentIntentId === 'dev_bypass';
    const usingCoupon = !devBypass && !!couponCode;

    if (!birthDate || !birthLocation || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!paymentIntentId && !couponCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureTable();

    let effectivePaymentId: string;
    let couponCredits = 0;

    if (devBypass) {
      effectivePaymentId = `dev_bypass_${Date.now()}`;
    } else if (usingCoupon) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS invite_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code TEXT NOT NULL UNIQUE,
          description TEXT,
          type TEXT NOT NULL DEFAULT 'free_reading',
          max_uses INTEGER NOT NULL DEFAULT 1,
          uses INTEGER NOT NULL DEFAULT 0,
          credits INTEGER NOT NULL DEFAULT 0,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0`);
      // Atomically redeem the coupon — only succeeds if still valid
      const redeemed = await pool.query(
        `UPDATE invite_codes
         SET uses = uses + 1
         WHERE UPPER(code) = UPPER($1)
           AND type = 'free_reading'
           AND uses < max_uses
           AND (expires_at IS NULL OR expires_at > NOW())
         RETURNING id, COALESCE(credits, 0) AS credits`,
        [couponCode.trim()]
      );
      if (redeemed.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or already-used invite code' }, { status: 402 });
      }
      effectivePaymentId = `coupon_${couponCode.trim().toUpperCase()}_${Date.now()}`;
      couponCredits = redeemed.rows[0].credits ?? 0;
    } else {
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }

      // Check for duplicate (idempotency)
      const existing = await pool.query(
        'SELECT * FROM astrology_readings WHERE stripe_payment_id = $1',
        [paymentIntentId]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ reading: existing.rows[0] });
      }

      effectivePaymentId = paymentIntentId;
    }

    // Get or create user
    const userId = request.cookies.get('user_id')?.value;
    let user = userId
      ? (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0]
      : null;

    let sessionToken: string | null = null;
    let accountCreated = false;

    if (!user) {
      user = await createUserAccount(email, password);
      sessionToken = await createSession(user.id);
      accountCreated = true;
    }

    // Grant credits if coupon included them
    if (couponCredits > 0) {
      await pool.query(`CREATE TABLE IF NOT EXISTS user_credits (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0)`);
      await pool.query(
        `INSERT INTO user_credits (user_id, balance)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET balance = GREATEST(0, user_credits.balance + $2)`,
        [user.id.toString(), couponCredits]
      );
    }

    // Build Claude prompt
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const focusLine = focus ? `\n\nThe person has a specific focus or question: "${focus}"` : '';

    const transitList = Array.isArray(transits) && transits.length > 0
      ? `\n\nCalculated active transits to natal chart (within 15° orb, sorted tightest first — ONLY reference these, do not mention any other transits):\n${
          transits.map((t: any) =>
            `- Transit ${t.transitPlanet} ${t.aspect} Natal ${t.natalPlanet} (orb: ${t.currentOrb}°, ${t.isApplying ? 'applying' : 'separating'})`
          ).join('\n')
        }`
      : '';

    const prompt = `You are an expert archetypal astrologer. Provide a rich, personal transit reading for someone with the following birth details:

Birth Date: ${birthDate}
Birth Time: ${birthTime || 'Unknown'}
Birth Location: ${birthLocation}
Today's Date: ${todayStr}${focusLine}${transitList}

Please provide a comprehensive personal transit reading with the following sections:

## Your Natal Blueprint
A brief overview of key natal tendencies based on their birth date and location — their core archetypal energies and life themes.

## Current Major Transits Affecting You
Using the calculated transit data above, describe the most significant active transits and what themes they are activating in this person's life right now. Reference the specific planets and aspects by name. Focus on the tightest orbs (closest to exact) as the most powerful influences.

## The Month Ahead
What the next 30 days look like energetically — key turning points, when major transits peak or perfect, and what opportunities or challenges to expect.

## Guidance & Integration
Practical archetypal guidance for working with these energies consciously. What to lean into, what to be mindful of.

Write in second person ("you/your"), with depth and warmth. Be specific — reference the actual planets and aspects. Avoid generic platitudes. Total length: 600-900 words.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const report = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save to DB
    const result = await pool.query(
      `INSERT INTO astrology_readings (user_id, stripe_payment_id, birth_date, birth_time, birth_location, focus, report)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.id, effectivePaymentId, birthDate, birthTime || null, birthLocation, focus || null, report]
    );

    const reading = result.rows[0];

    const res = NextResponse.json({ reading, accountCreated });

    if (sessionToken) {
      res.cookies.set('user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('Personal reading error:', error);
    return NextResponse.json({ error: 'Failed to generate reading' }, { status: 500 });
  }
}
