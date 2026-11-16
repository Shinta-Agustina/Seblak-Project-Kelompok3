import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

const pad = (n) => String(n).padStart(2, '0');

function normalisasiTanggal(t) {
  if (!t) return undefined;

  if (/^\d{4}-\d{2}-\d{2}/.test(String(t))) {
    return String(t).slice(0, 10);
  }

  const d = new Date(t);

  return Number.isNaN(d.getTime())
    ? undefined
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// =====================================================
// HELPER NOMINAL DAN JUMLAH
// =====================================================

function parseNominalPembelian(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const clean = String(value ?? '').replace(/[^0-9]/g, '');

  return clean ? Number(clean) : 0;
}

function parseJumlah(value) {
  const jumlah = Number(
    String(value ?? '').replace(',', '.')
  );

  return Number.isFinite(jumlah) ? jumlah : 0;
}

function hitungHargaSatuan(total, jumlah) {
  if (jumlah <= 0) {
    throw new Error('Jumlah pembelian harus lebih besar dari 0.');
  }

  if (total <= 0) {
    throw new Error('Total pembelian harus lebih besar dari Rp 0.');
  }

  return total / jumlah;
}

// =====================================================
// SATUAN
// =====================================================

function bacaSatuan(catatan) {
  const c = String(catatan || '');

  const a = /Satuan:\s*([^;.]+)/i.exec(c);

  if (a) return a[1].trim();

  const b = /Pembelian\s+[\d.,]+\s+([A-Za-z]+)/i.exec(c);

  return b ? b[1] : 'unit';
}

// =====================================================
// TANGGAL DAN WAKTU
// =====================================================

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function hariIniIndo(d = new Date()) {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function jamSekarang(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function tanggalIndoKeISO(str) {
  const t = String(str || '').trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return t.slice(0, 10);
  }

  const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);

  if (m) {
    const i = BULAN.findIndex(
      (b) => b.toLowerCase() === m[2].toLowerCase()
    );

    if (i >= 0) {
      return `${m[3]}-${pad(i + 1)}-${pad(Number(m[1]))}`;
    }
  }

  return '';
}


// =====================================================
// UPLOAD FOTO PENGELUARAN
// Mendukung foto dari Android, iOS, Web, dan URL Supabase.
// =====================================================

function base64ToArrayBuffer(base64) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(
    Math.floor((clean.length * 3) / 4)
  );

  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = chars.indexOf(clean[i]);

    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >> bits) & 0xff;
    }
  }

  return bytes.slice(0, index).buffer;
}

async function unggahFoto(sumber, folder) {
  if (!sumber) return null;

  // Jika sudah berupa URL publik, tidak perlu upload ulang.
  if (
    typeof sumber === 'string' &&
    /^https?:\/\//i.test(sumber)
  ) {
    return sumber;
  }

  let fileData;
  let contentType = 'image/jpeg';

  try {
    // WEB: foto biasanya berupa Data URL atau Blob URL.
    if (
      typeof sumber === 'string' &&
      (/^data:image\//i.test(sumber) ||
        /^blob:/i.test(sumber))
    ) {
      const response = await fetch(sumber);

      if (!response.ok) {
        throw new Error('Tidak dapat membaca foto dari browser.');
      }

      const blob = await response.blob();

      fileData = blob;
      contentType = blob.type || 'image/jpeg';
    } else {
      // ANDROID / IOS: baca URI lokal menggunakan FileSystem.
      const info = await FileSystem.getInfoAsync(sumber);

      if (!info.exists) {
        throw new Error('File foto tidak ditemukan di perangkat.');
      }

      const base64 = await FileSystem.readAsStringAsync(sumber, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64) {
        throw new Error('File foto kosong atau gagal dibaca.');
      }

      fileData = base64ToArrayBuffer(base64);

      const extension = sumber
        .split('?')[0]
        .split('#')[0]
        .split('.')
        .pop()
        .toLowerCase();

      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };

      contentType = mimeTypes[extension] || 'image/jpeg';
    }
  } catch (error) {
    console.error('Gagal membaca foto:', error);

    throw new Error(
      `Gagal membaca foto yang akan diunggah: ${error.message}`
    );
  }

  const extension =
    contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from('pengeluaran')
    .upload(path, fileData, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal mengunggah foto: ${error.message}`);
  }

  const { data } = supabase.storage
    .from('pengeluaran')
    .getPublicUrl(path);

  return data.publicUrl;
}


// =====================================================
// KOLOM TAMBAHAN
// =====================================================

async function kolomTambahan(values, dasar = {}) {
  const x = { ...dasar };

  if (
    values.waktu !== undefined &&
    values.waktu !== null &&
    String(values.waktu).trim()
  ) {
    const w = String(values.waktu)
      .replace(/\s*wib/i, '')
      .trim();

    if (/^\d{1,2}:\d{2}/.test(w)) {
      x.waktu = w.length === 5 ? `${w}:00` : w;
    }
  }

  if (values.supplier !== undefined) {
    x.supplier = String(values.supplier || '').trim() || null;
  }

  const [fotoItem, fotoStruk] = await Promise.all([
    values.fotoItem !== undefined
      ? unggahFoto(values.fotoItem, 'item')
      : Promise.resolve(undefined),

    values.fotoStruk !== undefined
      ? unggahFoto(values.fotoStruk, 'struk')
      : Promise.resolve(undefined),
  ]);

  if (fotoItem !== undefined) {
    x.foto_item = fotoItem;
  }

  if (fotoStruk !== undefined) {
    x.foto_struk = fotoStruk;
  }

  return x;
}

// =====================================================
// MAPPING DATA DATABASE
// =====================================================

const mapRow = (r) => {
  const jumlah = Number(r.jumlah || 0);
  const harga = Number(r.harga_satuan || 0);
  const total = Number(r.total ?? jumlah * harga);

  let waktu = r.waktu
    ? String(r.waktu).slice(0, 5)
    : '';

  if (!waktu && r.created_at) {
    const c = new Date(r.created_at);

    if (!Number.isNaN(c.getTime())) {
      waktu = `${pad(c.getHours())}:${pad(c.getMinutes())}`;
    }
  }

  const sup =
    r.supplier ||
    (
      /Supplier:\s*([^;]+)/i.exec(
        String(r.catatan || '')
      )?.[1] || ''
    ).trim();

  return {
    ...r,
    nama: r.nama_pengeluaran,
    jumlah,
    harga_satuan: harga,
    total,
    nominal: total,
    satuan: bacaSatuan(r.catatan),
    waktu: waktu || '--:--',
    supplier: sup && sup !== '-' ? sup : '-',
    fotoItem: r.foto_item || null,
    fotoStruk: r.foto_struk || null,
  };
};

// =====================================================
// READ: AMBIL SEMUA PENGELUARAN
// =====================================================

export async function getExpenses() {
  const { data, error } = await supabase
    .from('pengeluaran')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRow);
}

// =====================================================
// CARI STOK BERDASARKAN NAMA
// =====================================================

async function cariStokId(nama) {
  if (!nama) return null;

  const { data, error } = await supabase
    .from('stok_bahan')
    .select('id')
    .ilike('nama_bahan', String(nama).trim())
    .limit(1);

  if (error) throw error;

  return data?.[0]?.id || null;
}

// =====================================================
// CREATE: TAMBAH PENGELUARAN
// =====================================================

export async function createExpense(values, userId) {
  const nama = String(values.nama || '').trim();

  if (!nama) {
    throw new Error('Nama pengeluaran wajib diisi.');
  }

  const jumlah = parseJumlah(values.jumlah || 1);

  if (jumlah <= 0) {
    throw new Error('Jumlah pembelian harus lebih besar dari 0.');
  }

  const total = parseNominalPembelian(
    values.total ?? values.nominal
  );

  const hargaSatuan = total > 0
    ? hitungHargaSatuan(total, jumlah)
    : Number(values.harga_satuan || 0);

  if (hargaSatuan <= 0) {
    throw new Error('Total pembelian harus lebih besar dari Rp 0.');
  }

  const payload = {
    nama_pengeluaran: nama,
    kategori: values.kategori || 'Lainnya',
    jumlah,
    harga_satuan: hargaSatuan,
    catatan: values.catatan ?? null,
    dibuat_oleh: userId || null,
    stok_id: await cariStokId(nama),
  };

  const tanggal =
    normalisasiTanggal(values.tanggal) ||
    tanggalIndoKeISO(hariIniIndo());

  payload.tanggal = tanggal;

  Object.assign(
    payload,
    await kolomTambahan({
      ...values,
      waktu: values.waktu || jamSekarang(),
    })
  );

  const { data, error } = await supabase
    .from('pengeluaran')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

// =====================================================
// UPDATE: EDIT PENGELUARAN
// =====================================================


export async function updateExpense(id, values) {
  // Ambil jumlah dan harga satuan saat ini sebagai nilai cadangan.
  const { data: current, error: fetchError } = await supabase
    .from('pengeluaran')
    .select('jumlah, harga_satuan')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const patch = {
    updated_at: new Date().toISOString(),
  };

  if (values.nama !== undefined) {
    patch.nama_pengeluaran = String(values.nama).trim();
  }

  if (values.kategori !== undefined) {
    patch.kategori = values.kategori;
  }

  if (values.catatan !== undefined) {
    patch.catatan = values.catatan;
  }

  const tanggal = normalisasiTanggal(values.tanggal);

  if (tanggal) {
    patch.tanggal = tanggal;
  }

  // Gunakan nilai baru jika dikirim, jika tidak gunakan nilai database.
  const jumlahFinal =
    values.jumlah !== undefined
      ? Number(values.jumlah)
      : Number(current.jumlah);

  const hargaFinal =
    values.harga_satuan !== undefined
      ? Number(values.harga_satuan)
      : Number(current.harga_satuan);

  if (!Number.isFinite(jumlahFinal) || jumlahFinal <= 0) {
    throw new Error('Jumlah pembelian harus lebih dari 0.');
  }

  if (!Number.isFinite(hargaFinal) || hargaFinal < 0) {
    throw new Error('Harga satuan tidak valid.');
  }

  if (values.jumlah !== undefined) {
    patch.jumlah = jumlahFinal;
  }

  if (values.harga_satuan !== undefined) {
    patch.harga_satuan = hargaFinal;
  }

  // TOTAL ADALAH KOLOM BIASA, JADI WAJIB DIPERBARUI.
  if (
    values.total !== undefined ||
    values.nominal !== undefined
  ) {
    const nilaiTotal = values.total ?? values.nominal;

    const totalAngka =
      typeof nilaiTotal === 'number'
        ? nilaiTotal
        : Number(
          String(nilaiTotal).replace(/[^\d-]/g, '')
        );

    if (!Number.isFinite(totalAngka) || totalAngka <= 0) {
      throw new Error('Total pembelian tidak valid.');
    }

    patch.total = totalAngka;
  } else if (
    values.jumlah !== undefined ||
    values.harga_satuan !== undefined
  ) {
    patch.total = jumlahFinal * hargaFinal;
  }

  Object.assign(patch, await kolomTambahan(values));

  const { data, error } = await supabase
    .from('pengeluaran')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

// =====================================================
// DELETE: HAPUS PENGELUARAN
// =====================================================

// Riwayat mutasi stok tetap dipertahankan.
// Penghapusan tetap mengikuti aturan trigger stok di database.
export async function deleteExpense(id) {
  const { error: unlinkError } = await supabase
    .from('mutasi_stok')
    .update({ pengeluaran_id: null })
    .eq('pengeluaran_id', id);

  if (unlinkError) throw unlinkError;

  const { error } = await supabase
    .from('pengeluaran')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}
