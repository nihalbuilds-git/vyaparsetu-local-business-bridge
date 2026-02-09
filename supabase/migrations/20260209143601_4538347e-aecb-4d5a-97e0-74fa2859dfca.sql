
-- Create businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text,
  address text,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own businesses" ON public.businesses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create own businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own businesses" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own businesses" ON public.businesses FOR DELETE USING (auth.uid() = owner_id);

-- Add business_id to workers (nullable so existing rows aren't broken)
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  poster_url text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS for campaigns: allow if user owns the referenced business
CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (public.owns_business(business_id));
CREATE POLICY "Users can create own campaigns" ON public.campaigns FOR INSERT WITH CHECK (public.owns_business(business_id));
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (public.owns_business(business_id));
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE USING (public.owns_business(business_id));
