// components/logo.tsx
'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LogoProps {
  isSidebarOpen?: boolean
}

export default function Logo({ isSidebarOpen = false }: LogoProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for dark mode
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    return () => observer.disconnect()
  }, [])

  // Choose logo based on theme
  const logoSrc = isDarkMode 
    ? '/images/illuminati-logo.png' 
    : '/images/illuminati-logo-light.png'

  console.log('🎨 Logo render - isSidebarOpen:', isSidebarOpen)

  return (
    <Link className="flex items-center gap-3" href="/">
      <Image
        src={logoSrc}
        alt="Illuminati Logo"
        width={32}
        height={32}
        className="w-8 h-8 flex-shrink-0"
        priority
      />
      <span 
        className={`albertus-font text-md text-gray-400 dark:text-gray-500 transition-all duration-300 ease-in-out ${
          isSidebarOpen 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-2 pointer-events-none'
        }`}
      >
        ILLUMINATI
      </span>
    </Link>
  )
}