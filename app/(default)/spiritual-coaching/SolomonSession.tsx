'use client';

import { useVoice, VoiceProvider } from '@humeai/voice-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { languagePromptSuffix } from '@/hooks/useLanguage';

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

// ── Audio Visualizer ───────────────────────────────────────────────────────────

function AudioVisualizer() {
  const { micFft, messages } = useVoice();
  const [activeSpeaker, setActiveSpeaker] = useState<'solomon' | 'user' | 'idle'>('idle');
  const [solomonBars, setSolomonBars] = useState<number[]>(Array(40).fill(0));
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  const scheduleIdle = (delayMs: number) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setActiveSpeaker('idle'), delayMs);
  };

  // Detect user speaking from mic FFT
  const micAvg = micFft.length > 0 ? micFft.slice(0, 20).reduce((a, b) => a + b, 0) / 20 : 0;
  useEffect(() => {
    if (micAvg > 2) {
      setActiveSpeaker('user');
      scheduleIdle(600);
    }
  }, [micFft]);

  // Detect Solomon speaking from messages
  const msgCount = messages.length;
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.type === 'assistant_message') {
      setActiveSpeaker('solomon');
      scheduleIdle(2500);
    }
  }, [msgCount]);

  // Animate Solomon's bars with a smooth sine wave
  useEffect(() => {
    if (activeSpeaker !== 'solomon') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setSolomonBars(Array(40).fill(0));
      return;
    }
    const animate = () => {
      phaseRef.current += 0.055;
      const t = phaseRef.current;
      setSolomonBars(Array.from({ length: 40 }, (_, i) => {
        const a = Math.sin(t + i * 0.38) * 0.5 + 0.5;
        const b = Math.sin(t * 1.4 + i * 0.65) * 0.3 + 0.3;
        return (a + b) / 1.7;
      }));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [activeSpeaker]);

  const isSolomon = activeSpeaker === 'solomon';
  const isUser = activeSpeaker === 'user';
  const BAR_COUNT = 40;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 gap-8 px-8 overflow-hidden">

      {/* Solomon avatar with glow ring */}
      <div className="relative flex items-center justify-center">
        <div className={`absolute -inset-4 rounded-full transition-all duration-700 ease-out ${
          isSolomon
            ? 'opacity-100 ring-2 ring-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.25)]'
            : isUser
            ? 'opacity-100 ring-1 ring-white/15 shadow-[0_0_30px_rgba(255,255,255,0.08)]'
            : 'opacity-0'
        }`} />
        <div className="relative w-24 h-24 rounded-full overflow-hidden z-10">
          <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Speaker label */}
      <p className={`text-xs font-medium tracking-widest uppercase transition-all duration-400 ${
        isSolomon ? 'text-green-400' : isUser ? 'text-gray-400' : 'text-gray-800 dark:text-gray-800 select-none'
      }`}>
        {isSolomon ? 'Solomon' : isUser ? 'You' : '·'}
      </p>

      {/* Bar visualizer */}
      <svg viewBox="0 0 320 80" className="w-full max-w-xs h-20" preserveAspectRatio="none">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const raw = isSolomon
            ? solomonBars[i] ?? 0
            : isUser
            ? Math.min((micFft[i] ?? 0) / 220, 1)
            : 0.03;
          const h = Math.max(raw * 72, 3);
          const y = 40 - h / 2;
          const fill = isSolomon ? '#22c55e' : isUser ? '#ffffff' : '#1f2937';
          return (
            <motion.rect
              key={i}
              x={1 + i * 8}
              y={y}
              width={5}
              height={h}
              rx={2.5}
              fill={fill}
              animate={{ height: h, y, fill }}
              transition={{ duration: 0.08 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── Session Controls ───────────────────────────────────────────────────────────

function SessionControls({
  elapsedSeconds,
  resumedElapsedSeconds,
  creditsUsed,
  balance,
  onEnd,
}: {
  elapsedSeconds: number;
  resumedElapsedSeconds: number;
  creditsUsed: number;
  balance: number;
  onEnd: () => void;
}) {
  const { disconnect, status, isMuted, mute, unmute, micFft } = useVoice();

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = String(elapsedSeconds % 60).padStart(2, '0');

  const totalElapsed = resumedElapsedSeconds + elapsedSeconds;
  const prepaidRemaining = Math.max(0, 600 - totalElapsed);
  const prepaidMins = Math.floor(prepaidRemaining / 60);
  const prepaidSecs = String(prepaidRemaining % 60).padStart(2, '0');
  const inPrepaidWindow = prepaidRemaining > 0;

  return (
    <AnimatePresence>
      {status.value === 'connected' && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4"
        >
          {balance <= 20 && balance > 0 && (
          <div className="max-w-2xl mx-auto mb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Low tokens ({balance} remaining) — <Link href="/credits" className="underline font-medium">buy more</Link> to keep going
            </div>
          </div>
        )}
        {resumedElapsedSeconds > 0 && (
          <div className="max-w-2xl mx-auto mb-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
              inPrepaidWindow
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {inPrepaidWindow
                ? `${prepaidMins}:${prepaidSecs} prepaid time remaining`
                : 'Prepaid window used — billing at 10 tokens/min'}
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto flex items-center gap-4">
            {/* Timer + credits */}
            <div className="flex-shrink-0 text-center min-w-[72px]">
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{mins}:{secs}</p>
              <p className="text-xs text-gray-400">{creditsUsed} tokens</p>
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
  previousSummary,
  isResume,
  resumedChatGroupId,
  resumedElapsedSeconds,
}: {
  balance: number;
  accessToken: string;
  configId: string;
  previousSummary: string | null;
  isResume?: boolean;
  resumedChatGroupId?: string | null;
  resumedElapsedSeconds?: number;
}) {
  const { status, connect } = useVoice();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setConnecting(true);
    setError('');
    try {
      await connect({
        auth: { type: 'accessToken', value: accessToken },
        configId,
        resumedChatGroupId: resumedChatGroupId ?? undefined,
      });
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
        <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg">
          <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Solomon</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
        Your personal guide for spiritual exploration and self-discovery. Ask about any teaching, challenge, or question on your path.
      </p>

      {isResume ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full mb-4">
          <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-green-700 dark:text-green-400">Resuming your last session</span>
        </div>
      ) : previousSummary ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full mb-4">
          <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-yellow-700 dark:text-yellow-400">Solomon remembers your last session</span>
        </div>
      ) : null}

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-8 w-full max-w-xs">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Your balance</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{balance} tokens</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Session cost</span>
          {isResume ? (
            <span className="font-semibold text-green-600 dark:text-green-400">No charge — resuming</span>
          ) : (
            <span className="font-semibold text-yellow-700 dark:text-yellow-500">100 tokens (10 min min)</span>
          )}
        </div>
        {isResume && resumedElapsedSeconds !== undefined && resumedElapsedSeconds < 600 && (
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Prepaid time left</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {Math.floor((600 - resumedElapsedSeconds) / 60)}m {String((600 - resumedElapsedSeconds) % 60).padStart(2, '0')}s
            </span>
          </div>
        )}
      </div>

      {balance < MIN_CREDITS && !isResume && process.env.NODE_ENV !== 'development' ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">You need at least 100 tokens to start a session.</p>
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-700 hover:bg-yellow-800 text-white font-semibold rounded-xl transition-colors"
          >
            Buy Tokens
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
            {connecting ? 'Connecting...' : isResume ? 'Resume Session' : 'Begin Session'}
          </button>
          <p className="text-xs text-gray-400">{isResume ? 'Continuing your session — only new time beyond 10 min is billed' : '100 tokens deducted when session starts · +10/min after 10 min'}</p>
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
  onResume,
  onNew,
  onFreshStart,
}: {
  elapsedSeconds: number;
  creditsUsed: number;
  balance: number;
  summary: string;
  savingSession: boolean;
  onResume: () => void;
  onNew: () => void;
  onFreshStart: () => void;
}) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const unusedMinutes = Math.max(0, 10 - mins);
  const unusedCredits = unusedMinutes > 0 && creditsUsed <= 100 ? unusedMinutes * CREDITS_PER_MINUTE : 0;

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
            <p className="text-xs text-gray-500 dark:text-gray-400">Tokens used</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-500">{balance}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
          </div>
        </div>

        {/* Unused time notice */}
        {unusedCredits > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {unusedMinutes} prepaid {unusedMinutes === 1 ? 'minute' : 'minutes'} remaining
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Resume this session to use your full 10 minutes, or start fresh — tokens stay in your balance either way.
              </p>
            </div>
          </div>
        )}

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
        <div className="space-y-3 pb-6">
          {/* Primary: Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resume Session
          </button>

          <div className="flex gap-3">
            <button
              onClick={onNew}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              title="Continue this topic with Solomon"
            >
              New Session
            </button>
            <button
              onClick={onFreshStart}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              title="Start fresh — Solomon won't remember previous sessions"
            >
              Fresh Start
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            New Session continues your topic · Fresh Start is a clean slate
          </p>

          <div className="flex gap-3 pt-1">
            <Link
              href="/spiritual-coaching/sessions"
              className="flex-1 py-2.5 text-gray-500 dark:text-gray-400 text-sm text-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              All Sessions
            </Link>
            <Link
              href="/profile"
              className="flex-1 py-2.5 text-gray-500 dark:text-gray-400 text-sm text-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Profile
            </Link>
          </div>
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
  previousSummary,
  resumeChatGroupId,
  resumeTranscript,
  resumedElapsedSeconds = 0,
  contentContext,
  onSessionEnd,
  language = 'en',
}: {
  balance: number;
  accessToken: string;
  configId: string;
  previousSummary: string | null;
  resumeChatGroupId?: string | null;
  resumeTranscript?: any[] | null;
  resumedElapsedSeconds?: number;
  contentContext?: { title: string; type: 'enlightenment' | 'mystery' } | null;
  onSessionEnd: (creditsUsed: number, newBalance: number, elapsedSeconds: number, transcript: any[], chatGroupId: string | null) => void;
  language?: string;
}) {
  const { status, messages, chatMetadata, sendSessionSettings, sendAssistantInput } = useVoice();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [balance, setBalance] = useState(initialBalance);
  const startedAt = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMinuteCharged = useRef(0);
  const didDeductMinimum = useRef(false);
  const chatGroupIdRef = useRef<string | null>(null);

  // Capture chatGroupId from Hume metadata
  useEffect(() => {
    if (chatMetadata?.chatGroupId) {
      chatGroupIdRef.current = chatMetadata.chatGroupId;
    }
  }, [chatMetadata]);

  // Inject context once connected
  const sentContextRef = useRef(false);
  useEffect(() => {
    if (status.value !== 'connected') {
      sentContextRef.current = false;
      return;
    }
    if (sentContextRef.current) return;
    sentContextRef.current = true;

    if (contentContext) {
      // Content session: inject title-specific context and trigger the opening greeting
      const typeLabel = contentContext.type === 'enlightenment'
        ? 'a spiritual teaching on enlightenment'
        : 'an esoteric mystery';
      const previousCtx = previousSummary
        ? `\n\nContext from their previous session: ${previousSummary}\n\nUse this for continuity where relevant.`
        : '';
      sendSessionSettings({
        systemPrompt: `The user has just been reading "${contentContext.title}" — ${typeLabel}. Engage them deeply on this content.${previousCtx}${languagePromptSuffix(language)}`,
      });
      sendAssistantInput(`Welcome. I see you've been exploring "${contentContext.title}". I'm here to go as deep as you'd like — what drew you to this, or what questions came up as you read it?`);
    } else if (previousSummary && !resumeChatGroupId) {
      // New session (not resume) with a previous session — inject continuity context
      sendSessionSettings({
        systemPrompt: `Context from the user's previous session with you:\n\n${previousSummary}\n\nUse this to provide continuity. Do not mention that you have been given a summary; simply be present and connected.${languagePromptSuffix(language)}`,
      });
    } else if (resumeTranscript && resumeTranscript.length > 0) {
      // Legacy fallback: old sessions without chatGroupId — inject transcript manually
      const formatted = resumeTranscript
        .filter((m: any) => m.type === 'user_message' || m.type === 'assistant_message')
        .map((m: any) => `${m.message.role === 'user' ? 'User' : 'Solomon'}: ${m.message.content}`)
        .join('\n\n');
      sendSessionSettings({
        systemPrompt: `You are resuming a session. Pick up naturally where you left off:\n\n${formatted}${languagePromptSuffix(language)}`,
      });
    } else if (language !== 'en') {
      // Fresh session with no prior context — only inject if non-English
      sendSessionSettings({ systemPrompt: languagePromptSuffix(language).trim() });
    }
    // Resume via chatGroupId: Hume handles it natively — no injection needed
  }, [status.value]);

  // Start timer when connected
  useEffect(() => {
    if (status.value === 'connected' && !startedAt.current) {
      startedAt.current = Date.now();

      timerRef.current = setInterval(async () => {
        const elapsed = Math.floor((Date.now() - startedAt.current!) / 1000);
        setElapsedSeconds(elapsed);

        const minutesElapsed = Math.floor(elapsed / 60);

        const isDev = process.env.NODE_ENV === 'development';

        // Deduct minimum 100 credits once on connect (skip if resuming within prepaid window)
        if (!didDeductMinimum.current) {
          didDeductMinimum.current = true;
          const prevMinutesPaid = Math.floor(resumedElapsedSeconds / 60);
          const isResumingWithinPrepaid = resumedElapsedSeconds > 0 && prevMinutesPaid < 10;

          if (isResumingWithinPrepaid) {
            // Already paid for 10 min — no new charge, just resume billing from minute 10
            setCreditsUsed(0);
            lastMinuteCharged.current = 10;
          } else if (isDev) {
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
              onSessionEnd(creditsUsed, balance, elapsed, messages, chatGroupIdRef.current);
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
    onSessionEnd(creditsUsed, balance, elapsedSeconds, messages, chatGroupIdRef.current);
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
            previousSummary={previousSummary}
            isResume={!!(resumeChatGroupId || resumeTranscript)}
            resumedChatGroupId={resumeChatGroupId}
            resumedElapsedSeconds={resumedElapsedSeconds}
          />
        ) : (
          <AudioVisualizer key="visualizer" />
        )}
      </AnimatePresence>

      <SessionControls
        elapsedSeconds={elapsedSeconds}
        resumedElapsedSeconds={resumedElapsedSeconds}
        creditsUsed={creditsUsed}
        balance={balance}
        onEnd={handleEnd}
      />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

const CONFIG_NEW = process.env.NEXT_PUBLIC_HUME_COACHING_CONFIG_ID ?? '';
const CONFIG_RESUME = process.env.NEXT_PUBLIC_HUME_RESUME_CONFIG_ID ?? CONFIG_NEW;
const CONFIG_CONTENT = process.env.NEXT_PUBLIC_HUME_CONTENT_CONFIG_ID ?? CONFIG_NEW;

export default function SolomonSession({
  accessToken,
  initialBalance,
  initialResumeTranscript = null,
  initialResumeChatGroupId = null,
  initialResumeElapsed = 0,
  initialContentContext = null,
  language = 'en',
}: {
  accessToken: string;
  initialBalance: number;
  initialResumeTranscript?: any[] | null;
  initialResumeChatGroupId?: string | null;
  initialResumeElapsed?: number;
  initialContentContext?: { title: string; type: 'enlightenment' | 'mystery' } | null;
  language?: string;
}) {
  const [phase, setPhase] = useState<'session' | 'summary'>('session');
  const [summaryData, setSummaryData] = useState({ creditsUsed: 0, balance: initialBalance, elapsed: 0 });
  const [sessionSummary, setSessionSummary] = useState('');
  const [savingSession, setSavingSession] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [previousSummary, setPreviousSummary] = useState<string | null>(null);
  const [resumeTranscript, setResumeTranscript] = useState<any[] | null>(initialResumeTranscript);
  const [resumeChatGroupId, setResumeChatGroupId] = useState<string | null>(initialResumeChatGroupId);
  const [lastChatGroupId, setLastChatGroupId] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(initialBalance);
  const [resumedElapsed, setResumedElapsed] = useState(initialResumeElapsed);
  const lastTranscriptRef = useRef<any[]>([]);

  useEffect(() => {
    fetch('/api/coaching/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const lastSummary = d.sessions?.[0]?.summary;
        if (lastSummary) setPreviousSummary(lastSummary);
      })
      .catch(() => {});
  }, []);

  const handleSessionEnd = async (creditsUsed: number, balance: number, elapsed: number, transcript: any[], chatGroupId: string | null) => {
    lastTranscriptRef.current = transcript;
    setCurrentBalance(balance);
    setLastChatGroupId(chatGroupId);
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
          body: JSON.stringify({ transcript, durationSeconds: elapsed, creditsUsed, chatGroupId }),
        });
        const data = await res.json();
        if (data.session?.summary) {
          setSessionSummary(data.session.summary);
          setPreviousSummary(data.session.summary);
        }
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
        onResume={() => {
          setResumedElapsed(summaryData.elapsed);
          if (lastChatGroupId) {
            setResumeChatGroupId(lastChatGroupId);
            setResumeTranscript(null);
          } else {
            setResumeTranscript(lastTranscriptRef.current);
            setResumeChatGroupId(null);
          }
          setPhase('session');
          setSessionKey(k => k + 1);
        }}
        onNew={() => {
          setResumeTranscript(null);
          setResumeChatGroupId(null);
          setPhase('session');
          setSessionKey(k => k + 1);
        }}
        onFreshStart={() => {
          setResumeTranscript(null);
          setResumeChatGroupId(null);
          setPreviousSummary(null);
          setPhase('session');
          setSessionKey(k => k + 1);
        }}
      />
    );
  }

  const isResume = !!(resumeChatGroupId || resumeTranscript);
  const configId = isResume
    ? CONFIG_RESUME
    : initialContentContext
    ? CONFIG_CONTENT
    : CONFIG_NEW;

  return (
    <VoiceProvider key={sessionKey}>
      <InnerSession
        balance={currentBalance}
        accessToken={accessToken}
        configId={configId}
        previousSummary={previousSummary}
        resumeChatGroupId={resumeChatGroupId}
        resumeTranscript={resumeTranscript}
        resumedElapsedSeconds={isResume ? resumedElapsed : 0}
        contentContext={isResume ? null : initialContentContext}
        onSessionEnd={handleSessionEnd}
        language={language}
      />
    </VoiceProvider>
  );
}
