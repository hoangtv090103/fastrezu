-- Migration: Add 'ats_analysis' to cv_sections section_type check constraint
-- Date: 2025-11-02
-- Description: Allows storing ATS analysis data in cv_sections table

-- Drop the existing check constraint
ALTER TABLE cv_sections 
DROP CONSTRAINT IF EXISTS cv_sections_section_type_check;

-- Add the new check constraint with 'ats_analysis' included
ALTER TABLE cv_sections 
ADD CONSTRAINT cv_sections_section_type_check 
CHECK (section_type IN ('personal_info', 'summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'ats_analysis'));

-- Add comment for documentation
COMMENT ON CONSTRAINT cv_sections_section_type_check ON cv_sections IS 'Validates section_type values including ats_analysis for ATS scoring data';
