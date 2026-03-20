'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const CHAKRAS = [
  { name: 'Crown',         sanskrit: 'Sahasrara',    note: 'B', vowel: 'eee', color: '#C084FC', cy: 44  },
  { name: 'Third Eye',     sanskrit: 'Ajna',         note: 'A', vowel: 'aye', color: '#818CF8', cy: 116 },
  { name: 'Throat',        sanskrit: 'Vishuddha',    note: 'G', vowel: 'ai',  color: '#22D3EE', cy: 184 },
  { name: 'Heart',         sanskrit: 'Anahata',      note: 'F', vowel: 'ah',  color: '#4ADE80', cy: 260 },
  { name: 'Solar Plexus',  sanskrit: 'Manipura',     note: 'E', vowel: 'oh',  color: '#FDE047', cy: 328 },
  { name: 'Sacral',        sanskrit: 'Svadhisthana', note: 'D', vowel: 'ooh', color: '#FB923C', cy: 394 },
  { name: 'Root',          sanskrit: 'Muladhara',    note: 'C', vowel: 'uh',  color: '#F87171', cy: 460 },
];

// Every chromatic note maps to a chakra
const NOTE_TO_CHAKRA: Record<string, number> = {
  'C': 6, 'C#': 6,
  'D': 5, 'D#': 5,
  'E': 4,
  'F': 3, 'F#': 3,
  'G': 2, 'G#': 2,
  'A': 1, 'A#': 1,
  'B': 0,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFromFreq(freq: number) {
  if (freq <= 0 || !isFinite(freq)) return null;
  const semitones = 12 * Math.log2(freq / 440);
  const rounded = Math.round(semitones);
  const cents = Math.round((semitones - rounded) * 100);
  return { note: NOTE_NAMES[((rounded % 12) + 12) % 12], cents };
}

function autoCorrelate(buf: Float32Array<ArrayBuffer>, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / buf.length) < 0.015) return -1;

  let r1 = 0, r2 = buf.length - 1;
  for (let i = 0; i < buf.length / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  }
  for (let i = 1; i < buf.length / 2; i++) {
    if (Math.abs(buf[buf.length - i]) < 0.2) { r2 = buf.length - i; break; }
  }

  const b = buf.slice(r1, r2);
  const c = new Float32Array(b.length);
  for (let i = 0; i < b.length; i++)
    for (let j = 0; j < b.length - i; j++)
      c[i] += b[j] * b[j + i];

  let d = 0;
  while (d < c.length - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < c.length; i++)
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }

  if (maxPos < 1 || maxPos >= c.length - 1) return -1;
  const a = (c[maxPos - 1] + c[maxPos + 1] - 2 * c[maxPos]) / 2;
  const bv = (c[maxPos + 1] - c[maxPos - 1]) / 2;
  const T0 = a ? maxPos - bv / (2 * a) : maxPos;
  return sampleRate / T0;
}

// Deterministic star positions via golden-angle stepping (no Math.random)
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: +((i * 137.508) % 100).toFixed(2),
  y: +((i * 79.373) % 100).toFixed(2),
  r: i % 5 === 0 ? 1.5 : i % 3 === 0 ? 1 : 0.5,
  o: +(0.12 + (i % 7) * 0.06).toFixed(2),
}));

const SVG_H = 520;

export default function ChakraSoundPage() {
  const [listening, setListening] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [error, setError] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const confirmRef = useRef({ note: '', count: 0 });
  const lastTimeRef = useRef(0);
  const activeNoteRef = useRef<string | null>(null);

  const stopListening = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setListening(false);
    setCurrentNote(null);
    setFrequency(null);
    setActiveIdx(null);
    setAmplitude(0);
    activeNoteRef.current = null;
    confirmRef.current = { note: '', count: 0 };
  }, []);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    const audioCtx = audioCtxRef.current;
    if (!analyser || !buffer || !audioCtx) return;

    analyser.getFloatTimeDomainData(buffer);

    let maxAmp = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = Math.abs(buffer[i]);
      if (v > maxAmp) maxAmp = v;
    }
    setAmplitude(maxAmp);

    const freq = autoCorrelate(buffer, audioCtx.sampleRate);
    const now = performance.now();

    if (freq >= 60 && freq <= 1200) {
      const nd = getNoteFromFreq(freq);
      if (nd) {
        if (nd.note === confirmRef.current.note) confirmRef.current.count++;
        else confirmRef.current = { note: nd.note, count: 1 };

        if (confirmRef.current.count >= 2) {
          lastTimeRef.current = now;
          if (nd.note !== activeNoteRef.current) {
            activeNoteRef.current = nd.note;
            setCurrentNote(nd.note);
            setFrequency(Math.round(freq));
            setCents(nd.cents);
            setActiveIdx(NOTE_TO_CHAKRA[nd.note] ?? null);
          }
        }
      }
    } else {
      confirmRef.current = { note: '', count: 0 };
      if (activeNoteRef.current !== null && now - lastTimeRef.current > 300) {
        activeNoteRef.current = null;
        setCurrentNote(null);
        setFrequency(null);
        setActiveIdx(null);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startListening = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
      ctx.createMediaStreamSource(stream).connect(analyser);
      setListening(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, [loop]);

  useEffect(() => () => stopListening(), [stopListening]);

  const activeChakra = activeIdx !== null ? CHAKRAS[activeIdx] : null;
  // Spectrum position: Root (idx 6) = left (0%), Crown (idx 0) = right (100%)
  const spectrumPos = activeIdx !== null ? ((6 - activeIdx) / 6) * 100 : null;

  return (
    <div
      className="relative flex flex-col items-center min-h-[calc(100vh-4rem)] overflow-hidden select-none"
      style={{ background: 'url(/images/Spirit9.png) center calc(50% - 2pt) / cover no-repeat fixed' }}
    >
      {/* Dark overlay so UI stays readable over the background image */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.78)' }} />

      {/* Ambient background glow from active chakra */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: activeChakra
            ? `radial-gradient(ellipse 80% 60% at 50% 45%, ${activeChakra.color}12 0%, transparent 65%)`
            : 'none',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-4 pt-4 pb-6">

        {/* Header */}
        <p className="text-[12px] tracking-[0.5em] text-white/60 uppercase mb-1.5">Chakra Sound</p>
        <p className="text-[12px] text-white/45 tracking-widest mb-4">Sing a note to illuminate your energy centers</p>

        {/* Note display — only takes space when a note is detected */}
        {currentNote && (
          <div className="flex flex-col items-center mb-3">
            <div
              className="font-bold leading-none"
              style={{
                fontSize: 96,
                color: activeChakra?.color ?? '#fff',
                filter: `drop-shadow(0 0 20px ${activeChakra?.color ?? '#fff'}) drop-shadow(0 0 50px ${activeChakra?.color ?? '#fff'}50)`,
                transition: 'color 0.2s ease, filter 0.2s ease',
              }}
            >
              {currentNote}
            </div>
            <div className="text-xs text-white/40 mt-1.5 tracking-widest tabular-nums">
              {frequency} Hz &nbsp;·&nbsp; {cents >= 0 ? '+' : ''}{cents} cents
            </div>
          </div>
        )}

        {/* Chakra diagram */}
        <div className="flex items-stretch justify-center gap-4 mb-3" style={{ height: SVG_H }}>

          {/* Left: chakra names + note labels */}
          <div className="relative" style={{ width: 110 }}>
            {CHAKRAS.map((ch, i) => {
              const isActive = activeIdx === i;
              return (
                <div
                  key={ch.name}
                  className="absolute right-0 text-right transition-all duration-300"
                  style={{
                    top: ch.cy - 14,
                    color: isActive ? ch.color : 'rgba(255,255,255,0.55)',
                    filter: isActive ? `drop-shadow(0 0 6px ${ch.color})` : 'none',
                  }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider leading-tight">
                    {ch.name}
                  </div>
                  <div className="text-[10px] opacity-60">{ch.note} · "{ch.vowel}"</div>
                </div>
              );
            })}
          </div>

          {/* Center: SVG spine + orbs */}
          <svg
            viewBox={`0 0 100 ${SVG_H}`}
            style={{ width: 100, height: SVG_H, overflow: 'visible', flexShrink: 0 }}
          >
            <defs>
              <filter id="orb-glow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="soft-blur" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>

            {/* Sushumna (spine line) */}
            <line
              x1="50" y1={CHAKRAS[0].cy}
              x2="50" y2={CHAKRAS[6].cy}
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1"
            />
            {/* Glowing spine when a chakra is active */}
            {activeChakra && (
              <line
                x1="50" y1={CHAKRAS[0].cy}
                x2="50" y2={CHAKRAS[6].cy}
                stroke={activeChakra.color}
                strokeWidth="1"
                opacity="0.18"
                filter="url(#soft-blur)"
              />
            )}

            {/* Chakra orbs */}
            {CHAKRAS.map((ch, i) => {
              const isActive = activeIdx === i;
              return (
                <g key={ch.name}>
                  {/* Outer aura rings when active */}
                  {isActive && (
                    <>
                      <circle cx="50" cy={ch.cy} r="34" fill={ch.color} opacity="0.05" filter="url(#soft-blur)" />
                      <circle cx="50" cy={ch.cy} r="22" fill={ch.color} opacity="0.10" filter="url(#soft-blur)" />
                    </>
                  )}
                  {/* Main orb */}
                  <circle
                    cx="50"
                    cy={ch.cy}
                    r={isActive ? 14 : 9}
                    fill={isActive ? ch.color : 'transparent'}
                    stroke={ch.color}
                    strokeWidth={isActive ? 0 : 1.2}
                    opacity={isActive ? 1 : 0.55}
                    filter={isActive ? 'url(#orb-glow)' : undefined}
                  />
                  {/* Inner highlight for depth */}
                  {isActive && (
                    <circle cx="46" cy={ch.cy - 4} r="3.5" fill="white" opacity="0.28" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Right: Sanskrit names */}
          <div className="relative" style={{ width: 110 }}>
            {CHAKRAS.map((ch, i) => {
              const isActive = activeIdx === i;
              return (
                <div
                  key={ch.sanskrit}
                  className="absolute left-0 transition-all duration-300"
                  style={{
                    top: ch.cy - 10,
                    color: isActive ? ch.color : 'rgba(255,255,255,0.50)',
                    filter: isActive ? `drop-shadow(0 0 5px ${ch.color})` : 'none',
                  }}
                >
                  <div className="text-[11px] italic tracking-wide">{ch.sanskrit}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color spectrum bar */}
        <div className="w-full max-w-xs mb-1">
          <div
            className="relative h-3 rounded-full overflow-visible"
            style={{ background: 'linear-gradient(to right, #F87171, #FB923C, #FDE047, #4ADE80, #22D3EE, #818CF8, #C084FC)' }}
          >
            {spectrumPos !== null && (
              <div
                className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full"
                style={{
                  left: `${spectrumPos}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 10px 3px ${activeChakra?.color ?? '#fff'}`,
                  transition: 'left 0.2s ease',
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-white/22 mt-1.5 px-0.5">
            <span>C</span><span>D</span><span>E</span><span>F</span><span>G</span><span>A</span><span>B</span>
          </div>
        </div>

        {/* Active chakra pill */}
        <div className="h-14 flex items-center mb-3">
          {activeChakra ? (
            <div className="flex flex-col items-center gap-1">
              <div
                className="text-2xl font-bold tracking-widest italic"
                style={{
                  color: activeChakra.color,
                  filter: `drop-shadow(0 0 12px ${activeChakra.color})`,
                  transition: 'all 0.3s ease',
                }}
              >
                "{activeChakra.vowel}"
              </div>
              <div
                className="px-5 py-1.5 rounded-full text-xs font-medium border tracking-wide"
                style={{
                  color: activeChakra.color,
                  borderColor: `${activeChakra.color}35`,
                  background: `${activeChakra.color}0e`,
                  filter: `drop-shadow(0 0 6px ${activeChakra.color}30)`,
                  transition: 'all 0.3s ease',
                }}
              >
                {activeChakra.name} · {activeChakra.sanskrit}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Amplitude bars — always rendered to prevent layout shift */}
        <div className="flex gap-0.5 items-end h-8 mb-3">
          {Array.from({ length: 18 }).map((_, i) => {
            const threshold = i / 18;
            const lit = listening && amplitude > threshold;
            return (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: 5,
                  height: lit ? Math.max(4, 3 + i * 1.4) : 3,
                  background: lit
                    ? (activeChakra?.color ?? '#818CF8')
                    : 'rgba(255,255,255,0.07)',
                  transition: 'height 0.06s ease, background 0.3s ease',
                }}
              />
            );
          })}
        </div>

        {/* Begin / End button */}
        <button
          onClick={listening ? stopListening : startListening}
          className="px-10 py-3 rounded-full font-semibold tracking-widest text-sm uppercase transition-all duration-300"
          style={
            listening
              ? { background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: 'rgba(248,113,113,0.85)' }
              : { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.38)', color: 'rgba(192,132,252,0.9)' }
          }
        >
          {listening ? 'End Session' : 'Begin Session'}
        </button>

        {error && (
          <p className="mt-4 text-red-400/70 text-xs text-center max-w-xs leading-relaxed">{error}</p>
        )}
      </div>
    </div>
  );
}
