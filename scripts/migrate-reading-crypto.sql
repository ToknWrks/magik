-- reading_crypto_payments: one row per verified USDC payment for a reading.
-- The reading APIs check a row exists (and is unclaimed) before generating.
CREATE TABLE IF NOT EXISTS reading_crypto_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  chain_id INT NOT NULL,
  amount_usdc NUMERIC NOT NULL,
  reading_type TEXT NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rcp_user ON reading_crypto_payments(user_id);
