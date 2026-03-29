import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { consonants, intention, refine } = await req.json();

    if (!consonants || !intention) {
      return NextResponse.json({ error: 'Missing consonants or intention' }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'XAI_API_KEY is not configured' }, { status: 500 });
    }

    const letterList = consonants.split('').join(', ');
    const letterCount = consonants.length;

    const prompt = refine
      ? `A simplified, minimal sacred sigil glyph on a pure black background. Glowing silver ink. The sigil is built from exactly ${letterCount} unique letters: ${letterList} — each letter appears exactly once, no repetition. Reduce the design to its most essential form: fewer lines, more negative space, cleaner geometry. One unified mark, stripped of excess detail. The symbol captures the essence of: "${intention}". Minimalist occult art, high contrast, silver-white glow on black.`
      : `A sacred mystical sigil glyph on a pure black background. Ancient occult symbol drawn in glowing silver ink. Built from exactly ${letterCount} unique letters: ${letterList} — each letter appears exactly once, woven together into a single unified mark. No letter is repeated. Sacred geometry, flowing curves and angular runes interlocked into one cohesive symbol. Subtle silver-white radiance. No text labels, no borders, no decorations — only the sigil on black. The sigil embodies the intention: "${intention}". Chaos magic aesthetic, ultra detailed, high contrast.`;

    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt,
        n: 1,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('xAI API error:', response.status, errorBody);
      return NextResponse.json(
        { error: `Image generation failed: ${response.status} ${errorBody}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const url = data?.data?.[0]?.url;

    if (!url) {
      return NextResponse.json({ error: 'No image URL in response' }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Sigil generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
