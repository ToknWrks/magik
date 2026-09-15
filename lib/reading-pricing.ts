// lib/reading-pricing.ts
// Single source of truth for reading pricing across payment methods.
// Server routes enforce these; client UI displays them. Keep in sync.

export const READING_CARD_USD = 12; // Stripe card total (eco contribution included)
export const READING_CRYPTO_USD = 10; // USDC on Base, direct to treasury
export const READING_TOKENS = 250; // token balance deduct ($1 = 100 tokens)

export const FULL_INITIATION_CARD_USD = 23; // card total (existing)
export const FULL_INITIATION_TOKENS = 250;
