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
