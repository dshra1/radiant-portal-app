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
