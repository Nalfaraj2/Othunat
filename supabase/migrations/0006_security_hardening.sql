-- إذونات — security hardening, applied after Supabase's security advisor flagged these.
-- Internal/trigger-only functions: nobody should call these through the API.
revoke execute on function public.recalculate_monthly_balance(uuid, smallint, smallint) from public, anon, authenticated;
revoke execute on function public.permissions_after_write() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Signed-in users only (anon has no session, so nothing to delete / no admin check needed).
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- get_email_by_civil_id stays callable by anon: the login screen needs it before sign-in.

-- Pin search_path on the two non-definer functions.
alter function public.compute_permission_duration(text, time, time) set search_path = public;
alter function public.permissions_before_write() set search_path = public;
