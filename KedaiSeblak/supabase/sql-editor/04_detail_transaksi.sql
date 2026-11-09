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
