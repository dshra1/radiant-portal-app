-- Fix: sahadeveloperz@gmail.com signing in still lands on "Awaiting approval".
-- The owner-admin triggers only fire when an auth user is created or first confirms
-- their email. The owner account existed before those triggers were added, so it
-- never got approved or given the admin role. Backfill it once. Safe to re-run.

INSERT INTO public.profiles (id, email, status, approved_at)
SELECT u.id, lower(u.email), 'approved', now()
FROM auth.users u
WHERE lower(u.email) = 'sahadeveloperz@gmail.com'
  AND u.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE
  SET status = 'approved',
      approved_at = COALESCE(public.profiles.approved_at, now());

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE lower(u.email) = 'sahadeveloperz@gmail.com'
  AND u.email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
