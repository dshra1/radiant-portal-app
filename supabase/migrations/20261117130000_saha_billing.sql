-- SAHA central AI billing: firms, prepaid credit wallets, reservations, payments, GST invoices.
-- Lives in SAHA's own database. Row-level security is on with NO policies, so only the server
-- (service role) can read or write; firms reach it only through SAHA's billing API.

create table if not exists public.billing_firms (
  id text primary key,                       -- short firm code, e.g. 'acme-builders'
  name text not null,
  api_key_hash text not null,                -- sha-256 of the firm's key
  active boolean not null default true,
  balance numeric(14,2) not null default 0,
  billing jsonb not null default '{}'::jsonb, -- GSTIN, address, state, contact (latest from the firm)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_reservations (
  id uuid primary key default gen_random_uuid(),
  firm_id text not null references public.billing_firms(id),
  feature text not null,
  credits numeric(14,2) not null,
  status text not null default 'reserved' check (status in ('reserved','settled','released')),
  by_user text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists billing_reservations_open on public.billing_reservations (status, created_at);

create table if not exists public.billing_events (
  id bigserial primary key,
  firm_id text not null references public.billing_firms(id),
  type text not null check (type in ('use','refund','topup','adjust')),
  feature text,
  credits numeric(14,2) not null,            -- + in, − out
  balance_after numeric(14,2) not null,
  ref text,
  by_user text,
  at timestamptz not null default now()
);
create index if not exists billing_events_firm_at on public.billing_events (firm_id, at desc);

create table if not exists public.billing_counters (
  fy text primary key,                       -- e.g. '2026-27'
  last integer not null default 0
);

create table if not exists public.billing_payments (
  payment_id text primary key,               -- Razorpay payment id (or 'bank:<ref>')
  order_id text,
  firm_id text not null references public.billing_firms(id),
  pack text not null,
  amount_paise bigint not null,              -- incl. GST
  credits numeric(14,2) not null,
  source text not null,                      -- 'checkout' | 'webhook' | 'bank'
  invoice_no text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  invoice_no text primary key,
  fy text not null,
  seq integer not null,
  firm_id text not null references public.billing_firms(id),
  payment_id text references public.billing_payments(payment_id),
  buyer jsonb not null,
  taxable numeric(14,2) not null,
  cgst numeric(14,2) not null default 0,
  sgst numeric(14,2) not null default 0,
  igst numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  pdf_path text,
  created_at timestamptz not null default now()
);

alter table public.billing_firms enable row level security;
alter table public.billing_reservations enable row level security;
alter table public.billing_events enable row level security;
alter table public.billing_counters enable row level security;
alter table public.billing_payments enable row level security;
alter table public.billing_invoices enable row level security;

-- Reserve credits for one AI use: one atomic step, so two uses at the same moment can't both
-- pass on the same balance. Returns the reservation id, or raises 'insufficient' / 'inactive'.
create or replace function public.billing_reserve(p_firm text, p_feature text, p_credits numeric, p_user text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_bal numeric; v_id uuid;
begin
  update billing_firms set balance = balance - p_credits, updated_at = now()
    where id = p_firm and active and balance >= p_credits
    returning balance into v_bal;
  if v_bal is null then
    if exists (select 1 from billing_firms where id = p_firm and not active) then raise exception 'inactive'; end if;
    raise exception 'insufficient';
  end if;
  insert into billing_reservations (firm_id, feature, credits, by_user) values (p_firm, p_feature, p_credits, p_user)
    returning id into v_id;
  insert into billing_events (firm_id, type, feature, credits, balance_after, ref, by_user)
    values (p_firm, 'use', p_feature, -p_credits, v_bal, v_id::text, p_user);
  return v_id;
end $$;

-- The AI run succeeded: keep the charge.
create or replace function public.billing_settle(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update billing_reservations set status = 'settled', closed_at = now() where id = p_id and status = 'reserved';
$$;

-- The AI run failed: give the credits back (once).
create or replace function public.billing_release(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r billing_reservations; v_bal numeric;
begin
  update billing_reservations set status = 'released', closed_at = now()
    where id = p_id and status = 'reserved' returning * into r;
  if r.id is null then return; end if;
  update billing_firms set balance = balance + r.credits, updated_at = now() where id = r.firm_id returning balance into v_bal;
  insert into billing_events (firm_id, type, feature, credits, balance_after, ref)
    values (r.firm_id, 'refund', r.feature, r.credits, v_bal, r.id::text);
end $$;

-- A top-up paid: record the payment once (checkout, webhook or bank), add credits, take the
-- next invoice number for the financial year. Returns the invoice number, or null if this
-- payment was already recorded.
create or replace function public.billing_topup(
  p_payment text, p_order text, p_firm text, p_pack text, p_amount_paise bigint, p_credits numeric,
  p_source text, p_fy text, p_prefix text, p_by text)
returns text language plpgsql security definer set search_path = public as $$
declare v_seq int; v_no text; v_bal numeric;
begin
  insert into billing_payments (payment_id, order_id, firm_id, pack, amount_paise, credits, source)
    values (p_payment, p_order, p_firm, p_pack, p_amount_paise, p_credits, p_source)
    on conflict (payment_id) do nothing;
  if not found then return null; end if;
  update billing_firms set balance = balance + p_credits, updated_at = now() where id = p_firm returning balance into v_bal;
  insert into billing_events (firm_id, type, credits, balance_after, ref, by_user)
    values (p_firm, 'topup', p_credits, v_bal, p_payment, p_by);
  insert into billing_counters (fy, last) values (p_fy, 1)
    on conflict (fy) do update set last = billing_counters.last + 1
    returning last into v_seq;
  v_no := p_prefix || '/' || p_fy || '/' || lpad(v_seq::text, 4, '0');
  update billing_payments set invoice_no = v_no where payment_id = p_payment;
  return v_no;
end $$;

-- SAHA staff correction (no invoice).
create or replace function public.billing_adjust(p_firm text, p_credits numeric, p_note text, p_by text)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_bal numeric;
begin
  update billing_firms set balance = balance + p_credits, updated_at = now() where id = p_firm returning balance into v_bal;
  if v_bal is null then raise exception 'unknown firm'; end if;
  insert into billing_events (firm_id, type, credits, balance_after, ref, by_user) values (p_firm, 'adjust', p_credits, v_bal, p_note, p_by);
  return v_bal;
end $$;

-- Reservations left open by a crashed run are refunded after 15 minutes (called by the API).
create or replace function public.billing_release_stale()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from billing_reservations where status = 'reserved' and created_at < now() - interval '15 minutes' loop
    perform billing_release(r.id); n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.billing_reserve(text,text,numeric,text) from public, anon, authenticated;
revoke all on function public.billing_settle(uuid) from public, anon, authenticated;
revoke all on function public.billing_release(uuid) from public, anon, authenticated;
revoke all on function public.billing_topup(text,text,text,text,bigint,numeric,text,text,text,text) from public, anon, authenticated;
revoke all on function public.billing_adjust(text,numeric,text,text) from public, anon, authenticated;
revoke all on function public.billing_release_stale() from public, anon, authenticated;
grant execute on function public.billing_reserve(text,text,numeric,text) to service_role;
grant execute on function public.billing_settle(uuid) to service_role;
grant execute on function public.billing_release(uuid) to service_role;
grant execute on function public.billing_topup(text,text,text,text,bigint,numeric,text,text,text,text) to service_role;
grant execute on function public.billing_adjust(text,numeric,text,text) to service_role;
grant execute on function public.billing_release_stale() to service_role;
