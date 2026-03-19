'use client';

import { useVoice, VoiceProvider } from '@humeai/voice-react';
import { useEffect, useRef, useState, forwardRef, ComponentRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CREDITS_PER_MINUTE = 10;
const MIN_CREDITS = 100; // 10 min minimum

// ── Mic FFT Visualizer ─────────────────────────────────────────────────────────

function MicFFT({ fft }: { fft: number[] }) {
  return (
    <svg viewBox="0 0 96 32" className="w-24 h-8" preserveAspectRatio="none">
      {Array.from({ length: 24 }).map((_, i) => {
        const value = (fft[i] ?? 0) / 4;
        const h = Math.max(Math.min(32 * value, 28), 2);
        const y = 16 - h / 2;
        return (
          <motion.rect
            key={i}
            x={2 + i * 4}
            y={y}
            width={2}
            height={h}
            rx={1}
            className="fill-yellow-600"
            animate={{ height: h, y }}
            transition={{ duration: 0.05 }}
          />
        );
      })}
    </svg>
  );
}

// ── Message list ───────────────────────────────────────────────────────────────

const MessageList = forwardRef<ComponentRef<typeof motion.div>, Record<never, never>>(
  function MessageList(_, ref) {
    const { messages } = useVoice();

    return (
      <motion.div
        ref={ref}
        layoutScroll
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => {
              if (msg.type !== 'user_message' && msg.type !== 'assistant_message') return null;
              const isUser = msg.type === 'user_message';
              return (
                <motion.div
                  key={msg.type + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-yellow-700 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}>
                    {!isUser && (
                      <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 mb-1 uppercase tracking-wide">Solomon</p>
                    )}
                    <p>{msg.message.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <p className="text-sm">Solomon is listening...</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

// ── Session Controls ───────────────────────────────────────────────────────────

function SessionControls({
  elapsedSeconds,
  creditsUsed,
  onEnd,
}: {
  elapsedSeconds: number;
  creditsUsed: number;
  onEnd: () => void;
}) {
  const { disconnect, status, isMuted, mute, unmute, micFft } = useVoice();

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = String(elapsedSeconds % 60).padStart(2, '0');

  return (
    <AnimatePresence>
      {status.value === 'connected' && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            {/* Timer + credits */}
            <div className="flex-shrink-0 text-center min-w-[72px]">
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{mins}:{secs}</p>
              <p className="text-xs text-gray-400">{creditsUsed} credits</p>
            </div>

            {/* Waveform */}
            <div className="flex-1">
              <MicFFT fft={micFft} />
            </div>

            {/* Mute */}
            <button
              onClick={() => isMuted ? unmute() : mute()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            {/* End call */}
            <button
              onClick={() => { disconnect(); onEnd(); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
              End Session
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Start screen ───────────────────────────────────────────────────────────────

function StartScreen({
  balance,
  accessToken,
  configId,
}: {
  balance: number;
  accessToken: string;
  configId: string;
}) {
  const { status, connect } = useVoice();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setConnecting(true);
    setError('');
    try {
      await connect({ auth: { type: 'accessToken', value: accessToken }, configId });
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (status.value === 'connected') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      {/* Solomon avatar */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-800 to-yellow-600 flex items-center justify-center shadow-lg">
          <span className="text-5xl">⚕</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Solomon</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        Your personal guide for spiritual exploration and self-discovery. Ask about any teaching, challenge, or question on your path.
      </p>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-8 w-full max-w-xs">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Your balance</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{balance} credits</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Session cost</span>
          <span className="font-semibold text-yellow-700 dark:text-yellow-500">100 credits (10 min min)</span>
        </div>
      </div>

      {balance < MIN_CREDITS && process.env.NODE_ENV !== 'development' ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">You need at least 100 credits to start a session.</p>
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-700 hover:bg-yellow-800 text-white font-semibold rounded-xl transition-colors"
          >
            Buy Credits
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleStart}
            disabled={connecting}
            className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-700 hover:bg-yellow-800 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors text-lg shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {connecting ? 'Connecting...' : 'Begin Session'}
          </button>
          <p className="text-xs text-gray-400">100 credits deducted when session starts · +10/min after 10 min</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Session summary ────────────────────────────────────────────────────────────

function SessionSummary({
  elapsedSeconds,
  creditsUsed,
  balance,
  summary,
  savingSession,
  onNew,
}: {
  elapsedSeconds: number;
  creditsUsed: number;
  balance: number;
  summary: string;
  savingSession: boolean;
  onNew: () => void;
}) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-yellow-700 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Session Complete</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">May your path be illuminated.</p>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{mins}m {secs}s</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{creditsUsed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Credits used</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-500">{balance}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Session Reflection</h3>
          </div>
          <div className="p-5">
            {savingSession ? (
              <div className="flex items-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                <span className="text-sm">Generating reflection...</span>
              </div>
            ) : summary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {summary}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No reflection available.</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <button
            onClick={onNew}
            className="flex-1 py-2.5 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-xl transition-colors text-sm"
          >
            New Session
          </button>
          <Link
            href="/coaching/sessions"
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-center"
          >
            All Sessions
          </Link>
          <Link
            href="/profile"
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-center"
          >
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Inner session (inside VoiceProvider) ───────────────────────────────────────

function InnerSession({
  balance: initialBalance,
  accessToken,
  configId,
  onSessionEnd,
}: {
  balance: number;
  accessToken: string;
  configId: string;
  onSessionEnd: (creditsUsed: number, newBalance: number, elapsedSeconds: number, transcript: any[]) => void;
}) {
  const { status, messages } = useVoice();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [balance, setBalance] = useState(initialBalance);
  const startedAt = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMinuteCharged = useRef(0);
  const didDeductMinimum = useRef(false);
  const messagesRef = useRef<ComponentRef<typeof MessageList>>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Start timer when connected
  useEffect(() => {
    if (status.value === 'connected' && !startedAt.current) {
      startedAt.current = Date.now();

      timerRef.current = setInterval(async () => {
        const elapsed = Math.floor((Date.now() - startedAt.current!) / 1000);
        setElapsedSeconds(elapsed);

        const minutesElapsed = Math.floor(elapsed / 60);

        const isDev = process.env.NODE_ENV === 'development';

        // Deduct minimum 100 credits once on connect
        if (!didDeductMinimum.current) {
          didDeductMinimum.current = true;
          if (isDev) {
            setCreditsUsed(100);
            lastMinuteCharged.current = 10;
          } else {
            const res = await fetch('/api/credits/spend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ amount: 100, description: 'Solomon coaching session (10 min minimum)' }),
            });
            const data = await res.json();
            if (data.success) {
              setCreditsUsed(100);
              setBalance(data.balance);
              lastMinuteCharged.current = 10;
            }
          }
        }

        // After 10 min, charge 10 credits per additional minute
        if (minutesElapsed > lastMinuteCharged.current) {
          const newMinutes = minutesElapsed - lastMinuteCharged.current;
          const additionalCredits = newMinutes * CREDITS_PER_MINUTE;
          lastMinuteCharged.current = minutesElapsed;

          if (!isDev) {
            const res = await fetch('/api/credits/spend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ amount: additionalCredits, description: `Solomon session — minute ${minutesElapsed}` }),
            });
            const data = await res.json();
            if (data.success) {
              setCreditsUsed(prev => prev + additionalCredits);
              setBalance(data.balance);
            } else {
              // Out of credits — end session
              if (timerRef.current) clearInterval(timerRef.current);
              onSessionEnd(creditsUsed, balance, elapsed, messages);
            }
          } else {
            setCreditsUsed(prev => prev + additionalCredits);
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status.value]);

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSessionEnd(creditsUsed, balance, elapsedSeconds, messages);
  };

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {status.value !== 'connected' ? (
          <StartScreen
            key="start"
            balance={balance}
            accessToken={accessToken}
            configId={configId}
          />
        ) : (
          <MessageList key="messages" ref={messagesRef} />
        )}
      </AnimatePresence>

      <SessionControls
        elapsedSeconds={elapsedSeconds}
        creditsUsed={creditsUsed}
        onEnd={handleEnd}
      />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function SolomonSession({
  accessToken,
  initialBalance,
}: {
  accessToken: string;
  initialBalance: number;
}) {
  const [phase, setPhase] = useState<'session' | 'summary'>('session');
  const [summaryData, setSummaryData] = useState({ creditsUsed: 0, balance: initialBalance, elapsed: 0 });
  const [sessionSummary, setSessionSummary] = useState('');
  const [savingSession, setSavingSession] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const handleSessionEnd = async (creditsUsed: number, balance: number, elapsed: number, transcript: any[]) => {
    setSummaryData({ creditsUsed, balance, elapsed });
    setSessionSummary('');
    setPhase('summary');

    if (transcript.length > 0) {
      setSavingSession(true);
      try {
        const res = await fetch('/api/coaching/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ transcript, durationSeconds: elapsed, creditsUsed }),
        });
        const data = await res.json();
        if (data.session?.summary) setSessionSummary(data.session.summary);
      } catch {
        // summary unavailable — session still ended cleanly
      } finally {
        setSavingSession(false);
      }
    }
  };

  if (phase === 'summary') {
    return (
      <SessionSummary
        elapsedSeconds={summaryData.elapsed}
        creditsUsed={summaryData.creditsUsed}
        balance={summaryData.balance}
        summary={sessionSummary}
        savingSession={savingSession}
        onNew={() => {
          setPhase('session');
          setSessionKey(k => k + 1);
        }}
      />
    );
  }

  const configId = process.env.NEXT_PUBLIC_HUME_COACHING_CONFIG_ID ?? '';

  return (
    <VoiceProvider key={sessionKey}>
      <InnerSession
        balance={initialBalance}
        accessToken={accessToken}
        configId={configId}
        onSessionEnd={handleSessionEnd}
      />
    </VoiceProvider>
  );
}
