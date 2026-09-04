CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL,
  project_name text NOT NULL DEFAULT '',
  site_address text NOT NULL DEFAULT '',
  vendor_name text NOT NULL DEFAULT '',
  vendor_address text NOT NULL DEFAULT '',
  vendor_gstin text NOT NULL DEFAULT '',
  vendor_contact text NOT NULL DEFAULT '',
  vendor_email text NOT NULL DEFAULT '',
  quote_reference text NOT NULL DEFAULT '',
  po_date date NOT NULL DEFAULT current_date,
  delivery_date date,
  payment_terms text NOT NULL DEFAULT '30 days from delivery',
  delivery_terms text NOT NULL DEFAULT '',
  freight_charges numeric NOT NULL DEFAULT 0,
  other_charges numeric NOT NULL DEFAULT 0,
  tax_mode text NOT NULL DEFAULT 'intra' CHECK (tax_mode IN ('intra','inter')),
  terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  raised_by uuid,
  raised_by_name text NOT NULL DEFAULT '',
  approved_by uuid,
  approved_by_name text NOT NULL DEFAULT '',
  approved_at timestamptz,
  rejection_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members read purchase orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved members create purchase orders" ON public.purchase_orders
  FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved members update own draft purchase orders" ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (public.is_approved(auth.uid()) AND (status IN ('draft','pending') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm')))
  WITH CHECK (
    public.is_approved(auth.uid())
    AND (status IN ('draft','pending') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm'))
  );
CREATE POLICY "Admins and PMs delete purchase orders" ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm'));

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  discount_pct numeric NOT NULL DEFAULT 0,
  gst_pct numeric NOT NULL DEFAULT 18,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members manage po items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (public.is_approved(auth.uid()))
  WITH CHECK (public.is_approved(auth.uid()));

CREATE TRIGGER set_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_po_project ON public.purchase_orders(project_id);
CREATE INDEX idx_po_items_po ON public.purchase_order_items(po_id);

CREATE OR REPLACE FUNCTION public.next_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  seq int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(po_number, '^PO-\d{4}-', ''))::int), 0) + 1
    INTO seq
  FROM public.purchase_orders
  WHERE po_number ~ ('^PO-' || yr || '-\d+$');
  RETURN 'PO-' || yr || '-' || lpad(seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_po_number() TO authenticated;
