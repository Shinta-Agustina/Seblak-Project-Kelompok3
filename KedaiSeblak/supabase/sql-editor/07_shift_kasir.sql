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
