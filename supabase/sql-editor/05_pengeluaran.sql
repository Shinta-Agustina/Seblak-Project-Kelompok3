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
