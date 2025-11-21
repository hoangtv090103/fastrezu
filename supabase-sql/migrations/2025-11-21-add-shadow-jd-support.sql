-- Migration: Add Shadow JD support to jd_analyses table
-- Date: 2025-11-21
-- Description: Adds mode, shadow_job_title, and shadow_level columns to support Generic Mode (Shadow JD)

-- Add mode column to distinguish between real JD and shadow JD
ALTER TABLE jd_analyses
ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'real' CHECK (mode IN ('real', 'shadow'));

-- Add columns for shadow JD metadata
ALTER TABLE jd_analyses
ADD COLUMN IF NOT EXISTS shadow_job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS shadow_level VARCHAR(50);

-- Create index for faster queries by mode
CREATE INDEX IF NOT EXISTS idx_jd_analyses_mode ON jd_analyses (mode);

-- Add comment to explain the new columns
COMMENT ON COLUMN jd_analyses.mode IS 'Type of JD: real (user-provided JD) or shadow (AI-generated competency framework)';

COMMENT ON COLUMN jd_analyses.shadow_job_title IS 'Job title for shadow JD (Generic Mode)';

COMMENT ON COLUMN jd_analyses.shadow_level IS 'Experience level for shadow JD (intern, fresher, junior, midLevel, senior, manager)';

-- Update existing records to have mode='real' (backward compatibility)
UPDATE jd_analyses SET mode = 'real' WHERE mode IS NULL;