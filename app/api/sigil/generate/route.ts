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
      ? `Minimal sacred geometry sigil on pure black. Ultra-clean vector line art, silver-white lines only. Reduce to the absolute essence: a single geometric mark built from intersecting circles, precise angles, and Fibonacci proportions. Fewer elements, more negative space. No letters, no runes, no calligraphy — only pure geometric abstraction. ${letterCount} geometric anchor points. Captures the essence of: "${intention}". Flat vector aesthetic, razor-thin lines, perfect symmetry or intentional asymmetry. High contrast, no texture, no gradients.`
      : `Sacred geometry sigil on pure black background. Clean minimal vector line art in silver-white. Composed of ${letterCount} interlocking geometric forms — circles, arcs, triangles, hexagons, and Fibonacci spirals — arranged into one unified symbol. NO letters, NO runes, NO calligraphy, NO Celtic knotwork. Pure geometric abstraction only. The ${letterCount} forms correspond to these consonants — ${letterList} — interpreted as geometry, not as text. Golden ratio proportions. The composition embodies the intention: "${intention}". Flat vector illustration, razor-thin precise lines, radiant silver glow, deep black background. Reminiscent of Metatron's Cube or the Flower of Life but unique and personal.`;

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
