-- Create storage bucket for form attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-attachments',
  'form-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS Policies for form-attachments bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own form attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own form attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own form attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow organisation members to view files from their org
CREATE POLICY "Organisation members can view form attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'form-attachments' AND
  EXISTS (
    SELECT 1 FROM users u1
    JOIN users u2 ON u1.organisation_id = u2.organisation_id
    WHERE u1.id = auth.uid()
    AND u2.id = ((storage.foldername(name))[1])::uuid
  )
);