ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS map_link text NOT NULL DEFAULT '';