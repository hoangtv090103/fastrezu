-- Add language column to cvs table
-- Stores the language preference for the CV (vi or en)

ALTER TABLE cvs 
ADD COLUMN language VARCHAR(5) DEFAULT 'vi' CHECK (language IN ('vi', 'en'));

-- Add comment for documentation
COMMENT ON COLUMN cvs.language IS 'Language preference for the CV (vi for Vietnamese, en for English)';
