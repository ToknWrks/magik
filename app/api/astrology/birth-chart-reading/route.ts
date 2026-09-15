import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import { createUserAccount, createSession } from '@/lib/auth';
import { languagePromptSuffix } from '@/lib/language';
import { estimateFootprintGrams, REGEN_CONTRIBUTION_CENTS } from '@/lib/regen-footprint';

// POST /api/astrology/birth-chart-reading
// Standalone Birth Chart Reading ($9 or 250 tokens) — natal chart interpretation
// only, NOT the Full Initiation (which also includes the transit reading).

const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const LUMINARIES = new Set(['Sun', 'Moon']);

const NATAL_ASPECTS = [
  { name: 'Conjunction', angle: 0,   orb: 10, orbLuminary: 15 },
  { name: 'Opposition',  angle: 180, orb: 10, orbLuminary: 15 },
  { name: 'Trine',       angle: 120, orb: 9,  orbLuminary: 12 },
  { name: 'Square',      angle: 90,  orb: 9,  orbLuminary: 12 },
  { name: 'Sextile',     angle: 60,  orb: 5,  orbLuminary: 7  },
];

function lonToSign(lon: number): string {
  const n = ((lon % 360) + 360) % 360;
  return `${ZODIAC_SIGNS[Math.floor(n / 30)]} ${(n % 30).toFixed(1)}°`;
}

function calcNatalAspects(positions: Record<string, number>): string {
  const planets = Object.keys(positions);
  const results: string[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(positions[p1] - positions[p2]);
      diff = Math.min(diff, 360 - diff);
      const isLuminary = LUMINARIES.has(p1) || LUMINARIES.has(p2);
      for (const asp of NATAL_ASPECTS) {
        const maxOrb = isLuminary ? asp.orbLuminary : asp.orb;
        const orb = Math.abs(diff - asp.angle);
        if (orb <= maxOrb) {
          results.push(`- ${p1} ${asp.name} ${p2} (orb: ${orb.toFixed(1)}°)`);
          break;
        }
      }
    }
  }
  return results.length > 0 ? results.join('\n') : 'None within orb';
}

async function ensureSchema(pool: Pool) {
  await pool.query(`ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS reading_type TEXT DEFAULT 'transit'`);
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
      birthDate,
      birthTime,
      birthLocation,
      focus,
      email,
      password,
      natalPositions,
      language = 'en',
    } = await request.json();

    const isDev = process.env.NODE_ENV === 'development';
    const devBypass = isDev && paymentIntentId === 'dev_bypass';
    const usingCoupon = !devBypass && !!couponCode;
    const usingCredits = !devBypass && !usingCoupon && !!useCredits;

    // Token price of a Birth Chart Reading ($1 = 100 tokens) — same as a transit reading
    const READING_COST_TOKENS = 250;

    if (!birthDate || !birthLocation || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!paymentIntentId && !couponCode && !useCredits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureSchema(pool);

    let effectivePaymentId: string;
    let couponCredits = 0;

    if (devBypass) {
      effectivePaymentId = `dev_birthchart_${Date.now()}`;
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
      effectivePaymentId = `coupon_birthchart_${couponCode.trim().toUpperCase()}_${Date.now()}`;
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
        [uid, -READING_COST_TOKENS, 'Birth Chart Reading']
      );
      effectivePaymentId = `credits_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
      await pool.query(
        `INSERT INTO user_credits (user_id, balance)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET balance = GREATEST(0, user_credits.balance + $2)`,
        [user.id.toString(), couponCredits]
      );
    }

    const focusLine = focus ? `\n\nThe person has a specific focus or question: "${focus}"` : '';

    // Format natal positions and aspects for prompts
    const PLANET_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const orderedPositions = natalPositions
      ? Object.fromEntries(PLANET_ORDER.filter((p: string) => natalPositions[p] !== undefined).map((p: string) => [p, natalPositions[p]]))
      : {};
    const natalSection = Object.keys(orderedPositions).length > 0
      ? `\n\nNatal Planetary Positions:\n${Object.entries(orderedPositions).map(([p, lon]) => `- ${p}: ${lonToSign(lon as number)}`).join('\n')}`
      : '';
    const aspectsSection = Object.keys(orderedPositions).length > 0
      ? `\n\nNatal Aspects (major only):\n${calcNatalAspects(orderedPositions)}`
      : '';

    const prompt = `You are an expert archetypal astrologer providing a Birth Chart Reading for someone beginning their inner journey.

Birth Date: ${birthDate}
Birth Time: ${birthTime || 'Unknown (chart calculated for noon)'}
Birth Location: ${birthLocation}${focusLine}${natalSection}${aspectsSection}

Aspect orb guidelines used: Conjunction/Opposition up to 15° for Sun/Moon (10° others); Trine/Square up to 12° for Sun/Moon (9° others); Sextile up to 7° for Sun/Moon (5° others). Treat orbs as a spectrum of influence — tighter orbs carry more weight.

Using the natal planetary positions and aspects above, provide a rich and personal Birth Chart Reading:

## The Sun: Your Core Identity
Interpret the natal sun placement — the fundamental character, ego expression, and life purpose this person is here to embody. What is the essential nature of this solar energy and how does it want to shine?

## The Moon: Your Inner World
Interpret the natal moon placement — emotional nature, instinctual responses, unconscious needs, and the inner landscape. How does this person process feeling and find a sense of home within themselves?

## Mercury, Venus & Mars: Mind, Heart & Will
Focused interpretation of Mercury (communication, thinking style, how the mind works), Venus (values, relational nature, what the soul loves), and Mars (drive, desire, how they assert themselves and take action in the world).

## The Outer Planets: Growth & Mastery
Interpret Jupiter and Saturn placements — where this person is called to expand and grow, and where they face their deepest disciplines and greatest potential for mastery. Brief note on outer planet generational signatures.

## Your Aspects: The Architecture of the Soul
Interpret the most significant natal aspects listed above. Focus especially on tight conjunctions, squares, and oppositions as points of intensity and potential; trines and sextiles as natural gifts and flow. Weave these into the portrait of the person — how do these planetary relationships create tension, synergy, and the deeper story of who they are?

## Your Elemental Nature
From the planetary positions, identify the dominant elements (Fire, Earth, Air, Water) and modalities (Cardinal, Fixed, Mutable). What do these reveal about this person's temperament, natural gifts, and potential blind spots?

## Your Soul's Signature
A synthesizing reflection — the overall soul blueprint, the central themes woven through this lifetime, and the evolutionary invitation encoded in this chart. What is this person here to learn, to offer, to become?

Write in second person ("you/your"), with depth, warmth, and astrological precision. Be specific — reference the actual planetary placements and aspects by name. Total length: 1100–1400 words.${languagePromptSuffix(language)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      messages: [{ role: 'user', content: prompt }],
    });
    const report = response.content[0].type === 'text' ? response.content[0].text : '';

    const co2Grams = estimateFootprintGrams(report);

    // Save to DB
    const result = await pool.query(
      `INSERT INTO astrology_readings (user_id, stripe_payment_id, birth_date, birth_time, birth_location, focus, report, reading_type, co2_grams, regen_contribution_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'birthchart', $8, $9)
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
    console.error('Birth chart reading error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to generate reading', details: msg }, { status: 500 });
  }
}
