'use client';

import { useState } from 'react';

export default function EcoContributionInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full border border-green-500 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex-shrink-0"
        aria-label="About ecological contribution"
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ecological Contribution</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <span className="text-lg leading-none mt-0.5">🌱</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-0.5">Your reading funds ecological regeneration</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Every reading includes a contribution to <strong>Regen Network</strong> — a verified registry for real-world ecological projects. Funds go toward forests, grasslands, and biodiversity corridors with transparent, on-chain impact data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-lg leading-none mt-0.5">🔗</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-0.5">Permanently retired on-chain</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ecocredits are retired on Regen Ledger — immutable, publicly verifiable, and non-reversible. This isn't a promise; it's a provable act recorded on a public blockchain.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-lg leading-none mt-0.5">✦</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-0.5">Inner work, outer impact</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We believe consciousness work and ecological regeneration are connected. The more you invest in your inner life, the more the living world benefits.
                  </p>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
                We contribute well beyond what our compute uses — because that's the standard we hold ourselves to.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
