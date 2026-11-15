
import { supabase } from '../../lib/supabase';

const formatTanggal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const rupiah = (value) => Number(value || 0);

export async function getFinancialReport(options = {}) {
  const now = new Date();

  const startDate =
    options.startDate ||
    formatTanggal(new Date(now.getFullYear(), now.getMonth(), 1));

  const endDate =
    options.endDate ||
    formatTanggal(now);

  if (startDate > endDate) {
    throw new Error('Tanggal awal tidak boleh melebihi tanggal akhir.');
  }

  const [
    { data: transactions, error: transactionError },
    { data: expenses, error: expenseError },
  ] = await Promise.all([
    supabase
      .from('transaksi')
      .select('id, nomor_transaksi, total, status, created_at, metode_pembayaran')
      .eq('status', 'Lunas')
      .gte('created_at', `${startDate}T00:00:00`)
      .lt('created_at', `${endDate}T23:59:59.999`)
      .order('created_at', { ascending: true }),

    supabase
      .from('pengeluaran')
      .select('id, nama_pengeluaran, total, tanggal, kategori')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: true }),
  ]);

  if (transactionError) throw transactionError;
  if (expenseError) throw expenseError;

  const sales = transactions || [];
  const expenseRows = expenses || [];

  const totalPemasukan = sales.reduce(
    (sum, item) => sum + rupiah(item.total),
    0
  );

  const totalPengeluaran = expenseRows.reduce(
    (sum, item) => sum + rupiah(item.total),
    0
  );

  const keuntunganBersih = totalPemasukan - totalPengeluaran;

  const rekapTanggal = {};

  const getDaily = (date) => {
    if (!rekapTanggal[date]) {
      rekapTanggal[date] = {
        tanggal: date,
        pemasukan: 0,
        pengeluaran: 0,
        keuntungan: 0,
        jumlah_transaksi: 0,
      };
    }

    return rekapTanggal[date];
  };

  sales.forEach((item) => {
    const date = formatTanggal(new Date(item.created_at));
    const daily = getDaily(date);

    daily.pemasukan += rupiah(item.total);
    daily.jumlah_transaksi += 1;
  });

  expenseRows.forEach((item) => {
    const daily = getDaily(item.tanggal);

    daily.pengeluaran += rupiah(item.total);
  });

  const dailyReport = Object.values(rekapTanggal)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .map((item) => ({
      ...item,
      keuntungan: item.pemasukan - item.pengeluaran,
    }));

  const metodePembayaran = {};

  sales.forEach((item) => {
    const method = item.metode_pembayaran || 'Lainnya';

    metodePembayaran[method] =
      (metodePembayaran[method] || 0) + rupiah(item.total);
  });

  return {
    startDate,
    endDate,

    totalPemasukan,
    totalPengeluaran,
    keuntunganBersih,

    jumlahTransaksi: sales.length,

    transaksi: sales,
    pengeluaran: expenseRows,

    dailyReport,
    metodePembayaran,
  };
}
