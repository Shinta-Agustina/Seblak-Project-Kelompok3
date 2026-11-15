
import { supabase } from '../../lib/supabase';

const pad = (n) => String(n).padStart(2, '0');

function normalisasiTanggal(tanggal) {
  if (!tanggal) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal))) {
    return String(tanggal);
  }

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Format tanggal tidak valid.');
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

// Mendukung angka seperti 15000, 15.000, 15.000,50, dan 15000,50.
function parseNominal(value, label) {
  let normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '');

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/\./g, '');
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsed;
}

function validasiPengeluaran(values) {
  const nama = String(
    values.nama ?? values.nama_pengeluaran ?? values.keterangan ?? ''
  ).trim();

  const jumlah = parseNominal(values.jumlah ?? 1, 'Jumlah');
  const total = parseNominal(
    values.total ?? values.nominal,
    'Total pembelian'
  );

  const satuan = String(values.satuan ?? values.bahan_satuan ?? 'pcs').trim();

  if (!nama) throw new Error('Nama bahan wajib diisi.');
  if (jumlah <= 0) throw new Error('Jumlah harus lebih dari 0.');
  if (total <= 0) throw new Error('Total pembelian harus lebih dari 0.');
  if (!satuan) throw new Error('Satuan bahan wajib diisi.');

  return {
    nama,
    jumlah,
    total,
    satuan,
    hargaSatuan: total / jumlah,
  };
}

function mapRow(row) {
  const jumlah = Number(row.jumlah || 0);
  const harga = Number(row.harga_satuan || 0);
  const total = Number(row.total ?? jumlah * harga);

  return {
    ...row,
    nama: row.nama_pengeluaran,
    jumlah,
    harga_satuan: harga,
    total,
    nominal: total,
    satuan: row.bahan_satuan || row.stok_bahan?.satuan || 'unit',
  };
}

// =====================================================
// READ: AMBIL DAFTAR PENGELUARAN
// =====================================================

export async function getExpenses() {
  const { data, error } = await supabase
    .from('pengeluaran')
    .select(`
      *,
      stok_bahan (
        id,
        nama_bahan,
        satuan
      )
    `)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRow);
}

// =====================================================
// READ: AMBIL DAFTAR BAHAN BAKU
// =====================================================

export async function getDaftarBahanBaku() {
  const { data, error } = await supabase
    .from('stok_bahan')
    .select('id, nama_bahan, stok, satuan, harga_satuan')
    .order('nama_bahan', { ascending: true });

  if (error) throw error;

  return data || [];
}

// =====================================================
// CREATE: TAMBAH PENGELUARAN
// =====================================================

export async function createExpense(values) {
  const valid = validasiPengeluaran(values);

  const insertPayload = {
    nama_pengeluaran: valid.nama,
    bahan_nama: valid.nama,
    bahan_satuan: valid.satuan,
    kategori: String(values.kategori || 'Bahan Baku').trim(),
    jumlah: valid.jumlah,
    total: valid.total,
    harga_satuan: valid.hargaSatuan,
    tanggal:
      normalisasiTanggal(values.tanggal) ||
      new Date().toISOString().slice(0, 10),
    waktu: values.waktu || null,
    supplier: values.supplier || null,
    catatan: values.catatan || null,
    foto_item: values.fotoItem || null,
    foto_struk: values.fotoStruk || null,
  };

  const { data, error } = await supabase
    .from('pengeluaran')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  if (!data.stok_id) {
    throw new Error(
      'Pengeluaran tersimpan, tetapi belum terhubung ke stok bahan. Periksa trigger database.'
    );
  }

  return mapRow(data);
}

// =====================================================
// UPDATE: UBAH PENGELUARAN
// =====================================================

export async function updateExpense(id, values) {
  const { data: existing, error: readError } = await supabase
    .from('pengeluaran')
    .select('*')
    .eq('id', id)
    .single();

  if (readError) throw readError;

  const valid = validasiPengeluaran({
    nama: values.nama ?? existing.nama_pengeluaran,
    jumlah: values.jumlah ?? existing.jumlah,
    total: values.total ?? values.nominal ?? existing.total,
    satuan: values.satuan ?? existing.bahan_satuan,
  });

  const patch = {
    nama_pengeluaran: valid.nama,
    bahan_nama: valid.nama,
    bahan_satuan: valid.satuan,
    jumlah: valid.jumlah,
    total: valid.total,
    harga_satuan: valid.hargaSatuan,
    updated_at: new Date().toISOString(),
  };

  if (values.kategori !== undefined) {
    patch.kategori = values.kategori;
  }

  if (values.tanggal !== undefined) {
    patch.tanggal = normalisasiTanggal(values.tanggal);
  }

  if (values.catatan !== undefined) patch.catatan = values.catatan;
  if (values.supplier !== undefined) patch.supplier = values.supplier;
  if (values.waktu !== undefined) patch.waktu = values.waktu;
  if (values.fotoItem !== undefined) patch.foto_item = values.fotoItem;
  if (values.fotoStruk !== undefined) patch.foto_struk = values.fotoStruk;

  // Pertahankan hubungan dengan stok bahan yang sudah ada.
  // Jangan mengganti stok_id secara sembarangan.
  const { data, error } = await supabase
    .from('pengeluaran')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  return mapRow(data);
}

// =====================================================
// DELETE: HAPUS PENGELUARAN
// =====================================================

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('pengeluaran')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}
