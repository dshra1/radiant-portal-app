CREATE TABLE public.capital_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  owner_name text NOT NULL DEFAULT '',
  owner_role text NOT NULL DEFAULT '',
  entry_type text NOT NULL DEFAULT 'receipt',
  amount numeric NOT NULL DEFAULT 0,
  entry_date date,
  milestone text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'received',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capital_entries TO authenticated;
GRANT ALL ON public.capital_entries TO service_role;

ALTER TABLE public.capital_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capital_entries_select" ON public.capital_entries FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_insert" ON public.capital_entries FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_update" ON public.capital_entries FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_delete" ON public.capital_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER capital_entries_updated_at BEFORE UPDATE ON public.capital_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX capital_entries_project_idx ON public.capital_entries(project_id);