'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import OnboardingHeader from '../onboarding-header';
import OnboardingImage from '../onboarding-image';
import OnboardingProgress from '../onboarding-progress';

type Path = 'full' | 'transit' | 'solomon';

export default function Onboarding02() {
  const router = useRouter();
  const [selected, setSelected] = useState<Path>('full');

  const handleContinue = () => {
    if (selected === 'full') router.push('/full-illuminati-initiation');
    else if (selected === 'transit') router.push('/astrology/personal-reading');
    else router.push('/onboarding-solomon');
  };

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative flex ">
        <div className="w-full md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <div className="flex-1">
              <OnboardingHeader />
              <OnboardingProgress step={2} total={3} />
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">
                <div className="space-y-3 mb-8">

                  {/* Full Initiation */}
                  <label className="relative block cursor-pointer">
                    <input type="radio" name="path" value="full" checked={selected === 'full'} onChange={() => setSelected('full')} className="peer sr-only" />
                    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                        <Image src="/images/Spirit14.png" alt="Full Initiation" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">Full Initiation</p>
                          <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500 flex-shrink-0 ml-2">$23</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Birth Chart + Personal Transit Reading</p>
                        <div className="space-y-1">
                          {[
                            'Complete natal chart interpretation',
                            'World and Personal planetary transits',
                            
                          ].map(f => (
                            <p key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="text-yellow-600 dark:text-yellow-500 flex-shrink-0">✦</span>{f}
                            </p>
                          ))}
                        </div>
                        <span className="inline-block mt-2.5 text-xs font-medium text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-blue-200/20 border border-yellow-200 dark:border-yellow-800 px-2 py-0.5 rounded-full">
                          Most comprehensive
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent peer-checked:border-yellow-500 dark:peer-checked:border-yellow-600 rounded-xl pointer-events-none" aria-hidden="true" />
                  </label>

                  {/* Transit Reading */}
                  <label className="relative block cursor-pointer">
                    <input type="radio" name="path" value="transit" checked={selected === 'transit'} onChange={() => setSelected('transit')} className="peer sr-only" />
                    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                        <Image src="/images/Spirit11.png" alt="Transit Reading" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100"> Transit Reading</p>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">FREE</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Enter Code "BETA" </p>
                        <div className="space-y-1">
                          {[
                            'Current planetary influences on your natal chart',
                            "What the cosmos is activating right now",
                            'Guidance for the month ahead',
                          ].map(f => (
                            <p key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="text-indigo-400 flex-shrink-0">✦</span>{f}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent peer-checked:border-yellow-500 dark:peer-checked:border-yellow-600 rounded-xl pointer-events-none" aria-hidden="true" />
                  </label>

                  {/* Solomon's Path */}
                  <label className="relative block cursor-pointer">
                    <input type="radio" name="path" value="solomon" checked={selected === 'solomon'} onChange={() => setSelected('solomon')} className="peer sr-only" />
                    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                        <Image src="/images/Spirit10.png" alt="Solomon's Path" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">Solomon's Path</p>
                          <span className="text-sm font-medium text-gray-400 flex-shrink-0 ml-2">Tokens</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Spiritual Coaching with Solomon</p>
                        <div className="space-y-1">
                          {[
                            'Direct voice sessions with your spiritual guide',
                            'Ask anything — no scripts, no limits',
                            'Purchase tokens and begin immediately',
                          ].map(f => (
                            <p key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="text-emerald-500 flex-shrink-0">✦</span>{f}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent peer-checked:border-yellow-500 dark:peer-checked:border-yellow-600 rounded-xl pointer-events-none" aria-hidden="true" />
                  </label>

                </div>

                <div className="flex items-center justify-between">
                  <Link className="text-sm underline hover:no-underline" href="/onboarding-01">← Back</Link>
                  <button onClick={handleContinue} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                    Continue →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
        <OnboardingImage />
      </div>
    </main>
  );
}
