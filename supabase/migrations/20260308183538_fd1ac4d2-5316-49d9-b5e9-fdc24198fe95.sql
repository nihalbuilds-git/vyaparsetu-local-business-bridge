
-- 1. Khata / Udhar Book
CREATE TABLE public.khata_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  entry_type TEXT NOT NULL DEFAULT 'credit' CHECK (entry_type IN ('credit', 'debit')),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.khata_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own khata" ON public.khata_entries FOR SELECT USING (owns_business(business_id));
CREATE POLICY "Users can create own khata" ON public.khata_entries FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "Users can update own khata" ON public.khata_entries FOR UPDATE USING (owns_business(business_id));
CREATE POLICY "Users can delete own khata" ON public.khata_entries FOR DELETE USING (owns_business(business_id));

-- 2. Inventory / Stock
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.inventory_items FOR SELECT USING (owns_business(business_id));
CREATE POLICY "Users can create own inventory" ON public.inventory_items FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "Users can update own inventory" ON public.inventory_items FOR UPDATE USING (owns_business(business_id));
CREATE POLICY "Users can delete own inventory" ON public.inventory_items FOR DELETE USING (owns_business(business_id));

-- 3. Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst_percent NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (owns_business(business_id));
CREATE POLICY "Users can create own invoices" ON public.invoices FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (owns_business(business_id));
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (owns_business(business_id));

-- 4. Expenses (P&L Tracker)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'expense' CHECK (entry_type IN ('income', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (owns_business(business_id));
CREATE POLICY "Users can create own expenses" ON public.expenses FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (owns_business(business_id));
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (owns_business(business_id));

-- 5. Worker Advances
CREATE TABLE public.worker_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deducted')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own advances" ON public.worker_advances FOR SELECT USING (owns_business(business_id));
CREATE POLICY "Users can create own advances" ON public.worker_advances FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "Users can update own advances" ON public.worker_advances FOR UPDATE USING (owns_business(business_id));
CREATE POLICY "Users can delete own advances" ON public.worker_advances FOR DELETE USING (owns_business(business_id));
