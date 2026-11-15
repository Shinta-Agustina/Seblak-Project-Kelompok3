import { supabase } from '../../lib/supabase';

// Mengambil transaksi beserta detail dan kategori menu.
const SELECT = '*, detail_transaksi(*, menu_topping(kategori))';

const pad = (n, l = 2) => String(n).padStart(l, '0');

function buatNomorTransaksi() {
  const d = new Date();

  const tgl = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const jam = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  return `TRX-${tgl}-${jam}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

// Mengambil transaksi terbaru.
// Maksimal 5.000 transaksi, dibaca per halaman 500 baris.
const MAKS_BARIS = 5000;
const UKURAN_HALAMAN = 500;

export async function getTransactions({ limit = 200 } = {}) {
  const target = Math.max(Number(limit) || 0, MAKS_BARIS);
  const rows = [];

  for (let from = 0; from < target; from += UKURAN_HALAMAN) {
    const { data, error } = await supabase
      .from('transaksi')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, Math.min(from + UKURAN_HALAMAN, target) - 1);

    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < UKURAN_HALAMAN) {
      break;
    }
  }

  return rows;
}

// Membuat transaksi, menyimpan detail, dan mengurangi stok
// melalui satu proses database menggunakan RPC.
export async function createTransaction(payload, kasirId, namaKasir) {
  const rawItems = payload.items || [];

  if (!rawItems.length) {
    throw new Error('Keranjang masih kosong.');
  }

  // Validasi dan normalisasi item pesanan.
  const items = rawItems.map((item) => {
    const harga = Number(item.harga ?? item.price);
    const jumlah = Number(item.qty ?? item.jumlah ?? 1);

    if (!item.id) {
      throw new Error('ID menu tidak ditemukan.');
    }

    if (!item.nama && !item.name) {
      throw new Error('Nama menu tidak ditemukan.');
    }

    if (!Number.isFinite(harga) || harga < 0) {
      throw new Error('Harga menu tidak valid.');
    }

    if (!Number.isInteger(jumlah) || jumlah <= 0) {
      throw new Error('Jumlah pesanan harus lebih dari 0.');
    }

    return {
      menu_id: item.id,
      nama_menu: item.nama ?? item.name,
      harga_satuan: harga,
      jumlah,
    };
  });

  // Hitung subtotal berdasarkan seluruh item.
  const subtotal = items.reduce(
    (total, item) =>
      total + item.harga_satuan * item.jumlah,
    0
  );

  const diskon = Number(payload.diskon ?? 0);

  if (
    !Number.isFinite(diskon) ||
    diskon < 0 ||
    diskon > subtotal
  ) {
    throw new Error('Nominal diskon tidak valid.');
  }

  const total = subtotal - diskon;
  const uangDiterima = Number(payload.uang_diterima ?? total);

  if (
    !Number.isFinite(uangDiterima) ||
    uangDiterima < total
  ) {
    throw new Error('Uang pembayaran tidak mencukupi.');
  }

  // Validasi metode pembayaran.
  const metodePembayaran = String(
    payload.metode_pembayaran || ''
  ).trim();

  if (!metodePembayaran) {
    throw new Error('Metode pembayaran wajib dipilih.');
  }

  // Validasi tipe pesanan.
  const tipePesanan = payload.tipe_pesanan || 'Dine In';

  if (!['Dine In', 'Takeaway'].includes(tipePesanan)) {
    throw new Error('Tipe pesanan tidak valid.');
  }

  // Validasi level pedas.
  const levelPedas = payload.level_pedas ?? null;

  if (
    levelPedas !== null &&
    (
      !Number.isInteger(Number(levelPedas)) ||
      Number(levelPedas) < 0 ||
      Number(levelPedas) > 10
    )
  ) {
    throw new Error('Level pedas harus antara 0 sampai 10.');
  }

  const nomorTransaksi =
    payload.nomor_transaksi || buatNomorTransaksi();

  // Data transaksi yang dikirim ke fungsi database.
  const transaksiData = {
    nomor_transaksi: nomorTransaksi,
    kasir_id: kasirId || null,
    nama_kasir: namaKasir || 'Owner',
    tipe_pesanan: tipePesanan,
    kuah: payload.kuah ?? null,
    level_pedas:
      levelPedas === null ? null : Number(levelPedas),
    catatan: payload.catatan || null,
    diskon,
    uang_diterima: uangDiterima,
    metode_pembayaran: metodePembayaran,
  };

  // Simpan transaksi, detail, dan mutasi stok secara atomik.
  const { data: transaksiId, error: rpcError } =
    await supabase.rpc('simpan_transaksi', {
      p_transaksi: transaksiData,
      p_items: items,
    });

  if (rpcError) {
    throw new Error(
      rpcError.message || 'Gagal menyimpan transaksi.'
    );
  }

  if (!transaksiId) {
    throw new Error('ID transaksi tidak berhasil dibuat.');
  }

  // Ambil kembali transaksi beserta detailnya.
  const { data, error: readError } = await supabase
    .from('transaksi')
    .select(SELECT)
    .eq('id', transaksiId)
    .single();

  if (readError) {
    throw new Error(
      `Transaksi tersimpan, tetapi gagal dibaca kembali: ${readError.message}`
    );
  }

  return data;
}

// Memperbarui progres pesanan dapur.
export async function updateOrderProgress(id, statusPesanan) {
  const statusValid = [
    'Menunggu',
    'Diproses',
    'Siap',
    'Selesai',
    'Dibatalkan',
  ];

  if (!statusValid.includes(statusPesanan)) {
    throw new Error('Status pesanan tidak valid.');
  }

  const { data, error } = await supabase
    .from('transaksi')
    .update({
      status_pesanan: statusPesanan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, status_pesanan')
    .single();

  if (error) throw error;

  return data;
}

// Memperbarui status pembayaran.
export async function updateTransactionStatus(id, status) {
  const { data, error } = await supabase
    .from('transaksi')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Menghapus transaksi dan detailnya.
export async function deleteTransaction(id) {
  const { error: detailError } = await supabase
    .from('detail_transaksi')
    .delete()
    .eq('transaksi_id', id);

  if (detailError) throw detailError;

  const { error } = await supabase
    .from('transaksi')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}

// Memperbarui data transaksi yang diizinkan.
export async function updateTransaction(id, patch = {}) {
  const allowed = {};

  if (patch.status !== undefined) {
    allowed.status = patch.status;
  }

  if (patch.status_pesanan !== undefined) {
    allowed.status_pesanan = patch.status_pesanan;
  }

  if (patch.catatan !== undefined) {
    allowed.catatan = patch.catatan;
  }

  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('transaksi')
    .update(allowed)
    .eq('id', id)
    .select('id, status, status_pesanan, catatan')
    .single();

  if (error) throw error;

  return data;
}
