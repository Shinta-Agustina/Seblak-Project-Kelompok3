-- Akun kasir memakai Supabase Auth; jangan simpan password dalam tabel.
create table if not exists public.kasir (
 id uuid primary key references auth.users(id) on delete cascade,
 kode_kasir text unique,
 nama text not null,
 username text unique not null,
 no_telepon text,
 status text not null default 'aktif' check (status in ('aktif','nonaktif')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_kasir_status on public.kasir(status);
alter table public.kasir enable row level security;
drop policy if exists kasir_read_self_owner on public.kasir;
create policy kasir_read_self_owner on public.kasir for select to authenticated using (id = auth.uid() or public.is_owner());
drop policy if exists kasir_owner_insert on public.kasir;
create policy kasir_owner_insert on public.kasir for insert to authenticated with check (public.is_owner());
drop policy if exists kasir_owner_update on public.kasir;
create policy kasir_owner_update on public.kasir for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists kasir_owner_delete on public.kasir;
create policy kasir_owner_delete on public.kasir for delete to authenticated using (public.is_owner());

-- Sinkronisasi kasir ke tabel profiles
create or replace function public.sync_kasir_ke_profiles() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, role, status)
  values (new.id, new.nama, 'kasir', new.status)
  on conflict (id) do update
    set nama = excluded.nama,
        status = excluded.status
    where public.profiles.role = 'kasir';
  return new;
end;
$$;

drop trigger if exists trg_sync_kasir_profiles on public.kasir;
create trigger trg_sync_kasir_profiles
  after insert or update on public.kasir
  for each row execute function public.sync_kasir_ke_profiles();
