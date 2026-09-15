import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import { createUserAccount, createSession } from '@/lib/auth';
import { languagePromptSuffix } from '@/lib/language';
import { estimateFootprintGrams, REGEN_CONTRIBUTION_CENTS } from '@/lib/regen-footprint';
import { READING_CARD_USD, READING_TOKENS } from '@/lib/reading-pricing';

async function ensureTable(pool: Pool) {
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
  await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS co2_grams NUMERIC`);
  await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS regen_contribution_cents INT`);
  await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS regen_retired_at TIMESTAMPTZ`);
}

export async function POST(request: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

    const {
      paymentIntentId,
      couponCode,
      useCredits,
      cryptoPaymentId,
      birthDate,
      birthTime,
      birthLocation,
      focus,
      email,
      password,
      transits,
      language = 'en',
    } = await request.json();

    const isDev = process.env.NODE_ENV === 'development';
    const devBypass = isDev && paymentIntentId === 'dev_bypass';
    const usingCoupon = !devBypass && !!couponCode;
    const usingCredits = !devBypass && !usingCoupon && !!useCredits;
    const usingCrypto = !devBypass && !usingCoupon && !useCredits && !!cryptoPaymentId;

    // Token price of a Personal Transit Reading (lib/reading-pricing is the source of truth)
    const READING_COST_TOKENS = READING_TOKENS;

    if (!birthDate || !birthLocation || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!paymentIntentId && !couponCode && !useCredits && !cryptoPaymentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureTable(pool);

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
      // Validate only — do NOT increment yet so failed attempts don't consume uses
      const valid = await pool.query(
        `SELECT id, COALESCE(credits, 0) AS credits FROM invite_codes
         WHERE UPPER(code) = UPPER($1)
           AND type = 'free_reading'
           AND uses < max_uses
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [couponCode.trim()]
      );
      if (valid.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or already-used invite code' }, { status: 402 });
      }
      effectivePaymentId = `coupon_${couponCode.trim().toUpperCase()}_${Date.now()}`;
      couponCredits = valid.rows[0].credits ?? 0;
    } else if (usingCredits) {
      // Pay with tokens — must be logged in (tokens live on the account)
      const uid = request.cookies.get('user_id')?.value;
      if (!uid) {
        return NextResponse.json({ error: 'Sign in to pay with tokens' }, { status: 401 });
      }
      // Atomic deduct only if sufficient balance (same pattern as /api/credits/spend)
      const deduct = await pool.query(
        `UPDATE user_credits
         SET balance = balance - $1, updated_at = NOW()
         WHERE user_id = $2 AND balance >= $1
         RETURNING balance`,
        [READING_COST_TOKENS, uid]
      );
      if (deduct.rows.length === 0) {
        return NextResponse.json(
          { error: `Not enough tokens — this reading costs ${READING_COST_TOKENS} tokens` },
          { status: 402 }
        );
      }
      await pool.query(
        `INSERT INTO credit_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'spend', $3)`,
        [uid, -READING_COST_TOKENS, 'Personal Transit Reading']
      );
      effectivePaymentId = `credits_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    } else if (usingCrypto) {
      // Pay with crypto — verify the pre-verified payment belongs to this user,
      // is this reading type, and is unclaimed; then claim it atomically.
      const uid = request.cookies.get('user_id')?.value;
      if (!uid) {
        return NextResponse.json({ error: 'Sign in to pay with crypto' }, { status: 401 });
      }
      const claimed = await pool.query(
        `UPDATE reading_crypto_payments
         SET claimed_at = NOW()
         WHERE id = $1 AND user_id = $2 AND reading_type = 'transit' AND claimed_at IS NULL
         RETURNING id`,
        [cryptoPaymentId, uid]
      );
      if (claimed.rows.length === 0) {
        return NextResponse.json({ error: 'Crypto payment not found, already used, or for a different reading' }, { status: 402 });
      }
      effectivePaymentId = cryptoPaymentId;
    } else {
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }
      // Enforce the card price server-side (transit: card = READING_CARD_USD)
      const expectedCents = Math.round(READING_CARD_USD * 100);
      if (paymentIntent.amount !== expectedCents) {
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 402 });
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
      ? `\n\nCalculated active transits to natal chart (variable orbs applied — ONLY reference these, do not mention any other transits):\nOrb guidelines: Saturn transits 7° (Saturn return 20°, Saturn opposition self 10°); Mars 9° applying / 5° separating; Uranus return/opposition self 10°; same-planet transits 7°; all others 5°. Applying transits are building in strength; separating are releasing.\n${
          transits.map((t: any) =>
            `- Transiting ${t.transitPlanet} ${t.aspect} Natal ${t.natalPlanet} (orb: ${t.currentOrb}°, ${t.isApplying ? 'applying' : 'separating'})`
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

Write in second person ("you/your"), with depth and warmth. Be specific — reference the actual planets and aspects. Avoid generic platitudes. Total length: 600-900 words.${languagePromptSuffix(language)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const report = response.content[0].type === 'text' ? response.content[0].text : '';

    const co2Grams = estimateFootprintGrams(report);

    // Save to DB
    const result = await pool.query(
      `INSERT INTO astrology_readings (user_id, stripe_payment_id, birth_date, birth_time, birth_location, focus, report, co2_grams, regen_contribution_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.id, effectivePaymentId, birthDate, birthTime || null, birthLocation, focus || null, report, co2Grams, REGEN_CONTRIBUTION_CENTS]
    );

    const reading = result.rows[0];

    // Increment coupon uses only after reading is successfully saved
    if (usingCoupon) {
      await pool.query(
        `UPDATE invite_codes SET uses = uses + 1 WHERE UPPER(code) = UPPER($1)`,
        [couponCode.trim()]
      );
    }

    const res = NextResponse.json({ reading, accountCreated });

    res.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Personal reading error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to generate reading', details: msg }, { status: 500 });
  }
}
