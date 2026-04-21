// app/api/post-transit/route.ts
// Cron: daily transit tweet — calculates today's sky, writes tweet with Claude, posts to X
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';
import * as Astronomy from 'astronomy-engine';
import { pool } from '@/lib/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const twitter = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ASPECTS = [
  { name: 'conjunct',  angle: 0,   orb: 8 },
  { name: 'sextile',   angle: 60,  orb: 5 },
  { name: 'square',    angle: 90,  orb: 8 },
  { name: 'trine',     angle: 120, orb: 8 },
  { name: 'opposite',  angle: 180, orb: 8 },
];

function getPositions(date: Date): Record<string, { lon: number; sign: string; deg: string }> {
  const result: Record<string, { lon: number; sign: string; deg: string }> = {};
  for (const planet of PLANETS) {
    try {
      const vec = Astronomy.GeoVector(planet as Astronomy.Body, date, false);
      const ecl = Astronomy.Ecliptic(vec);
      const lon = ((ecl.elon % 360) + 360) % 360;
      const sign = ZODIAC[Math.floor(lon / 30)];
      const deg  = (lon % 30).toFixed(1);
      result[planet] = { lon, sign, deg };
    } catch { /* skip */ }
  }
  return result;
}

function getAspects(positions: Record<string, { lon: number }>) {
  const active: { p1: string; p2: string; aspect: string; orb: number }[] = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const a = positions[PLANETS[i]]?.lon;
      const b = positions[PLANETS[j]]?.lon;
      if (a === undefined || b === undefined) continue;
      let diff = Math.abs(a - b);
      diff = Math.min(diff, 360 - diff);
      for (const asp of ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          active.push({ p1: PLANETS[i], p2: PLANETS[j], aspect: asp.name, orb });
        }
      }
    }
  }
  return active.sort((a, b) => a.orb - b.orb); // tightest first
}

export async function GET(request: NextRequest) {
  try {
    const now  = new Date();
    const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const authorKey = `transit-${dateKey}`;

    // Skip if already posted today
    const existing = await pool.query(
      'SELECT id FROM posted_quotes WHERE author = $1',
      [authorKey],
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Transit tweet already posted today' });
    }

    // Calculate sky
    const positions = getPositions(now);
    const aspects   = getAspects(positions);

    // Build sky summary for Claude
    const planetLine = PLANETS
      .filter(p => positions[p])
      .map(p => `${p} in ${positions[p].sign} at ${positions[p].deg}°`)
      .join(', ');

    const aspectLines = aspects.slice(0, 6)
      .map(a => `${a.p1} ${a.aspect} ${a.p2} (${a.orb.toFixed(1)}° orb)`)
      .join('\n');

    const prompt = `Today is ${date}.

Current planetary positions: ${planetLine}

Active aspects (tightest first):
${aspectLines || 'No tight aspects today'}

Write a single tweet (max 250 characters) about today's astrological energy for the @illuminati_earth account.

Rules:
- Mystical, insightful, poetic tone — not generic horoscope fluff
- Reference 1–2 specific planets or aspects that are most significant today
- End with #Archetypal #Astrology
- Do NOT include a URL
- Output only the tweet text, nothing else`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    });

    const tweetText = (response.content[0].type === 'text' ? response.content[0].text : '').trim().slice(0, 280);
    if (!tweetText) throw new Error('Claude returned empty tweet');

    // Post to X
    const tweet = await twitter.v2.tweet(tweetText);

    // Save to DB
    await pool.query(
      'INSERT INTO posted_quotes (quote, author, tweet_id) VALUES ($1, $2, $3)',
      [tweetText, authorKey, tweet.data.id],
    );

    return NextResponse.json({ success: true, tweet: tweetText, tweetId: tweet.data.id });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Post-transit error:', err, error);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
