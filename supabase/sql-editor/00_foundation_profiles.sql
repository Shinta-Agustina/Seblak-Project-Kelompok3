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
drop policy if exists profiles_read_self_or_owner on public.profiles;
create policy profiles_read_self_or_owner on public.profiles
for select to authenticated using (id = auth.uid() or public.is_owner());
drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles
for insert to authenticated with check (public.is_owner());
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Buat user terlebih dahulu melalui Authentication > Users.
-- Lalu isi profilnya, contoh:
-- insert into public.profiles(id,nama,role) values ('UUID_AUTH_USER','Nama Owner','owner');
