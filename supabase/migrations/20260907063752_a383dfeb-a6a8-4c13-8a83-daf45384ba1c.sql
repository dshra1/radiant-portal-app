CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name text NOT NULL DEFAULT '',
  vendor_code text NOT NULL DEFAULT '',
  trade_category text NOT NULL DEFAULT '',
  brands_supplied text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  lead_time text NOT NULL DEFAULT '',
  on_time_pct numeric NOT NULL DEFAULT 0,
  quality_rating numeric NOT NULL DEFAULT 0,
  credit_terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view vendors" ON public.vendors FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved members can add vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved members can edit vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete vendors" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX vendors_trade_category_idx ON public.vendors (trade_category);