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
