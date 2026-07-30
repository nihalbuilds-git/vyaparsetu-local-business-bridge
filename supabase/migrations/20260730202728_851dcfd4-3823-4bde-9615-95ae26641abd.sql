-- Alert owners when client.error / denied audit events spike within a time window.
CREATE OR REPLACE FUNCTION public.notify_on_audit_event_spike()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window   interval := interval '15 minutes';
  v_threshold integer  := 5;
  v_count     integer;
BEGIN
  -- Only react to failure-ish events tied to a user.
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT (NEW.event_type = 'client.error' OR NEW.status IN ('denied', 'error')) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.audit_logs
  WHERE user_id = NEW.user_id
    AND created_at >= now() - v_window
    AND (event_type = 'client.error' OR status IN ('denied', 'error'));

  IF v_count < v_threshold THEN
    RETURN NEW;
  END IF;

  -- De-dupe: at most one spike alert per user per window.
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = 'security_alert'
      AND created_at >= now() - v_window
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    NEW.user_id,
    'Unusual activity detected',
    v_count || ' error/blocked events were recorded on your account in the last 15 minutes (latest: '
      || NEW.event_type || ', status ' || NEW.status || '). Open the Security Log to review.',
    'security_alert',
    false
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_on_audit_event_spike() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_on_audit_event_spike() FROM anon;
REVOKE ALL ON FUNCTION public.notify_on_audit_event_spike() FROM authenticated;

DROP TRIGGER IF EXISTS trg_audit_event_spike ON public.audit_logs;
CREATE TRIGGER trg_audit_event_spike
AFTER INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_audit_event_spike();

CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx
  ON public.audit_logs (user_id, created_at DESC);