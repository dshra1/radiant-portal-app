-- Subcontract work orders, measurements and RA bills; GPS on labour entries (26 Nov 2026).
--   work_orders: scope lines with qty and rate (items jsonb), retention %, advance and recovery %.
--   wo_measurements: work measured at site against a work-order line; billed once in an RA bill.
--   ra_bills: running-account bills; only an admin / PM can approve; the approved bill is posted
--     to bills (cost_type labour) so it is paid and tracked like any other bill.
--   labour_entries: where the entry was made (lat/lng/accuracy, distance from the site in m).
-- Safe to run more than once.

alter table public.labour_entries
  add column if not exists geo_lat numeric,
  add column if not exists geo_lng numeric,
  add column if not exists geo_accuracy_m numeric,
  add column if not exists geo_distance_m numeric;

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.site_projects(id) on delete cascade,
  wo_no text not null default '',
  contractor text not null default '',
  contractor_phone text not null default '',
  contractor_gstin text not null default '',
  trade text not null default '',
  scope text not null default '',
  items jsonb not null default '[]'::jsonb,
  gst_pct numeric not null default 0,
  retention_pct numeric not null default 5,
  advance numeric not null default 0,
  advance_recovery_pct numeric not null default 10,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('draft', 'active', 'closed')),
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wo_measurements (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  project_id uuid references public.site_projects(id) on delete cascade,
  item_id text not null default '',
  measured_on date not null default current_date,
  qty numeric not null default 0,
  location text not null default '',
  stage_code text not null default '',
  remarks text not null default '',
  measured_by_name text not null default '',
  ra_bill_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists wo_measurements_wo_idx on public.wo_measurements (work_order_id, measured_on);

create table if not exists public.ra_bills (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  project_id uuid references public.site_projects(id) on delete cascade,
  ra_no integer not null default 1,
  bill_date date not null default current_date,
  gross numeric not null default 0,
  gst numeric not null default 0,
  retention numeric not null default 0,
  advance_recovery numeric not null default 0,
  other_deductions numeric not null default 0,
  net numeric not null default 0,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  bill_id uuid references public.bills(id) on delete set null,
  approved_by_name text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists ra_bills_wo_idx on public.ra_bills (work_order_id, ra_no);

grant select, insert, update, delete on public.work_orders, public.wo_measurements, public.ra_bills to authenticated;
grant all on public.work_orders, public.wo_measurements, public.ra_bills to service_role;
alter table public.work_orders enable row level security;
alter table public.wo_measurements enable row level security;
alter table public.ra_bills enable row level security;

do $$
declare t text;
begin
  foreach t in array array['work_orders', 'wo_measurements', 'ra_bills'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_approved(auth.uid()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_manager(auth.uid()))', t || '_delete', t);
  end loop;
end $$;

-- Only an admin / PM approves or rejects an RA bill, and an approved bill is not edited.
create or replace function public.ra_bills_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status = 'approved' and not public.is_manager(auth.uid()) then
    raise exception 'RA bill % is approved: only an admin / PM can change it', old.ra_no;
  end if;
  if new.status in ('approved', 'rejected')
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and not public.is_manager(auth.uid()) then
    raise exception 'Only an admin / PM can approve or reject an RA bill';
  end if;
  return new;
end;
$$;
drop trigger if exists ra_bills_guard on public.ra_bills;
create trigger ra_bills_guard before insert or update on public.ra_bills
  for each row execute function public.ra_bills_guard();
