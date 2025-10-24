-- Migration: Add language field to cvs table for bilingual support
-- Run this in your Supabase SQL editor

-- Add language column to cvs table
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi' CHECK (language IN ('vi', 'en'));

-- Create index for language field for better query performance
CREATE INDEX IF NOT EXISTS idx_cvs_language ON cvs(language);

-- Update existing CVs to have Vietnamese as default language
UPDATE cvs SET language = 'vi' WHERE language IS NULL;

-- Make language field NOT NULL after setting defaults
ALTER TABLE cvs ALTER COLUMN language SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN cvs.language IS 'CV language: vi (Vietnamese) or en (English)';
