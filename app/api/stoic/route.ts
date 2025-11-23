// app/api/stoic-quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const res = await fetch('https://stoic.tekloon.net/stoic-quote');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stoic quote:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}