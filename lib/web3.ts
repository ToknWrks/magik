'use client'

// lib/web3.ts — Reown AppKit + wagmi setup
// Creates the AppKit modal and wagmi adapter. Mounted once via <Web3ModalProvider>.

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, mainnet } from 'wagmi/chains'
import type { AppKit } from '@reown/appkit'

// Reown (WalletConnect) project id — set in Vercel + .env.local.
// Must have a NEXT_PUBLIC_ variant to be readable in the browser.
export const reownProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  ''

if (!reownProjectId) {
  // Don't throw at build time — the modal just won't mount in that env.
  console.warn('[web3] Missing NEXT_PUBLIC_REOWN_PROJECT_ID — wallet features disabled')
}

// Roadmap chains — all available in the modal; purchases only on enabled ones.
const networks = [base, mainnet] as [typeof base, typeof mainnet]

// WagmiAdapter builds the full connector set (injected, walletConnect, coinbase…)
// and its wagmiConfig is the canonical one to hand to WagmiProvider.
const adapter = new WagmiAdapter({
  networks,
  projectId: reownProjectId,
  ssr: true,
})

export const wagmiConfig = adapter.wagmiConfig
export const wagmiAdapter = adapter

// Chain id ↔ wagmi chain map for the registry in lib/token.ts
export const wagmiChainById: Record<number, (typeof networks)[number]> = {
  [base.id]: base,
  [mainnet.id]: mainnet,
}

let appKit: AppKit | null = null

export function getAppKit(): AppKit | null {
  if (typeof window === 'undefined') return null
  if (!reownProjectId) return null
  if (!appKit) {
    appKit = createAppKit({
      adapters: [adapter],
      networks,
      projectId: reownProjectId,
      metadata: {
        name: 'Illuminati.earth',
        description: 'Mystical platform — sigils, readings, and the occult archive',
        url:
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://illuminati.co',
        icons: ['https://illuminati.co/icon.png'],
      },
      features: {
        analytics: false,
        swaps: true, // AppKit's built-in swap — used by /credits
      },
      themeMode: 'dark',
    })
  }
  return appKit
}

export { base, mainnet }
