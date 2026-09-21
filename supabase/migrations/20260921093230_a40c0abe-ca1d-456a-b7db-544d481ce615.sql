CREATE TABLE public.site_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  sort int NOT NULL DEFAULT 0,
  planned_pct numeric NOT NULL DEFAULT 0,
  actual_pct numeric NOT NULL DEFAULT 0,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  status text NOT NULL DEFAULT 'not started',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_stages TO authenticated;
GRANT ALL ON public.site_stages TO service_role;
ALTER TABLE public.site_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_stages_select" ON public.site_stages FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_insert" ON public.site_stages FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_update" ON public.site_stages FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_delete" ON public.site_stages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX site_stages_project_idx ON public.site_stages(project_id, sort);
CREATE TRIGGER site_stages_updated_at BEFORE UPDATE ON public.site_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.labour_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  contractor text NOT NULL DEFAULT '',
  trade text NOT NULL DEFAULT '',
  headcount numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 8,
  day_rate numeric NOT NULL DEFAULT 0,
  work_done text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  supervisor text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.labour_entries TO authenticated;
GRANT ALL ON public.labour_entries TO service_role;
ALTER TABLE public.labour_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "labour_entries_select" ON public.labour_entries FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_insert" ON public.labour_entries FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_update" ON public.labour_entries FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_delete" ON public.labour_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX labour_entries_project_idx ON public.labour_entries(project_id, work_date DESC);
CREATE TRIGGER labour_entries_updated_at BEFORE UPDATE ON public.labour_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pour_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  pour_ref text NOT NULL DEFAULT '',
  element text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT 'M25',
  quantity_cum numeric NOT NULL DEFAULT 0,
  pour_date date,
  slump text NOT NULL DEFAULT '',
  cubes_cast numeric NOT NULL DEFAULT 0,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  requested_by_name text NOT NULL DEFAULT '',
  approved_by uuid REFERENCES auth.users(id),
  approved_by_name text NOT NULL DEFAULT '',
  approved_at timestamptz,
  remarks text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pour_cards TO authenticated;
GRANT ALL ON public.pour_cards TO service_role;
ALTER TABLE public.pour_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pour_cards_select" ON public.pour_cards FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_insert" ON public.pour_cards FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_update" ON public.pour_cards FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_delete" ON public.pour_cards FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX pour_cards_project_idx ON public.pour_cards(project_id, pour_date DESC);
CREATE TRIGGER pour_cards_updated_at BEFORE UPDATE ON public.pour_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.qa_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  inspected_on date NOT NULL DEFAULT CURRENT_DATE,
  location_tag text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  code_ref text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'Low',
  findings text NOT NULL DEFAULT '',
  defect_count int NOT NULL DEFAULT 0,
  resolution text NOT NULL DEFAULT 'Open',
  inspector_name text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_inspections TO authenticated;
GRANT ALL ON public.qa_inspections TO service_role;
ALTER TABLE public.qa_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_inspections_select" ON public.qa_inspections FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_insert" ON public.qa_inspections FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_update" ON public.qa_inspections FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_delete" ON public.qa_inspections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX qa_inspections_project_idx ON public.qa_inspections(project_id, inspected_on DESC);
CREATE TRIGGER qa_inspections_updated_at BEFORE UPDATE ON public.qa_inspections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'progress',
  captured_on date,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO authenticated;
GRANT ALL ON public.project_media TO service_role;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_media_select" ON public.project_media FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "project_media_insert" ON public.project_media FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "project_media_update" ON public.project_media FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "project_media_delete" ON public.project_media FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX project_media_project_idx ON public.project_media(project_id, created_at DESC);
CREATE TRIGGER project_media_updated_at BEFORE UPDATE ON public.project_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();