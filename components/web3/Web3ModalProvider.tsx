'use client'

// components/web3/Web3ModalProvider.tsx
// Mounts wagmi + React Query + triggers AppKit modal creation.
// Add once, high in the tree (inside Theme, outside auth-specific providers).

import { useEffect, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig, getAppKit, reownProjectId } from '@/lib/web3'

const queryClient = new QueryClient()

export default function Web3ModalProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (reownProjectId) getAppKit()
  }, [])

  if (!reownProjectId) {
    // Web3 disabled in this environment — render children untouched.
    return <>{children}</>
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
