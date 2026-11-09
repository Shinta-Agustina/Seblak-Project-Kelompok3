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
