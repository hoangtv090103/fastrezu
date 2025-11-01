-- ============================================================================
-- FastRezu Database Schema v1.0.0
-- Complete database schema including all tables, indexes, and policies
-- 6 core tables for CV management and ATS optimization
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLES
-- ============================================================================

-- User profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  subscription_tier VARCHAR(50) DEFAULT 'beta_free' CHECK (subscription_tier IN ('beta_free', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVs table
CREATE TABLE IF NOT EXISTS cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'My CV',
  is_active BOOLEAN DEFAULT true,
  ats_score INTEGER DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CV sections table (flexible JSONB structure)
CREATE TABLE IF NOT EXISTS cv_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('personal_info', 'summary', 'experience', 'education', 'projects', 'skills', 'certifications')),
  order_index INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cv_id, section_type)
);

-- JD analyses table
CREATE TABLE IF NOT EXISTS jd_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  jd_text TEXT NOT NULL,
  keywords_extracted TEXT[] DEFAULT '{}',
  analysis_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ats_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  suggestion_id VARCHAR(100) NOT NULL,
  suggestion_text TEXT NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  target_section VARCHAR(50) NOT NULL,
  target_index INTEGER,
  keyword VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  original_content JSONB,
  suggested_content JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_applied BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(cv_id, suggestion_id)
);


-- ============================================================================
-- INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- CVs indexes
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at);

-- CV sections indexes
CREATE INDEX IF NOT EXISTS idx_cv_sections_cv_id ON cv_sections(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_type ON cv_sections(section_type);

-- JD analyses indexes
CREATE INDEX IF NOT EXISTS idx_jd_analyses_cv_id ON jd_analyses(cv_id);

CREATE INDEX IF NOT EXISTS idx_ats_suggestions_cv_id ON ats_suggestions(cv_id);
CREATE INDEX IF NOT EXISTS idx_ats_suggestions_is_active ON ats_suggestions(cv_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ats_suggestions_is_applied ON ats_suggestions(cv_id, is_applied, is_active);


-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_sections_updated_at 
    BEFORE UPDATE ON cv_sections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_suggestions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- CVs policies
CREATE POLICY "Users can view own CVs" ON cvs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own CVs" ON cvs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs" ON cvs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs" ON cvs
    FOR DELETE USING (auth.uid() = user_id);

-- CV sections policies
CREATE POLICY "Users can view own CV sections" ON cv_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = cv_sections.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own CV sections" ON cv_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = cv_sections.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own CV sections" ON cv_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = cv_sections.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own CV sections" ON cv_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = cv_sections.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

-- JD analyses policies
CREATE POLICY "Users can view own JD analyses" ON jd_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = jd_analyses.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own JD analyses" ON jd_analyses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = jd_analyses.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own JD analyses" ON jd_analyses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = jd_analyses.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own JD analyses" ON jd_analyses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cvs 
            WHERE cvs.id = jd_analyses.cv_id 
            AND cvs.user_id = auth.uid()
        )
    );

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


-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- User profiles permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- CVs permissions
GRANT ALL ON cvs TO authenticated;
GRANT ALL ON cvs TO service_role;

-- CV sections permissions
GRANT ALL ON cv_sections TO authenticated;
GRANT ALL ON cv_sections TO service_role;

-- JD analyses permissions
GRANT ALL ON jd_analyses TO authenticated;
GRANT ALL ON jd_analyses TO service_role;

GRANT SELECT, INSERT, UPDATE ON ats_suggestions TO authenticated;
GRANT ALL ON ats_suggestions TO service_role;


-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE ats_suggestions IS 'Stores ATS optimization suggestions generated from CV scoring';
COMMENT ON COLUMN ats_suggestions.cv_id IS 'Reference to the CV';
COMMENT ON COLUMN ats_suggestions.suggestion_id IS 'Unique identifier for the suggestion (e.g., suggestion-0, suggestion-1)';
COMMENT ON COLUMN ats_suggestions.suggestion_text IS 'The suggestion text displayed to user';
COMMENT ON COLUMN ats_suggestions.suggestion_type IS 'Type of suggestion (e.g., add_keyword, improve_bullet, add_section, enhance_content)';
COMMENT ON COLUMN ats_suggestions.target_section IS 'CV section where suggestion should be applied (e.g., experience, skills, summary, projects, education, certifications)';
COMMENT ON COLUMN ats_suggestions.target_index IS 'Index of element in array section (0-based, null if not applicable)';
COMMENT ON COLUMN ats_suggestions.keyword IS 'Related keyword for the suggestion (if applicable)';
COMMENT ON COLUMN ats_suggestions.priority IS 'Priority level: high, medium, or low';
COMMENT ON COLUMN ats_suggestions.original_content IS 'Current content at the location to be changed (JSONB)';
COMMENT ON COLUMN ats_suggestions.suggested_content IS 'Content after applying the suggestion (JSONB)';
COMMENT ON COLUMN ats_suggestions.is_active IS 'Whether this suggestion is from the latest scoring (true) or superseded (false)';
COMMENT ON COLUMN ats_suggestions.is_applied IS 'Whether this suggestion has been applied to the CV';
COMMENT ON COLUMN ats_suggestions.applied_at IS 'Timestamp when suggestion was applied';

