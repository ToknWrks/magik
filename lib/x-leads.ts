// lib/x-leads.ts — server-only (Node.js)
import { TwitterApi } from 'twitter-api-v2';
import { pool } from '@/lib/db';
export { LEAD_KEYWORDS } from '@/lib/x-leads-constants';

function getTwitterClient() {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

export interface XLead {
  id: number;
  twitter_user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  relevance_score: number;
  relevance_reason: string | null;
  source_tweet_id: string | null;
  source_tweet_text: string | null;
  status: 'discovered' | 'liked' | 'followed' | 'replied' | 'converted';
  liked_at: string | null;
  followed_at: string | null;
  replied_at: string | null;
  reply_tweet_id: string | null;
  created_at: string;
  updated_at: string;
}

// Score a user via XAI Grok — returns 0-100 relevance score
export async function scoreLeadWithXAI(
  username: string,
  bio: string | null,
  tweetText: string,
): Promise<{ score: number; reason: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { score: 50, reason: 'XAI not configured' };

  const prompt = `You are evaluating Twitter users as potential leads for illuminati.earth — a spiritual platform featuring astrology readings, occult teachings, sacred geometry, and mystical wisdom.

User: @${username}
Bio: ${bio || '(no bio)'}
Recent tweet: "${tweetText}"

Score this user's interest in astrology, occult, and spiritual topics from 0-100.
- 80-100: Clearly passionate — astrology/occult is a core interest, active poster, engaged community member
- 60-79: Genuine interest — follows and engages with spiritual content regularly
- 40-59: Moderate interest — occasional spiritual content among other topics
- 0-39: Low relevance — minimal or no genuine interest

Respond with JSON only: {"score": <number>, "reason": "<one sentence>"}`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return { score: 50, reason: 'Scoring failed' };

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      reason: parsed.reason || '',
    };
  } catch {
    return { score: 50, reason: 'Scoring error' };
  }
}

// Generate a personalized reply that adds value and mentions illuminati.earth
export async function generateReply(
  username: string,
  tweetText: string,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return `@${username} Your interest in the mystical arts is noted. Explore deeper at illuminati.earth ✨`;

  const prompt = `Write a Twitter reply to @${username} who tweeted: "${tweetText}"

You represent illuminati.earth — a platform for astrology, sacred geometry, and occult wisdom.

Rules:
- Max 240 characters including @username
- Sound genuinely interested and knowledgeable, not spammy
- Add a mystical insight or question relevant to their tweet
- End with a subtle mention of illuminati.earth or #realilluminati
- No emojis spam, 1-2 max
- Do NOT say "check out" or "visit" — be natural

Return just the reply text, nothing else.`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!res.ok) return `@${username} The stars align with your path. illuminati.earth`;

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch {
    return `@${username} The stars align with your path. illuminati.earth`;
  }
}

interface GrokLead {
  username: string;
  tweet_url?: string;
  tweet: string;
  bio?: string;
  display_name?: string;
  followers?: number;
}

// Use Grok live X search — no Twitter API search tier required
export async function searchAndImportLeads(
  keyword: string,
  maxResults = 20,
  minScore = 40,
): Promise<{ imported: number; skipped: number; duplicates: number; lowScore: number; grokFound: number; rawSample: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY not configured');

  let imported = 0;
  let duplicates = 0;
  let lowScore = 0;

  // Ask Grok to search X live via the Agent Tools API (x_search tool)
  const prompt = `Search X right now for real users actively posting about "${keyword}".

Find up to ${maxResults} distinct users. For each result include:
- username (no @)
- tweet_url: the full x.com URL to the specific tweet (e.g. https://x.com/username/status/1234567890)
- tweet: the exact tweet text
- bio: their bio if visible, else null
- display_name: their display name if visible, else null

Return ONLY a valid JSON array — no markdown, no explanation:
[{"username":"handle","tweet_url":"https://x.com/handle/status/ID","tweet":"exact tweet text","bio":"bio or null","display_name":"Name or null"}]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240_000); // 4 min hard cap

  let res: Response;
  try {
    res = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        input: [{ role: 'user', content: prompt }],
        tools: [{ type: 'x_search' }],
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new Error('Grok search timed out after 90s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Grok search failed ${res.status}: ${body}`);
  }

  const data = await res.json();

  // Response API: find the message output item (skip reasoning items)
  const messageItem = (data.output ?? []).find(
    (item: { type: string }) => item.type === 'message',
  );
  const content: string = messageItem?.content?.[0]?.text ?? '[]';

  // Extract JSON array from response (Grok may wrap it in markdown fences)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Grok returned no parseable JSON. Raw response: ${content.slice(0, 300)}`);

  let leads: GrokLead[];
  try {
    leads = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`JSON parse failed. Raw: ${jsonMatch[0].slice(0, 300)}`);
  }

  const grokFound = leads.length;

  if (grokFound === 0) {
    return { imported: 0, skipped: 0, duplicates: 0, lowScore: 0, grokFound: 0, rawSample: content.slice(0, 200) };
  }

  // Deduplicate against DB in one query
  const usernames = leads.map((l) => l.username?.toLowerCase()).filter(Boolean);
  const existingRes = usernames.length
    ? await pool.query('SELECT username FROM x_leads WHERE username = ANY($1)', [usernames])
    : { rows: [] };
  const existingSet = new Set(existingRes.rows.map((r: { username: string }) => r.username));

  const newLeads = leads
    .slice(0, maxResults)
    .filter((l) => l.username && !existingSet.has(l.username.toLowerCase()));

  duplicates = leads.length - newLeads.length;

  // Score all new leads in parallel
  const scored = await Promise.all(
    newLeads.map(async (lead) => {
      const { score, reason } = await scoreLeadWithXAI(
        lead.username,
        lead.bio ?? null,
        lead.tweet,
      );
      return { lead, score, reason };
    }),
  );

  for (const { lead, score, reason } of scored) {
    if (score < minScore) {
      lowScore++;
      continue;
    }

    // Extract tweet ID from URL: https://x.com/username/status/1234567890
    const tweetIdMatch = lead.tweet_url?.match(/\/status\/(\d+)/);
    const tweetId = tweetIdMatch?.[1] ?? null;

    await pool.query(
      `INSERT INTO x_leads
        (twitter_user_id, username, display_name, bio, followers_count,
         relevance_score, relevance_reason, source_tweet_id, source_tweet_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (twitter_user_id) DO NOTHING`,
      [
        lead.username.toLowerCase(),
        lead.username.toLowerCase(),
        lead.display_name ?? null,
        lead.bio ?? null,
        lead.followers ?? 0,
        score,
        reason,
        tweetId,
        lead.tweet,
      ],
    );
    imported++;
  }

  return { imported, skipped: duplicates + lowScore, duplicates, lowScore, grokFound, rawSample: content.slice(0, 200) };
}

// Like: marks locally (Grok leads have no tweet ID to like via API)
export async function likeLead(leadId: number): Promise<void> {
  await pool.query(
    "UPDATE x_leads SET status = 'liked', liked_at = NOW(), updated_at = NOW() WHERE id = $1",
    [leadId],
  );
}

// Follow a lead
export async function followLead(leadId: number): Promise<void> {
  const twitter = getTwitterClient();
  const rwClient = twitter.readWrite;

  const result = await pool.query(
    'SELECT twitter_user_id, username FROM x_leads WHERE id = $1',
    [leadId],
  );
  const lead = result.rows[0];
  if (!lead) throw new Error('Lead not found');

  const isNumericId = /^\d+$/.test(lead.twitter_user_id);
  let targetUserId = lead.twitter_user_id;

  if (!isNumericId) {
    const user = await rwClient.v2.userByUsername(lead.username);
    if (!user.data?.id) throw new Error(`User @${lead.username} not found on X`);
    targetUserId = user.data.id;
    await pool.query('UPDATE x_leads SET twitter_user_id = $1 WHERE id = $2', [targetUserId, leadId]);
  }

  const me = await rwClient.v2.me();
  try {
    await rwClient.v2.follow(me.data.id, targetUserId);
  } catch (err: unknown) {
    const e = err as { code?: number; status?: number; data?: unknown; errors?: unknown[]; message?: string };
    const status = e.code ?? e.status;
    const detail = e.data ?? e.errors ?? e.message ?? String(err);
    throw new Error(`Twitter ${status}: ${JSON.stringify(detail)}`);
  }

  await pool.query(
    "UPDATE x_leads SET status = 'followed', followed_at = NOW(), updated_at = NOW() WHERE id = $1",
    [leadId],
  );
}

// Reply: post an @mention tweet — Free tier allows posting tweets
export async function replyToLead(leadId: number): Promise<string> {
  const twitter = getTwitterClient();
  const rwClient = twitter.readWrite;

  const result = await pool.query(
    'SELECT username, source_tweet_id, source_tweet_text FROM x_leads WHERE id = $1',
    [leadId],
  );
  const lead = result.rows[0];
  if (!lead) throw new Error('Lead not found');

  const raw = await generateReply(lead.username, lead.source_tweet_text ?? '');
  // Ensure tweet starts with @mention and fits within 280 chars
  const mention = `@${lead.username}`;
  const replyText = raw.startsWith(mention)
    ? raw.slice(0, 280)
    : `${mention} ${raw}`.slice(0, 280);

  let tweetId: string;
  try {
    // Post as @mention tweet — Twitter blocks cold replies to users who haven't engaged with you
    const tweet = await rwClient.v2.tweet(replyText);
    tweetId = tweet.data.id;
  } catch (err: unknown) {
    const e = err as { code?: number; status?: number; data?: unknown; errors?: unknown[]; message?: string };
    const status = e.code ?? e.status;
    const detail = e.data ?? e.errors ?? e.message ?? String(err);
    throw new Error(`Twitter ${status}: ${JSON.stringify(detail)}`);
  }

  await pool.query(
    "UPDATE x_leads SET status = 'replied', replied_at = NOW(), reply_tweet_id = $2, updated_at = NOW() WHERE id = $1",
    [leadId, tweetId],
  );

  return replyText;
}
