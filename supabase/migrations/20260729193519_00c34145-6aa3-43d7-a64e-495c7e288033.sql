-- WORKERS: owner + business-ownership alignment (defence in depth)
DROP POLICY IF EXISTS "Users can view own workers" ON public.workers;
DROP POLICY IF EXISTS "Users can create own workers" ON public.workers;
DROP POLICY IF EXISTS "Users can update own workers" ON public.workers;
DROP POLICY IF EXISTS "Users can delete own workers" ON public.workers;

CREATE POLICY "Users can view own workers" ON public.workers
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND (business_id IS NULL OR public.owns_business(business_id)));

CREATE POLICY "Users can create own workers" ON public.workers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (business_id IS NULL OR public.owns_business(business_id)));

CREATE POLICY "Users can update own workers" ON public.workers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND (business_id IS NULL OR public.owns_business(business_id)))
WITH CHECK (auth.uid() = user_id AND (business_id IS NULL OR public.owns_business(business_id)));

CREATE POLICY "Users can delete own workers" ON public.workers
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND (business_id IS NULL OR public.owns_business(business_id)));

-- ATTENDANCE: owner + linked worker must belong to the same owner
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can create own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;

CREATE POLICY "Users can view own attendance" ON public.attendance
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can create own attendance" ON public.attendance
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can update own attendance" ON public.attendance
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND w.user_id = auth.uid()))
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can delete own attendance" ON public.attendance
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND w.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.workers TO service_role;
GRANT ALL ON public.attendance TO service_role;