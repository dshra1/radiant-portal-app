-- Allow approved members to see a basic peer list for task assignment
CREATE POLICY "Approved members read approved peers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND (
      id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        SELECT p.status FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1
      ) = 'approved'
    )
  );