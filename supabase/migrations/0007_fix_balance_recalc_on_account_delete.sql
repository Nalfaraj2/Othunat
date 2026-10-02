-- Found by an end-to-end test against the live project: deleting an account cascades
-- profile -> permissions, and each permission's AFTER DELETE trigger then tried to upsert
-- monthly_balances for a profile that was already deleted (FK violation), so account deletion
-- failed for any user who had permissions. Skip the recalculation when the profile is gone.
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
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return;
  end if;

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

revoke execute on function public.recalculate_monthly_balance(uuid, smallint, smallint) from public, anon, authenticated;
