-- ── Migration 002: Add Stripe fields to claims ───────────────────────────────
-- Run this in the Supabase SQL Editor for project pcthfpqwdrfszwasxfei

ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS tier                   TEXT NOT NULL DEFAULT 'claimed';

-- Index for fast webhook lookups by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_claims_stripe_customer     ON claims (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_stripe_subscription ON claims (stripe_subscription_id);

-- Comment
COMMENT ON COLUMN claims.tier IS 'claimed | paid — tracks subscription status independently of WP';
COMMENT ON COLUMN claims.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN claims.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)';
