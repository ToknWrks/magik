import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transitInfo } = await request.json();
    
    const prompt = `Please provide an interpretation of: "${transitInfo}". Use the Archetypal Astrology framework. Keep it concise, under 200 words.`;
    
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const interpretation = response.content[0].type === 'text' ? response.content[0].text : 'No interpretation available.';
    
    return NextResponse.json({ interpretation });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ interpretation: 'Error generating interpretation.' }, { status: 500 });
  }
}