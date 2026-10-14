-- Edit and delete rights by role, enforced in the database (not only on screen).
--   admin / pm (managers): everything; project settings and BOQ rates only by them.
--   accounts: money records (bills, payments, capital entries, charges) with the managers.
--   site_engineer / site_supervisor / purchase_stores: site records (stages, labour, pours,
--     QA, media, stock, purchase orders, tenders, vendors).
--   landowner_investor only: read-only, except their own decisions on owner requests.
-- Also removes the blanket "ALL" policies that let every member read every direct
-- message and notification. Safe to run more than once.

create or replace function public.is_manager(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_uid, 'admin') or public.has_role(_uid, 'pm');
$$;

create or replace function public.can_money(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved(_uid)
     and (public.has_role(_uid, 'admin') or public.has_role(_uid, 'pm') or public.has_role(_uid, 'accounts'));
$$;

-- Approved and holding at least one role other than landowner / investor.
create or replace function public.can_write(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved(_uid)
     and exists (select 1 from public.user_roles where user_id = _uid and role <> 'landowner_investor');
$$;

grant execute on function public.is_manager(uuid), public.can_money(uuid), public.can_write(uuid) to authenticated;

-- Projects: read by members, changed by managers, deleted by admins.
drop policy if exists "Approved members manage projects" on public.site_projects;
drop policy if exists "site_projects_select" on public.site_projects;
drop policy if exists "site_projects_insert" on public.site_projects;
drop policy if exists "site_projects_update" on public.site_projects;
drop policy if exists "site_projects_delete" on public.site_projects;
create policy "site_projects_select" on public.site_projects for select to authenticated using (public.is_approved(auth.uid()));
create policy "site_projects_insert" on public.site_projects for insert to authenticated with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
create policy "site_projects_update" on public.site_projects for update to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid())) with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
create policy "site_projects_delete" on public.site_projects for delete to authenticated using (public.is_approved(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- BOQ: read by members, changed by managers (others raise change requests).
drop policy if exists "Approved members manage boq items" on public.boq_items;
drop policy if exists "boq_items_select" on public.boq_items;
drop policy if exists "boq_items_write" on public.boq_items;
create policy "boq_items_select" on public.boq_items for select to authenticated using (public.is_approved(auth.uid()));
create policy "boq_items_write" on public.boq_items for all to authenticated using (public.is_approved(auth.uid()) and public.is_manager(auth.uid())) with check (public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

-- Money records: added and edited by managers and accounts.
do $$
declare t text;
begin
  foreach t in array array['bills', 'bill_payments', 'capital_entries', 'project_charges'] loop
    execute format('drop policy if exists %I on public.%I', t || '_money_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_money_update', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_money(auth.uid()))', t || '_money_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_money(auth.uid())) with check (public.can_money(auth.uid()))', t || '_money_update', t);
  end loop;
end $$;
drop policy if exists "Approved members can add bills" on public.bills;
drop policy if exists "Approved members can edit bills" on public.bills;
drop policy if exists "Approved members can add bill payments" on public.bill_payments;
drop policy if exists "Approved members can edit bill payments" on public.bill_payments;
drop policy if exists "capital_entries_insert" on public.capital_entries;
drop policy if exists "capital_entries_update" on public.capital_entries;
drop policy if exists "Approved members can add charges" on public.project_charges;
drop policy if exists "Approved members can edit charges" on public.project_charges;

-- Site records: added and edited by the site, stores and office team (not landowner-only users).
do $$
declare
  t text;
  pol record;
begin
  foreach t in array array['site_stages', 'labour_entries', 'pour_cards', 'qa_inspections', 'project_media',
    'stock_items', 'stock_movements', 'purchase_orders', 'purchase_order_items', 'rfqs', 'rfq_items',
    'rfq_bids', 'vendors', 'price_quotes', 'price_quote_items', 'stage_finance'] loop
    -- drop the old "any approved member" insert / update / all policies
    for pol in select policyname, cmd from pg_policies
               where schemaname = 'public' and tablename = t and cmd in ('INSERT', 'UPDATE', 'ALL') loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t || '_team_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t || '_team_update', t);
  end loop;
end $$;
-- purchase orders: keep the rule that only drafts / pending POs change, unless a manager.
drop policy if exists "purchase_orders_team_update" on public.purchase_orders;
create policy "purchase_orders_team_update" on public.purchase_orders for update to authenticated
  using (public.can_write(auth.uid()) and (status in ('draft', 'pending') or public.is_manager(auth.uid())))
  with check (public.can_write(auth.uid()));
-- purchase order items had a single ALL policy: give back read and delete.
drop policy if exists "purchase_order_items_select" on public.purchase_order_items;
drop policy if exists "purchase_order_items_delete" on public.purchase_order_items;
create policy "purchase_order_items_select" on public.purchase_order_items for select to authenticated using (public.is_approved(auth.uid()));
create policy "purchase_order_items_delete" on public.purchase_order_items for delete to authenticated using (public.can_write(auth.uid()));

-- Direct messages and notifications: drop the blanket policies that exposed everyone's.
drop policy if exists "Approved members manage messages" on public.team_messages;
drop policy if exists "Approved members manage notifications" on public.notifications;
-- recipients may update what was sent to them (mark read, task progress); workspace-wide items by the team.
drop policy if exists "Approved members update team_messages" on public.team_messages;
create policy "Approved members update team_messages" on public.team_messages for update to authenticated
  using (public.is_approved(auth.uid()) and (sender_id = auth.uid() or recipient_id = auth.uid()
    or public.is_manager(auth.uid()) or (recipient_id is null and public.can_write(auth.uid()))))
  with check (public.is_approved(auth.uid()));
drop policy if exists "Approved members update notifications" on public.notifications;
create policy "Approved members update notifications" on public.notifications for update to authenticated
  using (public.is_approved(auth.uid()) and (sender_id = auth.uid() or recipient_id = auth.uid()
    or recipient_id is null or public.has_role(auth.uid(), 'admin')))
  with check (public.is_approved(auth.uid()));

-- Drawings: only managers delete or overwrite them.
drop policy if exists "Approved members delete drawings" on storage.objects;
create policy "Approved members delete drawings" on storage.objects for delete to authenticated
  using (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()));
drop policy if exists "Approved members update drawings" on storage.objects;
create policy "Approved members update drawings" on storage.objects for update to authenticated
  using (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()))
  with check (bucket_id = 'project-drawings' and public.is_approved(auth.uid()) and public.is_manager(auth.uid()));

notify pgrst, 'reload schema';
