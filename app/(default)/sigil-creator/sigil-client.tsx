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

const DAILY_KEY = () => `sigil_worked_${new Date().toISOString().slice(0, 10)}`;
const STEP_LABELS = ['Speak', 'Reduction', 'Essence', 'Sigil'];

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

  // Auth + credits
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Daily limit
  const [dailyUsed, setDailyUsed] = useState(false);

  // Login modal (shown instead of redirecting)
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [imgOpacity, setImgOpacity] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [meditating, setMeditating] = useState(false);

  // On mount: check daily limit + auth/balance + restore pending sigil
  useEffect(() => {
    try {
      if (localStorage.getItem(DAILY_KEY())) setDailyUsed(true);
    } catch { /* ignore */ }

    // Restore a pending sigil for anyone returning to this page
    try {
      const saved = localStorage.getItem('sigil_pending');
      if (saved) {
        const { url, uniqueConsonants: uc, intention: int } = JSON.parse(saved);
        if (url) {
          setSigilUrl(url);
          setUniqueConsonants(uc || '');
          setIntention(int || '');
          setStep('sigil');
        }
      }
    } catch { /* ignore */ }

    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/credits/balance', { credentials: 'include' }).then(r => r.json()),
    ]).then(([auth, credits]) => {
      const loggedIn = !!auth.user;
      setIsLoggedIn(loggedIn);
      setBalance(credits.balance ?? null);

      if (!loggedIn) {
        try {
          if (localStorage.getItem('sigil_guest_used')) setDailyUsed(true);
        } catch { /* ignore */ }
      }
    }).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  // Save pending sigil for guest → show login modal
  const saveAndShowLogin = useCallback(() => {
    try {
      localStorage.setItem('sigil_pending', JSON.stringify({
        url: sigilUrl,
        uniqueConsonants,
        intention,
      }));
      localStorage.setItem('sigil_guest_used', '1');
    } catch { /* ignore */ }
    setShowLoginModal(true);
  }, [sigilUrl, uniqueConsonants, intention]);

  // Open modal — free, no login required
  const handleOpenModal = useCallback(() => {
    setError('');
    setReleasing(false);
    setImgOpacity(1);
    setShowModal(true);
  }, []);

  // Spend 10 tokens helper
  const spendTokens = useCallback(async (description: string): Promise<boolean> => {
    if (balance === null || balance < 10) {
      setError('You need 10 tokens to refine your sigil.');
      return false;
    }
    const res = await fetch('/api/credits/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount: 10, description }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to spend tokens'); return false; }
    setBalance(data.balance);
    return true;
  }, [balance]);

  const toggleMeditation = useCallback(() => {
    if (!audioRef.current) return;
    if (meditating) {
      audioRef.current.pause();
      setMeditating(false);
    } else {
      audioRef.current.play();
      setMeditating(true);
    }
  }, [meditating]);

  const stopMeditation = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setMeditating(false);
  }, []);

  const handleLetItGo = useCallback(() => {
    if (!canvasRef.current) return;
    stopMeditation();
    // Consuming the daily offering
    try {
      localStorage.setItem(DAILY_KEY(), '1');
      localStorage.removeItem('sigil_pending');
      if (!isLoggedIn) localStorage.setItem('sigil_guest_used', '1');
    } catch { /* ignore */ }
    setDailyUsed(true);
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
  }, [stopMeditation, isLoggedIn]);

  const handleRefine = useCallback(async () => {
    if (!isLoggedIn) { saveAndShowLogin(); return; }
    setError('');
    const ok = await spendTokens('Daily Offering — Refine Sigil');
    if (!ok) return;
    stopMeditation();
    setShowModal(false);
    setStep('generating');
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
      try {
        localStorage.setItem('sigil_pending', JSON.stringify({ url: data.url, uniqueConsonants, intention }));
      } catch { /* ignore */ }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('sigil');
    }
  }, [isLoggedIn, saveAndShowLogin, spendTokens, stopMeditation, uniqueConsonants, intention]);


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
      // Persist so navigation away doesn't lose it
      try {
        localStorage.setItem('sigil_pending', JSON.stringify({
          url: data.url,
          uniqueConsonants,
          intention,
        }));
      } catch { /* ignore */ }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate sigil');
      setStep('unique');
    }
  }, [uniqueConsonants, intention]);

  const handleReset = useCallback(() => {
    stopAll();
    try { localStorage.removeItem('sigil_pending'); } catch { /* ignore */ }
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
    <div className="relative flex flex-col min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-950">

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-16">

        {/* Step progress */}
        {step !== 'intro' && (
          <div className="flex items-center gap-3 mb-12">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      i <= stepIndex
                        ? 'bg-gray-900 dark:bg-gray-100 scale-125'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                  <span
                    className={`text-[9px] tracking-widest uppercase transition-all duration-300 ${
                      i === stepIndex
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-8 h-px mb-4 transition-all duration-500 ${
                      i < stepIndex ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="text-center max-w-sm">
            <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-4">Daily Practice</p>
            <h1 className="albertus-font text-4xl font-extralight text-gray-900 dark:text-gray-100 mb-6 leading-tight" style={{ letterSpacing: '0.05em' }}>
              ILLUMINATI
            </h1>

            {dailyUsed && !isLoggedIn ? (
              <div className="mt-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Sign in to create more sigils.</p>
                <a
                  href="/signin?redirect=/sigil-creator"
                  className="inline-block px-10 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                >
                  Sign In
                </a>
              </div>
            ) : dailyUsed ? (
              <>
                <button
                  onClick={startListening}
                  className="px-10 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                >
                  Begin
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Refinements cost 10 tokens</p>
              </>
            ) : (
              <>
                <button
                  onClick={startListening}
                  className="px-10 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                >
                  Begin
                </button>
              </>
            )}
            {error && <p className="text-red-600 dark:text-red-400 text-xs mt-5">{error}</p>}
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
                      <div className="absolute inset-0 rounded-full animate-ping bg-gray-200 dark:bg-gray-700" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-2 rounded-full animate-ping bg-gray-200 dark:bg-gray-700" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                    </>
                  )}
                  <div
                    className={`absolute inset-4 rounded-full flex items-center justify-center border transition-colors ${
                      isRecognizing
                        ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <svg className={`w-5 h-5 ${isRecognizing ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                {listeningMode === 'hume' && (
                  <span className="mt-3 text-gray-500 dark:text-gray-400 text-xs tracking-wider">
                    
                  </span>
                )}
              </div>
            )}

            {/* Text input fallback */}
            {showTextInput ? (
              <div className="mb-8 w-full">
                <p className="text-gray-600 dark:text-gray-400 text-base mb-3">
                  {error ? 'Speech unavailable — type your intention below' : 'Type your intention'}
                </p>
                <textarea
                  autoFocus
                  value={typedIntention}
                  onChange={(e) => setTypedIntention(e.target.value)}
                  placeholder="I intend to…"
                  rows={3}
                  className="w-full rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 text-base font-light italic resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
                />
                {!error && (
                  <button
                    onClick={() => { setShowTextInput(false); startListening(); }}
                    className="mt-3 text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <p className="text-lg font-light leading-relaxed text-gray-900 dark:text-gray-100 italic">
                      &ldquo;{intention}
                      <span className="text-gray-400 dark:text-gray-500">{interimText}</span>
                      &rdquo;
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      {isRecognizing
                        ? listeningMode === 'hume' ? 'Listening... speak then pause' : 'Listening…'
                        : 'Press Begin to start'}
                    </p>
                  )}
                </div>

                {/* Type instead toggle */}
                <button
                  onClick={() => { stopAll(); setShowTextInput(true); setListeningMode('text'); }}
                  className="mb-8 text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  type instead
                </button>
              </>
            )}

            {error && <p className="text-red-600 dark:text-red-400 text-xs mb-4">{error}</p>}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              {displayText && (
                <button
                  onClick={handleContinueFromListening}
                  className="px-8 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
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
              <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1">Your Intention</p>
              <p className="text-gray-600 dark:text-gray-400 text-base italic">&ldquo;{intention}&rdquo;</p>
            </div>

            <div className="my-8 p-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-5">Reduction</p>
              <p className="text-3xl font-light text-gray-900 dark:text-gray-100 break-all tracking-widest">
                {consonants}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleContinueFromConsonants}
                className="px-8 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── UNIQUE CONSONANTS ── */}
        {step === 'unique' && (
          <div className="text-center max-w-lg w-full">

            <div className="my-8 p-10 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-6">Essence</p>
              <p className="text-3xl font-light text-gray-900 dark:text-gray-100 break-all tracking-widest">
                {uniqueConsonants}
              </p>
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-xs mb-5">{error}</p>}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleGenerateSigil}
                className="px-8 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                Generate Sigil ✦
              </button>
            </div>
          </div>
        )}

        {/* ── GENERATING ── */}
        {step === 'generating' && (
          <div className="text-center">
            <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-12">
              Transmuting Intention
            </p>
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ animation: 'spin 4s linear infinite' }}
              />
              <div
                className="absolute inset-3 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ animation: 'spin 3s linear infinite reverse' }}
              />
              <div className="absolute inset-6 rounded-full border border-gray-900 dark:border-gray-100 animate-pulse" />
              <div className="absolute inset-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-xs tracking-widest">
              {uniqueConsonants.split('').join(' · ')}
            </p>
          </div>
        )}

        {/* ── SIGIL ── */}
        {step === 'sigil' && sigilUrl && (
          <div className="text-center max-w-md w-full">
            <button
              onClick={handleOpenModal}
              className="block w-full rounded-lg overflow-hidden mb-6 group transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sigilUrl} alt="Generated sigil" className="w-full block" />
              <div className="py-2 text-[9px] tracking-[0.4em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                Open Full Size
              </div>
            </button>

            <p className="text-sm tracking-widest mb-8 text-gray-400 dark:text-gray-500">
              {uniqueConsonants.split('').join(' ')}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleOpenModal}
                className="px-8 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                Work this Sigil ✦
              </button>
            </div>
            {error && <p className="text-red-600 dark:text-red-400 text-xs mt-4">{error}</p>}
          </div>
        )}

      </div>

      {/* ── SIGIL MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget && !releasing) setShowModal(false); }}
        >
          <div className="relative max-w-2xl w-full rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            {/* Close */}
            {!releasing && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
              <div className="px-8 py-6 flex flex-col items-center gap-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase mb-4">
                  {uniqueConsonants.split('').join(' · ')}
                </p>

                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={handleRefine}
                    className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    ↻ Refine · 10 tokens
                  </button>
                  <button
                    onClick={toggleMeditation}
                    className={`px-6 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      meditating
                        ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {meditating ? '⏸ Meditating' : '♬ Meditate'}
                  </button>
                  <button
                    onClick={handleLetItGo}
                    className="px-6 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                  >
                    ✦ Let It Go
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <p className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-4">Daily Offering</p>
            <h2 className="albertus-font text-2xl text-gray-900 dark:text-gray-100 mb-3">Sign In to Continue</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Your sigil has been saved. Sign in or create an account to work it.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/signin?redirect=/sigil-creator"
                className="w-full py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/signup?redirect=/sigil-creator"
                className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Create Account
              </a>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/audio/meditation20.mp3" loop preload="none" />
    </div>
  );
}
