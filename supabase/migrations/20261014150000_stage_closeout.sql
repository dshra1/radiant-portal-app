-- Stage close-out: the evidence a stage needs before the next one is released
-- (inspection results per check, who closed it and when). Safe to run more than once.
alter table public.site_stages
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid,
  add column if not exists closed_by_name text not null default '';

notify pgrst, 'reload schema';
