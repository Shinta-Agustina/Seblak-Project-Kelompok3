-- 00. Jalankan pertama kali. Membuat profil aplikasi yang terhubung ke Supabase Auth.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role text not null check (role in ('owner','kasir')),
  status text not null default 'aktif' check (status in ('aktif','nonaktif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'aktif' limit 1;
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'owner', false);
$$;

alter table public.profiles enable row level security;

-- Policy SELECT: User dapat membaca profilnya sendiri atau owner dapat membaca semua profil
drop policy if exists profiles_read_self_or_owner on public.profiles;
create policy profiles_read_self_or_owner on public.profiles
for select to authenticated using (id = auth.uid() or public.is_owner());

-- Policy INSERT: User dapat mendaftarkan profilnya sendiri atau owner mendaftarkan profil kasir
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_insert_self_or_owner on public.profiles;
create policy profiles_insert_self_or_owner on public.profiles
for insert to authenticated with check (id = auth.uid() or public.is_owner());

-- Policy UPDATE: User dapat memperbarui profilnya sendiri atau owner memperbarui profil kasir
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists profiles_update_self_or_owner on public.profiles;
create policy profiles_update_self_or_owner on public.profiles
for update to authenticated using (id = auth.uid() or public.is_owner()) with check (id = auth.uid() or public.is_owner());

-- Trigger otomatis untuk membuat profil saat user baru terdaftar di auth.users (email atau Google)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_role text;
begin
  v_nama := coalesce(
    new.raw_user_meta_data->>'nama',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  if new.raw_user_meta_data->>'role' = 'owner'
     or new.raw_user_meta_data->>'peran' = 'owner'
     or new.email = 'dewi@kedaiseblak.com'
     or not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
  else
    v_role := coalesce(new.raw_user_meta_data->>'role', 'kasir');
  end if;

  insert into public.profiles (id, nama, role, status)
  values (new.id, v_nama, v_role, 'aktif')
  on conflict (id) do update
  set nama = excluded.nama,
      status = 'aktif';

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
