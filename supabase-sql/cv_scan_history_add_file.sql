-- Migration: add file_storage_path to cv_scan_history
-- Run this in the Supabase SQL editor.

ALTER TABLE cv_scan_history
  ADD COLUMN IF NOT EXISTS file_storage_path TEXT;

-- Storage bucket for scan files (run once in Supabase dashboard → Storage)
-- Bucket name: cv-scan-files  (private)

-- Storage RLS: allow authenticated users to manage their own folder
-- INSERT policy
-- CREATE POLICY "Users can upload their own scan files"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'cv-scan-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- SELECT policy
-- CREATE POLICY "Users can read their own scan files"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'cv-scan-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE policy
-- CREATE POLICY "Users can delete their own scan files"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'cv-scan-files' AND (storage.foldername(name))[1] = auth.uid()::text);
