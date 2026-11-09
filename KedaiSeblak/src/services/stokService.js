import { supabase } from '../../lib/supabase';

// Ubah ke true HANYA bila di database ada trigger yang otomatis mengubah stok_bahan.stok
// setiap ada baris baru di mutasi_stok. Kalau trigger ada dan ini false, stok terhitung dua kali.
const STOK_DIUBAH_TRIGGER = false;

// -> baris tabel stok_bahan
export async function getStocks() {
  const { data, error } = await supabase
    .from('stok_bahan')
    .select('*')
    .order('nama_bahan', { ascending: true });
  if (error) throw error;
  return data || [];
}

// -> baris tabel mutasi_stok (terbaru dulu)
export async function getStockMovements({ limit = 1000 } = {}) {
  const { data, error } = await supabase
    .from('mutasi_stok')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function updateStock(id, values) {
  const patch = { updated_at: new Date().toISOString() };
  ['nama_bahan', 'kategori', 'satuan', 'stok_minimum', 'harga_satuan'].forEach((k) => {
    if (values[k] !== undefined) patch[k] = values[k];
  });
  const { data, error } = await supabase
    .from('stok_bahan').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// tipe 'masuk'  : stok bertambah sebanyak jumlah
// tipe 'keluar' : stok berkurang sebanyak jumlah
// tipe 'penyesuaian' : jumlah = stok baru (hasil stock opname)
export async function recordStockMutation({ stok_id, tipe, jumlah, keterangan, dibuat_oleh }) {
  if (!['masuk', 'keluar', 'penyesuaian'].includes(tipe)) throw new Error('Tipe mutasi tidak valid.');
  const qty = Number(jumlah);
  if (!Number.isFinite(qty) || qty < 0) throw new Error('Jumlah tidak valid.');
  if (qty === 0 && tipe !== 'penyesuaian') throw new Error('Jumlah harus lebih dari 0.');

  const { data: current, error: readError } = await supabase
    .from('stok_bahan').select('stok').eq('id', stok_id).single();
  if (readError) throw readError;

  const sekarang = Number(current.stok);
  const baru = tipe === 'masuk' ? sekarang + qty : tipe === 'keluar' ? sekarang - qty : qty;
  if (baru < 0) throw new Error('Stok tidak boleh negatif.');

  // Tabel mutasi_stok mewajibkan jumlah > 0, jadi penyesuaian ke 0 hanya mengubah stok.
  let mutasiId = null;
  if (qty > 0) {
    const { data: mutasi, error } = await supabase
      .from('mutasi_stok')
      .insert({ stok_id, tipe, jumlah: qty, keterangan: keterangan || null, dibuat_oleh: dibuat_oleh || null })
      .select('id')
      .single();
    if (error) throw error;
    mutasiId = mutasi.id;
  }

  if (!STOK_DIUBAH_TRIGGER) {
    const { error } = await supabase
      .from('stok_bahan').update({ stok: baru, updated_at: new Date().toISOString() }).eq('id', stok_id);
    if (error) {
      if (mutasiId) await supabase.from('mutasi_stok').delete().eq('id', mutasiId);
      throw error;
    }
  }
  return { stok: baru };
}
