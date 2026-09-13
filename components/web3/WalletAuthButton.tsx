'use client'

// components/web3/WalletAuthButton.tsx
// Connect + SIWE sign-in. Posts the signed message to /api/auth/wallet,
// which sets the same httpOnly session cookies as email login.
// On success: router.refresh() so server components pick up the session.

import { useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { useSignMessage, useSwitchChain } from 'wagmi'
import { SiweMessage } from 'siwe'
import { base } from 'viem/chains'
import { reownProjectId } from '@/lib/web3'

export default function WalletAuthButton({
  label = 'Sign in with Wallet',
  className = '',
  linkEmail,
}: {
  label?: string
  className?: string
  /** Pass an email to link a wallet to an existing account ("link:<email>" statement). */
  linkEmail?: string
}) {
  const { open } = useAppKit()
  const { address } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync } = useSwitchChain()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setError('')
    if (!reownProjectId) {
      setError('Wallet login is not configured in this environment.')
      return
    }
    setBusy(true)
    try {
      if (!address) {
        open() // opens AppKit modal → user connects first
        setBusy(false)
        return
      }

      // Ensure we're on a supported chain (Base by default)
      let activeChain = chainId
      if (!activeChain || ![8453, 1].includes(Number(activeChain))) {
        activeChain = await switchChainAsync({ chainId: base.id }).then(() => base.id)
      }

      const nonce = crypto.randomUUID().replace(/-/g, '')
      const siwe = new SiweMessage({
        domain: window.location.host,
        address,
        statement: linkEmail ? `link:${linkEmail}` : 'Sign in to Illuminati.earth',
        uri: window.location.origin,
        version: '1',
        chainId: Number(activeChain),
        nonce,
      })
      const message = siwe.prepareMessage()
      const signature = await signMessageAsync({ message })

      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, chainId: activeChain }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sign-in failed')
      }

      // Session cookies are set (path=/) — hard-navigate so every
      // server component / client fetch picks up the new session.
      const params = new URLSearchParams(window.location.search)
      const next = params.get('redirect') || '/sigil-creator'
      window.location.href = next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <button
        onClick={signIn}
        disabled={busy}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition ${className ? '' : ''}`}
      >
        {busy ? 'Signing…' : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
