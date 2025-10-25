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
