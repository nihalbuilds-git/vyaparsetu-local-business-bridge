
-- Payments INSERT policy
CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_subscriptions DELETE policy
CREATE POLICY "Users can delete their own subscription"
  ON public.user_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Fix campaign-posters storage policies
DROP POLICY IF EXISTS "Authenticated users can upload posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posters" ON storage.objects;

CREATE POLICY "Users can upload own posters"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-posters'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own posters"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'campaign-posters'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own posters"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'campaign-posters'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Restrict owns_business() to authenticated users only
REVOKE EXECUTE ON FUNCTION public.owns_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_business(uuid) TO authenticated;
