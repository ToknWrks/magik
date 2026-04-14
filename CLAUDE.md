# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # dev server (localhost:3000)
pnpm build      # production build
pnpm start      # production server
pnpm lint       # ESLint
```

No test suite. Package manager: **pnpm 9.13.2**.

## Project

**Illuminati.earth** — mystical/spiritual platform. Next.js 16 App Router, TypeScript, Tailwind, Neon PostgreSQL.

Core features: astrology readings, spiritual coaching (voice via Hume EVI), conspiracy discussions, sigil creation, e-commerce (Printful), ecological footprint tracking (Regen Network).

## Architecture

### Route Groups

| Group | Purpose |
|-------|---------|
| `app/(default)` | Main authenticated app — sidebar + header layout |
| `app/(auth)` | Login/signup |
| `app/(onboarding)` | New user flow |
| `app/(pay)` | Checkout/payment flows |
| `app/landing` | Public pages |
| `app/api` | ~71 API route handlers |

Root `app/page.tsx` redirects to `/real` (main dashboard).

### Key Directories

- `app/api/` — all API routes; business logic lives here (payments, AI calls, DB writes)
- `lib/db.ts` — Neon PostgreSQL pool, all user/session/reading queries (~20KB, single file)
- `lib/regen-footprint.ts` — tracks CO₂ cost of Claude API calls, feeds Regen Network credit retirement
- `lib/auth.ts` — JWT + session logic
- `components/` — reusable UI; feature-specific components (e.g. `SpiritVoices.tsx`, `ChakraToner.tsx`)
- `context/` — cart, selected-items, flyout (React Context)
- `hooks/` — `useCredits`, `useAutoLinks`, `useLanguage`

### Providers (app/layout.tsx wraps all)

`ThemeProvider` (next-themes) → `AppProvider` → `CartProvider` → Google Analytics

Default layout adds: sidebar nav + header with user menu.

### AI Integrations

- **Claude (Anthropic SDK)** — astrology interpretations, conspiracy content (`lib/ai-service.ts`), coaching
- **Hume EVI** — voice AI for spirit-voices and coaching sessions (`lib/tts.ts`)
- **XAI Grok** — additional AI content

### Payments

Stripe + PayPal. Webhooks handled in `app/api/stripe/` and `app/api/paypal/`.

### Ecological Fee System

Each reading/session charges ~$0.25 to fund Regen Network ecocredit retirement. Logic in `lib/regen-footprint.ts` and the session resume flow. See project memory for details.

### Cron Jobs

`vercel.json` schedules `/api/post-quote` daily at 09:00 UTC.

### Styling

Tailwind with monochromatic gray palette + yellow accents. Custom `sidebar-expanded` variant in `tailwind.config.js`. Dark mode via `next-themes`.

### Path Aliases

`@/*` maps to repo root (set in `tsconfig.json`).
