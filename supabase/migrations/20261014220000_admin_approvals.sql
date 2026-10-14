-- Review notes (14 Oct): supervisors may enter and edit bills and BOQ rates, but only
-- an admin approves them; only an admin deletes a project.
-- Bills: the site / office team adds and edits draft and verified bills; approving a bill,
-- and any change to an approved bill, is for an admin; marking paid for admin, accounts or PM.
drop policy if exists "bills_money_insert" on public.bills;
drop policy if exists "bills_money_update" on public.bills;
drop policy if exists "bills_team_insert" on public.bills;
drop policy if exists "bills_team_update" on public.bills;
create policy "bills_team_insert" on public.bills for insert to authenticated with check (public.can_write(auth.uid()));
create policy "bills_team_update" on public.bills for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()));

create or replace function public.bills_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('approved', 'paid')
     and not ((public.has_role(auth.uid(), 'accounts') or public.has_role(auth.uid(), 'pm')) and new.status = 'paid'
              and new.basic_amount = old.basic_amount and new.gst_amount = old.gst_amount
              and new.other_charges = old.other_charges and new.deductions = old.deductions
              and new.retention_amount = old.retention_amount) then
    raise exception 'This bill is approved: only an admin can change it';
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    raise exception 'Only an admin can approve a bill';
  end if;
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid')
     and not (public.has_role(auth.uid(), 'accounts') or public.has_role(auth.uid(), 'pm')) then
    raise exception 'Only an admin, accounts or PM can mark a bill paid';
  end if;
  return new;
end;
$$;
drop trigger if exists bills_guard on public.bills;
create trigger bills_guard before insert or update on public.bills
  for each row execute function public.bills_guard();

-- BOQ change requests are decided by an admin.
drop policy if exists "Admins and PMs can decide change requests" on public.boq_change_requests;
drop policy if exists "Admins decide change requests" on public.boq_change_requests;
create policy "Admins decide change requests" on public.boq_change_requests for update to authenticated
  using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'))
  with check (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'));

notify pgrst, 'reload schema';
