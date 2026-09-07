CREATE TABLE public.project_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  authority text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  charge_date date,
  status text NOT NULL DEFAULT 'planned',
  allocation text NOT NULL DEFAULT 'common',
  owner_splits jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_charges_project_idx ON public.project_charges(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_charges TO authenticated;
GRANT ALL ON public.project_charges TO service_role;

ALTER TABLE public.project_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view charges"
  ON public.project_charges FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can add charges"
  ON public.project_charges FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can edit charges"
  ON public.project_charges FOR UPDATE TO authenticated
  USING (public.is_approved(auth.uid()))
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Admins and PMs can delete charges"
  ON public.project_charges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER set_project_charges_updated_at
  BEFORE UPDATE ON public.project_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();