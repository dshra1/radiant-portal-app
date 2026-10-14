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
