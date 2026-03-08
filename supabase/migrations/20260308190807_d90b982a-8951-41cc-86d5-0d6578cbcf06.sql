
-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Subscription plans table (for tracking user plan)
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
