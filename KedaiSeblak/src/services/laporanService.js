import { supabase } from '../../lib/supabase';
import { getExpenses } from './pengeluaranService';

// Laporan Keuangan = murni BACA (Read). Omzet = transaksi berstatus Lunas,
// pengeluaran = tabel pengeluaran, laba bersih = omzet - pengeluaran.
const UKURAN_HALAMAN = 500;
const MAKS_BARIS = 20000;
const KOLOM = 'id, nomor_transaksi, nama_kasir, total, metode_pembayaran, status, created_at';

async function bacaTransaksi({ from, to }) {
  const rows = [];
  for (let start = 0; start < MAKS_BARIS; start += UKURAN_HALAMAN) {
    let q = supabase.from('transaksi').select(KOLOM).eq('status', 'Lunas');
    if (from) q = q.gte('created_at', `${from}T00:00:00+07:00`);
    if (to) q = q.lte('created_at', `${to}T23:59:59.999+07:00`);
    const { data, error } = await q
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(start, start + UKURAN_HALAMAN - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < UKURAN_HALAMAN) break;
  }
  return rows;
}

// from/to berformat 'YYYY-MM-DD' (WIB). Kosong = semua data.
export async function getFinancialReport({ from, to } = {}) {
  const [transaksi, semuaPengeluaran] = await Promise.all([bacaTransaksi({ from, to }), getExpenses()]);
  const pengeluaran = semuaPengeluaran.filter((r) => {
    const t = String(r.tanggal || '').slice(0, 10);
    return (!from || t >= from) && (!to || t <= to);
  });
  const totalOmzet = transaksi.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPengeluaran = pengeluaran.reduce((s, r) => s + Number(r.nominal || 0), 0);
  return { transaksi, pengeluaran, totalOmzet, totalPengeluaran, labaBersih: totalOmzet - totalPengeluaran };
}
