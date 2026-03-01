-- ============================================================================
-- EPIC 8 — Soft Delete RLS Policies Update
-- Updates existing policies to include `active = true` filters
-- ============================================================================

-- ── user_profiles ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR
SELECT USING (
        auth.uid () = id
        AND active = true
    );

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE
    USING (
        auth.uid () = id
        AND active = true
    );

-- ── master_profiles ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their master profiles" ON master_profiles;

CREATE POLICY "Users can manage their master profiles" ON master_profiles FOR ALL USING (
    auth.uid () = user_id
    AND active = true
);

-- ── jobs ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their jobs" ON jobs;

CREATE POLICY "Users can manage their jobs" ON jobs FOR ALL USING (
    auth.uid () = user_id
    AND active = true
);

-- ── job_analyses ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage analyses for their jobs" ON job_analyses;

CREATE POLICY "Users can manage analyses for their jobs" ON job_analyses FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM jobs j
        WHERE
            j.id = job_analyses.job_id
            AND j.user_id = auth.uid ()
            AND j.active = true
    )
    AND active = true
);

-- ── resumes ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage resumes for their jobs" ON resumes;

CREATE POLICY "Users can manage resumes for their jobs" ON resumes FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM jobs j
        WHERE
            j.id = resumes.job_id
            AND j.user_id = auth.uid ()
            AND j.active = true
    )
    AND active = true
);

-- ── cv_scan_history ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own scan history" ON cv_scan_history;

CREATE POLICY "Users can manage own scan history" ON cv_scan_history FOR ALL USING (
    auth.uid () = user_id
    AND active = true
);