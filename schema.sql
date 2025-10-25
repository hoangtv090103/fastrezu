-- FastRezu MVP Database Schema
-- Extends existing subscribers table with full CV management system

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_cv_sections_cv_id ON cv_sections(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_type ON cv_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_jd_analyses_cv_id ON jd_analyses(cv_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for cvs
CREATE POLICY "Users can view own CVs" ON cvs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own CVs" ON cvs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs" ON cvs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs" ON cvs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cv_sections
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

-- RLS Policies for jd_analyses
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON cvs TO authenticated;
GRANT ALL ON cv_sections TO authenticated;
GRANT ALL ON jd_analyses TO authenticated;

-- Service role permissions (for API routes)
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON cvs TO service_role;
GRANT ALL ON cv_sections TO service_role;
GRANT ALL ON jd_analyses TO service_role;


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


-- Migration: Add ats_analysis section type to cv_sections table
-- Run this in your Supabase SQL editor

-- Drop the existing check constraint
ALTER TABLE cv_sections 
DROP CONSTRAINT IF EXISTS cv_sections_section_type_check;

-- Add the new check constraint with 'ats_analysis' included
ALTER TABLE cv_sections 
ADD CONSTRAINT cv_sections_section_type_check 
CHECK (section_type IN ('personal_info', 'summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'ats_analysis'));

-- Add comment for documentation
COMMENT ON CONSTRAINT cv_sections_section_type_check ON cv_sections IS 'Validates section_type values including ats_analysis for ATS scoring data';


-- Create Storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create RLS policies for cv-uploads bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload CV files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own CV files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own CV files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own CV files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);
