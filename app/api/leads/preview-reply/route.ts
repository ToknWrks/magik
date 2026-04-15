// app/api/leads/preview-reply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateReply } from '@/lib/x-leads';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const result = await pool.query(
      'SELECT username, source_tweet_text FROM x_leads WHERE id = $1',
      [id],
    );
    const lead = result.rows[0];
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const replyText = await generateReply(lead.username, lead.source_tweet_text ?? '');
    const mention = `@${lead.username}`;
    const finalText = replyText.startsWith(mention)
      ? replyText.slice(0, 280)
      : `${mention} ${replyText}`.slice(0, 280);

    return NextResponse.json({
      username: lead.username,
      sourceTweet: lead.source_tweet_text,
      replyText: finalText,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview failed' },
      { status: 500 },
    );
  }
}
