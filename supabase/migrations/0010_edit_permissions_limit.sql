-- إذونات — editing permissions.
-- permissions_before_write() only enforced the monthly cap on INSERT, so an UPDATE that moves a
-- permission into a month that is already full (or re-activates a cancelled one) would bypass it.
-- Enforce the cap on those UPDATEs too, counting every OTHER active permission of that month.

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
  v_needs_cap_check boolean;
begin
  select * into v_settings from public.app_settings where id = true;

  if new.permission_type = 'morning' then
    new.work_start_time := least(greatest(coalesce(new.work_start_time, v_settings.standard_start), v_settings.flex_floor), v_settings.flex_ceiling);
  else
    new.work_start_time := null;
  end if;

  new.duration_minutes := public.compute_permission_duration(new.permission_type, new.entry_time, new.exit_time, new.work_start_time);

  v_needs_cap_check := false;
  if new.status = 'active' then
    if tg_op = 'INSERT' then
      v_needs_cap_check := true;
    elsif tg_op = 'UPDATE' then
      v_needs_cap_check := old.status <> 'active'
        or old.permission_year <> v_year
        or old.permission_month <> v_month;
    end if;
  end if;

  if v_needs_cap_check then
    v_max_permissions := v_settings.max_permissions;

    select count(*) into v_active_count
    from public.permissions
    where user_id = new.user_id
      and permission_year = v_year
      and permission_month = v_month
      and status = 'active'
      and id <> new.id;

    if v_active_count >= v_max_permissions then
      raise exception 'تم الوصول إلى الحد الأقصى (% أذونات) لهذا الشهر', v_max_permissions
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
