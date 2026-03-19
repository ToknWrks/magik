import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.HUME_API_KEY;
    const secretKey = process.env.HUME_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'Hume credentials not configured' }, { status: 500 });
    }

    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

    const res = await fetch('https://api.hume.ai/oauth2-cc/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Hume token error:', res.status, text);
      return NextResponse.json({ error: `Hume auth failed: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ accessToken: data.access_token });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Hume token error:', msg);
    return NextResponse.json({ error: `Token fetch failed: ${msg}` }, { status: 500 });
  }
}
