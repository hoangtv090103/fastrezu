-- ============================================================================
-- RLS Performance Migration
--
-- Description:
-- This migration script updates Row Level Security (RLS) policies to improve
-- query performance by addressing two issues identified by the Supabase linter:
--
-- 1. `auth_rls_initplan`: Wraps all `auth.uid()` calls in `(select auth.uid())`
--    to prevent the function from being re-evaluated for each row, making
--    queries significantly more efficient.
--
-- 2. `multiple_permissive_policies`: Consolidates multiple SELECT policies on
--    the `feedback` table into a single, more efficient policy.
--
-- Date: 2025-11-16
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: user_profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT
WITH
    CHECK ((select auth.uid()) = id);

-- ============================================================================
-- Table: cvs
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
CREATE POLICY "Users can view own CVs" ON public.cvs FOR
SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own CVs" ON public.cvs;
CREATE POLICY "Users can create own CVs" ON public.cvs FOR INSERT
WITH
    CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own CVs" ON public.cvs;
CREATE POLICY "Users can update own CVs" ON public.cvs
FOR UPDATE
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own CVs" ON public.cvs;
CREATE POLICY "Users can delete own CVs" ON public.cvs FOR DELETE USING ((select auth.uid()) = user_id);


-- ============================================================================
-- Table: cv_sections
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own CV sections" ON public.cv_sections;
CREATE POLICY "Users can view own CV sections" ON public.cv_sections FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = cv_sections.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own CV sections" ON public.cv_sections;
CREATE POLICY "Users can create own CV sections" ON public.cv_sections FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = cv_sections.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own CV sections" ON public.cv_sections;
CREATE POLICY "Users can update own CV sections" ON public.cv_sections
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = cv_sections.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own CV sections" ON public.cv_sections;
CREATE POLICY "Users can delete own CV sections" ON public.cv_sections FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.cvs
        WHERE
            cvs.id = cv_sections.cv_id
            AND cvs.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- Table: jd_analyses
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own JD analyses" ON public.jd_analyses;
CREATE POLICY "Users can view own JD analyses" ON public.jd_analyses FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = jd_analyses.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own JD analyses" ON public.jd_analyses;
CREATE POLICY "Users can create own JD analyses" ON public.jd_analyses FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = jd_analyses.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own JD analyses" ON public.jd_analyses;
CREATE POLICY "Users can update own JD analyses" ON public.jd_analyses
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = jd_analyses.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own JD analyses" ON public.jd_analyses;
CREATE POLICY "Users can delete own JD analyses" ON public.jd_analyses FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.cvs
        WHERE
            cvs.id = jd_analyses.cv_id
            AND cvs.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- Table: ats_suggestions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.ats_suggestions;
CREATE POLICY "Users can view own suggestions" ON public.ats_suggestions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = ats_suggestions.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert own suggestions" ON public.ats_suggestions;
CREATE POLICY "Users can insert own suggestions" ON public.ats_suggestions FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = ats_suggestions.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own suggestions" ON public.ats_suggestions;
CREATE POLICY "Users can update own suggestions" ON public.ats_suggestions
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.cvs
            WHERE
                cvs.id = ats_suggestions.cv_id
                AND cvs.user_id = (select auth.uid())
        )
    );

-- ============================================================================
-- Table: feedback
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Anon users can view feedback" ON public.feedback;

CREATE POLICY "Users can view own and anonymous feedback" ON public.feedback FOR
SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT
WITH
    CHECK (user_id IS NULL OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback" ON public.feedback
FOR UPDATE
    USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Table: feedback_attachments
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own feedback attachments" ON public.feedback_attachments;
CREATE POLICY "Users can view own feedback attachments" ON public.feedback_attachments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.feedback
            WHERE
                feedback.id = feedback_attachments.feedback_id
                AND (
                    feedback.user_id = (select auth.uid())
                    OR feedback.user_id IS NULL
                )
        )
    );

DROP POLICY IF EXISTS "Users can create feedback attachments" ON public.feedback_attachments;
CREATE POLICY "Users can create feedback attachments" ON public.feedback_attachments FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.feedback
            WHERE
                feedback.id = feedback_attachments.feedback_id
                AND (
                    feedback.user_id = (select auth.uid())
                    OR feedback.user_id IS NULL
                )
        )
    );

DROP POLICY IF EXISTS "Users can delete own feedback attachments" ON public.feedback_attachments;
CREATE POLICY "Users can delete own feedback attachments" ON public.feedback_attachments FOR DELETE USING (uploaded_by = (select auth.uid()));

COMMIT;
