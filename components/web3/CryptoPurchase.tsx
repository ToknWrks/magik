'use client'

// components/web3/CryptoPurchase.tsx
// Pay-with-crypto panel for /credits.
// Flow: pick a package → transfer USDC to treasury from the connected wallet
// (direct ERC-20 transfer — no router needed for a stablecoin rail) → paste/
// auto-capture tx hash → POST /api/credits/verify-crypto → credits land.

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi } from 'viem'
import { base } from 'viem/chains'
import { getAppKit } from '@/lib/web3'
import { PURCHASE_CHAINS, getPurchaseToken } from '@/lib/token'

const PACKAGES = [
  { id: 'single', credits: 100, usd: 5 },
  { id: 'standard', credits: 300, usd: 12 },
  { id: 'premium', credits: 600, usd: 20 },
]

// Credits per USDC — must match CREDITS_PER_USDC in verify-crypto route
const CREDITS_PER_USDC = 100

export default function CryptoPurchase({
  onSuccess,
}: {
  onSuccess: (newBalance: number) => void
}) {
  const { address, chainId, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [pkgId, setPkgId] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const rail = PURCHASE_CHAINS[0] // Base
  const token = getPurchaseToken(rail.id)

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: rail.id,
  })

  async function pay(pkgId: string) {
    setError('')
    setTxHash(null)
    setStatus('')
    const pkg = PACKAGES.find((p) => p.id === pkgId)!
    setPkgId(pkg.id)

    if (!isConnected || !address) {
      getAppKit()?.open()
      return
    }
    if (!token) {
      setError('Purchase rail unavailable')
      return
    }

    try {
      setStatus('Confirm in your wallet…')
      const rawAmount = BigInt(Math.round(pkg.usd * 10 ** token.decimals))
      const hash = await writeContractAsync({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`, rawAmount],
        chainId: rail.id,
      })
      setTxHash(hash)
      setStatus('Transaction submitted — waiting for confirmations…')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction rejected')
      setPkgId(null)
    }
  }

  // When the receipt lands, verify server-side
  async function verify(hash: `0x${string}`) {
    setVerifying(true)
    try {
      const res = await fetch('/api/credits/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash, chainId: rail.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed')
      }
      setStatus(`✓ ${data.creditsAdded} credits added`)
      setPkgId(null)
      setTxHash(null)
      onSuccess(data.balance)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  // Trigger verification once receipt confirms
  if (receipt?.status === 'success' && txHash && !verifying && status.includes('waiting')) {
    verify(txHash)
  }

  if (!token) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Crypto purchases are coming soon.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Pay with {token.symbol} on {rail.name} — credits appear automatically after
        the transaction confirms.
      </div>

      {!address && (
        <button
          onClick={() => getAppKit()?.open()}
          className="w-full py-2.5 rounded-md bg-gray-900 dark:bg-yellow-500 dark:text-gray-900 text-white text-sm font-medium hover:opacity-90 transition"
        >
          Connect Wallet
        </button>
      )}

      <div className="grid gap-3">
        {PACKAGES.map((pkg) => {
          const raw = BigInt(Math.round(pkg.usd * 10 ** token.decimals))
          return (
            <button
              key={pkg.id}
              onClick={() => pay(pkg.id)}
              disabled={!!pkgId && pkgId !== pkg.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border text-left transition ${
                pkgId === pkg.id
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600'
              } disabled:opacity-50`}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {pkg.credits.toLocaleString()} credits
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {pkg.usd} {token.symbol}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {pkgId === pkg.id ? (txHash ? '⏳' : '→') : 'Buy'}
              </div>
            </button>
          )
        })}
      </div>

      {status && (
        <div className="text-sm text-yellow-700 dark:text-yellow-400">{status}</div>
      )}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  )
}

// viem wants the raw bigint; per-package amounts are computed inline in pay()
