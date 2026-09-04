ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS drawings jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE POLICY "Shared workspace can read project drawings"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-drawings');

CREATE POLICY "Shared workspace can upload project drawings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-drawings');

CREATE POLICY "Shared workspace can delete project drawings"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-drawings');