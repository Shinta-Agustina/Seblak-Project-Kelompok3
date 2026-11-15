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

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
// "15 November 2026" (tanggal asli hari ini, zona waktu perangkat)
export function hariIniIndo(d = new Date()) {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
export function jamSekarang(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// "15 November 2026" atau "2026-11-15" -> "2026-11-15"
export function tanggalIndoKeISO(str) {
  const t = String(str || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (m) {
    const i = BULAN.findIndex((b) => b.toLowerCase() === m[2].toLowerCase());
    if (i >= 0) return `${m[3]}-${pad(i + 1)}-${pad(Number(m[1]))}`;
  }
  return '';
}

// Unggah foto (data URI / blob / file) ke bucket "pengeluaran"; URL http dibiarkan.
async function unggahFoto(sumber, folder) {
  if (!sumber) return null;
  if (/^https?:\/\//i.test(sumber) && !sumber.startsWith('blob:')) return sumber;
  const res = await fetch(sumber);
  const blob = await res.blob();
  const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext.replace('jpeg', 'jpg')}`;
  const { error } = await supabase.storage.from('pengeluaran').upload(path, blob, { contentType: blob.type || 'image/jpeg' });
  if (error) throw new Error(`Gagal mengunggah foto: ${error.message}`);
  return supabase.storage.from('pengeluaran').getPublicUrl(path).data.publicUrl;
}

async function kolomTambahan(values, dasar = {}) {
  const x = { ...dasar };
  if (values.waktu !== undefined && values.waktu !== null && String(values.waktu).trim()) {
    const w = String(values.waktu).replace(/\s*wib/i, '').trim();
    if (/^\d{1,2}:\d{2}/.test(w)) x.waktu = w.length === 5 ? `${w}:00` : w;
  }
  if (values.supplier !== undefined) x.supplier = String(values.supplier || '').trim() || null;
  if (values.fotoItem !== undefined) x.foto_item = await unggahFoto(values.fotoItem, 'item');
  if (values.fotoStruk !== undefined) x.foto_struk = await unggahFoto(values.fotoStruk, 'struk');
  return x;
}

const mapRow = (r) => {
  const jumlah = Number(r.jumlah);
  const harga = Number(r.harga_satuan);
  const total = Number(r.total ?? jumlah * harga);
  // Jam: kolom waktu; bila kosong pakai jam pencatatan (created_at) dalam zona waktu perangkat (WIB).
  let waktu = r.waktu ? String(r.waktu).slice(0, 5) : '';
  if (!waktu && r.created_at) {
    const c = new Date(r.created_at);
    if (!Number.isNaN(c.getTime())) waktu = `${pad(c.getHours())}:${pad(c.getMinutes())}`;
  }
  // Supplier: kolom supplier; bila kosong baca dari catatan "Supplier: X".
  const sup = r.supplier || (/Supplier:\s*([^;]+)/i.exec(String(r.catatan || ''))?.[1] || '').trim();
  return {
    ...r, nama: r.nama_pengeluaran, jumlah, harga_satuan: harga, total, nominal: total,
    satuan: bacaSatuan(r.catatan), waktu: waktu || '--:--', supplier: sup && sup !== '-' ? sup : '-',
    fotoItem: r.foto_item || null, fotoStruk: r.foto_struk || null,
  };
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
  const tanggal = normalisasiTanggal(values.tanggal) || tanggalIndoKeISO(hariIniIndo());
  payload.tanggal = tanggal;
  Object.assign(payload, await kolomTambahan({ ...values, waktu: values.waktu || jamSekarang() }));
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
  Object.assign(patch, await kolomTambahan(values));
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
