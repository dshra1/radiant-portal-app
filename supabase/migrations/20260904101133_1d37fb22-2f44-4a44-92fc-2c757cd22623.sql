DROP POLICY IF EXISTS "Approved members read approved peers" ON public.profiles;
CREATE POLICY "Approved members read approved peers"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  AND (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_approved(auth.uid())
  )
);