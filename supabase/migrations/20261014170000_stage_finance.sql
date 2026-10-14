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
