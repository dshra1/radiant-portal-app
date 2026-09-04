-- site_projects
DROP POLICY IF EXISTS "Shared workspace can read projects" ON public.site_projects;
DROP POLICY IF EXISTS "Shared workspace can add projects" ON public.site_projects;
DROP POLICY IF EXISTS "Shared workspace can edit projects" ON public.site_projects;
DROP POLICY IF EXISTS "Shared workspace can delete projects" ON public.site_projects;
REVOKE ALL ON public.site_projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_projects TO authenticated;
GRANT ALL ON public.site_projects TO service_role;
CREATE POLICY "Signed-in users manage projects" ON public.site_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- team_messages
DROP POLICY IF EXISTS "Shared workspace can read messages" ON public.team_messages;
DROP POLICY IF EXISTS "Shared workspace can post messages" ON public.team_messages;
DROP POLICY IF EXISTS "Shared workspace can edit messages" ON public.team_messages;
DROP POLICY IF EXISTS "Shared workspace can delete messages" ON public.team_messages;
REVOKE ALL ON public.team_messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;
CREATE POLICY "Signed-in users manage messages" ON public.team_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- notifications
DROP POLICY IF EXISTS "Shared workspace can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Shared workspace can add notifications" ON public.notifications;
DROP POLICY IF EXISTS "Shared workspace can edit notifications" ON public.notifications;
DROP POLICY IF EXISTS "Shared workspace can delete notifications" ON public.notifications;
REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY "Signed-in users manage notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ai_threads
DROP POLICY IF EXISTS "ai_threads open access" ON public.ai_threads;
REVOKE ALL ON public.ai_threads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_threads TO authenticated;
GRANT ALL ON public.ai_threads TO service_role;
CREATE POLICY "Signed-in users manage ai threads" ON public.ai_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ai_messages
DROP POLICY IF EXISTS "ai_messages open access" ON public.ai_messages;
REVOKE ALL ON public.ai_messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
CREATE POLICY "Signed-in users manage ai messages" ON public.ai_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- storage: drawings only for signed-in users
DROP POLICY IF EXISTS "Shared workspace can read drawings" ON storage.objects;
DROP POLICY IF EXISTS "Shared workspace can upload drawings" ON storage.objects;
DROP POLICY IF EXISTS "Shared workspace can update drawings" ON storage.objects;
DROP POLICY IF EXISTS "Shared workspace can delete drawings" ON storage.objects;
CREATE POLICY "Signed-in users read drawings" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-drawings');
CREATE POLICY "Signed-in users upload drawings" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-drawings');
CREATE POLICY "Signed-in users update drawings" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-drawings') WITH CHECK (bucket_id = 'project-drawings');
CREATE POLICY "Signed-in users delete drawings" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-drawings');