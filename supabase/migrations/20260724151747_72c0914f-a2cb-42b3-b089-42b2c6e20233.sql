
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, JSONB, TEXT);

GRANT INSERT ON public.audit_logs TO authenticated;

CREATE POLICY "Users insert own audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
