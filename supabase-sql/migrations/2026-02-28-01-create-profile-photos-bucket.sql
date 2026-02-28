-- Migration: Create storage bucket for profile photos
-- Date: 2026-02-28
-- Description: Creates the profile-photos storage bucket with RLS policies
--              for Story 5.5 (Upload Ảnh Đại Diện)

-- Create Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true, -- Public bucket so photo URLs can be embedded in PDFs and previews
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile photo" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload their own profile photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to read profile photos (public bucket — used in PDFs)
CREATE POLICY "Anyone can read profile photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-photos'
);

-- Allow authenticated users to overwrite (upsert) their own photo
CREATE POLICY "Authenticated users can update their own profile photo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photo
CREATE POLICY "Authenticated users can delete their own profile photo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
