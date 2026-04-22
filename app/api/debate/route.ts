// app/api/debate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { articleId, articleContent, articleTitle, userMessage, conversationHistory } = await request.json();

    // Build conversation history for Claude
    const messages = [
      {
        role: 'user' as const,
        content: `You are debating an article titled "${articleTitle}". Here's the article content:\n\n${articleContent}\n\nRespond thoughtfully to the user's questions and challenges. Be balanced, cite evidence from the article, and encourage critical thinking.`,
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',  // Updated to latest model
      max_tokens: 1000,
      messages,
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'Error: Unexpected response format.';

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Anthropic API error:', error);  // Added logging for debugging
    return NextResponse.json({ 
      response: 'I apologize, but I encountered an error processing your question. Please try again.' 
    }, { status: 500 });
  }
}