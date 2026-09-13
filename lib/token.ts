// lib/token.ts
// Single source of truth for the crypto purchase rail.
// Swap the env vars when the app's own token launches — no code changes.
// All three roadmap chains are declared; only ones with `enabled: true`
// appear in the purchase UI. Sign-in works on every chain regardless.

export interface ChainConfig {
  id: number
  name: string
  /** USDC contract on this chain (purchase placeholder / stable rail) */
  usdcAddress: string
  /** The app's own token on this chain — set at launch, null until then */
  tokenAddress: string | null
  /** Purchase rail live for this chain (requires liquidity + verification RPC) */
  enabled: boolean
}

const BASE_MAINNET = 8453
const ETHEREUM_MAINNET = 1
// Robinhood Chain — Arbitrum Orbit L2, chainId 4663
const ROBINHOOD_MAINNET = 4663

export const CHAINS: Record<number, ChainConfig> = {
  [BASE_MAINNET]: {
    id: BASE_MAINNET,
    name: 'Base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // canonical USDC on Base
    tokenAddress: null,
    enabled: true, // only enabled purchase rail at launch
  },
  [ETHEREUM_MAINNET]: {
    id: ETHEREUM_MAINNET,
    name: 'Ethereum',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenAddress: null,
    enabled: false, // enable when OFT representation + pool are live
  },
  [ROBINHOOD_MAINNET]: {
    id: ROBINHOOD_MAINNET,
    name: 'Robinhood Chain',
    usdcAddress: '', // no canonical USDC yet — USDG is the dollar token there
    tokenAddress: null,
    enabled: false, // enable when LayerZero endpoint + pool exist
  },
}

/** Chains shown in the wallet modal / sign-in (all roadmap chains). */
export const SIGNIN_CHAINS = Object.values(CHAINS)

/** Chains with a live purchase rail. */
export const PURCHASE_CHAINS = Object.values(CHAINS).filter((c) => c.enabled)

/**
 * The token users buy credits with on a given chain.
 * Phase 1: USDC on Base. At token launch: set NEXT_PUBLIC_TOKEN_ADDRESS_<CHAIN>
 * and flip `tokenAddress` — the UI and verification route pick it up automatically.
 */
export function getPurchaseToken(chainId: number): {
  address: string
  symbol: string
  decimals: number
} | null {
  const chain = CHAINS[chainId]
  if (!chain || !chain.enabled) return null

  // App token takes precedence once deployed; env override wins for rollout
  // flexibility (e.g. pointing Preview at a test token).
  const envToken = process.env.NEXT_PUBLIC_TOKEN_ADDRESS
  const address = envToken || chain.tokenAddress || chain.usdcAddress
  if (!address) return null

  return {
    address,
    symbol: envToken
      ? process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'TOKEN'
      : chain.tokenAddress
        ? process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'MAGIK'
        : 'USDC',
    decimals: 6, // USDC on Base is 6 decimals; re-read from the contract at launch
  }
}

/** The treasury wallet that receives purchased tokens.
 *  Public info (a receiving address, not a secret), so one NEXT_PUBLIC_ var
 *  serves both the client UI and server-side verification. */
export function getTreasuryAddress(): string | null {
  return process.env.NEXT_PUBLIC_TREASURY_ADDRESS || null
}
