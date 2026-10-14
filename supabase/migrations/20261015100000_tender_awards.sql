-- Tenders: at least three vendor quotes before award, award item by item,
-- and the award becomes purchase orders (one per awarded vendor).
alter table public.rfqs add column if not exists item_awards jsonb not null default '{}'::jsonb;
alter table public.rfqs add column if not exists award_note text not null default '';
alter table public.rfqs add column if not exists awarded_by uuid;
alter table public.rfqs add column if not exists awarded_by_name text not null default '';
alter table public.rfqs add column if not exists awarded_at timestamptz;
alter table public.rfqs add column if not exists po_numbers jsonb not null default '[]'::jsonb;

alter table public.rfq_items add column if not exists item_code text not null default '';
alter table public.rfq_items add column if not exists gst_pct numeric not null default 18;
-- Items imported earlier carry the code at the start of the description ("ST05 · …").
update public.rfq_items set item_code = split_part(description, ' · ', 1)
  where item_code = '' and description ~ '^[A-Z]{1,4}[0-9]{0,3}[a-z]?(-[A-Z0-9]{1,4})? · ';

-- Where a bid came from: '' typed in the app, 'workbook' from the quotation workbook.
alter table public.rfq_bids add column if not exists source text not null default '';

create or replace function public.rfqs_award_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare q integer;
begin
  if auth.uid() is null then return new; end if;
  if new.status = 'awarded' and (tg_op = 'INSERT' or old.status is distinct from 'awarded') then
    if not public.is_manager(auth.uid()) then
      raise exception 'Only an admin or PM can award a tender';
    end if;
    select count(*) into q from public.rfq_bids where rfq_id = new.id and rates <> '{}'::jsonb;
    if q < 3 and not (public.has_role(auth.uid(), 'admin') and btrim(new.award_note) <> '') then
      raise exception 'At least 3 vendor quotes are needed before award (% received). Only an admin can award with fewer, and must give the reason.', q;
    end if;
    new.awarded_by := auth.uid();
    new.awarded_at := now();
  end if;
  if tg_op = 'UPDATE' and old.status = 'awarded' and new.status is distinct from 'awarded'
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only an admin can reopen an awarded tender';
  end if;
  return new;
end;
$$;
drop trigger if exists rfqs_award_guard on public.rfqs;
create trigger rfqs_award_guard before insert or update on public.rfqs
  for each row execute function public.rfqs_award_guard();

notify pgrst, 'reload schema';
