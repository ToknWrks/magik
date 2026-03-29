'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// ── Particle burst / disintegration ───────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  decay: number;
  hue: number;
}

// Spawns particles from the canvas area — no cross-origin image sampling needed.
// The image fades via CSS; the canvas sits on top drawing only particles.
function burstSigil(
  canvas: HTMLCanvasElement,
  setImgOpacity: (v: number) => void,
  onDone: () => void,
) {
  const W = canvas.width = canvas.offsetWidth || 512;
  const H = canvas.height = canvas.offsetHeight || 512;
  const ctx = canvas.getContext('2d')!;

  const COUNT = 700;
  const particles: Particle[] = [];
  const cx = W / 2;
  const cy = H / 2;

  for (let i = 0; i < COUNT; i++) {
    // Bias spawn positions toward the center (where the sigil lives)
    const r = Math.pow(Math.random(), 0.5) * Math.min(W, H) * 0.48;
    const a = Math.random() * Math.PI * 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 4;
    particles.push({
      x: px, y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 1.5,
      size: 1 + Math.random() * 3,
      alpha: 0.8 + Math.random() * 0.2,
      decay: 0.007 + Math.random() * 0.016,
      hue: Math.random() < 0.55 ? 270 : 210, // purple or silver-blue
    });
  }

  let frame = 0;
  const MAX_FRAMES = 130;

  function tick() {
    // Fade the image via callback in first 30 frames
    if (frame <= 30) setImgOpacity(1 - frame / 30);

    ctx.clearRect(0, 0, W, H);

    let alive = 0;
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045;
      p.vx *= 0.98;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${Math.max(0, p.alpha)})`;
      ctx.fill();
    }

    frame++;
    if (alive > 0 && frame < MAX_FRAMES) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
      onDone();
    }
  }

  requestAnimationFrame(tick);
}

// Web Speech API types (not in lib.dom.d.ts by default in all TS configs)
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

type Step = 'intro' | 'listening' | 'consonants' | 'unique' | 'generating' | 'sigil';

function removeVowels(text: string): string {
  return text.replace(/[aeiou\s]/gi, '').toUpperCase();
}

function makeUnique(consonants: string): string {
  const seen = new Set<string>();
  return consonants
    .split('')
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .join('');
}

const STEP_LABELS = ['Speak', 'Consonants', 'Essence', 'Sigil'];

export default function SigilClient() {
  const [step, setStep] = useState<Step>('intro');
  const [intention, setIntention] = useState('');
  const [interimText, setInterimText] = useState('');
  const [consonants, setConsonants] = useState('');
  const [uniqueConsonants, setUniqueConsonants] = useState('');
  const [sigilUrl, setSigilUrl] = useState('');
  const [error, setError] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedIntention, setTypedIntention] = useState('');
  const [listeningMode, setListeningMode] = useState<'browser' | 'hume' | 'text'>('browser');

  const [showModal, setShowModal] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [imgOpacity, setImgOpacity] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const openModal = useCallback(() => {
    setReleasing(false);
    setImgOpacity(1);
    setShowModal(true);
  }, []);

  const handleLetItGo = useCallback(() => {
    if (!canvasRef.current) return;
    setReleasing(true);
    burstSigil(canvasRef.current, setImgOpacity, () => {
      setTimeout(() => {
        setShowModal(false);
        setStep('intro');
        setIntention('');
        setInterimText('');
        setTypedIntention('');
        setShowTextInput(false);
        setListeningMode('browser');
        setConsonants('');
        setUniqueConsonants('');
        setSigilUrl('');
        setError('');
        finalTextRef.current = '';
      }, 200);
    });
  }, []);

  const handleRefine = useCallback(async () => {
    setShowModal(false);
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/sigil/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consonants: uniqueConsonants, intention, refine: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Generation failed');
      setSigilUrl(data.url);
      setStep('sigil');
      setShowModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('sigil');
    }
  }, [uniqueConsonants, intention]);


  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const humeWsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef('');

  // ── Stop all active recording ──────────────────────────────────────────────
  const stopAll = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null; // null first so onend doesn't restart
    rec?.stop();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    humeWsRef.current?.close();
    humeWsRef.current = null;
    setIsRecognizing(false);
  }, []);

  // ── Hume EVI fallback ──────────────────────────────────────────────────────
  const startHumeListening = useCallback(async () => {
    setError('');
    setIntention('');
    setInterimText('');
    finalTextRef.current = '';
    setListeningMode('hume');
    setStep('listening');

    try {
      // Fetch short-lived access token
      const tokenRes = await fetch('/api/hume/token');
      if (!tokenRes.ok) throw new Error('Could not obtain Hume token');
      const { accessToken } = await tokenRes.json();

      // Mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Open EVI WebSocket
      const configId = process.env.NEXT_PUBLIC_HUME_CONTENT_CONFIG_ID;
      const wsUrl = `wss://api.hume.ai/v0/evi/chat?access_token=${accessToken}${configId ? `&config_id=${configId}` : ''}`;
      const ws = new WebSocket(wsUrl);
      humeWsRef.current = ws;

      ws.onopen = () => {
        // MediaRecorder sends opus/webm chunks every 100 ms
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = async (e) => {
          if (e.data.size === 0 || ws.readyState !== WebSocket.OPEN) return;
          const buf = await e.data.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          ws.send(JSON.stringify({ type: 'audio_input', data: btoa(binary) }));
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecognizing(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          // Capture transcript; ignore assistant audio/messages
          if (msg.type === 'user_message' && msg.message?.content) {
            finalTextRef.current = msg.message.content;
            setIntention(msg.message.content);
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        setError('Hume connection error — please type your intention below.');
        setShowTextInput(true);
        setListeningMode('text');
        stopAll();
      };

      ws.onclose = () => setIsRecognizing(false);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hume connection failed';
      setError(`${msg} — please type your intention below.`);
      setShowTextInput(true);
      setListeningMode('text');
      stopAll();
    }
  }, [stopAll]);

  // ── Browser Web Speech API ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    setError('');
    setIntention('');
    setInterimText('');
    finalTextRef.current = '';
    setListeningMode('browser');

    const SR =
      (window as typeof window & { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SR) {
      startHumeListening();
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + ' ';
          setIntention(finalTextRef.current.trim());
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
        setIsRecognizing(false);
      } else if (event.error === 'network' || event.error === 'service-not-allowed') {
        // Silently fall back to Hume EVI
        recognitionRef.current = null;
        startHumeListening();
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        startHumeListening();
      }
    };

    recognition.onend = () => {
      // Auto-restart if we didn't intentionally stop (user hasn't continued yet)
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      } else {
        setIsRecognizing(false);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecognizing(true);
    setStep('listening');
  }, [startHumeListening]);

  const handleContinueFromListening = useCallback(() => {
    const text = (typedIntention || finalTextRef.current || interimText).trim();
    if (!text) return;
    stopAll();
    setIntention(text);
    setConsonants(removeVowels(text));
    setStep('consonants');
  }, [typedIntention, interimText, stopAll]);

  const handleContinueFromConsonants = useCallback(() => {
    setUniqueConsonants(makeUnique(consonants));
    setStep('unique');
  }, [consonants]);

  const handleGenerateSigil = useCallback(async () => {
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/sigil/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consonants: uniqueConsonants, intention }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate sigil');
      }

      const data = await res.json();
      setSigilUrl(data.url);
      setStep('sigil');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate sigil');
      setStep('unique');
    }
  }, [uniqueConsonants, intention]);

  const handleReset = useCallback(() => {
    stopAll();
    setStep('intro');
    setIntention('');
    setInterimText('');
    setTypedIntention('');
    setShowTextInput(false);
    setListeningMode('browser');
    setConsonants('');
    setUniqueConsonants('');
    setSigilUrl('');
    setError('');
    finalTextRef.current = '';
  }, [stopAll]);

  useEffect(() => () => { stopAll(); }, [stopAll]);

  // Step index for progress indicator
  const stepIndex =
    step === 'intro' || step === 'listening' ? 0
    : step === 'consonants' ? 1
    : step === 'unique' ? 2
    : 3;

  const displayText = typedIntention || intention || interimText;

  return (
    <div
      className="relative flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0a2e 0%, #0d0d14 60%, #080810 100%)',
      }}
    >
      {/* Subtle star-field */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-16">

        {/* Step progress */}
        {step !== 'intro' && (
          <div className="flex items-center gap-3 mb-12">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: i <= stepIndex ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.15)',
                      boxShadow: i === stepIndex ? '0 0 8px rgba(168,85,247,0.6)' : 'none',
                      transform: i === stepIndex ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  <span
                    className="text-[9px] tracking-widest uppercase transition-all duration-300"
                    style={{ color: i === stepIndex ? 'rgba(192,132,252,0.8)' : 'rgba(255,255,255,0.2)' }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="w-8 h-px mb-4 transition-all duration-500"
                    style={{ background: i < stepIndex ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="text-center max-w-sm">
            <p className="text-sm tracking-[0.6em] text-white/40 uppercase mb-4">Sigil Creator</p>
            <h1
              className="text-4xl font-extralight text-white/90 mb-10 leading-tight"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}
            >
              Manifest Your<br />Intention
            </h1>
            <button
              onClick={startListening}
              className="px-10 py-3 rounded-full text-sm tracking-[0.3em] uppercase transition-all duration-300 hover:scale-105"
              style={{
                border: '1px solid rgba(168,85,247,0.35)',
                color: 'rgba(192,132,252,0.9)',
                background: 'rgba(139,92,246,0.06)',
              }}
            >
              Begin
            </button>
            {error && <p className="text-red-400/60 text-xs mt-5">{error}</p>}
          </div>
        )}

        {/* ── LISTENING ── */}
        {step === 'listening' && (
          <div className="text-center max-w-lg w-full">

            {/* Pulsing mic orb — hidden when text input is shown */}
            {!showTextInput && (
              <div className="flex flex-col items-center mb-10">
                <div className="relative w-20 h-20">
                  {isRecognizing && (
                    <>
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: 'rgba(168,85,247,0.12)', animationDuration: '1.5s' }}
                      />
                      <div
                        className="absolute inset-2 rounded-full animate-ping"
                        style={{ background: 'rgba(168,85,247,0.08)', animationDuration: '2s', animationDelay: '0.3s' }}
                      />
                    </>
                  )}
                  <div
                    className="absolute inset-4 rounded-full flex items-center justify-center"
                    style={{
                      background: isRecognizing ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isRecognizing ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isRecognizing ? '0 0 20px rgba(168,85,247,0.2)' : 'none',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: isRecognizing ? 'rgba(192,132,252,0.9)' : 'rgba(255,255,255,0.3)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                {listeningMode === 'hume' && (
                  <span className="mt-3 text-[9px] tracking-[0.35em] uppercase"
                    style={{ color: 'rgba(251,191,36,0.5)' }}>
                    
                  </span>
                )}
              </div>
            )}

            {/* Text input fallback */}
            {showTextInput ? (
              <div className="mb-8 w-full">
                <p className="text-white/60 text-base mb-3">
                  {error ? 'Speech unavailable — type your intention below' : 'Type your intention'}
                </p>
                <textarea
                  autoFocus
                  value={typedIntention}
                  onChange={(e) => setTypedIntention(e.target.value)}
                  placeholder="I intend to…"
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-white/85 text-base font-light italic resize-none outline-none placeholder:text-white/20 focus:ring-1"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    caretColor: 'rgba(192,132,252,0.8)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)')}
                />
                {!error && (
                  <button
                    onClick={() => { setShowTextInput(false); startListening(); }}
                    className="mt-3 text-xs tracking-widest text-white/25 uppercase hover:text-white/45 transition-colors"
                  >
                    ← try microphone instead
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Live transcript */}
                <div className="min-h-[72px] mb-6 px-4">
                  {displayText ? (
                    <p
                      className="text-lg font-light leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}
                    >
                      &ldquo;{intention}
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{interimText}</span>
                      &rdquo;
                    </p>
                  ) : (
                    <p className="text-white/50 text-base">
                      {isRecognizing
                        ? listeningMode === 'hume' ? 'Listening... speak then pause' : 'Listening…'
                        : 'Press Begin to start'}
                    </p>
                  )}
                </div>

                {/* Type instead toggle */}
                <button
                  onClick={() => { stopAll(); setShowTextInput(true); setListeningMode('text'); }}
                  className="mb-8 text-xs tracking-widest text-white/20 uppercase hover:text-white/40 transition-colors"
                >
                  type instead
                </button>
              </>
            )}

            {error && <p className="text-red-400/60 text-xs mb-4">{error}</p>}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              >
                Cancel
              </button>
              {displayText && (
                <button
                  onClick={handleContinueFromListening}
                  className="px-8 py-2.5 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                  style={{
                    border: '1px solid rgba(168,85,247,0.4)',
                    color: 'rgba(192,132,252,0.9)',
                    background: 'rgba(139,92,246,0.08)',
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── CONSONANTS ── */}
        {step === 'consonants' && (
          <div className="text-center max-w-lg w-full">

            <div className="mb-6">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-1">Your Intention</p>
              <p className="text-white/65 text-base italic">&ldquo;{intention}&rdquo;</p>
            </div>

            <div
              className="my-8 p-8 rounded-2xl"
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p className="text-xs tracking-[0.5em] text-white/40 uppercase mb-5">Consonants</p>
              <p
                className="text-3xl font-light text-white/85 break-all"
                style={{ letterSpacing: '0.45em' }}
              >
                {consonants}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              >
                Start Over
              </button>
              <button
                onClick={handleContinueFromConsonants}
                className="px-8 py-2.5 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                style={{
                  border: '1px solid rgba(168,85,247,0.4)',
                  color: 'rgba(192,132,252,0.9)',
                  background: 'rgba(139,92,246,0.08)',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── UNIQUE CONSONANTS ── */}
        {step === 'unique' && (
          <div className="text-center max-w-lg w-full">

            <div
              className="my-8 p-10 rounded-2xl"
              style={{
                border: '1px solid rgba(168,85,247,0.18)',
                background: 'rgba(139,92,246,0.04)',
                boxShadow: '0 0 40px rgba(139,92,246,0.06) inset',
              }}
            >
              <p className="text-xs tracking-[0.5em] text-purple-300/30 uppercase mb-6">Sigil Letters</p>
              <p
                className="text-5xl font-thin text-purple-100/90 break-all"
                style={{
                  letterSpacing: '0.75em',
                  textShadow: '0 0 30px rgba(168,85,247,0.35)',
                }}
              >
                {uniqueConsonants}
              </p>
            </div>

            {error && <p className="text-red-400/60 text-xs mb-5">{error}</p>}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              >
                Start Over
              </button>
              <button
                onClick={handleGenerateSigil}
                className="px-8 py-2.5 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                style={{
                  border: '1px solid rgba(251,191,36,0.4)',
                  color: 'rgba(253,224,71,0.85)',
                  background: 'rgba(245,158,11,0.06)',
                }}
              >
                Generate Sigil ✦
              </button>
            </div>
          </div>
        )}

        {/* ── GENERATING ── */}
        {step === 'generating' && (
          <div className="text-center">
            <p className="text-sm tracking-[0.5em] text-white/50 uppercase mb-12">
              Transmuting Intention
            </p>
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: 'rgba(251,191,36,0.25)',
                  animation: 'spin 4s linear infinite',
                }}
              />
              <div
                className="absolute inset-3 rounded-full border"
                style={{
                  borderColor: 'rgba(168,85,247,0.25)',
                  animation: 'spin 3s linear infinite reverse',
                }}
              />
              <div
                className="absolute inset-6 rounded-full border animate-pulse"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              />
              <div
                className="absolute inset-9 rounded-full"
                style={{
                  background: 'rgba(168,85,247,0.15)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <p className="text-white/30 text-xs tracking-widest">
              {uniqueConsonants.split('').join(' · ')}
            </p>
          </div>
        )}

        {/* ── SIGIL ── */}
        {step === 'sigil' && sigilUrl && (
          <div className="text-center max-w-md w-full">
            <button
              onClick={openModal}
              className="block w-full rounded-2xl overflow-hidden mb-6 group transition-all duration-300 hover:scale-[1.02]"
              style={{
                border: '1px solid rgba(168,85,247,0.2)',
                boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(139,92,246,0.06)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sigilUrl} alt="Generated sigil" className="w-full block" />
              <div
                className="py-2 text-[9px] tracking-[0.4em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: 'rgba(192,132,252,0.7)', background: 'rgba(0,0,0,0.4)' }}
              >
                Open Full Size
              </div>
            </button>

            <p
              className="text-sm tracking-[0.5em] mb-8"
              style={{ color: 'rgba(253,224,71,0.4)' }}
            >
              {uniqueConsonants.split('').join(' ')}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              >
                Start Over
              </button>
              <button
                onClick={openModal}
                className="px-8 py-2.5 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                style={{
                  border: '1px solid rgba(168,85,247,0.4)',
                  color: 'rgba(192,132,252,0.9)',
                  background: 'rgba(139,92,246,0.08)',
                }}
              >
                View Sigil ✦
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── SIGIL MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !releasing) setShowModal(false); }}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl overflow-hidden"
            style={{
              border: '1px solid rgba(168,85,247,0.25)',
              boxShadow: '0 0 80px rgba(139,92,246,0.2), 0 0 200px rgba(139,92,246,0.08)',
              background: 'rgba(5,0,15,0.95)',
            }}
          >
            {/* Close */}
            {!releasing && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                ✕
              </button>
            )}

            {/* Image / Canvas */}
            <div className="relative w-full aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sigilUrl}
                alt="Generated sigil"
                className="w-full h-full object-contain"
                style={{ opacity: imgOpacity, transition: releasing ? 'none' : 'opacity 0.3s' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ display: releasing ? 'block' : 'none' }}
              />
            </div>

            {/* Actions */}
            {!releasing && (
              <div
                className="px-8 py-6 flex flex-col items-center gap-4"
                style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}
              >
                <p className="text-white/25 text-xs tracking-[0.5em] uppercase mb-1">
                  {uniqueConsonants.split('').join(' · ')}
                </p>
                <p className="text-white/55 text-base italic mb-2">&ldquo;{intention}&rdquo;</p>

                <div className="flex gap-4">
                  <button
                    onClick={handleRefine}
                    className="px-8 py-3 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                    style={{
                      border: '1px solid rgba(168,85,247,0.4)',
                      color: 'rgba(192,132,252,0.9)',
                      background: 'rgba(139,92,246,0.08)',
                    }}
                  >
                    ↻ Refine
                  </button>
                  <button
                    onClick={handleLetItGo}
                    className="px-8 py-3 rounded-full text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105"
                    style={{
                      border: '1px solid rgba(251,191,36,0.35)',
                      color: 'rgba(253,224,71,0.85)',
                      background: 'rgba(245,158,11,0.06)',
                    }}
                  >
                    ✦ Let It Go
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
