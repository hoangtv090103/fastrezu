-- Migration: Add feedback attachments table for storing images/screenshots
-- Run this in your Supabase SQL editor

    -- Create feedback_attachments table
    CREATE TABLE IF NOT EXISTS feedback_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_attachments_uploaded_by ON feedback_attachments(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_feedback_attachments_created_at ON feedback_attachments(created_at);

    -- Enable Row Level Security (RLS)
    ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for feedback_attachments
    -- Users can view attachments of their own feedback
    CREATE POLICY "Users can view own feedback attachments" ON feedback_attachments
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM feedback
                WHERE feedback.id = feedback_attachments.feedback_id
                AND (feedback.user_id = auth.uid() OR feedback.user_id IS NULL)
            )
        );

    -- Users can upload attachments for their feedback
    CREATE POLICY "Users can create feedback attachments" ON feedback_attachments
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM feedback
                WHERE feedback.id = feedback_attachments.feedback_id
                AND (feedback.user_id = auth.uid() OR feedback.user_id IS NULL)
            )
        );

    -- Users can delete their own attachments
    CREATE POLICY "Users can delete own feedback attachments" ON feedback_attachments
        FOR DELETE USING (
            uploaded_by = auth.uid()
        );

    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    GRANT ALL ON feedback_attachments TO authenticated;
    GRANT SELECT, INSERT ON feedback_attachments TO anon;

    -- Service role permissions (for API routes)
    GRANT ALL ON feedback_attachments TO service_role;

-- Add comment for documentation
COMMENT ON TABLE feedback_attachments IS 'Stores file attachments for feedback including screenshots and error images';
COMMENT ON COLUMN feedback_attachments.file_path IS 'Path to file in storage bucket';
COMMENT ON COLUMN feedback_attachments.file_type IS 'MIME type of the file (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN feedback_attachments.uploaded_by IS 'User who uploaded the attachment (can be null for anonymous users)';

-- Create Storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  true, -- Public bucket for easy access to attachments
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for feedback-attachments bucket
-- Allow anyone to upload files (for anonymous feedback)
CREATE POLICY "Anyone can upload feedback attachment files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'feedback-attachments'
  AND auth.role() IN ('authenticated', 'anon')
) ON CONFLICT DO NOTHING;

-- Allow users to read their own files
CREATE POLICY "Users can read their own feedback attachment files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'feedback-attachments'
  AND (
    -- Authenticated users can read their own files
    (auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1])
    OR
    -- Anonymous users can read files from anonymous folder
    (auth.role() = 'anon' AND (storage.foldername(name))[1] = 'anonymous')
  )
) ON CONFLICT DO NOTHING;

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own feedback attachment files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'feedback-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
) ON CONFLICT DO NOTHING;

-- Allow users to update their own files
CREATE POLICY "Users can update their own feedback attachment files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'feedback-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
) ON CONFLICT DO NOTHING;
