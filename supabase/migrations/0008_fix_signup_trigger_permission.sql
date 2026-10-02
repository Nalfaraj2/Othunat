-- Defensive fix: Supabase Auth creates users as the supabase_auth_admin role, which then fires
-- the handle_new_user() trigger. 0006 revoked EXECUTE on it from PUBLIC (to stop API callers),
-- which also removed it from supabase_auth_admin. Postgres normally only checks a trigger
-- function's EXECUTE permission at CREATE TRIGGER time, so this may not have been the cause of
-- the first failed sign-up — but granting it back to that one role is correct and harmless.
-- anon/authenticated still cannot call the function.
grant execute on function public.handle_new_user() to supabase_auth_admin;
