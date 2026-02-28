-- Migration: add template_id and color_theme columns to resumes table
-- Run this in Supabase SQL Editor

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS color_theme  TEXT NOT NULL DEFAULT 'blue';

-- Optional: add check constraints
ALTER TABLE resumes
  ADD CONSTRAINT resumes_template_id_check
    CHECK (template_id IN ('classic', 'modern', 'executive', 'creative', 'minimal'));

ALTER TABLE resumes
  ADD CONSTRAINT resumes_color_theme_check
    CHECK (color_theme IN ('blue', 'slate', 'emerald', 'rose'));
