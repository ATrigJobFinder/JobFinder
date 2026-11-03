-- Lets a signed-in person delete their own account (and, through the cascade, everything saved in it).
-- Run once in Supabase (SQL Editor > New query > paste > Run). Safe to run again. Needs 003_user_docs.sql first.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();   -- user_docs rows go with it (on delete cascade)
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
