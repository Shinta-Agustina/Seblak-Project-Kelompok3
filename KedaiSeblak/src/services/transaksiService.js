import { supabase } from '../../lib/supabase';

// Embed detail + kategori menu, sesuai yang dibaca mapTransaction di KasirContext.
const SELECT = '*, detail_transaksi(*, menu_topping(kategori))';

const pad = (n, l = 2) => String(n).padStart(l, '0');
function buatNomorTransaksi() {
  const d = new Date();
  const tgl = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const jam = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `TRX-${tgl}-${jam}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// -> array baris transaksi (terbaru dulu) beserta detail_transaksi
export async function getTransactions({ limit = 200 } = {}) {
  const { data, error } = await supabase
    .from('transaksi')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// payload: { items, nomor_transaksi, tipe_pesanan, kuah, level_pedas, catatan, metode_pembayaran, uang_diterima }
// kasirId: id kasir (null bila owner yang transaksi), namaKasir: nama untuk struk
export async function createTransaction(payload, kasirId, namaKasir) {
  const items = (payload.items || []).map((x) => ({
    menu_id: x.id,
    nama_menu: x.nama ?? x.name,
    harga_satuan: Number(x.harga ?? x.price ?? 0),
    jumlah: Number(x.qty || 1),
  }));
  if (!items.length) throw new Error('Keranjang masih kosong.');

  const subtotal = items.reduce((s, x) => s + x.harga_satuan * x.jumlah, 0);
  const diskon = 0;
  const total = subtotal - diskon;
  const uangDiterima = Number(payload.uang_diterima ?? total);

  const { data: trx, error } = await supabase
    .from('transaksi')
    .insert({
      nomor_transaksi: payload.nomor_transaksi || buatNomorTransaksi(),
      kasir_id: kasirId || null,
      nama_kasir: namaKasir || 'Owner',
      tipe_pesanan: payload.tipe_pesanan || 'Dine In',
      kuah: payload.kuah ?? null,
      level_pedas: payload.level_pedas ?? null,
      catatan: payload.catatan || null,
      subtotal, diskon, total,
      metode_pembayaran: payload.metode_pembayaran,
      uang_diterima: uangDiterima,
      kembalian: Math.max(uangDiterima - total, 0),
      status: 'Lunas',
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: detailError } = await supabase.from('detail_transaksi').insert(
    items.map((x) => ({ ...x, transaksi_id: trx.id, subtotal: x.harga_satuan * x.jumlah }))
  );
  if (detailError) {
    await supabase.from('transaksi').delete().eq('id', trx.id); // batalkan transaksi yang setengah jadi
    throw detailError;
  }

  const { data, error: readError } = await supabase.from('transaksi').select(SELECT).eq('id', trx.id).single();
  if (readError) throw readError;
  return data;
}

// status yang diizinkan database: Menunggu, Lunas, Dibatalkan, Refund
export async function updateTransactionStatus(id, status) {
  const { data, error } = await supabase
    .from('transaksi').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
