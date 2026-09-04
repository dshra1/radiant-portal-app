-- Roles
CREATE TYPE public.app_role AS ENUM (
  'admin','pm','site_engineer','site_supervisor','purchase_stores','accounts','landowner_investor'
);

-- Member directory
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  requested_note text NOT NULL DEFAULT '',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'approved');
$$;

-- Profile policies
CREATE POLICY "Members read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members update own name" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Role policies
CREATE POLICY "Members read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins grant roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins revoke roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bootstrap the workspace owner as admin once their email is verified
CREATE OR REPLACE FUNCTION public.bootstrap_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'sahadeveloperz@gmail.com' THEN
    INSERT INTO public.profiles (id, email, status, approved_at)
    VALUES (NEW.id, lower(NEW.email), 'approved', now())
    ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = now();
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_owner_admin AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_owner_admin();
CREATE TRIGGER on_auth_user_confirmed_owner_admin AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.bootstrap_owner_admin();

-- Existing workspace data now requires an approved member
DROP POLICY IF EXISTS "Signed-in users manage projects" ON public.site_projects;
CREATE POLICY "Approved members manage projects" ON public.site_projects
  FOR ALL TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Signed-in users manage messages" ON public.team_messages;
CREATE POLICY "Approved members manage messages" ON public.team_messages
  FOR ALL TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Signed-in users manage notifications" ON public.notifications;
CREATE POLICY "Approved members manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Signed-in users manage ai threads" ON public.ai_threads;
CREATE POLICY "Approved members manage ai threads" ON public.ai_threads
  FOR ALL TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Signed-in users manage ai messages" ON public.ai_messages;
CREATE POLICY "Approved members manage ai messages" ON public.ai_messages
  FOR ALL TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));

-- Drawings only for approved members
DROP POLICY IF EXISTS "Signed-in users read drawings" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users upload drawings" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users update drawings" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users delete drawings" ON storage.objects;
CREATE POLICY "Approved members read drawings" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'project-drawings' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members upload drawings" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-drawings' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members update drawings" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'project-drawings' AND public.is_approved(auth.uid()))
  WITH CHECK (bucket_id = 'project-drawings' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members delete drawings" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'project-drawings' AND public.is_approved(auth.uid()));