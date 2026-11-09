-- Menu dan topping. Dapat dijalankan setelah 00_foundation_profiles.sql.
create table if not exists public.menu_topping (
 id uuid primary key default gen_random_uuid(),
 nama text not null check (length(trim(nama)) >= 2),
 kategori text not null,
 harga numeric(12,2) not null check (harga > 0),
 stok integer not null default 0 check (stok >= 0),
 berat text not null default '1 pcs',
 status text not null default 'Aktif' check (status in ('Aktif','Nonaktif')),
 emoji text default '🍲',
 foto_url text,
 foto_path text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_menu_topping_status on public.menu_topping(status);
create index if not exists idx_menu_topping_kategori on public.menu_topping(kategori);
alter table public.menu_topping enable row level security;
drop policy if exists menu_read_authenticated on public.menu_topping;
create policy menu_read_authenticated on public.menu_topping for select to authenticated using (true);
drop policy if exists menu_owner_insert on public.menu_topping;
create policy menu_owner_insert on public.menu_topping for insert to authenticated with check (public.is_owner());
drop policy if exists menu_owner_update on public.menu_topping;
create policy menu_owner_update on public.menu_topping for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists menu_owner_delete on public.menu_topping;
create policy menu_owner_delete on public.menu_topping for delete to authenticated using (public.is_owner());
