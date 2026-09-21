CREATE TABLE public.owner_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'decision',
  priority text NOT NULL DEFAULT 'normal',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  raised_by uuid REFERENCES auth.users(id),
  raised_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_requests TO authenticated;
GRANT ALL ON public.owner_requests TO service_role;
ALTER TABLE public.owner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_requests_select" ON public.owner_requests FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "owner_requests_insert" ON public.owner_requests FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "owner_requests_update" ON public.owner_requests FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "owner_requests_delete" ON public.owner_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TABLE public.owner_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.owner_requests(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  owner_name text NOT NULL DEFAULT '',
  owner_role text NOT NULL DEFAULT 'Land Holder',
  decision text NOT NULL DEFAULT 'pending',
  comment text NOT NULL DEFAULT '',
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, owner_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_decisions TO authenticated;
GRANT ALL ON public.owner_decisions TO service_role;
ALTER TABLE public.owner_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_decisions_select" ON public.owner_decisions FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "owner_decisions_insert" ON public.owner_decisions FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "owner_decisions_update" ON public.owner_decisions FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "owner_decisions_delete" ON public.owner_decisions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE INDEX owner_requests_project_idx ON public.owner_requests(project_id);
CREATE INDEX owner_decisions_request_idx ON public.owner_decisions(request_id);

CREATE TRIGGER owner_requests_updated_at BEFORE UPDATE ON public.owner_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER owner_decisions_updated_at BEFORE UPDATE ON public.owner_decisions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();