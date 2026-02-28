-- Migration: add file_storage_path to cv_scan_history
-- Run this in the Supabase SQL editor.

ALTER TABLE cv_scan_history
ADD COLUMN IF NOT EXISTS file_storage_path TEXT;

-- Storage bucket for scan files (run once in Supabase dashboard → Storage)
-- Bucket name: cv-scan-files  (private)

INSERT INTO
    storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'cv-scan-files',
        'cv-scan-files',
        false, -- Private bucket
        5242880, -- 5MB limit
        ARRAY['application/pdf']
    )
ON CONFLICT (id) DO
UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: allow authenticated users to manage their own folder
-- INSERT policy
CREATE POLICY "Users can upload their own scan files" ON storage.objects FOR INSERT TO authenticated
WITH
    CHECK (
        bucket_id = 'cv-scan-files'
        AND (storage.foldername (name)) [1] = auth.uid ()::text
    );

-- SELECT policy
CREATE POLICY "Users can read their own scan files" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'cv-scan-files'
        AND (storage.foldername (name)) [1] = auth.uid ()::text
    );

-- DELETE policy
CREATE POLICY "Users can delete their own scan files" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'cv-scan-files'
    AND (storage.foldername (name)) [1] = auth.uid ()::text
);