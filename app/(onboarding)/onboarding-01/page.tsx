export const metadata = {
  title: 'Welcome to the Illuminati',
  description: 'Begin your journey of inner transformation.',
}

import Link from 'next/link'
import OnboardingHeader from '../onboarding-header'
import OnboardingImage from '../onboarding-image'
import OnboardingProgress from '../onboarding-progress'

export default function Onboarding01() {
  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative flex">
        <div className="w-full md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <div className="flex-1">
              <OnboardingHeader />
              <OnboardingProgress step={1} total={3} />
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">Let's clear something up.</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">We know what you're thinking. Allow us to address it.</p>

                {/* Myths */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <span className="text-red-400 font-bold text-base leading-none mt-0.5 flex-shrink-0">✕</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">We control world governments</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">We can barely agree on a meeting time.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <span className="text-red-400 font-bold text-base leading-none mt-0.5 flex-shrink-0">✕</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">Lizard people. New world order. Secret handshakes.</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Okay, there's one handshake. But it's very tasteful.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <span className="text-red-400 font-bold text-base leading-none mt-0.5 flex-shrink-0">✕</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">Hidden agenda to reshape civilization</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Our only agenda is your highest self. Admittedly ambitious.</p>
                    </div>
                  </div>
                </div>

                {/* What we are */}
                <div className="border border-yellow-200 dark:border-yellow-800/60 rounded-xl p-5 mb-8 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-3">What we actually are</p>
                  <div className="space-y-2.5">
                    {[
                      'A community of seekers on the inner path',
                      'Ancient wisdom applied to modern minds',
                      'Tools for self-discovery and conscious living',
                      'A space to ask the questions that actually matter',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">✦</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-8">
                  "The real conspiracy is becoming the best version of yourself. It's harder than it sounds."
                </p>

                <div className="flex justify-end">
                  <Link className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" href="/onboarding-02">
                    I'm in. Let's go →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
        <OnboardingImage />
      </div>
    </main>
  )
}
