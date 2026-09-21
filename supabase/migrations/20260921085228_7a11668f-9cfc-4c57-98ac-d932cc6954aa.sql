CREATE TABLE public.rfqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  rfq_number text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  spec text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  deadline date,
  budget_estimate numeric NOT NULL DEFAULT 0,
  awarded_bid_id uuid,
  awarded_vendor_name text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfqs_select" ON public.rfqs FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_delete" ON public.rfqs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TABLE public.rfq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'MT',
  benchmark_rate numeric NOT NULL DEFAULT 0,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_items TO authenticated;
GRANT ALL ON public.rfq_items TO service_role;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfq_items_select" ON public.rfq_items FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_insert" ON public.rfq_items FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_update" ON public.rfq_items FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_delete" ON public.rfq_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TABLE public.rfq_bids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_name text NOT NULL DEFAULT '',
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  freight_total numeric NOT NULL DEFAULT 0,
  payment_terms text NOT NULL DEFAULT '',
  lead_time text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_bids TO authenticated;
GRANT ALL ON public.rfq_bids TO service_role;
ALTER TABLE public.rfq_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfq_bids_select" ON public.rfq_bids FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_insert" ON public.rfq_bids FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_update" ON public.rfq_bids FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_delete" ON public.rfq_bids FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE INDEX rfqs_project_idx ON public.rfqs(project_id);
CREATE INDEX rfq_items_rfq_idx ON public.rfq_items(rfq_id);
CREATE INDEX rfq_bids_rfq_idx ON public.rfq_bids(rfq_id);

CREATE TRIGGER rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rfq_bids_updated_at BEFORE UPDATE ON public.rfq_bids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();