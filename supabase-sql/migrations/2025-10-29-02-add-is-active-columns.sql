-- Migration: Add is_active and is_applied columns to applied_suggestions table
-- Description: Track whether a suggestion is still active or has been superseded, and whether it has been applied
-- Date: 2025-10-29

-- Add is_active column
ALTER TABLE applied_suggestions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add is_applied column
ALTER TABLE applied_suggestions
ADD COLUMN IF NOT EXISTS is_applied BOOLEAN DEFAULT false NOT NULL;

-- Create index for performance when filtering active suggestions
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_is_active ON applied_suggestions (cv_id, is_active);

-- Create index for performance when filtering applied suggestions
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_is_applied ON applied_suggestions (cv_id, is_applied, is_active);

-- Add comments for documentation
COMMENT ON COLUMN applied_suggestions.is_active IS 'Whether this suggestion is still active (true) or has been superseded by a new scoring (false)';

COMMENT ON COLUMN applied_suggestions.is_applied IS 'Whether this suggestion has been applied to the CV (true) or is still pending (false)';