'use client'

import { ThemeProvider } from 'next-themes'

export default function Theme({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"  // Set default to dark
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}