-- Migration: Add applied_suggestions table
-- Description: Track which CV suggestions have been applied by users
-- Date: 2025-10-29

-- Create applied_suggestions table
CREATE TABLE IF NOT EXISTS applied_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  suggestion_id VARCHAR(100) NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  keyword VARCHAR(255),
  target_section VARCHAR(50) NOT NULL,
  target_index INTEGER,
  original_content JSONB,
  applied_content JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cv_id, suggestion_id)
);

-- Create indexes for performance
CREATE INDEX idx_applied_suggestions_cv_id ON applied_suggestions(cv_id);
CREATE INDEX idx_applied_suggestions_applied_at ON applied_suggestions(applied_at);

-- Add comments for documentation
COMMENT ON TABLE applied_suggestions IS 'Tracks CV suggestions that have been applied by users';
COMMENT ON COLUMN applied_suggestions.cv_id IS 'Reference to the CV that the suggestion was applied to';
COMMENT ON COLUMN applied_suggestions.suggestion_id IS 'Unique identifier for the suggestion';
COMMENT ON COLUMN applied_suggestions.suggestion_type IS 'Type of suggestion (e.g., missing_keyword, improve_bullet)';
COMMENT ON COLUMN applied_suggestions.keyword IS 'The keyword or content that was suggested';
COMMENT ON COLUMN applied_suggestions.target_section IS 'CV section where suggestion was applied (e.g., skills, experience, summary)';
COMMENT ON COLUMN applied_suggestions.target_index IS 'Index within the section if applicable (e.g., which experience entry)';
COMMENT ON COLUMN applied_suggestions.original_content IS 'Original content before applying suggestion';
COMMENT ON COLUMN applied_suggestions.applied_content IS 'Content after applying suggestion';
COMMENT ON COLUMN applied_suggestions.applied_at IS 'Timestamp when suggestion was applied';

-- Enable Row Level Security
ALTER TABLE applied_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own applied suggestions
CREATE POLICY "Users can view own applied suggestions" ON applied_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = applied_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own applied suggestions
CREATE POLICY "Users can insert own applied suggestions" ON applied_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = applied_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON applied_suggestions TO authenticated;

-- Grant all permissions to service_role for admin operations
GRANT ALL ON applied_suggestions TO service_role;
