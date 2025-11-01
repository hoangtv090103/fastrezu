-- Migration: Add missing fields to ats_suggestions table
-- Description: Add keyword, target_index, original_content, and suggested_content fields
-- Date: 2025-10-30

-- Add missing columns to ats_suggestions table
ALTER TABLE ats_suggestions
ADD COLUMN IF NOT EXISTS keyword VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_index INTEGER,
ADD COLUMN IF NOT EXISTS original_content JSONB,
ADD COLUMN IF NOT EXISTS suggested_content JSONB;

-- Add comments for documentation
COMMENT ON COLUMN ats_suggestions.keyword IS 'Related keyword for the suggestion (if applicable)';
COMMENT ON COLUMN ats_suggestions.target_index IS 'Index of element in array section (0-based, null if not applicable)';
COMMENT ON COLUMN ats_suggestions.original_content IS 'Current content at the location to be changed (JSONB)';
COMMENT ON COLUMN ats_suggestions.suggested_content IS 'Content after applying the suggestion (JSONB)';
