ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_source text NOT NULL DEFAULT '';