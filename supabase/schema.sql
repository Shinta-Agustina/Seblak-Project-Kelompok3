-- KEDAI SEBLAK: skema database lengkap.
-- Jalankan file ini SEKALI di Supabase SQL Editor, atau jalankan file terpisah
-- di folder supabase/sql-editor sesuai urutan 00 sampai 07.


-- ===== 00_foundation_profiles.sql =====

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


-- ===== 01_menu_topping.sql =====

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


-- ===== 02_kasir.sql =====

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


-- ===== 03_transaksi.sql =====

create table if not exists public.transaksi (
 id uuid primary key default gen_random_uuid(),
 nomor_transaksi text not null unique,
 kasir_id uuid references public.kasir(id) on delete set null,
 nama_kasir text not null,
 tipe_pesanan text not null default 'Dine In' check (tipe_pesanan in ('Dine In','Takeaway')),
 kuah text,
 level_pedas integer check (level_pedas between 0 and 10),
 catatan text,
 subtotal numeric(12,2) not null check (subtotal >= 0),
 diskon numeric(12,2) not null default 0 check (diskon >= 0),
 total numeric(12,2) not null check (total >= 0),
 metode_pembayaran text not null,
 uang_diterima numeric(12,2) not null default 0,
 kembalian numeric(12,2) not null default 0,
 status text not null default 'Lunas' check (status in ('Menunggu','Lunas','Dibatalkan','Refund')),
 created_at timestamptz not null default now()
);
create index if not exists idx_transaksi_created on public.transaksi(created_at desc);
create index if not exists idx_transaksi_kasir on public.transaksi(kasir_id);
alter table public.transaksi enable row level security;
drop policy if exists transaksi_read_owner_or_self on public.transaksi;
create policy transaksi_read_owner_or_self on public.transaksi for select to authenticated
using (public.is_owner() or kasir_id = auth.uid());
drop policy if exists transaksi_cashier_insert on public.transaksi;
create policy transaksi_cashier_insert on public.transaksi for insert to authenticated
with check (public.current_user_role() in ('owner','kasir') and (public.is_owner() or kasir_id = auth.uid()));
drop policy if exists transaksi_owner_update on public.transaksi;
create policy transaksi_owner_update on public.transaksi for update to authenticated using (public.is_owner()) with check (public.is_owner());


-- ===== 04_detail_transaksi.sql =====

create table if not exists public.detail_transaksi (
 id uuid primary key default gen_random_uuid(),
 transaksi_id uuid not null references public.transaksi(id) on delete cascade,
 menu_id uuid references public.menu_topping(id) on delete set null,
 nama_menu text not null,
 harga_satuan numeric(12,2) not null check (harga_satuan >= 0),
 jumlah integer not null check (jumlah > 0),
 subtotal numeric(12,2) not null check (subtotal >= 0),
 created_at timestamptz not null default now()
);
create index if not exists idx_detail_transaksi_header on public.detail_transaksi(transaksi_id);
alter table public.detail_transaksi enable row level security;
drop policy if exists detail_read_parent on public.detail_transaksi;
create policy detail_read_parent on public.detail_transaksi for select to authenticated
using (exists (select 1 from public.transaksi t where t.id = transaksi_id and (public.is_owner() or t.kasir_id = auth.uid())));
drop policy if exists detail_insert_parent on public.detail_transaksi;
create policy detail_insert_parent on public.detail_transaksi for insert to authenticated
with check (exists (select 1 from public.transaksi t where t.id = transaksi_id and (public.is_owner() or t.kasir_id = auth.uid())));
drop policy if exists detail_owner_update on public.detail_transaksi;
create policy detail_owner_update on public.detail_transaksi for update to authenticated
using (public.is_owner()) with check (public.is_owner());
drop policy if exists detail_owner_delete on public.detail_transaksi;
create policy detail_owner_delete on public.detail_transaksi for delete to authenticated using (public.is_owner());


-- ===== 05_pengeluaran.sql =====

create table if not exists public.pengeluaran (
 id uuid primary key default gen_random_uuid(),
 tanggal date not null default current_date,
 nama_pengeluaran text not null,
 kategori text not null,
 jumlah numeric(12,2) not null default 1 check (jumlah > 0),
 harga_satuan numeric(12,2) not null check (harga_satuan >= 0),
 total numeric(12,2) generated always as (jumlah * harga_satuan) stored,
 catatan text,
 dibuat_oleh uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_pengeluaran_tanggal on public.pengeluaran(tanggal desc);
alter table public.pengeluaran enable row level security;
drop policy if exists pengeluaran_owner_all on public.pengeluaran;
create policy pengeluaran_owner_all on public.pengeluaran for all to authenticated
using (public.is_owner()) with check (public.is_owner());


-- ===== 06_stok_bahan.sql =====

create table if not exists public.stok_bahan (
 id uuid primary key default gen_random_uuid(),
 nama_bahan text not null unique,
 kategori text not null,
 satuan text not null default 'pcs',
 stok numeric(12,2) not null default 0 check (stok >= 0),
 stok_minimum numeric(12,2) not null default 0 check (stok_minimum >= 0),
 harga_satuan numeric(12,2) not null default 0 check (harga_satuan >= 0),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.mutasi_stok (
 id uuid primary key default gen_random_uuid(),
 stok_id uuid not null references public.stok_bahan(id) on delete cascade,
 tipe text not null check (tipe in ('masuk','keluar','penyesuaian')),
 jumlah numeric(12,2) not null check (jumlah > 0),
 keterangan text,
 dibuat_oleh uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists idx_mutasi_stok_stok on public.mutasi_stok(stok_id,created_at desc);
alter table public.stok_bahan enable row level security;
alter table public.mutasi_stok enable row level security;
drop policy if exists stok_read_auth on public.stok_bahan;
create policy stok_read_auth on public.stok_bahan for select to authenticated using (true);
drop policy if exists stok_owner_write on public.stok_bahan;
create policy stok_owner_write on public.stok_bahan for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists mutasi_read_auth on public.mutasi_stok;
create policy mutasi_read_auth on public.mutasi_stok for select to authenticated using (true);
drop policy if exists mutasi_owner_write on public.mutasi_stok;
create policy mutasi_owner_write on public.mutasi_stok for all to authenticated using (public.is_owner()) with check (public.is_owner());


-- ===== 07_shift_kasir.sql =====

create table if not exists public.shift_kasir (
 id uuid primary key default gen_random_uuid(),
 kasir_id uuid not null references public.kasir(id) on delete restrict,
 waktu_mulai timestamptz not null default now(),
 waktu_selesai timestamptz,
 modal_awal numeric(12,2) not null default 0 check (modal_awal >= 0),
 uang_akhir_fisik numeric(12,2),
 omzet_sistem numeric(12,2) not null default 0,
 total_transaksi integer not null default 0,
 selisih numeric(12,2),
 status text not null default 'buka' check (status in ('buka','tutup')),
 catatan text,
 created_at timestamptz not null default now()
);
create index if not exists idx_shift_kasir_date on public.shift_kasir(waktu_mulai desc);
alter table public.shift_kasir enable row level security;
drop policy if exists shift_read_owner_or_self on public.shift_kasir;
create policy shift_read_owner_or_self on public.shift_kasir for select to authenticated using (public.is_owner() or kasir_id = auth.uid());
drop policy if exists shift_insert_self on public.shift_kasir;
create policy shift_insert_self on public.shift_kasir for insert to authenticated with check (public.is_owner() or kasir_id = auth.uid());
drop policy if exists shift_update_owner_or_self on public.shift_kasir;
create policy shift_update_owner_or_self on public.shift_kasir for update to authenticated using (public.is_owner() or kasir_id = auth.uid()) with check (public.is_owner() or kasir_id = auth.uid());


-- Storage foto menu
insert into storage.buckets (id, name, public)
values ('menu-seblak','menu-seblak',true)
on conflict (id) do update set public = true;

drop policy if exists menu_seblak_public_read on storage.objects;
create policy menu_seblak_public_read on storage.objects
for select to public using (bucket_id = 'menu-seblak');

drop policy if exists menu_seblak_owner_insert on storage.objects;
create policy menu_seblak_owner_insert on storage.objects
for insert to authenticated with check (bucket_id = 'menu-seblak' and public.is_owner());

drop policy if exists menu_seblak_owner_update on storage.objects;
create policy menu_seblak_owner_update on storage.objects
for update to authenticated using (bucket_id = 'menu-seblak' and public.is_owner())
with check (bucket_id = 'menu-seblak' and public.is_owner());

drop policy if exists menu_seblak_owner_delete on storage.objects;
create policy menu_seblak_owner_delete on storage.objects
for delete to authenticated using (bucket_id = 'menu-seblak' and public.is_owner());
