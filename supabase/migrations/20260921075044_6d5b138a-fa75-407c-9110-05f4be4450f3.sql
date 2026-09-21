ALTER TABLE public.owner_requests
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_owner_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_label text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.is_pmc_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','pm','accounts')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_see_owner_request(_user_id uuid, _audience text, _target_owner_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _audience <> 'owner'
      OR public.is_pmc_team(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = _user_id
          AND lower(btrim(p.full_name)) = lower(btrim(_target_owner_name))
      )
$$;

DROP POLICY IF EXISTS "owner_requests_select" ON public.owner_requests;
CREATE POLICY "owner_requests_select" ON public.owner_requests
FOR SELECT TO authenticated
USING (
  public.is_approved(auth.uid())
  AND public.can_see_owner_request(auth.uid(), audience, target_owner_name)
);

DROP POLICY IF EXISTS "owner_decisions_select" ON public.owner_decisions;
CREATE POLICY "owner_decisions_select" ON public.owner_decisions
FOR SELECT TO authenticated
USING (
  public.is_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.owner_requests r
    WHERE r.id = owner_decisions.request_id
      AND public.can_see_owner_request(auth.uid(), r.audience, r.target_owner_name)
  )
);