
-- Public read access to all band-media files
CREATE POLICY "Public can view band media"
ON storage.objects FOR SELECT
USING (bucket_id = 'band-media');

-- Authenticated users can upload to their own folder (first path segment = auth.uid())
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'band-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'band-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'band-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
