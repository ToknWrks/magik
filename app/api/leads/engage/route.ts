// app/api/leads/engage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { likeLead, followLead, replyToLead } from '@/lib/x-leads';

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 });
    }

    if (!['like', 'follow', 'reply'].includes(action)) {
      return NextResponse.json({ error: 'action must be like, follow, or reply' }, { status: 400 });
    }

    let replyText: string | undefined;

    if (action === 'like') {
      await likeLead(id);
    } else if (action === 'follow') {
      await followLead(id);
    } else if (action === 'reply') {
      replyText = await replyToLead(id);
    }

    return NextResponse.json({ success: true, action, replyText });
  } catch (error) {
    console.error('Engage error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Engagement failed' },
      { status: 500 },
    );
  }
}
