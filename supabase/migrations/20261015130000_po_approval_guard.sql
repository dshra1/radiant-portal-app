-- Only an admin or PM may approve or reject a purchase order (the app already
-- hides the buttons; this makes the database refuse it too).
create or replace function public.purchase_orders_approval_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.status in ('approved', 'rejected')
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and not public.is_manager(auth.uid()) then
    raise exception 'Only an admin or PM can approve or reject a purchase order';
  end if;
  return new;
end;
$$;
drop trigger if exists purchase_orders_approval_guard on public.purchase_orders;
create trigger purchase_orders_approval_guard before insert or update on public.purchase_orders
  for each row execute function public.purchase_orders_approval_guard();

notify pgrst, 'reload schema';
