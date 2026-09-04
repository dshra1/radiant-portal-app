CREATE TABLE public.site_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  single_floor_slab_sft NUMERIC NOT NULL DEFAULT 0,
  cellar_floors INTEGER NOT NULL DEFAULT 0,
  stilt_floors INTEGER NOT NULL DEFAULT 0,
  typical_floors INTEGER NOT NULL DEFAULT 0,
  total_built_up_sft NUMERIC NOT NULL DEFAULT 0,
  total_slab_sft NUMERIC NOT NULL DEFAULT 0,
  target_budget NUMERIC NOT NULL DEFAULT 0,
  spend NUMERIC NOT NULL DEFAULT 0,
  health TEXT NOT NULL DEFAULT 'On Track',
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_projects TO authenticated;
GRANT ALL ON public.site_projects TO service_role;

ALTER TABLE public.site_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared workspace can read projects" ON public.site_projects FOR SELECT USING (true);
CREATE POLICY "Shared workspace can add projects" ON public.site_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Shared workspace can edit projects" ON public.site_projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Shared workspace can delete projects" ON public.site_projects FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER site_projects_updated_at BEFORE UPDATE ON public.site_projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_projects (name, location, type, single_floor_slab_sft, cellar_floors, stilt_floors, typical_floors, total_built_up_sft, total_slab_sft, target_budget, spend, health, phases) VALUES
('Cyber Enclave A', 'Madhapur, Hyderabad', 'G+5 Commercial', 2000, 1, 1, 5, 12000, 14000, 30000000, 18420000, 'On Track', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"done"},{"name":"Structural","state":"active"},{"name":"MEP","state":"pending"},{"name":"Finishing","state":"pending"}]'::jsonb),
('Tarnaka Block 5', 'Tarnaka, Hyderabad', 'Apartment Building', 3200, 0, 1, 7, 22400, 25600, 52000000, 41800000, 'At Risk', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"done"},{"name":"Structural","state":"done"},{"name":"MEP","state":"active"},{"name":"Finishing","state":"pending"}]'::jsonb),
('Kokapet Tower 2', 'Kokapet, Hyderabad', 'G+12 Residential', 4100, 2, 1, 12, 49200, 61500, 145000000, 39250000, 'Delayed', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"active"},{"name":"Structural","state":"pending"},{"name":"MEP","state":"pending"},{"name":"Finishing","state":"pending"}]'::jsonb);