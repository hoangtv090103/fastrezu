-- Migration: Update ats_suggestions table to support structured suggestions
-- Description: Add original_content, applied_content, keyword, and target_index columns
-- Date: 2025-10-29

-- Add missing columns to ats_suggestions table
ALTER TABLE ats_suggestions 
ADD COLUMN IF NOT EXISTS keyword VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_index INTEGER,
ADD COLUMN IF NOT EXISTS original_content JSONB,
ADD COLUMN IF NOT EXISTS applied_content JSONB;

-- Add comment for documentation
COMMENT ON COLUMN ats_suggestions.keyword IS 'The keyword that this suggestion is targeting';
COMMENT ON COLUMN ats_suggestions.target_index IS 'The index within the target section where the suggestion should be applied';
COMMENT ON COLUMN ats_suggestions.original_content IS 'The original content before applying the suggestion';
COMMENT ON COLUMN ats_suggestions.applied_content IS 'The content after applying the suggestion';

