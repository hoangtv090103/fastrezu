-- ============================================================================
-- EPIC 8 — Soft Delete Migration
-- Adds: active BOOLEAN, deleted_at TIMESTAMPTZ, deleted_by UUID
-- to all user data tables.
-- active = true  → record is alive
-- active = false → record is soft-deleted / account suspended
-- ============================================================================

-- ── user_profiles ───────────────────────────────────────────────────────────
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles (active);

-- ── master_profiles ──────────────────────────────────────────────────────────
ALTER TABLE master_profiles
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_master_profiles_active ON master_profiles (active);

-- ── jobs ─────────────────────────────────────────────────────────────────────
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs (active);

-- ── job_analyses ──────────────────────────────────────────────────────────────
ALTER TABLE job_analyses
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_analyses_active ON job_analyses (active);

-- ── resumes ───────────────────────────────────────────────────────────────────
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes (active);

-- ── cv_scan_history ───────────────────────────────────────────────────────────
ALTER TABLE cv_scan_history
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cv_scan_history_active ON cv_scan_history (active);

-- ── RLS: add active = true filter to existing SELECT policies ────────────────
-- Apply the active filter to SELECT policies for all tables supporting soft-delete.

-- 1. user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR
SELECT USING (
        auth.uid () = id
        AND active = true
    );

-- 2. master_profiles
DROP POLICY IF EXISTS "Users can view own master_profiles" ON master_profiles;

DROP POLICY IF EXISTS "Users can view own master profile" ON master_profiles;

CREATE POLICY "Users can view own master_profiles" ON master_profiles FOR
SELECT USING (
        auth.uid () = user_id
        AND active = true
    );

-- 3. jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;

DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;

CREATE POLICY "Users can view own jobs" ON jobs FOR
SELECT USING (
        auth.uid () = user_id
        AND active = true
    );

-- 4. job_analyses
DROP POLICY IF EXISTS "Users can view own JD analyses" ON job_analyses;

DROP POLICY IF EXISTS "Users can view own job_analyses" ON job_analyses;

CREATE POLICY "Users can view own JD analyses" ON job_analyses FOR
SELECT USING (
        auth.uid () = user_id
        AND active = true
    );

-- 5. resumes
DROP POLICY IF EXISTS "Users can manage own resumes" ON resumes;

CREATE POLICY "Users can manage own resumes" ON resumes FOR
SELECT USING (
        auth.uid () = user_id
        AND active = true
    );

-- 6. cv_scan_history
DROP POLICY IF EXISTS "Users can manage own scan history" ON cv_scan_history;

CREATE POLICY "Users can manage own scan history" ON cv_scan_history FOR
SELECT USING (
        auth.uid () = user_id
        AND active = true
    );