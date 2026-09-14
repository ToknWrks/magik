# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # dev server (localhost:3000)
pnpm build      # production build
pnpm start      # production server
pnpm lint       # ESLint
```

No test suite. Package manager: **pnpm 9.13.2**. Turbopack build requires `@x402/*` peer deps (see `package.json` `pnpm.overrides`).

**Git workflow:** Always commit completed work with a descriptive message — but never push; the user pushes.

## Project

**Illuminati** — mystical/spiritual platform. Next.js 16 App Router, TypeScript, Tailwind, Neon PostgreSQL. Now at **illuminati.co** (code still references `illuminati.co` in `app/sitemap.ts`, `lib/web3.ts` AppKit metadata, and various content pages — pending rename).

Core features: **sigil creator** (now the home/nav centerpiece), astrology readings, spiritual coaching (voice via Hume EVI), conspiracy discussions, e-commerce (Printful), ecological footprint tracking (Regen Network), and **Web3 wallet auth + crypto credit purchases**.

## Architecture

### Route Groups

| Group | Purpose |
|-------|---------|
| `app/(default)` | Main authenticated app — sidebar + header layout |
| `app/(auth)` | Sign-in (inline signup, skips onboarding) / signup / reset-password |
| `app/(onboarding)` | New user flow |
| `app/(pay)` | Checkout/payment flows |
| `app/landing` | Public pages |
| `app/api` | ~75 API route handlers |

### Key Directories

- `app/api/` — all API routes; business logic lives here (payments, AI calls, DB writes)
- `app/api/sigil/` — `generate` (xAI image gen), `save`, `list` (Vercel Blob + `saved_sigils` table)
- `app/api/auth/wallet/` — SIWE wallet login: verifies signature with viem, upserts user keyed by `wallet_address`, same session shape as email login
- `app/api/credits/verify-crypto/` — verifies on-chain USDC transfer → treasury (12 confirmations on Base), idempotent credit via `tx_hash` unique; 100 credits per USDC
- `lib/db.ts` — Neon PostgreSQL pool, all user/session/reading queries (~20KB, single file)
- `lib/web3.ts` — Reown AppKit + wagmi setup (client-side singleton), chains: Base + Ethereum mainnet
- `lib/token.ts` — chain registry for the crypto purchase rail: Base (enabled, canonical USDC), Ethereum + Robinhood Chain (disabled until pools live). Swap env vars at app-token launch
- `lib/regen-footprint.ts` — tracks CO₂ cost of Claude API calls, feeds Regen Network credit retirement
- `lib/auth.ts` — JWT + session logic
- `components/` — reusable UI; `components/sigil/SigilModal.tsx` (sigil viewer, shared by creator + gallery)
- `context/` — cart, selected-items, flyout (React Context)
- `hooks/` — `useCredits`, `useAutoLinks`, `useLanguage`
- `scripts/` — DB migrations (`migrate-saved-sigils.js/.sql`, `check-schema.js`)

### Web3 (added 2026-09)

- **Sign-in with Ethereum (SIWE)** via `@reown/appkit-siwe` — wallet users are first-class users (email optional). Wallet-only users on the credits page default to the crypto payment tab.
- **USDC-on-Base credit purchases**: client sends `txHash` → server verifies transfer to treasury on-chain → credits ledger (same ledger as Stripe).
- Requires `NEXT_PUBLIC_REOWN_PROJECT_ID` (Vercel + `.env.local`); features degrade gracefully (warn, no modal) if missing.

### AI Integrations

- **Claude (Anthropic SDK)** — astrology interpretations, conspiracy content (`lib/ai-service.ts`), coaching. Models upgraded from deprecated versions (2026-09).
- **xAI Grok** — sigil image generation (`app/api/sigil/generate`), additional AI content
- **Hume EVI** — voice AI for spirit-voices and coaching sessions (`lib/tts.ts`)

### Payments

Stripe + PayPal (traditional rail, `app/api/stripe/`, `app/api/payments/`) **plus crypto rail** (USDC via wallet, see Web3 above). Webhooks handled in `app/api/stripe/` and `app/api/paypal/`.

### Sigil Creator

Nav is organized around it — sigil is the home experience. Randomly varied base forms (pentagon/hexagon/triangle/circle/Sri Yantra/etc.). Phase 1 persistence: sigils re-hosted from expiring xAI URLs into Vercel Blob under `sigils/<userId>/`, rows in `saved_sigils`. Gallery at `/sigil-creator/collection`; release flow deletes blob + row permanently.

### Ecological Fee System

Each reading/session charges ~$0.25 to fund Regen Network ecocredit retirement. Logic in `lib/regen-footprint.ts` and the session resume flow. See project memory for details.

### Cron Jobs

`vercel.json` schedules:
- `/api/post-quote` daily at 09:00 UTC
- `/api/post-transit` daily at 12:00 UTC

### Styling

Tailwind with monochromatic gray palette + yellow accents. Custom `sidebar-expanded` variant in `tailwind.config.js`. Dark mode via `next-themes`. Sidebar: auth-aware nav (visitor links vs member sections); Cart/Checkout folded into Store dropdown.

### Path Aliases

`@/*` maps to repo root (set in `tsconfig.json`).
