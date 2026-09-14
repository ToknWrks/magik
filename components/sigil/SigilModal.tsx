'use client';

// components/sigil/SigilModal.tsx
// Shared "Work this Sigil" modal — used by the creator and the collection gallery.
// Props give the parent full control over the sigil being worked and what
// happens on each action. Release animation (particle burst) is built in.

import { useRef, useState, useCallback, useEffect } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  decay: number;
  hue: number;
}

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
      hue: Math.random() < 0.55 ? 270 : 210,
    });
  }

  let frame = 0;
  const MAX_FRAMES = 130;

  function tick() {
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

export interface SigilModalProps {
  open: boolean;
  onClose: () => void;
  sigilUrl: string;
  intention: string;
  uniqueConsonants: string;
  /** Refined state: hide Save (already saved) on collection sigils */
  alreadySaved?: boolean;
  balance: number | null;
  isLoggedIn: boolean;
  onRefine: () => void;
  onNeedLogin: () => void;
  onReleased: () => void;
}

export default function SigilModal({
  open,
  onClose,
  sigilUrl,
  intention,
  uniqueConsonants,
  alreadySaved = false,
  balance,
  isLoggedIn,
  onRefine,
  onNeedLogin,
  onReleased,
}: SigilModalProps) {
  const [releasing, setReleasing] = useState(false);
  const [imgOpacity, setImgOpacity] = useState(1);
  const [meditating, setMeditating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setReleasing(false);
      setImgOpacity(1);
      setMeditating(false);
    }
  }, [open]);

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
    setReleasing(true);
    burstSigil(canvasRef.current, setImgOpacity, () => {
      setTimeout(() => {
        onReleased();
      }, 200);
    });
  }, [stopMeditation, onReleased]);

  const handleRefineClick = useCallback(() => {
    if (!isLoggedIn) { onNeedLogin(); return; }
    if (balance === null || balance < 10) {
      return; // parent surfaces its own error, or we disable below
    }
    stopMeditation();
    onRefine();
  }, [isLoggedIn, balance, onNeedLogin, onRefine, stopMeditation]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget && !releasing) onClose(); }}
    >
      <div className="relative max-w-xl w-full max-h-[85vh] flex flex-col rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {/* Close */}
        {!releasing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        )}

        {/* Image / Canvas */}
        <div className="relative w-full aspect-square max-h-[60vh] mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sigilUrl}
            alt={intention || 'Generated sigil'}
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
          <div className="px-6 py-4 flex flex-col items-center gap-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <p className="text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase">
              {uniqueConsonants.split('').join(' · ')}
            </p>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleRefineClick}
                disabled={balance !== null && balance < 10}
                className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↻ Refine · 10 tokens
              </button>
              <button
                onClick={toggleMeditation}
                className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  meditating
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {meditating ? '⏸ Meditating' : '♬ Meditate'}
              </button>
              {!alreadySaved && (
                <button
                  onClick={() => { if (!isLoggedIn) { onNeedLogin(); return; } }}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ☆ Save
                </button>
              )}
              <button
                onClick={handleLetItGo}
                className="px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                ✦ Let It Go
              </button>
            </div>
          </div>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/audio/meditation20.mp3" loop preload="none" />
    </div>
  );
}
