ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS steel_grade text NOT NULL DEFAULT 'Fe500D',
  ADD COLUMN IF NOT EXISTS paint_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS plumbing_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS electrical_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS flooring_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS doors_windows_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS sanitaryware_spec text NOT NULL DEFAULT 'Standard';