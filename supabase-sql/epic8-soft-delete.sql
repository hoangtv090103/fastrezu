-- ============================================================================
-- EPIC 8 — Soft Delete Migration
-- Adds: active BOOLEAN, deleted_at TIMESTAMPTZ, deleted_by UUID
-- to all user data tables.
-- active = true  → record is alive
-- active = false → record is soft-deleted / account suspended
-- ============================================================================

-- ── user_profiles ───────────────────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles (active);

-- ── master_profiles ──────────────────────────────────────────────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_master_profiles_active ON master_profiles (active);

-- ── jobs ─────────────────────────────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs (active);

-- ── job_analyses ──────────────────────────────────────────────────────────────
ALTER TABLE job_analyses
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_analyses_active ON job_analyses (active);

-- ── resumes ───────────────────────────────────────────────────────────────────
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes (active);

-- ── cv_scan_history ───────────────────────────────────────────────────────────
ALTER TABLE cv_scan_history
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cv_scan_history_active ON cv_scan_history (active);

-- ── RLS: add active = true filter to existing SELECT policies ────────────────
-- NOTE: Drop and recreate existing SELECT policies to add the active filter.
-- Adjust policy names to match what exists in your Supabase project.
-- You can check exact policy names in: Supabase Dashboard → Authentication → Policies

-- Example pattern (repeat for each table):
-- DROP POLICY IF EXISTS "users_select_own_jobs" ON jobs;
-- CREATE POLICY "users_select_own_jobs" ON jobs
--   FOR SELECT USING (auth.uid() = user_id AND active = true);
--
-- Run: SELECT policyname, tablename FROM pg_policies WHERE schemaname='public';
-- to see all existing policy names before dropping.
