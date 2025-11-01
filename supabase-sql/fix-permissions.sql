-- ============================================================================
-- Fix Permissions for applied_suggestions and ats_suggestions
-- Run this if you get error 42501 (permission denied)
-- ============================================================================

-- Grant permissions for applied_suggestions
GRANT
SELECT,
INSERT
,
UPDATE ON applied_suggestions TO authenticated;

GRANT ALL ON applied_suggestions TO service_role;

-- Grant permissions for ats_suggestions
GRANT SELECT, INSERT , UPDATE ON ats_suggestions TO authenticated;

GRANT ALL ON ats_suggestions TO service_role;

-- Verify RLS is enabled
ALTER TABLE applied_suggestions ENABLE ROW LEVEL SECURITY;

ALTER TABLE ats_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own applied suggestions" ON applied_suggestions;

DROP POLICY IF EXISTS "Users can insert own applied suggestions" ON applied_suggestions;

DROP POLICY IF EXISTS "Users can update own applied suggestions" ON applied_suggestions;

DROP POLICY IF EXISTS "Users can view own suggestions" ON ats_suggestions;

DROP POLICY IF EXISTS "Users can insert own suggestions" ON ats_suggestions;

DROP POLICY IF EXISTS "Users can update own suggestions" ON ats_suggestions;

-- Recreate RLS policies for applied_suggestions
CREATE POLICY "Users can view own applied suggestions" ON applied_suggestions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM cvs
            WHERE
                cvs.id = applied_suggestions.cv_id
                AND cvs.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert own applied suggestions" ON applied_suggestions FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM cvs
            WHERE
                cvs.id = applied_suggestions.cv_id
                AND cvs.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update own applied suggestions" ON applied_suggestions FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM cvs
        WHERE
            cvs.id = applied_suggestions.cv_id
            AND cvs.user_id = auth.uid ()
    )
);

-- Recreate RLS policies for ats_suggestions
CREATE POLICY "Users can view own suggestions" ON ats_suggestions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM cvs
            WHERE
                cvs.id = ats_suggestions.cv_id
                AND cvs.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert own suggestions" ON ats_suggestions FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM cvs
            WHERE
                cvs.id = ats_suggestions.cv_id
                AND cvs.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update own suggestions" ON ats_suggestions FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM cvs
        WHERE
            cvs.id = ats_suggestions.cv_id
            AND cvs.user_id = auth.uid ()
    )
);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE
    tablename IN (
        'applied_suggestions',
        'ats_suggestions'
    )
ORDER BY tablename, policyname;

-- Verify permissions
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE
    table_name IN (
        'applied_suggestions',
        'ats_suggestions'
    )
    AND grantee IN (
        'authenticated',
        'service_role'
    )
ORDER BY
    table_name,
    grantee,
    privilege_type;

-- Success message
SELECT 'Permissions fixed successfully!' as status;