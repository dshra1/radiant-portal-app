-- Phone alerts (Web Push), owner 22 Nov 2026: staff mostly use the app on a phone and must be alerted
-- when a team message or an action-centre notification arrives, even with the app closed.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text not null default '',
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Own phone alerts: read" on public.push_subscriptions;
create policy "Own phone alerts: read" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "Own phone alerts: remove" on public.push_subscriptions;
create policy "Own phone alerts: remove" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

-- A phone may change hands: subscribing moves the device to whoever is signed in now.
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_device text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, device)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, coalesce(p_device, ''))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        device = excluded.device, created_at = now();
end $$;
revoke all on function public.push_subscribe(text, text, text, text) from public, anon;
grant execute on function public.push_subscribe(text, text, text, text) to authenticated;

-- Each message or notification is sent to phones once only.
create table if not exists public.push_sent (
  source text not null,
  row_id uuid not null,
  sent_at timestamptz not null default now(),
  primary key (source, row_id)
);
alter table public.push_sent enable row level security;
grant all on public.push_sent to service_role;

-- New team message or notification -> ask the app server to alert the phones. The server reads the row
-- itself with its own key, so this call carries only the table and id. Never blocks the insert.
create extension if not exists pg_net with schema extensions;

create or replace function public.push_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://radiant-portal-app.dshra1.workers.dev/api/push/send',
    body := jsonb_build_object('table', tg_table_name, 'id', new.id),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists push_team_messages on public.team_messages;
create trigger push_team_messages after insert on public.team_messages
  for each row execute function public.push_after_insert();
drop trigger if exists push_notifications on public.notifications;
create trigger push_notifications after insert on public.notifications
  for each row execute function public.push_after_insert();
