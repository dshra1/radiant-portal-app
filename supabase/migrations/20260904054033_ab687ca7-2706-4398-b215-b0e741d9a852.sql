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