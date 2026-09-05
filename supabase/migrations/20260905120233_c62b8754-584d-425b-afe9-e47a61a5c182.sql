ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS work_scope text NOT NULL DEFAULT 'common';

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_work_scope_check CHECK (work_scope IN ('common','individual'));

CREATE INDEX IF NOT EXISTS boq_items_project_scope_idx ON public.boq_items (project_id, work_scope);