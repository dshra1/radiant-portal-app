-- Saha OS (radiant-portal-app): full database setup for a NEW, EMPTY Supabase project.
-- Generated from supabase/migrations (43 files, in order) plus the 7 private storage buckets.
-- Run once in the new project's SQL Editor. Do not run on a database that already has these tables.

-- ===== 20260904050637_a0e50756-e361-4a79-88fe-b9de4a0ccaf6.sql =====
CREATE TABLE public.site_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  single_floor_slab_sft NUMERIC NOT NULL DEFAULT 0,
  cellar_floors INTEGER NOT NULL DEFAULT 0,
  stilt_floors INTEGER NOT NULL DEFAULT 0,
  typical_floors INTEGER NOT NULL DEFAULT 0,
  total_built_up_sft NUMERIC NOT NULL DEFAULT 0,
  total_slab_sft NUMERIC NOT NULL DEFAULT 0,
  target_budget NUMERIC NOT NULL DEFAULT 0,
  spend NUMERIC NOT NULL DEFAULT 0,
  health TEXT NOT NULL DEFAULT 'On Track',
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_projects TO authenticated;
GRANT ALL ON public.site_projects TO service_role;

ALTER TABLE public.site_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared workspace can read projects" ON public.site_projects FOR SELECT USING (true);
CREATE POLICY "Shared workspace can add projects" ON public.site_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Shared workspace can edit projects" ON public.site_projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Shared workspace can delete projects" ON public.site_projects FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER site_projects_updated_at BEFORE UPDATE ON public.site_projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_projects (name, location, type, single_floor_slab_sft, cellar_floors, stilt_floors, typical_floors, total_built_up_sft, total_slab_sft, target_budget, spend, health, phases) VALUES
('Cyber Enclave A', 'Madhapur, Hyderabad', 'G+5 Commercial', 2000, 1, 1, 5, 12000, 14000, 30000000, 18420000, 'On Track', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"done"},{"name":"Structural","state":"active"},{"name":"MEP","state":"pending"},{"name":"Finishing","state":"pending"}]'::jsonb),
('Tarnaka Block 5', 'Tarnaka, Hyderabad', 'Apartment Building', 3200, 0, 1, 7, 22400, 25600, 52000000, 41800000, 'At Risk', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"done"},{"name":"Structural","state":"done"},{"name":"MEP","state":"active"},{"name":"Finishing","state":"pending"}]'::jsonb),
('Kokapet Tower 2', 'Kokapet, Hyderabad', 'G+12 Residential', 4100, 2, 1, 12, 49200, 61500, 145000000, 39250000, 'Delayed', '[{"name":"Piling","state":"done"},{"name":"Foundation","state":"active"},{"name":"Structural","state":"pending"},{"name":"MEP","state":"pending"},{"name":"Finishing","state":"pending"}]'::jsonb);
-- ===== 20260904054033_ab687ca7-2706-4398-b215-b0e741d9a852.sql =====
CREATE TABLE public.team_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel text NOT NULL DEFAULT 'general',
  author_name text NOT NULL DEFAULT 'Site user',
  author_role text NOT NULL DEFAULT 'Admin / Owner',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_messages TO anon, authenticated;
GRANT ALL ON public.team_messages TO service_role;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace can read messages" ON public.team_messages FOR SELECT USING (true);
CREATE POLICY "Shared workspace can post messages" ON public.team_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Shared workspace can edit messages" ON public.team_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Shared workspace can delete messages" ON public.team_messages FOR DELETE USING (true);
CREATE TRIGGER set_team_messages_updated_at BEFORE UPDATE ON public.team_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'Normal',
  link text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Shared workspace can add notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Shared workspace can edit notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Shared workspace can delete notifications" ON public.notifications FOR DELETE USING (true);
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.notifications (title, body, category, priority, link) VALUES
  ('Pour card SUP-021 awaiting approval', 'Slab pour for Cyber Enclave A tower, level 6 — checklist signed by site engineer.', 'QA & Inspect', 'High', '/pour-cards'),
  ('Steel rate up 3.9%', 'Jairaj Fe500D moved to Rs 71,200/ton — 4 BOQ lines above estimate.', 'BOQ & Rates', 'Normal', '/boq'),
  ('PO-2291 pending release', 'Cement order for Madhapur site is waiting on accounts release.', 'Purchase', 'High', '/purchase-orders'),
  ('Landowner payout scheduled', 'Phase 2 payout batch queued for Friday.', 'Money & Owners', 'Low', '/landowners-investment');

INSERT INTO public.team_messages (channel, author_name, author_role, body) VALUES
  ('general', 'Ravi (PM)', 'Project Manager', 'Team, level 6 slab pour is planned Saturday 6 AM. Confirm RMC booking today.'),
  ('general', 'Stores', 'Purchase / Stores', 'Cement stock at Madhapur is 240 bags. Ordering 400 more tomorrow.'),
  ('site', 'Kiran', 'Site Engineer', 'Shuttering for footings F12-F18 completed and checked.'),
  ('accounts', 'Accounts', 'Accounts', 'Contractor RA bill 04 verified, payment on Monday.');
-- ===== 20260904061424_f9de480e-1073-4341-bfb7-cb9b2cb75030.sql =====
CREATE TABLE public.ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_threads TO anon, authenticated;
GRANT ALL ON public.ai_threads TO service_role;
ALTER TABLE public.ai_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_threads open access" ON public.ai_threads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_thread_idx ON public.ai_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO anon, authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages open access" ON public.ai_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- ===== 20260904063914_fc3330cc-3ece-4767-bb01-d7d8879e1e38.sql =====
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS target_handover_date date,
  ADD COLUMN IF NOT EXISTS working_days_per_week integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS slab_cycle_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS finishing_days_per_floor integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS procurement_lead_days integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS concrete_grade text NOT NULL DEFAULT 'M25',
  ADD COLUMN IF NOT EXISTS steel_ratio_kg_per_sft numeric NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS cement_bags_per_sft numeric NOT NULL DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS blockwork_type text NOT NULL DEFAULT 'AAC Blocks',
  ADD COLUMN IF NOT EXISTS finishing_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'Item Rate',
  ADD COLUMN IF NOT EXISTS workflow_template text NOT NULL DEFAULT 'Standard RCC Framed';
-- ===== 20260904064016_636c47f5-5c7a-47d7-9939-dedc88604d3c.sql =====
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS steel_grade text NOT NULL DEFAULT 'Fe500D',
  ADD COLUMN IF NOT EXISTS paint_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS plumbing_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS electrical_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS flooring_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS doors_windows_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS sanitaryware_spec text NOT NULL DEFAULT 'Standard';
-- ===== 20260904064042_a67fcbf7-34e0-4ef5-8a7c-274a93e3f6bb.sql =====
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS map_link text NOT NULL DEFAULT '';
-- ===== 20260904064121_88115d23-243c-4b79-85c1-0ce3a1dceff3.sql =====
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS total_staff integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engineers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labour_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landowner_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS landowner_contact text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS landowner_share_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS investor_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS investor_contact text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS investor_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_last4 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_ifsc text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_gstin text NOT NULL DEFAULT '';
-- ===== 20260904064344_c65182c5-05b9-4695-8a42-8818b4404faf.sql =====
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
-- ===== 20260904065549_a9e8f511-059b-4cf7-b5e1-eef4063b1504.sql =====
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
-- ===== 20260904070045_3364ab6d-ea94-47c5-9698-4cf3b414978f.sql =====
DROP POLICY IF EXISTS "Shared workspace can read project drawings" ON storage.objects;
DROP POLICY IF EXISTS "Shared workspace can upload project drawings" ON storage.objects;
DROP POLICY IF EXISTS "Shared workspace can delete project drawings" ON storage.objects;
-- ===== 20260904070310_6018b400-df2c-4eb4-8b69-e32e75f17f3e.sql =====
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
-- ===== 20260904070336_ad18874b-239c-4858-a4be-bb2973b6561d.sql =====
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.bootstrap_owner_admin() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_approved(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
-- ===== 20260904072948_60e5e72b-bf34-4148-aeb1-9fa464fa2e72.sql =====
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS landowners jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS investors jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.site_projects
SET landowners = jsonb_build_array(jsonb_build_object('name', landowner_name, 'contact', landowner_contact, 'share_pct', landowner_share_pct))
WHERE landowners = '[]'::jsonb AND coalesce(landowner_name, '') <> '';

UPDATE public.site_projects
SET investors = jsonb_build_array(jsonb_build_object('name', investor_name, 'contact', investor_contact, 'amount', investor_amount))
WHERE investors = '[]'::jsonb AND coalesce(investor_name, '') <> '';
-- ===== 20260904075421_0dd33cfe-5596-4044-8f23-b1773f95bfe2.sql =====
CREATE TABLE public.boq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  brand text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'ai',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_items TO authenticated;
GRANT ALL ON public.boq_items TO service_role;

ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members manage boq items" ON public.boq_items
  FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE INDEX boq_items_project_idx ON public.boq_items (project_id, sort_order);

CREATE TRIGGER set_boq_items_updated_at BEFORE UPDATE ON public.boq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260904082152_ac86df6d-8190-4d3b-9326-2ac43f67505b.sql =====
ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_source text NOT NULL DEFAULT '';
-- ===== 20260904082250_07b01653-78e9-4a25-9edf-163d334e0073.sql =====
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
-- ===== 20260904085328_44dff3c9-0b2b-433c-8d80-d03988b096a5.sql =====
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL,
  project_name text NOT NULL DEFAULT '',
  site_address text NOT NULL DEFAULT '',
  vendor_name text NOT NULL DEFAULT '',
  vendor_address text NOT NULL DEFAULT '',
  vendor_gstin text NOT NULL DEFAULT '',
  vendor_contact text NOT NULL DEFAULT '',
  vendor_email text NOT NULL DEFAULT '',
  quote_reference text NOT NULL DEFAULT '',
  po_date date NOT NULL DEFAULT current_date,
  delivery_date date,
  payment_terms text NOT NULL DEFAULT '30 days from delivery',
  delivery_terms text NOT NULL DEFAULT '',
  freight_charges numeric NOT NULL DEFAULT 0,
  other_charges numeric NOT NULL DEFAULT 0,
  tax_mode text NOT NULL DEFAULT 'intra' CHECK (tax_mode IN ('intra','inter')),
  terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  raised_by uuid,
  raised_by_name text NOT NULL DEFAULT '',
  approved_by uuid,
  approved_by_name text NOT NULL DEFAULT '',
  approved_at timestamptz,
  rejection_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members read purchase orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved members create purchase orders" ON public.purchase_orders
  FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved members update own draft purchase orders" ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (public.is_approved(auth.uid()) AND (status IN ('draft','pending') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm')))
  WITH CHECK (
    public.is_approved(auth.uid())
    AND (status IN ('draft','pending') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm'))
  );
CREATE POLICY "Admins and PMs delete purchase orders" ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pm'));

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  discount_pct numeric NOT NULL DEFAULT 0,
  gst_pct numeric NOT NULL DEFAULT 18,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members manage po items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (public.is_approved(auth.uid()))
  WITH CHECK (public.is_approved(auth.uid()));

CREATE TRIGGER set_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_po_project ON public.purchase_orders(project_id);
CREATE INDEX idx_po_items_po ON public.purchase_order_items(po_id);

CREATE OR REPLACE FUNCTION public.next_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  seq int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(po_number, '^PO-\d{4}-', ''))::int), 0) + 1
    INTO seq
  FROM public.purchase_orders
  WHERE po_number ~ ('^PO-' || yr || '-\d+$');
  RETURN 'PO-' || yr || '-' || lpad(seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_po_number() TO authenticated;

-- ===== 20260904085355_966b699e-99e0-4405-95b4-91ae03ebeabf.sql =====
REVOKE EXECUTE ON FUNCTION public.next_po_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_po_number() TO authenticated;
-- ===== 20260904094058_676c3675-dee4-4216-af87-231590b4e1bb.sql =====
-- Make chat and notifications user-assignable

ALTER TABLE public.team_messages
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_task boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL;

-- Backfill sender_id from auth context where possible (no-op for historical rows)
-- Keep existing policies; add recipient-scoped read policies for team_messages
DROP POLICY IF EXISTS "Recipients and workspace read team_messages" ON public.team_messages;
CREATE POLICY "Recipients and workspace read team_messages"
  ON public.team_messages
  FOR SELECT
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      recipient_id IS NULL
      OR recipient_id = auth.uid()
      OR sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Approved members create team_messages" ON public.team_messages;
CREATE POLICY "Approved members create team_messages"
  ON public.team_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members update team_messages" ON public.team_messages;
CREATE POLICY "Approved members update team_messages"
  ON public.team_messages
  FOR UPDATE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members delete team_messages" ON public.team_messages;
CREATE POLICY "Approved members delete team_messages"
  ON public.team_messages
  FOR DELETE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Recipient-scoped read policy for notifications
DROP POLICY IF EXISTS "Recipients and workspace read notifications" ON public.notifications;
CREATE POLICY "Recipients and workspace read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      recipient_id IS NULL
      OR recipient_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Approved members create notifications" ON public.notifications;
CREATE POLICY "Approved members create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members update notifications" ON public.notifications;
CREATE POLICY "Approved members update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members delete notifications" ON public.notifications;
CREATE POLICY "Approved members delete notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Index for fast recipient lookups
CREATE INDEX IF NOT EXISTS idx_team_messages_recipient ON public.team_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_project ON public.team_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id);

-- ===== 20260904094433_dd758fb8-f700-40d0-9e8c-f42c1db9df6c.sql =====
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
-- ===== 20260904101133_1d37fb22-2f44-4a44-92fc-2c757cd22623.sql =====
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
-- ===== 20260904104506_7159468d-917b-48bd-8ee9-b57b70b9c50c.sql =====
ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
-- ===== 20260904104539_e22bd4ca-9504-4703-a759-ef860ac10278.sql =====
CREATE POLICY "Approved members read chat attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members upload chat attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members delete chat attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-attachments' AND public.is_approved(auth.uid()));
-- ===== 20260904110233_cbb760be-f51d-44d6-8119-5bc2d27c331d.sql =====
ALTER TABLE public.team_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Open',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;
-- ===== 20260905095445_9e3de655-ed14-4c2e-b595-cdb46858753c.sql =====
ALTER TABLE public.site_projects ADD COLUMN IF NOT EXISTS brand_preferences jsonb NOT NULL DEFAULT '[]'::jsonb;
-- ===== 20260905100011_86052ede-0371-4e4c-9d27-a39010a1a703.sql =====
ALTER TABLE public.site_projects ADD COLUMN IF NOT EXISTS pmc_scope jsonb NOT NULL DEFAULT '{}'::jsonb;
-- ===== 20260905104001_e4fa21bf-14ad-4032-84b9-4be84742fdaf.sql =====
CREATE TABLE public.boq_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  boq_item_id uuid REFERENCES public.boq_items(id) ON DELETE SET NULL,
  trade text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  change_type text NOT NULL DEFAULT 'edit',
  source text NOT NULL DEFAULT 'manual',
  current_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_amount numeric NOT NULL DEFAULT 0,
  proposed_amount numeric NOT NULL DEFAULT 0,
  saving numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_name text NOT NULL DEFAULT '',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by_name text NOT NULL DEFAULT '',
  decided_at timestamp with time zone,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_change_requests TO authenticated;
GRANT ALL ON public.boq_change_requests TO service_role;

ALTER TABLE public.boq_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view change requests"
ON public.boq_change_requests FOR SELECT TO authenticated
USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can raise change requests"
ON public.boq_change_requests FOR INSERT TO authenticated
WITH CHECK (public.is_approved(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Admins and PMs can decide change requests"
ON public.boq_change_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE POLICY "Admins can delete change requests"
ON public.boq_change_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX boq_change_requests_project_status_idx
ON public.boq_change_requests (project_id, status, created_at DESC);

CREATE TRIGGER set_boq_change_requests_updated_at
BEFORE UPDATE ON public.boq_change_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260905120233_c62b8754-584d-425b-afe9-e47a61a5c182.sql =====
ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS work_scope text NOT NULL DEFAULT 'common';

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_work_scope_check CHECK (work_scope IN ('common','individual'));

CREATE INDEX IF NOT EXISTS boq_items_project_scope_idx ON public.boq_items (project_id, work_scope);
-- ===== 20260907063752_a383dfeb-a6a8-4c13-8a83-daf45384ba1c.sql =====
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name text NOT NULL DEFAULT '',
  vendor_code text NOT NULL DEFAULT '',
  trade_category text NOT NULL DEFAULT '',
  brands_supplied text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  lead_time text NOT NULL DEFAULT '',
  on_time_pct numeric NOT NULL DEFAULT 0,
  quality_rating numeric NOT NULL DEFAULT 0,
  credit_terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view vendors" ON public.vendors FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Approved members can add vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Approved members can edit vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete vendors" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX vendors_trade_category_idx ON public.vendors (trade_category);
-- ===== 20260907094723_3b236468-b65b-4f34-96ba-410bc52283b5.sql =====
CREATE TABLE public.project_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  authority text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  charge_date date,
  status text NOT NULL DEFAULT 'planned',
  allocation text NOT NULL DEFAULT 'common',
  owner_splits jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_charges_project_idx ON public.project_charges(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_charges TO authenticated;
GRANT ALL ON public.project_charges TO service_role;

ALTER TABLE public.project_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view charges"
  ON public.project_charges FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can add charges"
  ON public.project_charges FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Approved members can edit charges"
  ON public.project_charges FOR UPDATE TO authenticated
  USING (public.is_approved(auth.uid()))
  WITH CHECK (public.is_approved(auth.uid()));

CREATE POLICY "Admins and PMs can delete charges"
  ON public.project_charges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER set_project_charges_updated_at
  BEFORE UPDATE ON public.project_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260907111622_8976a6a9-944e-43ab-8716-d5c134487ef6.sql =====
CREATE TABLE public.price_quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.site_projects(id) on delete set null,
  vendor_name text not null default '',
  vendor_gstin text not null default '',
  vendor_contact text not null default '',
  quote_ref text not null default '',
  quote_date date,
  currency text not null default 'INR',
  trade text not null default '',
  source_file text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.price_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.price_quotes(id) on delete cascade,
  item_code text not null default '',
  description text not null default '',
  brand text not null default '',
  trade text not null default '',
  unit text not null default '',
  quantity numeric not null default 0,
  rate numeric not null default 0,
  discount_pct numeric not null default 0,
  gst_pct numeric not null default 0,
  net_rate numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_quotes TO authenticated;
GRANT ALL ON public.price_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_quote_items TO authenticated;
GRANT ALL ON public.price_quote_items TO service_role;

ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view quotes" ON public.price_quotes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add quotes" ON public.price_quotes FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit quotes" ON public.price_quotes FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete quotes" ON public.price_quotes FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pm'::app_role));

CREATE POLICY "Approved members can view quote items" ON public.price_quote_items FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add quote items" ON public.price_quote_items FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit quote items" ON public.price_quote_items FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete quote items" ON public.price_quote_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pm'::app_role));

CREATE TRIGGER price_quotes_updated_at BEFORE UPDATE ON public.price_quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER price_quote_items_updated_at BEFORE UPDATE ON public.price_quote_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX price_quote_items_quote_id_idx ON public.price_quote_items(quote_id);
-- ===== 20260907133214_8a721214-86cd-4f52-903e-a45a1ec533a2.sql =====
CREATE POLICY "Approved members upload proformas" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'price-proformas' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members read proformas" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'price-proformas' AND public.is_approved(auth.uid()));
CREATE POLICY "Approved members delete proformas" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'price-proformas' AND public.is_approved(auth.uid()));
-- ===== 20260907163225_3b0c8bd7-249e-4a4e-a255-3681baf8aee0.sql =====
CREATE TABLE public.stock_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  opening_qty numeric NOT NULL DEFAULT 0,
  reorder_level numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  store_location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.stock_items(id) ON DELETE CASCADE,
  item_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  movement_type text NOT NULL DEFAULT 'receipt',
  quantity numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  movement_date date NOT NULL DEFAULT current_date,
  reference text NOT NULL DEFAULT '',
  party text NOT NULL DEFAULT '',
  handled_by text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO authenticated;
GRANT ALL ON public.stock_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view stock items" ON public.stock_items FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add stock items" ON public.stock_items FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit stock items" ON public.stock_items FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete stock items" ON public.stock_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pm'::app_role));

CREATE POLICY "Approved members can view stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add stock movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit stock movements" ON public.stock_movements FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete stock movements" ON public.stock_movements FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pm'::app_role));

CREATE TRIGGER stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER stock_movements_updated_at BEFORE UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260907163456_8b7e96ff-62dc-4932-b6d0-f561d17867e9.sql =====
CREATE TABLE public.bills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  bill_number text NOT NULL DEFAULT '',
  bill_date date,
  due_date date,
  vendor_name text NOT NULL DEFAULT '',
  vendor_gstin text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  basic_amount numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  other_charges numeric NOT NULL DEFAULT 0,
  retention_amount numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  attachment_path text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bill_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT current_date,
  amount numeric NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'bank transfer',
  reference text NOT NULL DEFAULT '',
  paid_from text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payments TO authenticated;
GRANT ALL ON public.bill_payments TO service_role;

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view bills" ON public.bills FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add bills" ON public.bills FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit bills" ON public.bills FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete bills" ON public.bills FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pm'::app_role));

CREATE POLICY "Approved members can view bill payments" ON public.bill_payments FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved members can add bill payments" ON public.bill_payments FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Approved members can edit bill payments" ON public.bill_payments FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Admins and PMs can delete bill payments" ON public.bill_payments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pm'::app_role));

CREATE TRIGGER bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bill_payments_updated_at BEFORE UPDATE ON public.bill_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260921071650_781d508e-eeb8-4c82-9279-8671b75ad35f.sql =====
CREATE TABLE public.capital_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  owner_name text NOT NULL DEFAULT '',
  owner_role text NOT NULL DEFAULT '',
  entry_type text NOT NULL DEFAULT 'receipt',
  amount numeric NOT NULL DEFAULT 0,
  entry_date date,
  milestone text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'received',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capital_entries TO authenticated;
GRANT ALL ON public.capital_entries TO service_role;

ALTER TABLE public.capital_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capital_entries_select" ON public.capital_entries FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_insert" ON public.capital_entries FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_update" ON public.capital_entries FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "capital_entries_delete" ON public.capital_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TRIGGER capital_entries_updated_at BEFORE UPDATE ON public.capital_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX capital_entries_project_idx ON public.capital_entries(project_id);
-- ===== 20260921072812_693d5b5e-12d5-43ee-8af8-d250d2e26483.sql =====
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
-- ===== 20260921072851_c3ad4e55-8d36-46a9-aaa6-3ac17acba1ee.sql =====
CREATE POLICY "owner_approvals_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()))
  WITH CHECK (bucket_id = 'owner-approvals' AND public.is_approved(auth.uid()));
CREATE POLICY "owner_approvals_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'owner-approvals' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm')));
-- ===== 20260921075044_6d5b138a-fa75-407c-9110-05f4be4450f3.sql =====
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
-- ===== 20260921075109_d10a6852-a457-4b84-85cd-cf84f25ad42a.sql =====
REVOKE ALL ON FUNCTION public.is_pmc_team(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.can_see_owner_request(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_pmc_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_owner_request(uuid, text, text) TO authenticated;
-- ===== 20260921081219_de79445d-93ef-4c77-93cf-92af99704d02.sql =====
create policy "financial_docs_read" on storage.objects for select to authenticated
  using (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_update" on storage.objects for update to authenticated
  using (bucket_id = 'financial-docs' and is_approved(auth.uid()))
  with check (bucket_id = 'financial-docs' and is_approved(auth.uid()));
create policy "financial_docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'financial-docs' and (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'pm'::app_role) or has_role(auth.uid(), 'accounts'::app_role)));
-- ===== 20260921085228_7a11668f-9cfc-4c57-98ac-d932cc6954aa.sql =====
CREATE TABLE public.rfqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  rfq_number text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  spec text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  deadline date,
  budget_estimate numeric NOT NULL DEFAULT 0,
  awarded_bid_id uuid,
  awarded_vendor_name text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfqs_select" ON public.rfqs FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfqs_delete" ON public.rfqs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TABLE public.rfq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'MT',
  benchmark_rate numeric NOT NULL DEFAULT 0,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_items TO authenticated;
GRANT ALL ON public.rfq_items TO service_role;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfq_items_select" ON public.rfq_items FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_insert" ON public.rfq_items FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_update" ON public.rfq_items FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_items_delete" ON public.rfq_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE TABLE public.rfq_bids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_name text NOT NULL DEFAULT '',
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  freight_total numeric NOT NULL DEFAULT 0,
  payment_terms text NOT NULL DEFAULT '',
  lead_time text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_bids TO authenticated;
GRANT ALL ON public.rfq_bids TO service_role;
ALTER TABLE public.rfq_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfq_bids_select" ON public.rfq_bids FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_insert" ON public.rfq_bids FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_update" ON public.rfq_bids FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "rfq_bids_delete" ON public.rfq_bids FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));

CREATE INDEX rfqs_project_idx ON public.rfqs(project_id);
CREATE INDEX rfq_items_rfq_idx ON public.rfq_items(rfq_id);
CREATE INDEX rfq_bids_rfq_idx ON public.rfq_bids(rfq_id);

CREATE TRIGGER rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rfq_bids_updated_at BEFORE UPDATE ON public.rfq_bids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260921093230_a40c0abe-ca1d-456a-b7db-544d481ce615.sql =====
CREATE TABLE public.site_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  sort int NOT NULL DEFAULT 0,
  planned_pct numeric NOT NULL DEFAULT 0,
  actual_pct numeric NOT NULL DEFAULT 0,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  status text NOT NULL DEFAULT 'not started',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_stages TO authenticated;
GRANT ALL ON public.site_stages TO service_role;
ALTER TABLE public.site_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_stages_select" ON public.site_stages FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_insert" ON public.site_stages FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_update" ON public.site_stages FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "site_stages_delete" ON public.site_stages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX site_stages_project_idx ON public.site_stages(project_id, sort);
CREATE TRIGGER site_stages_updated_at BEFORE UPDATE ON public.site_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.labour_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  contractor text NOT NULL DEFAULT '',
  trade text NOT NULL DEFAULT '',
  headcount numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 8,
  day_rate numeric NOT NULL DEFAULT 0,
  work_done text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  supervisor text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.labour_entries TO authenticated;
GRANT ALL ON public.labour_entries TO service_role;
ALTER TABLE public.labour_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "labour_entries_select" ON public.labour_entries FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_insert" ON public.labour_entries FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_update" ON public.labour_entries FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "labour_entries_delete" ON public.labour_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX labour_entries_project_idx ON public.labour_entries(project_id, work_date DESC);
CREATE TRIGGER labour_entries_updated_at BEFORE UPDATE ON public.labour_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pour_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  pour_ref text NOT NULL DEFAULT '',
  element text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT 'M25',
  quantity_cum numeric NOT NULL DEFAULT 0,
  pour_date date,
  slump text NOT NULL DEFAULT '',
  cubes_cast numeric NOT NULL DEFAULT 0,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  requested_by_name text NOT NULL DEFAULT '',
  approved_by uuid REFERENCES auth.users(id),
  approved_by_name text NOT NULL DEFAULT '',
  approved_at timestamptz,
  remarks text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pour_cards TO authenticated;
GRANT ALL ON public.pour_cards TO service_role;
ALTER TABLE public.pour_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pour_cards_select" ON public.pour_cards FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_insert" ON public.pour_cards FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_update" ON public.pour_cards FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "pour_cards_delete" ON public.pour_cards FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX pour_cards_project_idx ON public.pour_cards(project_id, pour_date DESC);
CREATE TRIGGER pour_cards_updated_at BEFORE UPDATE ON public.pour_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.qa_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  inspected_on date NOT NULL DEFAULT CURRENT_DATE,
  location_tag text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  code_ref text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'Low',
  findings text NOT NULL DEFAULT '',
  defect_count int NOT NULL DEFAULT 0,
  resolution text NOT NULL DEFAULT 'Open',
  inspector_name text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_inspections TO authenticated;
GRANT ALL ON public.qa_inspections TO service_role;
ALTER TABLE public.qa_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_inspections_select" ON public.qa_inspections FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_insert" ON public.qa_inspections FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_update" ON public.qa_inspections FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "qa_inspections_delete" ON public.qa_inspections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX qa_inspections_project_idx ON public.qa_inspections(project_id, inspected_on DESC);
CREATE TRIGGER qa_inspections_updated_at BEFORE UPDATE ON public.qa_inspections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.site_projects(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'progress',
  captured_on date,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO authenticated;
GRANT ALL ON public.project_media TO service_role;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_media_select" ON public.project_media FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "project_media_insert" ON public.project_media FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "project_media_update" ON public.project_media FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "project_media_delete" ON public.project_media FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm'));
CREATE INDEX project_media_project_idx ON public.project_media(project_id, created_at DESC);
CREATE TRIGGER project_media_updated_at BEFORE UPDATE ON public.project_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260921093927_75e136aa-d798-462d-b757-f03481d56c0d.sql =====
CREATE POLICY "site_media_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-media' AND public.is_approved(auth.uid()));
CREATE POLICY "site_media_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_approved(auth.uid()));
CREATE POLICY "site_media_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_approved(auth.uid())) WITH CHECK (bucket_id = 'site-media' AND public.is_approved(auth.uid()));
CREATE POLICY "site_media_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pm')));
-- ===== storage buckets used by the app (all private) =====
insert into storage.buckets (id, name, public) values
  ('project-drawings','project-drawings',false),
  ('site-media','site-media',false),
  ('boq-images','boq-images',false),
  ('owner-approvals','owner-approvals',false),
  ('chat-attachments','chat-attachments',false),
  ('financial-docs','financial-docs',false),
  ('price-proformas','price-proformas',false)
on conflict (id) do nothing;
-- Report sync (BOQ packages + GST, programme fields) and the profile self-approval fix.
-- Safe to run more than once.

-- 1. Security: a member may change only their own name and note. Approval status,
--    approver and e-mail change only through an admin (or the database itself, e.g.
--    the sign-up and owner-bootstrap triggers, which run without a signed-in user).
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.email is distinct from old.email then
    raise exception 'Only an admin can change approval, approver or e-mail on a profile';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- 2. BOQ lines carry the report's package, sub-group and GST rate.
alter table public.boq_items
  add column if not exists package text not null default '',
  add column if not exists package_no integer not null default 0,
  add column if not exists line_group text not null default '',
  add column if not exists gst_pct numeric not null default 18;

-- 3. Project figures the report uses for totals and Rs/sft.
alter table public.site_projects
  add column if not exists saleable_sft numeric not null default 0,
  add column if not exists contingency_pct numeric not null default 5,
  add column if not exists estimate_amount numeric not null default 0;

-- 4. Programme stages carry their code, group, floor, duration, predecessors and
--    the inspection checks (hold / witness points) that apply to them.
alter table public.site_stages
  add column if not exists code text not null default '',
  add column if not exists stage_group text not null default '',
  add column if not exists floor text not null default '',
  add column if not exists duration_days integer not null default 0,
  add column if not exists preds text[] not null default '{}',
  add column if not exists checks jsonb not null default '[]'::jsonb,
  add column if not exists hold_point boolean not null default false,
  add column if not exists materials jsonb not null default '[]'::jsonb,
  add column if not exists steel jsonb,
  add column if not exists directions jsonb not null default '[]'::jsonb;

-- 5. Project-level notes from the control workbook: flow of events, pre-start list, principles.
alter table public.site_projects
  add column if not exists control_notes jsonb not null default '{}'::jsonb;

create index if not exists site_stages_project_code on public.site_stages (project_id, code);
create index if not exists boq_items_project_package on public.boq_items (project_id, package_no);
-- Stage close-out: the evidence a stage needs before the next one is released
-- (inspection results per check, who closed it and when). Safe to run more than once.
alter table public.site_stages
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid,
  add column if not exists closed_by_name text not null default '';

notify pgrst, 'reload schema';
-- Stage finance: the budget each programme stage needs, the payment request
-- sent to the landowners for it, and the actual cost after the stage, which
-- goes to the landowners only after an admin / PM has approved it.
create table if not exists public.stage_finance (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  stage_code text not null,
  budget jsonb not null default '{}'::jsonb,
  call_total numeric not null default 0,
  called_at timestamptz,
  called_by uuid,
  actual jsonb not null default '{}'::jsonb,
  actual_total numeric not null default 0,
  actual_status text not null default 'none',
  approved_by uuid,
  approved_by_name text not null default '',
  approved_at timestamptz,
  sent_at timestamptz,
  credit_carried numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, stage_code)
);

grant select, insert, update, delete on public.stage_finance to authenticated;
grant all on public.stage_finance to service_role;
alter table public.stage_finance enable row level security;

drop policy if exists "Approved members can view stage finance" on public.stage_finance;
create policy "Approved members can view stage finance" on public.stage_finance
  for select to authenticated using (public.is_approved(auth.uid()));
drop policy if exists "Approved members can add stage finance" on public.stage_finance;
create policy "Approved members can add stage finance" on public.stage_finance
  for insert to authenticated with check (public.is_approved(auth.uid()));
drop policy if exists "Approved members can edit stage finance" on public.stage_finance;
create policy "Approved members can edit stage finance" on public.stage_finance
  for update to authenticated using (public.is_approved(auth.uid())) with check (public.is_approved(auth.uid()));
drop policy if exists "Admins and PMs can delete stage finance" on public.stage_finance;
create policy "Admins and PMs can delete stage finance" on public.stage_finance
  for delete to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'pm'));

-- Only an admin or PM may approve an actual cost or send it to the landowners.
create or replace function public.stage_finance_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'pm') then
    return new;
  end if;
  if new.actual_status in ('approved', 'sent')
     and (tg_op = 'INSERT' or new.actual_status is distinct from old.actual_status) then
    raise exception 'Only an admin or PM can approve or send a stage cost';
  end if;
  if tg_op = 'UPDATE' and (new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.called_at is distinct from old.called_at) then
    raise exception 'Only an admin or PM can approve costs or request payments';
  end if;
  if tg_op = 'INSERT' and (new.approved_by is not null or new.called_at is not null) then
    raise exception 'Only an admin or PM can approve costs or request payments';
  end if;
  return new;
end;
$$;

drop trigger if exists stage_finance_guard on public.stage_finance;
create trigger stage_finance_guard
  before insert or update on public.stage_finance
  for each row execute function public.stage_finance_guard();

drop trigger if exists set_stage_finance_updated_at on public.stage_finance;
create trigger set_stage_finance_updated_at
  before update on public.stage_finance
  for each row execute function public.set_updated_at();

create index if not exists stage_finance_project on public.stage_finance (project_id);

notify pgrst, 'reload schema';
-- Link purchases, bills, labour and stock issues to the programme stage they are for,
-- so the site plan knows what is ordered and each stage's actual cost adds itself up.
alter table public.purchase_orders add column if not exists stage_code text not null default '';
alter table public.purchase_order_items
  add column if not exists stage_code text not null default '',
  add column if not exists material_key text not null default '';
alter table public.bills
  add column if not exists stage_code text not null default '',
  add column if not exists cost_type text not null default 'material';
alter table public.labour_entries add column if not exists stage_code text not null default '';
alter table public.stock_movements add column if not exists stage_code text not null default '';
create index if not exists purchase_order_items_stage on public.purchase_order_items (stage_code);
create index if not exists bills_project_stage on public.bills (project_id, stage_code);
create index if not exists labour_entries_project_stage on public.labour_entries (project_id, stage_code);
notify pgrst, 'reload schema';
-- Edit and delete rights by role, enforced in the database (not only on screen).
--   admin / pm (managers): everything; project settings and BOQ rates only by them.
--   accounts: money records (bills, payments, capital entries, charges) with the managers.
--   site_engineer / site_supervisor / purchase_stores: site records (stages, labour, pours,
--     QA, media, stock, purchase orders, tenders, vendors).
--   landowner_investor only: read-only, except their own decisions on owner requests.
-- Also removes the blanket "ALL" policies that let every member read every direct
-- message and notification. Safe to run more than once.

create or replace function public.is_manager(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_uid, 'admin') or public.has_role(_uid, 'pm');
$$;

create or replace function public.can_money(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved(_uid)
     and (public.has_role(_uid, 'admin') or public.has_role(_uid, 'pm') or public.has_role(_uid, 'accounts'));
$$;

-- Approved and holding at least one role other than landowner / investor.
create or replace function public.can_write(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved(_uid)
     and exists (select 1 from public.user_roles where user_id = _uid and role <> 'landowner_investor');
$$;

grant execute on function public.is_manager(uuid), public.can_money(uuid), public.can_write(uuid) to authenticated;

-- Projects: read by members, changed by managers, deleted by admins.
drop policy if exists "Approved members manage projects" on public.site_projects;
drop policy if exists "site_projects_select" on public.site_projects;
drop policy if exists "site_projects_insert" on public.site_projects;
drop policy if exists "site_projects_update" on public.site_projects;
drop policy if exists "site_projects_delete" on public.site_projects;
create policy "site_projects_select" on public.site_projects for select to authenticated using (public.is_approved(auth.uid()));
create policy "site_projects_insert" on public.site_projects for insert to authenticated with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
create policy "site_projects_update" on public.site_projects for update to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid())) with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
create policy "site_projects_delete" on public.site_projects for delete to authenticated using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- BOQ: read by members, changed by managers (others raise change requests).
drop policy if exists "Approved members manage boq items" on public.boq_items;
drop policy if exists "boq_items_select" on public.boq_items;
drop policy if exists "boq_items_write" on public.boq_items;
create policy "boq_items_select" on public.boq_items for select to authenticated using (public.is_approved(auth.uid()));
create policy "boq_items_write" on public.boq_items for all to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid())) with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

-- Money records: added and edited by managers and accounts.
do $$
declare t text;
begin
  foreach t in array array['bills', 'bill_payments', 'capital_entries', 'project_charges'] loop
    execute format('drop policy if exists %I on public.%I', t || '_money_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_money_update', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_money(auth.uid()))', t || '_money_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_money(auth.uid())) with check (public.can_money(auth.uid()))', t || '_money_update', t);
  end loop;
end $$;
drop policy if exists "Approved members can add bills" on public.bills;
drop policy if exists "Approved members can edit bills" on public.bills;
drop policy if exists "Approved members can add bill payments" on public.bill_payments;
drop policy if exists "Approved members can edit bill payments" on public.bill_payments;
drop policy if exists "capital_entries_insert" on public.capital_entries;
drop policy if exists "capital_entries_update" on public.capital_entries;
drop policy if exists "Approved members can add charges" on public.project_charges;
drop policy if exists "Approved members can edit charges" on public.project_charges;

-- Site records: added and edited by the site, stores and office team (not landowner-only users).
do $$
declare
  t text;
  pol record;
begin
  foreach t in array array['site_stages', 'labour_entries', 'pour_cards', 'qa_inspections', 'project_media',
    'stock_items', 'stock_movements', 'purchase_orders', 'purchase_order_items', 'rfqs', 'rfq_items',
    'rfq_bids', 'vendors', 'price_quotes', 'price_quote_items', 'stage_finance'] loop
    -- drop the old "any approved member" insert / update / all policies
    for pol in select policyname, cmd from pg_policies
               where schemaname = 'public' and tablename = t and cmd in ('INSERT', 'UPDATE', 'ALL') loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t || '_team_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t || '_team_update', t);
  end loop;
end $$;
-- purchase orders: keep the rule that only drafts / pending POs change, unless a manager.
drop policy if exists "purchase_orders_team_update" on public.purchase_orders;
create policy "purchase_orders_team_update" on public.purchase_orders for update to authenticated
  using (public.can_write(auth.uid()) and (status in ('draft', 'pending') or public.is_manager(auth.uid())))
  with check (public.can_write(auth.uid()));
-- purchase order items had a single ALL policy: give back read and delete.
drop policy if exists "purchase_order_items_select" on public.purchase_order_items;
drop policy if exists "purchase_order_items_delete" on public.purchase_order_items;
create policy "purchase_order_items_select" on public.purchase_order_items for select to authenticated using (public.is_approved(auth.uid()));
create policy "purchase_order_items_delete" on public.purchase_order_items for delete to authenticated using (public.can_write(auth.uid()));

-- Direct messages and notifications: drop the blanket policies that exposed everyone's.
drop policy if exists "Approved members manage messages" on public.team_messages;
drop policy if exists "Approved members manage notifications" on public.notifications;
-- recipients may update what was sent to them (mark read, task progress); workspace-wide items by the team.
drop policy if exists "Approved members update team_messages" on public.team_messages;
create policy "Approved members update team_messages" on public.team_messages for update to authenticated
  using (public.is_approved(auth.uid()) and (sender_id = auth.uid() or recipient_id = auth.uid()
    or public.is_manager(auth.uid()) or (recipient_id is null and public.can_write(auth.uid()))))
  with check (public.is_approved(auth.uid()));
drop policy if exists "Approved members update notifications" on public.notifications;
create policy "Approved members update notifications" on public.notifications for update to authenticated
  using (public.is_approved(auth.uid()) and (sender_id = auth.uid() or recipient_id = auth.uid()
    or recipient_id is null or public.has_role(auth.uid(), 'admin')))
  with check (public.is_approved(auth.uid()));

-- Drawings: only managers delete or overwrite them.
drop policy if exists "Approved members delete drawings" on storage.objects;
create policy "Approved members delete drawings" on storage.objects for delete to authenticated
  using (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
drop policy if exists "Approved members update drawings" on storage.objects;
create policy "Approved members update drawings" on storage.objects for update to authenticated
  using (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()))
  with check (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

notify pgrst, 'reload schema';
-- Material plan dates on stock items: reorder alarms only once a material is due.
alter table public.stock_items
  add column if not exists first_needed date,
  add column if not exists order_by date;
update public.stock_items
   set order_by = to_date(substring(notes from 'order by (\d{1,2} [A-Za-z]{3} \d{4})'), 'DD Mon YYYY')
 where order_by is null and notes ~ 'order by \d{1,2} [A-Za-z]{3} \d{4}';
update public.stock_items
   set first_needed = to_date(substring(notes from 'first needed (\d{1,2} [A-Za-z]{3} \d{4})'), 'DD Mon YYYY')
 where first_needed is null and notes ~ 'first needed \d{1,2} [A-Za-z]{3} \d{4}';
notify pgrst, 'reload schema';
-- Review notes (14 Oct): supervisors may enter and edit bills and BOQ rates, but only
-- an admin approves them; only an admin deletes a project.
-- Bills: the site / office team adds and edits draft and verified bills; approving a bill,
-- and any change to an approved bill, is for an admin; marking paid for admin, accounts or PM.
drop policy if exists "bills_money_insert" on public.bills;
drop policy if exists "bills_money_update" on public.bills;
drop policy if exists "bills_team_insert" on public.bills;
drop policy if exists "bills_team_update" on public.bills;
create policy "bills_team_insert" on public.bills for insert to authenticated with check (public.can_write(auth.uid()));
create policy "bills_team_update" on public.bills for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()));

create or replace function public.bills_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('approved', 'paid')
     and not ((public.has_role(auth.uid(), 'accounts') or public.has_role(auth.uid(), 'pm')) and new.status = 'paid'
              and new.basic_amount = old.basic_amount and new.gst_amount = old.gst_amount
              and new.other_charges = old.other_charges and new.deductions = old.deductions
              and new.retention_amount = old.retention_amount) then
    raise exception 'This bill is approved: only an admin can change it';
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    raise exception 'Only an admin can approve a bill';
  end if;
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid')
     and not (public.has_role(auth.uid(), 'accounts') or public.has_role(auth.uid(), 'pm')) then
    raise exception 'Only an admin, accounts or PM can mark a bill paid';
  end if;
  return new;
end;
$$;
drop trigger if exists bills_guard on public.bills;
create trigger bills_guard before insert or update on public.bills
  for each row execute function public.bills_guard();

-- BOQ change requests are decided by an admin.
drop policy if exists "Admins and PMs can decide change requests" on public.boq_change_requests;
drop policy if exists "Admins decide change requests" on public.boq_change_requests;
create policy "Admins decide change requests" on public.boq_change_requests for update to authenticated
  using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'))
  with check (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'));

notify pgrst, 'reload schema';
-- Quality registers from the PMC control workbook: checklist log (ITP check per stage),
-- cube-test register (every pour, IS 456 samples, 7/28-day results) and NCR log.
create table if not exists public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  stage_code text not null,
  floor text not null default '',
  itp_id text not null,
  check_name text not null default '',
  point text not null default '',
  planned_date date,
  inspected_on date,
  result text not null default '',
  inspector text not null default '',
  signed_by text not null default '',
  ncr_no text not null default '',
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, stage_code, itp_id)
);

create table if not exists public.cube_tests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  stage_code text not null,
  pour text not null,
  grade text not null default 'M30',
  volume_m3 numeric not null default 0,
  planned_pour_date date,
  actual_pour_date date,
  samples integer not null default 0,
  cubes integer not null default 0,
  mean_7 numeric,
  cube_28_1 numeric,
  cube_28_2 numeric,
  cube_28_3 numeric,
  lab text not null default '',
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, stage_code, pour)
);

create table if not exists public.ncrs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  ncr_no text not null,
  raised_on date not null default current_date,
  stage_code text not null default '',
  location text not null default '',
  itp_id text not null default '',
  what_wrong text not null default '',
  cause text not null default '',
  correction text not null default '',
  raised_by text not null default '',
  target_date date,
  closed_on date,
  status text not null default 'OPEN',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, ncr_no)
);

do $$
declare t text;
begin
  foreach t in array array['quality_checks', 'cube_tests', 'ncrs'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_approved(auth.uid()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid()))', t || '_delete', t);
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
  end loop;
end $$;

create index if not exists quality_checks_project on public.quality_checks (project_id, stage_code);
create index if not exists cube_tests_project on public.cube_tests (project_id);
create index if not exists ncrs_project on public.ncrs (project_id, status);

notify pgrst, 'reload schema';

-- Flats and flat types. Common works are the landowners' PMC (by share %);
-- individual works belong to each flat (by flat type) and go to the flat's owner.
-- More flat types can be added; each type carries its own individual-works lines.
create table if not exists public.flat_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  code text not null,
  label text not null default '',
  bhk integer not null default 0,
  floors text not null default '',
  saleable_sft numeric not null default 0,
  indiv_excl numeric not null default 0,
  indiv_incl numeric not null default 0,
  indiv_total numeric not null default 0,
  lines jsonb not null default '[]'::jsonb,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  flat_no text not null,
  floor integer not null default 0,
  type_code text not null default '',
  owner_name text not null default '',
  saleable_sft numeric not null default 0,
  owner_extra numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, flat_no)
);

do $$
declare t text;
begin
  foreach t in array array['flat_types', 'flats'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_approved(auth.uid()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid())) with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), ''admin''))', t || '_delete', t);
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
  end loop;
end $$;

create index if not exists flats_project on public.flats (project_id);

notify pgrst, 'reload schema';

-- Tenders: at least three vendor quotes before award, award item by item,
-- and the award becomes purchase orders (one per awarded vendor).
alter table public.rfqs add column if not exists item_awards jsonb not null default '{}'::jsonb;
alter table public.rfqs add column if not exists award_note text not null default '';
alter table public.rfqs add column if not exists awarded_by uuid;
alter table public.rfqs add column if not exists awarded_by_name text not null default '';
alter table public.rfqs add column if not exists awarded_at timestamptz;
alter table public.rfqs add column if not exists po_numbers jsonb not null default '[]'::jsonb;

alter table public.rfq_items add column if not exists item_code text not null default '';
alter table public.rfq_items add column if not exists gst_pct numeric not null default 18;
-- Items imported earlier carry the code at the start of the description ("ST05 · …").
update public.rfq_items set item_code = split_part(description, ' · ', 1)
  where item_code = '' and description ~ '^[A-Z]{1,4}[0-9]{0,3}[a-z]?(-[A-Z0-9]{1,4})? · ';

-- Where a bid came from: '' typed in the app, 'workbook' from the quotation workbook.
alter table public.rfq_bids add column if not exists source text not null default '';

create or replace function public.rfqs_award_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare q integer;
begin
  if auth.uid() is null then return new; end if;
  if new.status = 'awarded' and (tg_op = 'INSERT' or old.status is distinct from 'awarded') then
    if not public.is_manager(auth.uid()) then
      raise exception 'Only an admin or PM can award a tender';
    end if;
    select count(*) into q from public.rfq_bids where rfq_id = new.id and rates <> '{}'::jsonb;
    if q < 3 and not (public.has_role(auth.uid(), 'admin') and btrim(new.award_note) <> '') then
      raise exception 'At least 3 vendor quotes are needed before award (% received). Only an admin can award with fewer, and must give the reason.', q;
    end if;
    new.awarded_by := auth.uid();
    new.awarded_at := now();
  end if;
  if tg_op = 'UPDATE' and old.status = 'awarded' and new.status is distinct from 'awarded'
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only an admin can reopen an awarded tender';
  end if;
  return new;
end;
$$;
drop trigger if exists rfqs_award_guard on public.rfqs;
create trigger rfqs_award_guard before insert or update on public.rfqs
  for each row execute function public.rfqs_award_guard();

notify pgrst, 'reload schema';
