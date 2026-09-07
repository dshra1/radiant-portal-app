CREATE TABLE public.price_quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.site_projects(id) on delete set null,
  vendor_name text not null default '',
  vendor_gstin text not null default '',
  vendor_contact text not null default '',
  quote_ref text not null default '',
  quote_date date,
  currency text not null default 'INR',
  trade text not null default '',
  source_file text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.price_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.price_quotes(id) on delete cascade,
  item_code text not null default '',
  description text not null default '',
  brand text not null default '',
  trade text not null default '',
  unit text not null default '',
  quantity numeric not null default 0,
  rate numeric not null default 0,
  discount_pct numeric not null default 0,
  gst_pct numeric not null default 0,
  net_rate numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_quotes TO authenticated;
GRANT ALL ON public.price_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_quote_items TO authenticated;
GRANT ALL ON public.price_quote_items TO service_role;

ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view quotes" ON public.price_quotes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add quotes" ON public.price_quotes FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit quotes" ON public.price_quotes FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete quotes" ON public.price_quotes FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pm'::app_role));

CREATE POLICY "Approved members can view quote items" ON public.price_quote_items FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add quote items" ON public.price_quote_items FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit quote items" ON public.price_quote_items FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete quote items" ON public.price_quote_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pm'::app_role));

CREATE TRIGGER price_quotes_updated_at BEFORE UPDATE ON public.price_quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER price_quote_items_updated_at BEFORE UPDATE ON public.price_quote_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX price_quote_items_quote_id_idx ON public.price_quote_items(quote_id);