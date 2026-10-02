-- إذونات — Phase 7: admin panel support.
-- 1) app_settings: the business-rule constants that used to be hardcoded in
--    compute_permission_duration() and permissions_before_write(), now editable by an admin
--    without touching code or redeploying a migration.
-- 2) is_admin(): a small helper so every admin-read policy below stays one line.
-- 3) Additive SELECT-only policies granting admins read access — these are extra PERMISSIVE
--    policies, combined with OR against the existing owner-only policies from 0001_init.sql,
--    so they only ever widen read access for admins and never touch write access at all.
-- 4) app_reviews: in-app ratings, shown to the admin.

create table public.app_settings (
  id boolean primary key default true check (id),  -- singleton row pattern
  standard_start time not null default '06:55',
  shift_length_minutes smallint not null default 370,
  flex_floor time not null default '06:55',
  flex_ceiling time not null default '07:40',
  total_monthly_minutes smallint not null default 720,
  max_permissions smallint not null default 4,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (true);

alter table public.app_settings enable row level security;

-- Every authenticated user must be able to read this: permissions_before_write() (SECURITY
-- INVOKER, runs as the employee submitting the permission) needs it to compute duration.
create policy "app_settings: select all authenticated" on public.app_settings
  for select to authenticated using (true);

create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "app_settings: admin update" on public.app_settings
  for update using (public.is_admin());

-- ---- Re-point the business logic at app_settings instead of hardcoded constants ----
create or replace function public.compute_permission_duration(
  p_type text,
  p_entry_time time,
  p_exit_time time
)
returns smallint
language plpgsql
stable
as $$
declare
  v_settings public.app_settings;
  v_effective_end time;
  v_minutes int;
begin
  select * into v_settings from public.app_settings where id = true;

  if p_type = 'morning' then
    v_minutes := greatest(0, extract(epoch from (p_entry_time - v_settings.standard_start)) / 60);
  elsif p_type = 'end_of_day' then
    if p_exit_time is null then
      return 0;
    end if;
    v_effective_end := (
      least(greatest(p_entry_time, v_settings.flex_floor), v_settings.flex_ceiling)
      + make_interval(mins => v_settings.shift_length_minutes)
    )::time;
    v_minutes := greatest(0, extract(epoch from (v_effective_end - p_exit_time)) / 60);
  else
    v_minutes := 0;
  end if;

  return least(v_minutes, 32767)::smallint;
end;
$$;

create or replace function public.permissions_before_write()
returns trigger
language plpgsql
as $$
declare
  v_active_count int;
  v_max_permissions smallint;
  v_year smallint := extract(year from new.permission_date)::smallint;
  v_month smallint := extract(month from new.permission_date)::smallint;
begin
  new.duration_minutes := public.compute_permission_duration(new.permission_type, new.entry_time, new.exit_time);

  if tg_op = 'INSERT' and new.status = 'active' then
    select max_permissions into v_max_permissions from public.app_settings where id = true;

    select count(*) into v_active_count
    from public.permissions
    where user_id = new.user_id
      and permission_year = v_year
      and permission_month = v_month
      and status = 'active';

    if v_active_count >= v_max_permissions then
      raise exception 'تم الوصول إلى الحد الأقصى (% أذونات) لهذا الشهر', v_max_permissions
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- monthly_balances.total_minutes should also track app_settings, not a fixed 720 default,
-- for months created after an admin changes it. recalculate_monthly_balance() below always
-- supplies it explicitly now, so the old fixed default is dropped rather than left stale.
alter table public.monthly_balances alter column total_minutes drop default;

create or replace function public.recalculate_monthly_balance(p_user_id uuid, p_year smallint, p_month smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
  v_count int;
  v_total smallint;
begin
  select coalesce(sum(duration_minutes), 0), count(*)
    into v_used, v_count
  from public.permissions
  where user_id = p_user_id
    and permission_year = p_year
    and permission_month = p_month
    and status = 'active';

  select total_monthly_minutes into v_total from public.app_settings where id = true;

  insert into public.monthly_balances (user_id, balance_year, balance_month, total_minutes, used_minutes, permissions_count, updated_at)
  values (p_user_id, p_year, p_month, v_total, v_used, v_count, now())
  on conflict (user_id, balance_year, balance_month)
  do update set
    used_minutes = excluded.used_minutes,
    permissions_count = excluded.permissions_count,
    updated_at = now();
end;
$$;

-- ---- Admin read access (additive — OR'd with the existing owner-only policies) ----
create policy "profiles: admin select all" on public.profiles
  for select using (public.is_admin());

create policy "permissions: admin select all" on public.permissions
  for select using (public.is_admin());

create policy "monthly_balances: admin select all" on public.monthly_balances
  for select using (public.is_admin());

create policy "medical_permissions: admin select all" on public.medical_permissions
  for select using (public.is_admin());

create policy "subscriptions: admin select all" on public.subscriptions
  for select using (public.is_admin());

-- ---- In-app ratings ----
create table public.app_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.app_reviews enable row level security;

create policy "app_reviews: owner insert/select" on public.app_reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "app_reviews: admin select all" on public.app_reviews
  for select using (public.is_admin());
