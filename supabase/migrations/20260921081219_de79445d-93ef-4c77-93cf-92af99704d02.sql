create policy "financial_docs_read" on storage.objects for select to authenticated
  using (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_update" on storage.objects for update to authenticated
  using (bucket_id = 'financial-docs' and is_approved(auth.uid()))
  with check (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'financial-docs' and (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'pm'::app_role) or has_role(auth.uid(), 'accounts'::app_role)));