-- إذونات — the entry time an employee picks for a given day on the flexible-hours page.
-- One row per user per day. The morning-permission form prefills "start of work" from it.

create table public.daily_schedules (
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  entry_time time not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, work_date)
);

alter table public.daily_schedules enable row level security;

create policy "daily_schedules: owner all" on public.daily_schedules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.daily_schedules from anon;

-- Keep the chosen time inside the flexible window (same clamp as permissions.work_start_time).
create function public.daily_schedules_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_settings public.app_settings;
begin
  select * into v_settings from public.app_settings where id = true;
  new.entry_time := least(greatest(new.entry_time, v_settings.flex_floor), v_settings.flex_ceiling);
  new.updated_at := now();
  return new;
end;
$$;

create trigger daily_schedules_before_write_trg
  before insert or update on public.daily_schedules
  for each row execute function public.daily_schedules_before_write();
