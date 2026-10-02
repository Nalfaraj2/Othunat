-- إذونات — Phase 6: subscription state. Kept in its own table (not extra columns on
-- profiles) specifically so RLS can allow users to READ their own row while allowing NO
-- insert/update/delete policy at all for the "authenticated" role — the only writer is the
-- revenuecat-webhook Edge Function, which uses the service role key and bypasses RLS entirely.
-- If this lived on profiles instead, the existing "profiles: update own" policy (row-level,
-- not column-level) would let any user grant themselves an active subscription directly.
create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'inactive' check (status in ('inactive', 'active', 'expired', 'cancelled')),
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own" on public.subscriptions
  for select using (user_id = auth.uid());

-- No insert/update/delete policy for "authenticated" on purpose — see comment above.
