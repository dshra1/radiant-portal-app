-- Link purchases, bills, labour and stock issues to the programme stage they are for,
-- so the site plan knows what is ordered and each stage's actual cost adds itself up.
alter table public.purchase_orders add column if not exists stage_code text not null default '';
alter table public.purchase_order_items
  add column if not exists stage_code text not null default '',
  add column if not exists material_key text not null default '';
alter table public.bills
  add column if not exists stage_code text not null default '',
  add column if not exists cost_type text not null default 'material';
alter table public.labour_entries add column if not exists stage_code text not null default '';
alter table public.stock_movements add column if not exists stage_code text not null default '';
create index if not exists purchase_order_items_stage on public.purchase_order_items (stage_code);
create index if not exists bills_project_stage on public.bills (project_id, stage_code);
create index if not exists labour_entries_project_stage on public.labour_entries (project_id, stage_code);
notify pgrst, 'reload schema';
