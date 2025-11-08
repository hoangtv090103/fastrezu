-- Migration: Create storage bucket for feedback attachments
-- Date: 2025-11-03
-- Description: Creates the feedback-attachments storage bucket with RLS policies

-- Create Storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  true, -- Public bucket for easy access to attachments
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload feedback attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read feedback attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read feedback attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own feedback attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own feedback attachment files" ON storage.objects;

-- Allow anyone (authenticated and anonymous) to upload files
CREATE POLICY "Anyone can upload feedback attachment files" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'feedback-attachments'
);

-- Allow anyone to read feedback attachment files (since bucket is public)
CREATE POLICY "Anyone can read feedback attachment files" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'feedback-attachments'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own feedback attachment files" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'feedback-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own feedback attachment files" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'feedback-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
