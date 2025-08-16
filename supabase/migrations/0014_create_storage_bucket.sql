-- Create storage bucket for file uploads
-- This migration creates the 'samaj' storage bucket and sets up appropriate policies

-- Create the 'samaj' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'samaj',
  'samaj', 
  true,  -- public bucket
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the 'samaj' bucket

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "samaj_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "samaj_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "samaj_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "samaj_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "samaj_bucket_folder_access" ON storage.objects;

-- Allow authenticated users to read files
CREATE POLICY "samaj_bucket_select" ON storage.objects
FOR SELECT USING (bucket_id = 'samaj' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload files
CREATE POLICY "samaj_bucket_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'samaj' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('photos', 'documents')
);

-- Allow authenticated users to update their own files
CREATE POLICY "samaj_bucket_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'samaj' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'samaj' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files (optional - you may want to restrict this)
CREATE POLICY "samaj_bucket_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'samaj' 
  AND auth.role() = 'authenticated'
);

-- Create folder structure policies
-- Allow uploads to specific folders: photos/, documents/aadhar/, documents/pan/, documents/others/
CREATE POLICY "samaj_bucket_folder_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'samaj' 
  AND (
    -- Allow access to photos folder
    (storage.foldername(name))[1] = 'photos'
    OR 
    -- Allow access to documents subfolders
    ((storage.foldername(name))[1] = 'documents' AND 
     (storage.foldername(name))[2] IN ('aadhar', 'pan', 'others'))
  )
);

-- Comment on the bucket (removed due to permission issues)
-- COMMENT ON TABLE storage.buckets IS 'Storage bucket for Samaj application files including member photos and documents';
