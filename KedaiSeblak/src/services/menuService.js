
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const TABLE = 'menu_topping';
const BUCKET = 'menu-seblak';
const MAX_FOTO_BYTES = 2 * 1024 * 1024;

const MIME_DARI_EKSTENSI = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function normalisasiUrlFoto(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    value = value.uri;
  }

  if (typeof value !== 'string') return null;

  let url = value.trim();

  // Mengatasi URL yang tersimpan dalam format Markdown.
  const markdown = /^!?\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i.exec(url);

  if (markdown) {
    url = markdown[1];
  }

  return url || null;
}

// =====================================================
// MAPPING DATA MENU
// =====================================================

const mapRow = (row, fotoStok = null) => {
  const foto =
    normalisasiUrlFoto(fotoStok) ||
    normalisasiUrlFoto(row.foto_url) ||
    normalisasiUrlFoto(row.foto_item) ||
    null;

  return {
    id: row.id,
    nama: row.nama,
    kategori: row.kategori,
    harga: Number(row.harga || 0),
    berat: 'pcs',
    satuan: 'pcs',
    stok: Number(row.stok || 0),
    status: row.status || 'aktif',
    emoji: '🍲',
    stok_id: row.stok_id || null,
    foto_url: foto,
    image: foto,
  };
};

// =====================================================
// HELPER FOTO
// =====================================================

function tentukanTipe(uri) {
  const dataUrl = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(uri);

  if (dataUrl) {
    return dataUrl[1].toLowerCase();
  }

  const ext = uri
    .split('?')[0]
    .split('.')
    .pop()
    ?.toLowerCase();

  return MIME_DARI_EKSTENSI[ext] || 'image/jpeg';
}

async function bacaSebagaiArrayBuffer(uri) {
  if (Platform.OS !== 'web') {
    try {
      const { File } = require('expo-file-system');
      return await new File(uri).arrayBuffer();
    } catch (error) {
      console.warn('Alternatif pembacaan foto:', error);
    }
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Gagal membaca foto dari perangkat.');
  }

  return response.arrayBuffer();
}

async function uploadPhoto(photo) {
  if (!photo) return null;

  if (
    typeof photo === 'string' &&
    /^https?:\/\//i.test(photo)
  ) {
    return photo;
  }

  const uri =
    typeof photo === 'string'
      ? photo
      : photo.uri;

  if (!uri) {
    throw new Error('Foto tidak valid.');
  }

  const contentType = tentukanTipe(uri);
  const buffer = await bacaSebagaiArrayBuffer(uri);

  if (buffer.byteLength > MAX_FOTO_BYTES) {
    throw new Error('Ukuran foto maksimal 2 MB.');
  }

  const extension = contentType
    .split('/')[1]
    .replace('jpeg', 'jpg');

  const path = `produk/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// =====================================================
// HAPUS FOTO STORAGE
// =====================================================

async function hapusFotoStorage(url) {
  if (!url || typeof url !== 'string') return;

  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) return;

  let path = url.substring(index + marker.length);

  if (!path) return;

  try {
    path = decodeURIComponent(path);
  } catch {
    // Gunakan path asli jika URL tidak dapat di-decode.
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    console.warn('Foto gagal dihapus:', error.message);
  }
}

// =====================================================
// SEED MENU AWAL
// =====================================================

export async function seedInitialMenusIfEmpty(initialItems = []) {
  const { count, error: countError } = await supabase
    .from(TABLE)
    .select('id', {
      count: 'exact',
      head: true,
    });

  if (countError) throw countError;

  if (count > 0) return false;

  if (!Array.isArray(initialItems) || initialItems.length === 0) {
    console.warn('Seed menu dilewati: daftar menu awal belum tersedia.');
    return false;
  }

  const rows = initialItems.map((item, index) => ({
    nama: item.nama,
    kategori: item.kategori,
    harga: Number(item.harga || 0),
    stok: 20 + ((index * 7) % 30),
    satuan: 'pcs',
    status: 'aktif',
    foto_url: item.image || null,
  }));

  const { error } = await supabase
    .from(TABLE)
    .insert(rows);

  if (error) throw error;

  return true;
}

// =====================================================
// AMBIL FOTO DARI STOK BAHAN
// SUMBER FOTO UTAMA UNTUK KASIR
// =====================================================

const normalisasiNama = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Mengambil foto dari stok_bahan, dicocokkan berdasarkan
// stok_id atau (jika kosong) nama bahan yang sama dengan menu.
// Kegagalan membaca foto tidak boleh menggagalkan daftar menu.
async function getFotoStok() {
  const perId = new Map();
  const perNama = new Map();

  // 1. Ambil foto dari stok bahan.
  const { data: stokData, error: stokError } = await supabase
    .from('stok_bahan')
    .select('id, nama_bahan, foto_url');

  if (stokError) {
    console.warn(
      'Gagal mengambil foto stok:',
      stokError.message
    );
  } else {
    (stokData || []).forEach((item) => {
      const url = normalisasiUrlFoto(item.foto_url);

      if (!url) return;

      if (item.id) {
        perId.set(String(item.id), url);
      }

      const nama = normalisasiNama(item.nama_bahan);

      if (nama && !perNama.has(nama)) {
        perNama.set(nama, url);
      }
    });
  }

  // 2. Ambil foto dari riwayat pengeluaran.
  // Foto terbaru digunakan sebagai cadangan.
  const { data: pengeluaranData, error: pengeluaranError } =
    await supabase
      .from('pengeluaran')
      .select(
        'stok_id, nama_pengeluaran, bahan_nama, foto_item, created_at'
      )
      .not('foto_item', 'is', null)
      .order('created_at', { ascending: false });

  if (pengeluaranError) {
    console.warn(
      'Gagal mengambil foto pengeluaran:',
      pengeluaranError.message
    );
  } else {
    (pengeluaranData || []).forEach((item) => {
      const url = normalisasiUrlFoto(item.foto_item);

      if (!url) return;

      const stokId = item.stok_id
        ? String(item.stok_id)
        : null;

      const nama = normalisasiNama(
        item.bahan_nama || item.nama_pengeluaran
      );

      // Foto stok tidak ditimpa foto pengeluaran.
      if (stokId && !perId.has(stokId)) {
        perId.set(stokId, url);
      }

      if (nama && !perNama.has(nama)) {
        perNama.set(nama, url);
      }
    });
  }

  return { perId, perNama };
}

// =====================================================
// READ: AMBIL DAFTAR MENU
// =====================================================

export async function getMenus({
  includeInactive = true,
} = {}) {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('created_at', {
      ascending: false,
    });

  if (!includeInactive) {
    query = query.eq('status', 'aktif');
  }

  const { data, error } = await query;

  if (error) throw error;

  const menus = data || [];

  const { perId, perNama } = await getFotoStok();

  const hasil = menus.map((row) => {
    const fotoStok =
      (row.stok_id && perId.get(String(row.stok_id))) ||
      perNama.get(normalisasiNama(row.nama)) ||
      null;

    return mapRow(row, fotoStok);
  });

  console.log(
    'DATA MENU KASIR:',
    hasil.map((item) => ({
      nama: item.nama,
      stok_id: item.stok_id,
      foto_url: item.foto_url,
      image: item.image,
    }))
  );

  return hasil;
}

// =====================================================
// CREATE: TAMBAH MENU
// =====================================================

export async function createMenu(values) {
  const nama = String(values.nama || '').trim();

  if (!nama) {
    throw new Error('Nama menu wajib diisi.');
  }

  const foto_url = await uploadPhoto(values.image);

  const payload = {
    nama,
    kategori: values.kategori,
    harga: Number(values.harga || 0),
    stok: Number(values.stok || 0),
    satuan: 'pcs',
    status: String(values.status || 'aktif').toLowerCase(),
    foto_url,
    stok_id: values.stok_id || null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (foto_url) {
      await hapusFotoStorage(foto_url);
    }

    throw error;
  }

  return mapRow(data);
}

// =====================================================
// UPDATE: EDIT MENU
// =====================================================

export async function updateMenu(id, values, previous = {}) {
  const nama = values.nama !== undefined
    ? String(values.nama || '').trim()
    : undefined;

  if (nama !== undefined && !nama) {
    throw new Error('Nama menu wajib diisi.');
  }

  // Hanya foto milik menu yang dianggap foto lama.
  // Jangan menghapus foto stok dari Storage.
  const fotoLama = previous.foto_url || null;

  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (nama !== undefined) {
    payload.nama = nama;
  }

  if (values.kategori !== undefined) {
    payload.kategori = values.kategori;
  }

  if (values.harga !== undefined) {
    payload.harga = Number(values.harga || 0);
  }

  if (values.stok !== undefined) {
    payload.stok = Number(values.stok || 0);
  }

  if (values.status !== undefined) {
    payload.status = String(values.status || 'aktif').toLowerCase();
  }

  if (values.stok_id !== undefined) {
    payload.stok_id = values.stok_id || null;
  }

  const imageBerubah = values.image !== undefined;

  let fotoBaru = fotoLama;

  if (imageBerubah) {
    if (!values.image) {
      fotoBaru = null;
    } else {
      fotoBaru = await uploadPhoto(values.image);
    }

    payload.foto_url = fotoBaru;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (imageBerubah && fotoBaru && fotoBaru !== fotoLama) {
      await hapusFotoStorage(fotoBaru);
    }

    throw error;
  }

  if (
    imageBerubah &&
    fotoLama &&
    fotoLama !== fotoBaru
  ) {
    await hapusFotoStorage(fotoLama);
  }

  return mapRow(data);
}

// =====================================================
// DELETE: HAPUS MENU
// =====================================================

export async function deleteMenu(id, previous = {}) {
  const fotoLama = previous.foto_url || null;

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (fotoLama) {
    await hapusFotoStorage(fotoLama);
  }

  return true;
}
