-- Material plan dates on stock items: reorder alarms only once a material is due.
alter table public.stock_items
  add column if not exists first_needed date,
  add column if not exists order_by date;
update public.stock_items
   set order_by = to_date(substring(notes from 'order by (\d{1,2} [A-Za-z]{3} \d{4})'), 'DD Mon YYYY')
 where order_by is null and notes ~ 'order by \d{1,2} [A-Za-z]{3} \d{4}';
update public.stock_items
   set first_needed = to_date(substring(notes from 'first needed (\d{1,2} [A-Za-z]{3} \d{4})'), 'DD Mon YYYY')
 where first_needed is null and notes ~ 'first needed \d{1,2} [A-Za-z]{3} \d{4}';
notify pgrst, 'reload schema';
