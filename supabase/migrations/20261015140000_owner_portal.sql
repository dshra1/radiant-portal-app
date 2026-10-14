-- Landowner portal: link a login to a landowner, the options an owner may pick
-- for the individual works of their flat, their selections and approvals, and
-- change requests on common or individual works.

-- Which landowner a login is (set by the admin when approving the login).
create table if not exists public.owner_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  owner_name text not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.owner_links to authenticated;
grant all on public.owner_links to service_role;
alter table public.owner_links enable row level security;
drop policy if exists owner_links_select on public.owner_links;
drop policy if exists owner_links_write on public.owner_links;
create policy owner_links_select on public.owner_links for select to authenticated
  using (user_id = auth.uid() or (public.is_approved(auth.uid()) and public.is_manager(auth.uid())));
create policy owner_links_write on public.owner_links for all to authenticated
  using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'))
  with check (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create or replace function public.owner_name_of(_uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select owner_name from public.owner_links where user_id = _uid), '');
$$;
grant execute on function public.owner_name_of(uuid) to authenticated;

-- True when this login is the owner of the flat (or of the landowner named).
create or replace function public.owns_flat(_uid uuid, _project uuid, _flat text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved(_uid)
     and public.owner_name_of(_uid) <> ''
     and exists (select 1 from public.flats f
                 where f.project_id = _project and f.flat_no = _flat
                   and lower(btrim(f.owner_name)) = lower(btrim(public.owner_name_of(_uid))));
$$;
grant execute on function public.owns_flat(uuid, uuid, text) to authenticated;

-- Alternatives to our specification for an individual-works item (the default
-- is the flat type's own line). type_code '' = every flat type.
create table if not exists public.flat_options (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  item_code text not null,
  type_code text not null default '',
  label text not null,
  make text not null default '',
  rate numeric not null default 0,
  gst_pct numeric not null default 18,
  note text not null default '',
  sort integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flat_options_item on public.flat_options (project_id, item_code);

-- What each flat's owner chose, per item. option_id null = our specification.
create table if not exists public.flat_selections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  flat_no text not null,
  item_code text not null,
  option_id uuid references public.flat_options(id) on delete set null,
  delta numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'owner_approved', 'accepted', 'rejected')),
  owner_note text not null default '',
  pmc_note text not null default '',
  chosen_by uuid,
  chosen_at timestamptz,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, flat_no, item_code)
);

-- Requests for changes from an owner (common works or their flat).
create table if not exists public.owner_change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.site_projects(id) on delete cascade,
  owner_name text not null,
  scope text not null default 'common' check (scope in ('common', 'flat')),
  flat_no text not null default '',
  item_code text not null default '',
  subject text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'accepted', 'declined', 'done')),
  response text not null default '',
  created_by uuid,
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['flat_options', 'flat_selections', 'owner_change_requests'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
  end loop;
end $$;

-- options: read by members, kept by admin / PM
drop policy if exists flat_options_select on public.flat_options;
drop policy if exists flat_options_write on public.flat_options;
create policy flat_options_select on public.flat_options for select to authenticated using (public.is_approved(auth.uid()));
create policy flat_options_write on public.flat_options for all to authenticated
  using (public.is_approved(auth.uid()) and public.is_manager(auth.uid()))
  with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

-- selections: read by members; written by the flat's owner or admin / PM
drop policy if exists flat_selections_select on public.flat_selections;
drop policy if exists flat_selections_insert on public.flat_selections;
drop policy if exists flat_selections_update on public.flat_selections;
drop policy if exists flat_selections_delete on public.flat_selections;
create policy flat_selections_select on public.flat_selections for select to authenticated using (public.is_approved(auth.uid()));
create policy flat_selections_insert on public.flat_selections for insert to authenticated
  with check (public.is_manager(auth.uid()) or public.owns_flat(auth.uid(), project_id, flat_no));
create policy flat_selections_update on public.flat_selections for update to authenticated
  using (public.is_manager(auth.uid()) or public.owns_flat(auth.uid(), project_id, flat_no))
  with check (public.is_manager(auth.uid()) or public.owns_flat(auth.uid(), project_id, flat_no));
create policy flat_selections_delete on public.flat_selections for delete to authenticated
  using (public.is_manager(auth.uid()) or (public.owns_flat(auth.uid(), project_id, flat_no) and status = 'draft'));

-- An owner chooses and approves; only admin / PM accept or reject into the plan.
-- Once accepted, the owner cannot change it (they raise a change request).
create or replace function public.flat_selections_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_manager(auth.uid()) then
    if new.status in ('accepted', 'rejected') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
      new.decided_by := auth.uid();
      new.decided_at := now();
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'accepted' then
    raise exception 'This choice is already in the plan: raise a change request instead';
  end if;
  if new.status not in ('draft', 'owner_approved') then
    raise exception 'Only the PMC can accept or reject a selection';
  end if;
  if tg_op = 'UPDATE' and (new.pmc_note is distinct from old.pmc_note or new.decided_by is distinct from old.decided_by) then
    raise exception 'Only the PMC can add its note or decision';
  end if;
  new.chosen_by := auth.uid();
  new.chosen_at := now();
  new.pmc_note := coalesce(case when tg_op = 'UPDATE' then old.pmc_note end, '');
  new.decided_by := null;
  new.decided_at := null;
  return new;
end;
$$;
drop trigger if exists flat_selections_guard on public.flat_selections;
create trigger flat_selections_guard before insert or update on public.flat_selections
  for each row execute function public.flat_selections_guard();

-- change requests: owners see and raise their own; admin / PM see all and respond
drop policy if exists owner_change_requests_select on public.owner_change_requests;
drop policy if exists owner_change_requests_insert on public.owner_change_requests;
drop policy if exists owner_change_requests_update on public.owner_change_requests;
create policy owner_change_requests_select on public.owner_change_requests for select to authenticated
  using (public.is_approved(auth.uid()) and (public.is_manager(auth.uid())
    or lower(owner_name) = lower(public.owner_name_of(auth.uid()))));
create policy owner_change_requests_insert on public.owner_change_requests for insert to authenticated
  with check (public.is_approved(auth.uid()) and (public.is_manager(auth.uid())
    or (public.owner_name_of(auth.uid()) <> '' and lower(owner_name) = lower(public.owner_name_of(auth.uid())))));
create policy owner_change_requests_update on public.owner_change_requests for update to authenticated
  using (public.is_approved(auth.uid()) and public.is_manager(auth.uid()))
  with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

create or replace function public.owner_change_requests_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    if auth.uid() is not null and not public.is_manager(auth.uid()) then
      new.status := 'open';
      new.response := '';
    end if;
  elsif new.status is distinct from old.status or new.response is distinct from old.response then
    new.responded_by := auth.uid();
    new.responded_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists owner_change_requests_guard on public.owner_change_requests;
create trigger owner_change_requests_guard before insert or update on public.owner_change_requests
  for each row execute function public.owner_change_requests_guard();

create index if not exists flat_selections_project on public.flat_selections (project_id, flat_no);
create index if not exists owner_change_requests_project on public.owner_change_requests (project_id, status);

notify pgrst, 'reload schema';
