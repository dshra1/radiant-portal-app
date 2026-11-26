-- Site wallet: money requests, advances and site expenses per person (26 Nov 2026).
--   request : site asks for money (purpose, payee, amount) → admin / PM approves → accounts pays.
--             A paid request adds to the person's wallet like an advance.
--   advance : accounts / admin gives money to a person (petty cash, imprest); paid on entry.
--   expense : money spent from the wallet at site (tea, transport, small material), with the
--             bill photo → admin / PM approves. Pending and approved expenses reduce the wallet.
-- Balance of a person = paid requests + advances − (pending + approved) expenses.
-- Safe to run more than once.

create table if not exists public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.site_projects(id) on delete cascade,
  person_id uuid references auth.users(id),
  person_name text not null default '',
  entry_type text not null check (entry_type in ('request', 'advance', 'expense')),
  entry_date date not null default current_date,
  amount numeric not null default 0 check (amount >= 0),
  category text not null default '',
  payee text not null default '',
  purpose text not null default '',
  stage_code text not null default '',
  photo_path text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  decided_by_name text not null default '',
  decided_at timestamptz,
  rejection_reason text not null default '',
  paid_by_name text not null default '',
  paid_on date,
  pay_mode text not null default '',
  pay_reference text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists wallet_entries_project_idx on public.wallet_entries (project_id, entry_date);
create index if not exists wallet_entries_person_idx on public.wallet_entries (person_id, entry_date);

grant select, insert, update, delete on public.wallet_entries to authenticated;
grant all on public.wallet_entries to service_role;
alter table public.wallet_entries enable row level security;

drop policy if exists wallet_entries_select on public.wallet_entries;
drop policy if exists wallet_entries_insert on public.wallet_entries;
drop policy if exists wallet_entries_update on public.wallet_entries;
drop policy if exists wallet_entries_delete on public.wallet_entries;
create policy wallet_entries_select on public.wallet_entries for select to authenticated
  using (public.is_approved(auth.uid()));
create policy wallet_entries_insert on public.wallet_entries for insert to authenticated
  with check (public.can_write(auth.uid()));
create policy wallet_entries_update on public.wallet_entries for update to authenticated
  using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()));
create policy wallet_entries_delete on public.wallet_entries for delete to authenticated
  using (public.is_manager(auth.uid()));

-- Who may do what (checked in the database, whatever the app shows):
--   approve / reject a request or expense: admin / PM;
--   pay a request or give an advance: admin / PM / accounts;
--   a decided entry is changed only by admin / PM; the person edits their own pending entry.
create or replace function public.wallet_entries_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mgr boolean := public.is_manager(uid);
  money boolean := mgr or public.has_role(uid, 'accounts');
begin
  if uid is null then
    return new; -- service role / SQL editor
  end if;
  if tg_op = 'INSERT' then
    if new.entry_type = 'advance' then
      if not money then
        raise exception 'Only admin, PM or accounts can give an advance';
      end if;
      new.status := 'paid';
    elsif new.status <> 'pending' then
      raise exception 'A new request or expense starts as pending';
    end if;
    return new;
  end if;
  -- UPDATE
  if old.status <> 'pending' and not mgr and not (money and old.status = 'approved' and new.status = 'paid') then
    raise exception 'This entry is %: only an admin / PM can change it', old.status;
  end if;
  if new.status is distinct from old.status then
    if new.status in ('approved', 'rejected') and not mgr then
      raise exception 'Only an admin / PM can approve or reject';
    end if;
    if new.status = 'paid' and not money then
      raise exception 'Only admin, PM or accounts can mark it paid';
    end if;
    if new.status = 'paid' and old.entry_type <> 'request' and old.entry_type <> 'advance' then
      raise exception 'Only a money request is paid';
    end if;
  end if;
  if old.status = 'pending' and new.status = 'pending' and old.created_by is distinct from uid and not mgr then
    raise exception 'Only the person who entered it (or an admin / PM) can edit a pending entry';
  end if;
  return new;
end;
$$;
drop trigger if exists wallet_entries_guard on public.wallet_entries;
create trigger wallet_entries_guard before insert or update on public.wallet_entries
  for each row execute function public.wallet_entries_guard();
