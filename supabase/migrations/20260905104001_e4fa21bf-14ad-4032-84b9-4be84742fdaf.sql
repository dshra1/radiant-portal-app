CREATE TABLE public.boq_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  boq_item_id uuid REFERENCES public.boq_items(id) ON DELETE SET NULL,
  trade text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  change_type text NOT NULL DEFAULT 'edit',
  source text NOT NULL DEFAULT 'manual',
  current_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_amount numeric NOT NULL DEFAULT 0,
  proposed_amount numeric NOT NULL DEFAULT 0,
  saving numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_name text NOT NULL DEFAULT '',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by_name text NOT NULL DEFAULT '',
  decided_at timestamp with time zone,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_change_requests TO authenticated;
GRANT ALL ON public.boq_change_requests TO service_role;

ALTER TABLE public.boq_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view change requests"
ON public.boq_change_requests FOR SELECT TO authenticated
USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can raise change requests"
ON public.boq_change_requests FOR INSERT TO authenticated
WITH CHECK (public.is_approved(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Admins and PMs can decide change requests"
ON public.boq_change_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE POLICY "Admins can delete change requests"
ON public.boq_change_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX boq_change_requests_project_status_idx
ON public.boq_change_requests (project_id, status, created_at DESC);

CREATE TRIGGER set_boq_change_requests_updated_at
BEFORE UPDATE ON public.boq_change_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();