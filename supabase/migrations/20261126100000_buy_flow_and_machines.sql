-- Buy flow and machines (26 Nov 2026).
-- 1. Material requests are purchase orders with vendor 'To be chosen by Purchase' (raised from
--    site). Purchase may now open such a request to pick the vendor and rate; before, only the
--    person who raised it or an admin / PM could edit it.
-- 2. Machines & diesel: owned and hired machines, and a daily log of hours, diesel and work,
--    per project. Site roles log; managers delete. Landowner / investor logins read only.
-- Safe to run more than once.

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
    if not (
      po.raised_by = uid
      or public.is_manager(uid)
      -- Purchase picks the vendor and rate on a site material request.
      or (public.has_role(uid, 'purchase_stores') and po.vendor_name = 'To be chosen by Purchase')
    ) then
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

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.site_projects(id) on delete set null,
  name text not null default '',
  kind text not null default '',
  reg_no text not null default '',
  ownership text not null default 'hired' check (ownership in ('owned', 'hired')),
  hire_party text not null default '',
  hire_rate numeric not null default 0,
  rate_unit text not null default 'hour' check (rate_unit in ('hour', 'day', 'month')),
  min_hours_per_day numeric not null default 0,
  diesel_in_hire boolean not null default false,
  diesel_lph numeric not null default 0,
  service_every_hours numeric not null default 0,
  last_service_hours numeric not null default 0,
  hire_start date,
  hire_end date,
  status text not null default 'working' check (status in ('working', 'idle', 'returned')),
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_logs (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  project_id uuid references public.site_projects(id) on delete cascade,
  log_date date not null default current_date,
  hours numeric not null default 0,
  diesel_l numeric not null default 0,
  operator text not null default '',
  work_done text not null default '',
  stage_code text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists machine_logs_machine_idx on public.machine_logs (machine_id, log_date);
create index if not exists machine_logs_project_idx on public.machine_logs (project_id, log_date);

grant select, insert, update, delete on public.machines, public.machine_logs to authenticated;
grant all on public.machines, public.machine_logs to service_role;
alter table public.machines enable row level security;
alter table public.machine_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['machines', 'machine_logs'] loop
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
