CREATE TABLE public.boq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  brand text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'ai',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_items TO authenticated;
GRANT ALL ON public.boq_items TO service_role;

ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members manage boq items" ON public.boq_items
  FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE INDEX boq_items_project_idx ON public.boq_items (project_id, sort_order);

CREATE TRIGGER set_boq_items_updated_at BEFORE UPDATE ON public.boq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();