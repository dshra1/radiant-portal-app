-- Programme re-planning: each stage keeps its baseline (the report's dates) while
-- the planned dates follow the latest re-plan; every applied re-plan is logged.
-- Only admin / PM change programme dates.

alter table public.site_stages
  add column if not exists baseline_start date,
  add column if not exists baseline_end date;
update public.site_stages
   set baseline_start = planned_start, baseline_end = planned_end
 where baseline_start is null and baseline_end is null;

create table if not exists public.programme_replans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  applied_by uuid,
  applied_by_name text not null default '',
  handover_before date,
  handover_after date,
  stages_moved integer not null default 0,
  monsoon boolean not null default false,
  reason text not null default '',
  summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.programme_replans to authenticated;
grant all on public.programme_replans to service_role;
alter table public.programme_replans enable row level security;
drop policy if exists programme_replans_select on public.programme_replans;
drop policy if exists programme_replans_insert on public.programme_replans;
create policy programme_replans_select on public.programme_replans for select to authenticated
  using (public.is_approved(auth.uid()));
create policy programme_replans_insert on public.programme_replans for insert to authenticated
  with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
create index if not exists programme_replans_project on public.programme_replans (project_id, created_at desc);

create or replace function public.site_stages_dates_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_manager(auth.uid()) then
    return new;
  end if;
  if new.planned_start is distinct from old.planned_start
     or new.planned_end is distinct from old.planned_end
     or new.baseline_start is distinct from old.baseline_start
     or new.baseline_end is distinct from old.baseline_end then
    raise exception 'Only the admin or PM can change programme dates (use Re-plan)';
  end if;
  return new;
end;
$$;
drop trigger if exists site_stages_dates_guard on public.site_stages;
create trigger site_stages_dates_guard before update on public.site_stages
  for each row execute function public.site_stages_dates_guard();

notify pgrst, 'reload schema';
