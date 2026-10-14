-- Flow fixes (15 Oct): per-person read status for team-wide notifications, chat delete
-- rights, owner decisions only by the owner or an admin, atomic PO save / edit, stock
-- receipts linked to a PO, and creators may delete their own price quotations.
-- Safe to run more than once.

-- 1. Per-person read status. A notification addressed to one person keeps using
--    notifications.is_read; a team-wide one (recipient_id null) is read per person here,
--    so one member reading it no longer hides it for everyone.
create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);
create index if not exists notification_reads_user on public.notification_reads (user_id);
grant select, insert, delete on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;
alter table public.notification_reads enable row level security;
drop policy if exists "notification_reads_select_own" on public.notification_reads;
drop policy if exists "notification_reads_insert_own" on public.notification_reads;
drop policy if exists "notification_reads_delete_own" on public.notification_reads;
create policy "notification_reads_select_own" on public.notification_reads for select to authenticated
  using (user_id = auth.uid() and public.is_approved(auth.uid()));
create policy "notification_reads_insert_own" on public.notification_reads for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved(auth.uid()));
create policy "notification_reads_delete_own" on public.notification_reads for delete to authenticated
  using (user_id = auth.uid() and public.is_approved(auth.uid()));
-- keep today's state: team-wide notices already marked read stay read for current members
insert into public.notification_reads (notification_id, user_id)
select n.id, p.id
  from public.notifications n
  cross join public.profiles p
 where n.recipient_id is null and n.is_read and p.status = 'approved'
on conflict do nothing;

-- 2. Team chat: delete your own messages; admins and PMs may delete any.
drop policy if exists "Approved members delete team_messages" on public.team_messages;
create policy "Approved members delete team_messages" on public.team_messages for delete to authenticated
  using (public.is_approved(auth.uid()) and (sender_id = auth.uid() or public.is_manager(auth.uid())));

-- 3. Owner decisions: only the owner deciding (landowner / investor login) or an admin
--    records approve / reject. Others may still create the pending rows when raising a request.
create or replace function public.owner_decisions_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new; -- service role / maintenance
  end if;
  if public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'landowner_investor') then
    if tg_op = 'UPDATE' and new.decision is distinct from old.decision then
      new.decided_by := auth.uid();
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.decision <> 'pending' or new.decided_by is not null or new.decided_at is not null then
      raise exception 'Only the landowner / investor or an admin can record an owner decision';
    end if;
    return new;
  end if;
  if new.decision is distinct from old.decision
     or new.comment is distinct from old.comment
     or new.decided_by is distinct from old.decided_by
     or new.decided_at is distinct from old.decided_at then
    raise exception 'Only the landowner / investor or an admin can record an owner decision';
  end if;
  return new;
end;
$$;
drop trigger if exists owner_decisions_guard on public.owner_decisions;
create trigger owner_decisions_guard before insert or update on public.owner_decisions
  for each row execute function public.owner_decisions_guard();

-- 4. Purchase orders: save header + lines in one transaction (new or edit). Editing is
--    allowed for draft, pending and rejected POs, by the person who raised it or an admin / PM.
--    An edited PO goes back to draft / pending and loses any earlier approval or rejection.
create or replace function public.save_purchase_order(p_header jsonb, p_items jsonb, p_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  po public.purchase_orders%rowtype;
  st text := coalesce(nullif(p_header->>'status', ''), 'draft');
begin
  if uid is null or not public.can_write(uid) then
    raise exception 'You do not have permission to raise purchase orders';
  end if;
  if st not in ('draft', 'pending') then
    raise exception 'A purchase order can only be saved as draft or sent for approval';
  end if;
  if coalesce(btrim(p_header->>'vendor_name'), '') = '' then
    raise exception 'Vendor name is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one line item';
  end if;

  if p_id is null then
    insert into public.purchase_orders (
      po_number, project_id, project_name, site_address, vendor_name, vendor_address, vendor_gstin,
      vendor_contact, vendor_email, quote_reference, po_date, delivery_date, payment_terms,
      delivery_terms, freight_charges, other_charges, tax_mode, stage_code, terms, notes, status,
      raised_by, raised_by_name)
    values (
      public.next_po_number(),
      nullif(p_header->>'project_id', '')::uuid,
      coalesce(p_header->>'project_name', ''),
      coalesce(p_header->>'site_address', ''),
      btrim(p_header->>'vendor_name'),
      coalesce(p_header->>'vendor_address', ''),
      coalesce(p_header->>'vendor_gstin', ''),
      coalesce(p_header->>'vendor_contact', ''),
      coalesce(p_header->>'vendor_email', ''),
      coalesce(p_header->>'quote_reference', ''),
      coalesce(nullif(p_header->>'po_date', '')::date, current_date),
      nullif(p_header->>'delivery_date', '')::date,
      coalesce(p_header->>'payment_terms', ''),
      coalesce(p_header->>'delivery_terms', ''),
      coalesce(nullif(p_header->>'freight_charges', '')::numeric, 0),
      coalesce(nullif(p_header->>'other_charges', '')::numeric, 0),
      coalesce(nullif(p_header->>'tax_mode', ''), 'intra'),
      coalesce(p_header->>'stage_code', ''),
      coalesce(p_header->>'terms', ''),
      coalesce(p_header->>'notes', ''),
      st,
      uid,
      coalesce(p_header->>'raised_by_name', ''))
    returning * into po;
  else
    select * into po from public.purchase_orders where id = p_id for update;
    if not found then
      raise exception 'Purchase order not found';
    end if;
    if po.status not in ('draft', 'pending', 'rejected') then
      raise exception '% is %: only draft, pending or rejected purchase orders can be edited', po.po_number, po.status;
    end if;
    if not (po.raised_by = uid or public.is_manager(uid)) then
      raise exception 'Only the person who raised % or an admin / PM can edit it', po.po_number;
    end if;
    update public.purchase_orders set
      project_id = nullif(p_header->>'project_id', '')::uuid,
      project_name = coalesce(p_header->>'project_name', ''),
      site_address = coalesce(p_header->>'site_address', ''),
      vendor_name = btrim(p_header->>'vendor_name'),
      vendor_address = coalesce(p_header->>'vendor_address', ''),
      vendor_gstin = coalesce(p_header->>'vendor_gstin', ''),
      vendor_contact = coalesce(p_header->>'vendor_contact', ''),
      vendor_email = coalesce(p_header->>'vendor_email', ''),
      quote_reference = coalesce(p_header->>'quote_reference', ''),
      po_date = coalesce(nullif(p_header->>'po_date', '')::date, po.po_date),
      delivery_date = nullif(p_header->>'delivery_date', '')::date,
      payment_terms = coalesce(p_header->>'payment_terms', ''),
      delivery_terms = coalesce(p_header->>'delivery_terms', ''),
      freight_charges = coalesce(nullif(p_header->>'freight_charges', '')::numeric, 0),
      other_charges = coalesce(nullif(p_header->>'other_charges', '')::numeric, 0),
      tax_mode = coalesce(nullif(p_header->>'tax_mode', ''), 'intra'),
      stage_code = coalesce(p_header->>'stage_code', ''),
      terms = coalesce(p_header->>'terms', ''),
      notes = coalesce(p_header->>'notes', ''),
      status = st,
      approved_by = null,
      approved_by_name = '',
      approved_at = null,
      rejection_reason = ''
    where id = p_id
    returning * into po;
    delete from public.purchase_order_items where po_id = p_id;
  end if;

  insert into public.purchase_order_items (
    po_id, item_code, description, brand, unit, quantity, rate, discount_pct, gst_pct,
    sort_order, stage_code, material_key)
  select po.id,
         coalesce(x.item_code, ''), coalesce(x.description, ''), coalesce(x.brand, ''),
         coalesce(x.unit, ''), coalesce(x.quantity, 0), coalesce(x.rate, 0),
         coalesce(x.discount_pct, 0), coalesce(x.gst_pct, 18),
         coalesce(x.sort_order, (e.ord - 1)::int), coalesce(x.stage_code, ''),
         coalesce(x.material_key, '')
    from jsonb_array_elements(p_items) with ordinality as e(item, ord)
    cross join lateral jsonb_to_record(e.item) as x(
      item_code text, description text, brand text, unit text, quantity numeric, rate numeric,
      discount_pct numeric, gst_pct numeric, sort_order int, stage_code text, material_key text)
   order by e.ord;

  return jsonb_build_object('id', po.id, 'po_number', po.po_number, 'status', po.status);
end;
$$;
revoke execute on function public.save_purchase_order(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_purchase_order(jsonb, jsonb, uuid) to authenticated;

-- 5. Stock receipts can be linked to the purchase order they were delivered against.
alter table public.stock_movements add column if not exists po_number text not null default '';

-- 6. Price database: whoever uploaded a quotation may delete it (or one of its lines);
--    admins / PMs keep deleting any.
drop policy if exists "price_quotes_creator_delete" on public.price_quotes;
create policy "price_quotes_creator_delete" on public.price_quotes for delete to authenticated
  using (public.can_write(auth.uid()) and created_by = auth.uid());
drop policy if exists "price_quote_items_creator_delete" on public.price_quote_items;
create policy "price_quote_items_creator_delete" on public.price_quote_items for delete to authenticated
  using (public.can_write(auth.uid()) and exists (
    select 1 from public.price_quotes q where q.id = quote_id and q.created_by = auth.uid()));

notify pgrst, 'reload schema';
