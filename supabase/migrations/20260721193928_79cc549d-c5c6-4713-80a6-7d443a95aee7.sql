
-- 1. Switch owns_business from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = auth.uid()
  );
$$;

-- 2. Drop broad public SELECT policies on storage.objects for the public buckets.
-- Public URLs continue to work (public buckets are served via the storage CDN
-- without consulting RLS); only anonymous listing/enumeration is blocked.
DROP POLICY IF EXISTS "Public can view worker avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view campaign posters" ON storage.objects;

-- Owners can still list their own files in each bucket.
CREATE POLICY "Users can list own worker avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can list own campaign posters"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'campaign-posters'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
