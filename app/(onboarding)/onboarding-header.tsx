import Link from 'next/link'
import Logo from '@/components/ui/logo'

export default function OnboardingHeader() {
  return (
    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
      <Logo />
      <div className="text-sm">
        Have an account? <Link className="font-medium text-yellow-700 hover:text-yellow-600 dark:hover:text-yellow-400" href="/signin">Sign In</Link>
      </div>
    </div>
  )
}
