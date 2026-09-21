CREATE POLICY "owner_approvals_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()))
  WITH CHECK (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'owner-approvals' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm')));