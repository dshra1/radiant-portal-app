CREATE POLICY "Approved members read boq images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'boq-images' AND public.is_approved(auth.uid()));

CREATE POLICY "Approved members upload boq images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'boq-images' AND public.is_approved(auth.uid()));

CREATE POLICY "Approved members update boq images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'boq-images' AND public.is_approved(auth.uid()))
WITH CHECK (bucket_id = 'boq-images' AND public.is_approved(auth.uid()));

CREATE POLICY "Approved members delete boq images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'boq-images' AND public.is_approved(auth.uid()));