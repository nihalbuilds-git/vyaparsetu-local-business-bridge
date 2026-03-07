
-- Add avatar_url column to workers table
ALTER TABLE public.workers ADD COLUMN avatar_url text;

-- Create storage bucket for worker avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-avatars', 'worker-avatars', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload worker avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'worker-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own worker avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'worker-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own worker avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'worker-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access for displaying avatars
CREATE POLICY "Public can view worker avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'worker-avatars');
