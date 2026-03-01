-- ============================================================================
-- AI Rate Limiting Migration
-- ============================================================================
-- 1. Rename subscription tiers to new structure (free / sprint_pass / pro_pass / beta_free)
-- 2. Create admin-configurable rate limit config table
-- 3. Create AI usage log table for daily counting
--
-- Run this migration ONCE against your Supabase project.
-- ============================================================================

-- ── 1. Migrate subscription_tier to new tier names ──────────────────────────

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE user_profiles
ALTER COLUMN subscription_tier
SET DEFAULT 'free',
ADD CONSTRAINT user_profiles_subscription_tier_check CHECK (
    subscription_tier IN (
        'free',
        'sprint_pass',
        'pro_pass',
        'beta_free'
    )
);

UPDATE user_profiles
SET
    subscription_tier = 'pro_pass'
WHERE
    subscription_tier IN ('premium', 'enterprise');

-- ── 2. Admin-configurable rate limit config ────────────────────────────────
-- feature = 'default' applies to all features unless overridden by a specific feature row.
-- daily_limit = -1 means unlimited (no rate check performed).
-- Admin can UPDATE rows here to tune limits without redeploying code.

CREATE TABLE IF NOT EXISTS ai_rate_limit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    tier TEXT NOT NULL,
    feature TEXT NOT NULL DEFAULT 'default',
    daily_limit INTEGER NOT NULL DEFAULT 10, -- -1 = unlimited
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tier, feature)
);

-- Seed default values
INSERT INTO
    ai_rate_limit_config (tier, feature, daily_limit)
VALUES ('free', 'default', 10),
    ('sprint_pass', 'default', -1),
    ('pro_pass', 'default', -1),
    ('beta_free', 'default', -1)
ON CONFLICT (tier, feature) DO NOTHING;

-- ── 3. AI usage log (rolling 24h counter for free tier) ─────────────────────

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs (user_id, created_at DESC);

-- ── 4. RLS policies ──────────────────────────────────────────────────────────

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE ai_rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Users can read and insert their own usage logs
CREATE POLICY "users_read_own_ai_usage" ON ai_usage_logs FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "users_insert_own_ai_usage" ON ai_usage_logs FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Rate limit config is read-only for authenticated users (admin writes via service role / Supabase dashboard)
CREATE POLICY "authenticated_read_rate_config" ON ai_rate_limit_config FOR
SELECT TO authenticated USING (true);