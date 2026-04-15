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
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual');
  const isCron   = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  if (!isManual && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rumiQuotes = [
    { quote: "Out beyond ideas of wrongdoing and rightdoing there is a field. I'll meet you there.", author: 'Rumi' },
    { quote: "The wound is the place where the Light enters you.", author: 'Rumi' },
    { quote: "What you seek is seeking you.", author: 'Rumi' },
    { quote: "Set your life on fire. Seek those who fan your flames.", author: 'Rumi' },
    { quote: "Silence is the language of God, all else is poor translation.", author: 'Rumi' },
    { quote: "Let the beauty of what you love be what you do.", author: 'Rumi' },
    { quote: "Stop acting so small. You are the universe in ecstatic motion.", author: 'Rumi' },
    { quote: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.", author: 'Rumi' },
    { quote: "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.", author: 'Rumi' },
    { quote: "There is a voice that doesn't use words. Listen.", author: 'Rumi' },
  ];

  try {
    const quote = rumiQuotes[Math.floor(Math.random() * rumiQuotes.length)];
    console.log('Selected quote:', quote);

    // Check if already posted
    const existing = await pool.query('SELECT * FROM posted_quotes WHERE quote = $1', [quote.quote]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Quote already posted' });
    }

    // Post to Twitter
    console.log('About to tweet');
    const tweet = await twitterClient.v2.tweet(`${quote.quote} - ${quote.author} #realilluminati https://illuminati.earth`);
    console.log('Tweet posted:', tweet.data.id);

    // Save to database
    console.log('Saving to DB');
    await pool.query('INSERT INTO posted_quotes (quote, author, tweet_id) VALUES ($1, $2, $3)', [
      quote.quote,
      quote.author,
      tweet.data.id,
    ]);
    console.log('Saved to DB');

    return NextResponse.json({ message: 'Posted successfully', tweetId: tweet.data.id });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
  }
}