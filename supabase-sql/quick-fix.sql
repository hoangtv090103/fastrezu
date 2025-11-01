-- ============================================================================
-- QUICK FIX: Add Missing Tables
-- Run this if you only need to add ats_suggestions and applied_suggestions
-- ============================================================================

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
  suggested_content JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_applied BOOLEAN DEFAULT false NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cv_id, suggestion_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ats_suggestions_cv_id ON ats_suggestions(cv_id);
CREATE INDEX IF NOT EXISTS idx_ats_suggestions_is_active ON ats_suggestions(cv_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ats_suggestions_is_applied ON ats_suggestions(cv_id, is_applied, is_active);
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_cv_id ON applied_suggestions(cv_id);
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_applied_at ON applied_suggestions(applied_at);
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_is_active ON applied_suggestions(cv_id, is_active);
CREATE INDEX IF NOT EXISTS idx_applied_suggestions_is_applied ON applied_suggestions(cv_id, is_applied, is_active);

-- Enable RLS
ALTER TABLE ats_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_suggestions
CREATE POLICY "Users can view own suggestions" ON ats_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own suggestions" ON ats_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own suggestions" ON ats_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = ats_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- RLS Policies for applied_suggestions
CREATE POLICY "Users can view own applied suggestions" ON applied_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = applied_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own applied suggestions" ON applied_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = applied_suggestions.cv_id 
      AND cvs.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ats_suggestions TO authenticated;
GRANT ALL ON ats_suggestions TO service_role;
GRANT SELECT, INSERT ON applied_suggestions TO authenticated;
GRANT ALL ON applied_suggestions TO service_role;

-- Verify tables created
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ats_suggestions', 'applied_suggestions');
