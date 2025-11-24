// app/api/cron/post-quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { pool } from '@/lib/db'; // Adjust import

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    // Fetch a random stoic quote
    const res = await fetch('https://stoic.tekloon.net/stoic-quote');
    const data = await res.json();
    const quote = data.data;

    // Check if already posted
    const existing = await pool.query('SELECT * FROM posted_quotes WHERE quote = $1', [quote.quote]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Quote already posted' });
    }

    // Post to Twitter
    const tweet = await twitterClient.v2.tweet(`${quote.quote} - ${quote.author} #realilluminati`);

    // Save to database
    await pool.query('INSERT INTO posted_quotes (quote, author, tweet_id) VALUES ($1, $2, $3)', [
      quote.quote,
      quote.author,
      tweet.data.id,
    ]);

    return NextResponse.json({ message: 'Posted successfully', tweetId: tweet.data.id });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
  }
}