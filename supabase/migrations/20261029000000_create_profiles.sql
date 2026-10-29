-- Profiles: one row per auth user, owner-only access.

create table public.profiles (
  id uuid not null references auth.users (id) on delete cascade primary key,
  display_name text not null default '' check (char_length(display_name) <= 50)
);

alter table public.profiles enable row level security;

-- New tables are not exposed to the Data API automatically, so grant explicitly.
-- No insert/delete for clients: rows are created by the trigger below and
-- removed by the cascade from auth.users.
grant select, update (display_name) on public.profiles to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create a profile automatically when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, '');
  return new;
end;
$$;

-- security definer functions in public are callable via the Data API by default.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that signed up before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
