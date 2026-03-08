
-- Create campaign-posters storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-posters', 'campaign-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to campaign-posters
CREATE POLICY "Authenticated users can upload posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'campaign-posters');

-- Allow public read access to campaign posters
CREATE POLICY "Public can view campaign posters"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'campaign-posters');

-- Allow users to delete their own posters
CREATE POLICY "Users can delete own posters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'campaign-posters');
