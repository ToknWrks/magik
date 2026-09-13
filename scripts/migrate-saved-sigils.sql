-- Saved sigils: user's kept sigils, images stored in Vercel Blob.
-- Release ("Let It Go") deletes the row + blob — gone forever.
CREATE TABLE IF NOT EXISTS saved_sigils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  intention TEXT NOT NULL,
  consonants TEXT NOT NULL DEFAULT '',
  base_form TEXT NOT NULL DEFAULT '',
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_sigils_user ON saved_sigils (user_id, created_at DESC);
