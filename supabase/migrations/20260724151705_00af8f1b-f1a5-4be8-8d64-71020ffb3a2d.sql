
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs (event_type);

-- Security-definer helper: authenticated users can log their OWN events only.
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _event_type TEXT,
  _resource TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb,
  _status TEXT DEFAULT 'ok'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  INSERT INTO public.audit_logs (user_id, event_type, resource, metadata, status)
  VALUES (auth.uid(), _event_type, _resource, COALESCE(_metadata, '{}'::jsonb), COALESCE(_status, 'ok'))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, JSONB, TEXT) TO authenticated;
