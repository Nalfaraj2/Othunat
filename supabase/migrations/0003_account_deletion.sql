-- إذونات — Phase 5: self-service account deletion (required by Apple guideline 5.1.1v and
-- requested by Google Play). Deleting the auth.users row cascades to profiles and, from there,
-- to permissions/monthly_balances/medical_permissions/fingerprint_records (all declared
-- "on delete cascade" against profiles in 0001_init.sql) — one delete removes everything.
-- Known gap: this does not remove the user's files from the "attachments" storage bucket
-- (storage objects aren't FK-linked to profiles); a periodic cleanup job can reconcile that later.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
