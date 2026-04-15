// app/api/stoic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Astronomy from 'astronomy-engine';

const rumiQuotes = [
  "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
  "Out beyond ideas of wrongdoing and rightdoing there is a field. I'll meet you there.",
  "The wound is the place where the Light enters you.",
  "What you seek is seeking you.",
  "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
  "Don't grieve. Anything you lose comes round in another form.",
  "The only lasting beauty is the beauty of the heart.",
  "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.",
  "Raise your words, not voice. It is rain that grows flowers, not thunder.",
  "You were born with wings, why prefer to crawl through life?",
  "The art of knowing is knowing what to ignore.",
  "Set your life on fire. Seek those who fan your flames.",
  "Silence is the language of God, all else is poor translation.",
  "Let the beauty of what you love be what you do.",
  "Be grateful for whoever comes, because each has been sent as a guide from beyond.",
  "The universe is not outside of you. Look inside yourself; everything that you want, you already are.",
  "Respond to every call that excites your spirit.",
  "Sell your cleverness and buy bewilderment.",
  "There is a voice that doesn't use words. Listen.",
  "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.",
  "Stop acting so small. You are the universe in ecstatic motion.",
  "Love is the bridge between you and everything.",
  "This being human is a guest house. Every morning a new arrival.",
  "As you start to walk on the way, the way appears.",
  "If you are irritated by every rub, how will your mirror be polished?",
  "These pains you feel are messengers. Listen to them.",
  "The garden of the world has no limits, except in your mind.",
];

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};
const ASPECTS = [
  { name: 'conjunct',  angle: 0,   orb: 8 },
  { name: 'sextile',   angle: 60,  orb: 5 },
  { name: 'square',    angle: 90,  orb: 8 },
  { name: 'trine',     angle: 120, orb: 8 },
  { name: 'opposite',  angle: 180, orb: 8 },
];

function getTodayTransits() {
  const now = new Date();
  const positions: Record<string, { lon: number; sign: string }> = {};

  for (const planet of PLANETS) {
    try {
      const vec = Astronomy.GeoVector(planet as Astronomy.Body, now, false);
      const ecl = Astronomy.Ecliptic(vec);
      const lon = ((ecl.elon % 360) + 360) % 360;
      positions[planet] = { lon, sign: ZODIAC[Math.floor(lon / 30)] };
    } catch { /* skip */ }
  }

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

  active.sort((a, b) => a.orb - b.orb);
  const top = active.slice(0, 3);

  return {
    aspects: top.map(a => ({
      label: `${PLANET_GLYPHS[a.p1] ?? a.p1} ${a.p1} ${a.aspect} ${PLANET_GLYPHS[a.p2] ?? a.p2} ${a.p2}`,
      orb: `${a.orb.toFixed(1)}°`,
    })),
    skyline: PLANETS
      .filter(p => positions[p])
      .slice(0, 5)
      .map(p => `${PLANET_GLYPHS[p]} ${positions[p].sign}`)
      .join('  '),
  };
}

export async function GET(_request: NextRequest) {
  const quote = rumiQuotes[Math.floor(Math.random() * rumiQuotes.length)];
  const transit = getTodayTransits();

  return NextResponse.json({
    data: {
      stoic: null,
      rumi: { quote, author: 'Rumi' },
      transit,
    },
  });
}
