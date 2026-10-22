-- إذونات — flexible work start for morning permissions.
-- The employee picks when their work starts (inside the flexible window flex_floor..flex_ceiling,
-- 06:55–07:40 by default). A morning permission is then: sign-in time − chosen start time.
-- The chosen time is clamped to the window server-side, so the client can never widen it.

alter table public.permissions add column if not exists work_start_time time;

-- New 4-argument version (the old 3-argument one is left in place, unused).
create or replace function public.compute_permission_duration(
  p_type text,
  p_entry_time time,
  p_exit_time time,
  p_work_start time
)
returns smallint
language plpgsql
stable
set search_path = public
as $$
declare
  v_settings public.app_settings;
  v_start time;
  v_effective_end time;
  v_minutes int;
begin
  select * into v_settings from public.app_settings where id = true;

  if p_type = 'morning' then
    v_start := least(greatest(coalesce(p_work_start, v_settings.standard_start), v_settings.flex_floor), v_settings.flex_ceiling);
    v_minutes := greatest(0, extract(epoch from (p_entry_time - v_start)) / 60);
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
set search_path = public
as $$
declare
  v_active_count int;
  v_max_permissions smallint;
  v_settings public.app_settings;
  v_year smallint := extract(year from new.permission_date)::smallint;
  v_month smallint := extract(month from new.permission_date)::smallint;
begin
  select * into v_settings from public.app_settings where id = true;

  if new.permission_type = 'morning' then
    -- Store the effective (clamped) start so the record always shows what the duration was based on.
    new.work_start_time := least(greatest(coalesce(new.work_start_time, v_settings.standard_start), v_settings.flex_floor), v_settings.flex_ceiling);
  else
    new.work_start_time := null;
  end if;

  new.duration_minutes := public.compute_permission_duration(new.permission_type, new.entry_time, new.exit_time, new.work_start_time);

  if tg_op = 'INSERT' and new.status = 'active' then
    v_max_permissions := v_settings.max_permissions;

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
