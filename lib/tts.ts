// Shared Hume eTTS helper with SSML <break> support.
const VALID_VOICES = ['Meditation Female', 'Meditation Male'];
const HUME_MAX_CHARS = 4800; // Hume limit is 5000; leave buffer

// Splits text on <break time="Xs"/> tags, calls Hume per segment (WAV),
// inserts PCM silence, and stitches into a single WAV file.

const BREAK_RE = /<break\s+time="([\d.]+)s"\s*\/?>/gi;

type Segment = { type: 'text'; content: string } | { type: 'break'; seconds: number };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  BREAK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BREAK_RE.exec(text)) !== null) {
    const before = stripTags(text.slice(last, m.index));
    if (before) segments.push({ type: 'text', content: before });
    segments.push({ type: 'break', seconds: parseFloat(m[1]) });
    last = m.index + m[0].length;
  }
  const tail = stripTags(text.slice(last));
  if (tail) segments.push({ type: 'text', content: tail });
  return segments;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/^---+$/gm, '')           // horizontal rules
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/`(.+?)`/g, '$1')         // inline code
    .trim();
}

// Split cleaned text into chunks ≤ HUME_MAX_CHARS, breaking at paragraph/sentence boundaries
function splitIntoChunks(text: string): string[] {
  if (text.length <= HUME_MAX_CHARS) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';
  for (const para of paragraphs) {
    const addition = current ? '\n\n' + para : para;
    if ((current + addition).length > HUME_MAX_CHARS) {
      if (current) chunks.push(current.trim());
      // If a single paragraph is too long, split at sentence boundaries
      if (para.length > HUME_MAX_CHARS) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        let sub = '';
        for (const sentence of sentences) {
          if ((sub + ' ' + sentence).length > HUME_MAX_CHARS) {
            if (sub) chunks.push(sub.trim());
            sub = sentence;
          } else {
            sub = sub ? sub + ' ' + sentence : sentence;
          }
        }
        if (sub) current = sub;
        else current = '';
      } else {
        current = para;
      }
    } else {
      current = current + addition;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

function wavToPCM(wav: Buffer): { pcm: Buffer; sampleRate: number; channels: number; bitDepth: number } {
  const sampleRate = wav.readUInt32LE(24);
  const channels = wav.readUInt16LE(22);
  const bitDepth = wav.readUInt16LE(34);
  let offset = 12;
  while (offset < wav.length - 8) {
    const id = wav.slice(offset, offset + 4).toString('ascii');
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'data') {
      return { pcm: wav.slice(offset + 8, offset + 8 + size), sampleRate, channels, bitDepth };
    }
    offset += 8 + (size % 2 === 1 ? size + 1 : size); // RIFF chunks are word-aligned
  }
  throw new Error('WAV data chunk not found');
}

function buildWAV(pcm: Buffer, sampleRate: number, channels: number, bitDepth: number): Buffer {
  const blockAlign = channels * (bitDepth / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function silencePCM(seconds: number, sampleRate: number, channels: number, bitDepth: number): Buffer {
  const bytes = Math.ceil(seconds * sampleRate) * channels * (bitDepth / 8);
  return Buffer.alloc(bytes, 0);
}

async function humeAPICall(texts: string | string[], voice?: string, format: 'mp3' | 'wav' = 'mp3'): Promise<Buffer> {
  const chunks = Array.isArray(texts) ? texts : [texts];
  const utterances = chunks.map(text => {
    const u: Record<string, unknown> = { text };
    if (voice && VALID_VOICES.includes(voice)) u.voice = { name: voice };
    return u;
  });

  const res = await fetch('https://api.hume.ai/v0/tts', {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': process.env.HUME_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      utterances,
      format: { type: format },
    }),
  });

  if (!res.ok) throw new Error(`Hume TTS ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const b64 = data.generations?.[0]?.audio;
  if (!b64) throw new Error('No audio in Hume TTS response');
  return Buffer.from(b64, 'base64');
}

export interface TTSResult {
  buffer: Buffer;
  ext: 'mp3' | 'wav';
  contentType: 'audio/mpeg' | 'audio/wav';
}

export async function generateTTS(text: string, voice?: string): Promise<TTSResult> {
  const hasBreaks = BREAK_RE.test(text);
  BREAK_RE.lastIndex = 0;

  if (!hasBreaks) {
    const clean = stripMarkdown(text);
    const chunks = splitIntoChunks(clean);
    // Single chunk or multiple utterances in one request
    const buffer = await humeAPICall(chunks, voice, 'mp3');
    return { buffer, ext: 'mp3', contentType: 'audio/mpeg' };
  }

  // SSML mode: split, stitch with silence
  const segments = parseSegments(text);
  const pcmChunks: Buffer[] = [];
  let fmt = { sampleRate: 24000, channels: 1, bitDepth: 16 };

  for (const seg of segments) {
    if (seg.type === 'break') {
      pcmChunks.push(silencePCM(seg.seconds, fmt.sampleRate, fmt.channels, fmt.bitDepth));
    } else {
      const wav = await humeAPICall(stripMarkdown(seg.content), voice, 'wav');
      const parsed = wavToPCM(wav);
      fmt = { sampleRate: parsed.sampleRate, channels: parsed.channels, bitDepth: parsed.bitDepth };
      pcmChunks.push(parsed.pcm);
    }
  }

  const buffer = buildWAV(Buffer.concat(pcmChunks), fmt.sampleRate, fmt.channels, fmt.bitDepth);
  return { buffer, ext: 'wav', contentType: 'audio/wav' };
}
