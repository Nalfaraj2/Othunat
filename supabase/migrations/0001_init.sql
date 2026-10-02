-- إذونات — Phase 1: profiles, permissions, monthly balances, fingerprint OCR, medical permissions
-- All sensitive calculations (duration, monthly balance, permission-count limit) are enforced here,
-- never trusted from the client.

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  civil_id text not null unique,
  full_name text not null,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_civil_id_format check (civil_id ~ '^[0-9]{12}$');

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- Auto-provision a profile row when a new auth user signs up.
-- civil_id and full_name are passed in as auth signUp() user metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, civil_id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'civil_id',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Login-by-civil-id support: the client authenticates with Supabase Auth using a real email
-- (required so Supabase's own password-reset emails work), but signs in and registers using the
-- civil ID. This lookup translates civil_id -> the account's real email, and only that single
-- field, so it is safe to expose to anonymous callers (same shape as a "forgot username" lookup).
create function public.get_email_by_civil_id(p_civil_id text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.civil_id = p_civil_id
  limit 1;
$$;

grant execute on function public.get_email_by_civil_id(text) to anon, authenticated;

-- ============================================================
-- fingerprint_records (OCR-extracted attendance photo data)
-- ============================================================
create table public.fingerprint_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  extracted_date date,
  extracted_entry_time time,
  extracted_exit_time time,
  confidence numeric(4, 3),
  created_at timestamptz not null default now()
);

alter table public.fingerprint_records enable row level security;

create policy "fingerprint_records: owner all" on public.fingerprint_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- permissions (morning / end_of_day — count toward the 12h / 4-permission monthly limits)
-- ============================================================
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission_type text not null check (permission_type in ('morning', 'end_of_day')),
  permission_date date not null,
  permission_year smallint generated always as (extract(year from permission_date)::smallint) stored,
  permission_month smallint generated always as (extract(month from permission_date)::smallint) stored,
  entry_time time not null,
  exit_time time,
  duration_minutes smallint not null default 0 check (duration_minutes >= 0),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  fingerprint_record_id uuid references public.fingerprint_records (id),
  created_at timestamptz not null default now(),
  constraint permissions_end_of_day_needs_exit
    check (permission_type <> 'end_of_day' or exit_time is not null)
);

create index permissions_user_month_idx
  on public.permissions (user_id, permission_year, permission_month)
  where status = 'active';

alter table public.permissions enable row level security;

create policy "permissions: owner all" on public.permissions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Business rules, computed here so the client cannot fake them ----

-- Standard shift: 06:55 -> 13:05 (6h10m). Assumption, adjust here if the real official
-- start/end differs — every duration below derives from these two constants.
create function public.compute_permission_duration(
  p_type text,
  p_entry_time time,
  p_exit_time time
)
returns smallint
language plpgsql
immutable
as $$
declare
  v_standard_start time := '06:55';
  v_shift_length interval := '6 hours 10 minutes';
  v_flex_floor time := '06:55';
  v_flex_ceiling time := '07:40';
  v_effective_end time;
  v_minutes int;
begin
  if p_type = 'morning' then
    v_minutes := greatest(0, extract(epoch from (p_entry_time - v_standard_start)) / 60);
  elsif p_type = 'end_of_day' then
    if p_exit_time is null then
      return 0;
    end if;
    v_effective_end := (least(greatest(p_entry_time, v_flex_floor), v_flex_ceiling) + v_shift_length)::time;
    v_minutes := greatest(0, extract(epoch from (v_effective_end - p_exit_time)) / 60);
  else
    v_minutes := 0;
  end if;

  return least(v_minutes, 32767)::smallint;
end;
$$;

create function public.permissions_before_write()
returns trigger
language plpgsql
as $$
declare
  v_active_count int;
  v_year smallint := extract(year from new.permission_date)::smallint;
  v_month smallint := extract(month from new.permission_date)::smallint;
begin
  new.duration_minutes := public.compute_permission_duration(new.permission_type, new.entry_time, new.exit_time);

  -- permission_year/permission_month are GENERATED columns: not populated yet inside a
  -- BEFORE trigger, so derive them from permission_date directly instead of reading new.*.
  if tg_op = 'INSERT' and new.status = 'active' then
    select count(*) into v_active_count
    from public.permissions
    where user_id = new.user_id
      and permission_year = v_year
      and permission_month = v_month
      and status = 'active';

    if v_active_count >= 4 then
      raise exception 'تم الوصول إلى الحد الأقصى (٤ أذونات) لهذا الشهر'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger permissions_before_write_trg
  before insert or update on public.permissions
  for each row execute function public.permissions_before_write();

-- ============================================================
-- monthly_balances (12h = 720 minutes, freely spent, overdraft allowed — shown as a red deficit)
-- ============================================================
create table public.monthly_balances (
  user_id uuid not null references public.profiles (id) on delete cascade,
  balance_year smallint not null,
  balance_month smallint not null,
  total_minutes smallint not null default 720,
  used_minutes smallint not null default 0,
  permissions_count smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, balance_year, balance_month)
);

alter table public.monthly_balances enable row level security;

create policy "monthly_balances: select own" on public.monthly_balances
  for select using (user_id = auth.uid());

create function public.recalculate_monthly_balance(p_user_id uuid, p_year smallint, p_month smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
  v_count int;
begin
  select coalesce(sum(duration_minutes), 0), count(*)
    into v_used, v_count
  from public.permissions
  where user_id = p_user_id
    and permission_year = p_year
    and permission_month = p_month
    and status = 'active';

  insert into public.monthly_balances (user_id, balance_year, balance_month, used_minutes, permissions_count, updated_at)
  values (p_user_id, p_year, p_month, v_used, v_count, now())
  on conflict (user_id, balance_year, balance_month)
  do update set
    used_minutes = excluded.used_minutes,
    permissions_count = excluded.permissions_count,
    updated_at = now();
end;
$$;

create function public.permissions_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_monthly_balance(old.user_id, old.permission_year, old.permission_month);
    return old;
  end if;

  perform public.recalculate_monthly_balance(new.user_id, new.permission_year, new.permission_month);

  -- an UPDATE that moved a permission to a different month must also refresh the old month
  if tg_op = 'UPDATE' and (old.permission_year <> new.permission_year or old.permission_month <> new.permission_month) then
    perform public.recalculate_monthly_balance(old.user_id, old.permission_year, old.permission_month);
  end if;

  return new;
end;
$$;

create trigger permissions_after_write_trg
  after insert or update or delete on public.permissions
  for each row execute function public.permissions_after_write();

-- ============================================================
-- attachments (generic file links, e.g. a fingerprint photo attached to a specific permission)
-- ============================================================
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  permission_id uuid not null references public.permissions (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "attachments: owner all" on public.attachments
  for all using (
    exists (
      select 1 from public.permissions p
      where p.id = attachments.permission_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.permissions p
      where p.id = attachments.permission_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- medical_permissions (fully independent of the 12h / 4-permission monthly limits)
-- ============================================================
create table public.medical_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission_date date not null,
  notes text,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.medical_permissions enable row level security;

create policy "medical_permissions: owner all" on public.medical_permissions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
