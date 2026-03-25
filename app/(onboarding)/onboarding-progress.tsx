import Link from 'next/link'

const STEP_HREFS = ['/onboarding-01', '/illuminati-initiation', '/full-illuminati-initiation'];

export default function OnboardingProgress({ step = 1, total = 3 }: { step?: number; total?: number }) {
  return (
    <div className="px-4 pt-12 pb-8">
      <div className="max-w-md mx-auto w-full">
        <div className="relative">
          <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200 dark:bg-gray-700/60" aria-hidden="true"></div>
          <ul className="relative flex justify-between w-full">
            {Array.from({ length: total }, (_, i) => i + 1).map(s => (
              <li key={s}>
                <Link
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${step >= s ? 'bg-yellow-700 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                  href={STEP_HREFS[s - 1] ?? '#'}
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
