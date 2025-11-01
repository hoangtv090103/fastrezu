-- Migration: Add ats_suggestions table
-- Description: Store ATS suggestions generated from scoring, separate from applied suggestions
-- Date: 2025-10-29

-- Create ats_suggestions table
CREATE TABLE IF NOT EXISTS ats_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  suggestion_id VARCHAR(100) NOT NULL,
  suggestion_text TEXT NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  target_section VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_applied BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(cv_id, suggestion_id)
);

-- Create indexes for performance
CREATE INDEX idx_ats_suggestions_cv_id ON ats_suggestions(cv_id);
CREATE INDEX idx_ats_suggestions_is_active ON ats_suggestions(cv_id, is_active);
CREATE INDEX idx_ats_suggestions_is_applied ON ats_suggestions(cv_id, is_applied, is_active);

-- Add comments for documentation
COMMENT ON TABLE ats_suggestions IS 'Stores ATS optimization suggestions generated from CV scoring';
COMMENT ON COLUMN ats_suggestions.cv_id IS 'Reference to the CV';
COMMENT ON COLUMN ats_suggestions.suggestion_id IS 'Unique identifier for the suggestion (e.g., suggestion-0, suggestion-1)';
COMMENT ON COLUMN ats_suggestions.suggestion_text IS 'The suggestion text displayed to user';
COMMENT ON COLUMN ats_suggestions.suggestion_type IS 'Type of suggestion (e.g., add_keyword, improve_bullet)';
COMMENT ON COLUMN ats_suggestions.target_section IS 'CV section where suggestion should be applied';
COMMENT ON COLUMN ats_suggestions.priority IS 'Priority level: high, medium, or low';
COMMENT ON COLUMN ats_suggestions.is_active IS 'Whether this suggestion is from the latest scoring (true) or superseded (false)';
COMMENT ON COLUMN ats_suggestions.is_applied IS 'Whether this suggestion has been applied to the CV';
COMMENT ON COLUMN ats_suggestions.applied_at IS 'Timestamp when suggestion was applied';

-- Enable Row Level Security
ALTER TABLE ats_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" ON ats_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own suggestions
CREATE POLICY "Users can insert own suggestions" ON ats_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own suggestions
CREATE POLICY "Users can update own suggestions" ON ats_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON ats_suggestions TO authenticated;

-- Grant all permissions to service_role for admin operations
GRANT ALL ON ats_suggestions TO service_role;
