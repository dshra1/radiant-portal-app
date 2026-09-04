ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS landowners jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS investors jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.site_projects
SET landowners = jsonb_build_array(jsonb_build_object('name', landowner_name, 'contact', landowner_contact, 'share_pct', landowner_share_pct))
WHERE landowners = '[]'::jsonb AND coalesce(landowner_name, '') <> '';

UPDATE public.site_projects
SET investors = jsonb_build_array(jsonb_build_object('name', investor_name, 'contact', investor_contact, 'amount', investor_amount))
WHERE investors = '[]'::jsonb AND coalesce(investor_name, '') <> '';