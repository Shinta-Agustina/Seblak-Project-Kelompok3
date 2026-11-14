import { supabase } from '../../lib/supabase';

const pad = (n) => String(n).padStart(2, '0');

function normalisasiTanggal(t) {
  if (!t) return undefined; // kosong -> pakai default CURRENT_DATE dari database
  if (/^\d{4}-\d{2}-\d{2}/.test(String(t))) return String(t).slice(0, 10);
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Satuan tidak punya kolom sendiri; dibaca dari catatan:
// "Satuan: kg; Supplier: ..." (dari aplikasi) atau "Pembelian 5 kg (EXP-1)" (data impor).
function bacaSatuan(catatan) {
  const c = String(catatan || '');
  const a = /Satuan:\s*([^;.]+)/i.exec(c);
  if (a) return a[1].trim();
  const b = /Pembelian\s+[\d.,]+\s+([A-Za-z]+)/i.exec(c);
  return b ? b[1] : 'unit';
}

const mapRow = (r) => {
  const jumlah = Number(r.jumlah);
  const harga = Number(r.harga_satuan);
  const total = Number(r.total ?? jumlah * harga);
  return { ...r, nama: r.nama_pengeluaran, jumlah, harga_satuan: harga, total, nominal: total, satuan: bacaSatuan(r.catatan) };
};

// -> array pengeluaran (terbaru dulu) dengan field: nama, nominal, total, tanggal, catatan, satuan, ...
export async function getExpenses() {
  const { data, error } = await supabase
    .from('pengeluaran')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function cariStokId(nama) {
  if (!nama) return null;
  const { data } = await supabase.from('stok_bahan').select('id').ilike('nama_bahan', String(nama).trim()).limit(1);
  return data?.[0]?.id || null;
}

// values: { tanggal, nama, kategori, jumlah, harga_satuan, catatan }
// Kolom total dihitung database sendiri (generated column), jadi tidak dikirim.
export async function createExpense(values, userId) {
  const payload = {
    nama_pengeluaran: String(values.nama || '').trim(),
    kategori: values.kategori || 'Lainnya',
    jumlah: Number(values.jumlah || 1),
    harga_satuan: Number(values.harga_satuan || 0),
    catatan: values.catatan ?? null,
    dibuat_oleh: userId || null,
    stok_id: await cariStokId(values.nama),
  };
  if (!payload.nama_pengeluaran) throw new Error('Nama pengeluaran wajib diisi.');
  const tanggal = normalisasiTanggal(values.tanggal);
  if (tanggal) payload.tanggal = tanggal;
  const { data, error } = await supabase.from('pengeluaran').insert(payload).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateExpense(id, values) {
  const patch = { updated_at: new Date().toISOString() };
  if (values.nama !== undefined) patch.nama_pengeluaran = String(values.nama).trim();
  if (values.kategori !== undefined) patch.kategori = values.kategori;
  if (values.jumlah !== undefined) patch.jumlah = Number(values.jumlah);
  if (values.harga_satuan !== undefined) patch.harga_satuan = Number(values.harga_satuan);
  if (values.catatan !== undefined) patch.catatan = values.catatan;
  const tanggal = normalisasiTanggal(values.tanggal);
  if (tanggal) patch.tanggal = tanggal;
  const { data, error } = await supabase.from('pengeluaran').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return mapRow(data);
}

// Riwayat mutasi stok yang terkait tidak ikut terhapus; hanya dilepas dari pengeluaran ini.
export async function deleteExpense(id) {
  const { error: unlinkError } = await supabase
    .from('mutasi_stok').update({ pengeluaran_id: null }).eq('pengeluaran_id', id);
  if (unlinkError) throw unlinkError;
  const { error } = await supabase.from('pengeluaran').delete().eq('id', id);
  if (error) throw error;
}
