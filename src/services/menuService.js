import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const TABLE = 'menu_topping';
const BUCKET = 'menu-seblak';

// =====================================================
// MAPPING DATA MENU
// =====================================================

const mapRow = (row) => ({
  id: row.id,
  nama: row.nama,
  kategori: row.kategori,
  harga: Number(row.harga || 0),

  // Satuan penjualan selalu pcs.
  // Satuan stok bahan tetap disimpan di stok_bahan.
  berat: 'pcs',
  satuan: 'pcs',

  stok: Number(row.stok || 0),
  status: row.status || 'aktif',
  emoji: '🍲',

  // Foto default dari tabel menu_topping.
  image: row.foto_url || null,
});

// =====================================================
// SEED MENU AWAL
// =====================================================

export async function seedInitialMenusIfEmpty() {
  const { count, error: countError } = await supabase
    .from(TABLE)
    .select('id', {
      count: 'exact',
      head: true,
    });

  if (countError) throw countError;

  if (count > 0) return false;

  const rows = TOPPING_ITEMS.map((item, index) => ({
    nama: item.nama,
    kategori: item.kategori,
    harga: Number(item.harga),
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
// AMBIL FOTO PENGELUARAN BERDASARKAN STOK ID
// =====================================================

async function getFotoPengeluaran(stokIds = []) {
  const ids = [
    ...new Set(
      stokIds.filter(Boolean).map((id) => String(id))
    ),
  ];

  if (ids.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('pengeluaran')
    .select('stok_id, foto_item, created_at')
    .in('stok_id', ids)
    .not('foto_item', 'is', null)
    .neq('foto_item', '')
    .order('created_at', {
      ascending: false,
    });

  if (error) throw error;

  const fotoMap = new Map();

  // Data sudah diurutkan terbaru terlebih dahulu.
  // Ambil foto pertama untuk setiap stok_id.
  (data || []).forEach((item) => {
    const stokId = String(item.stok_id);

    if (!fotoMap.has(stokId) && item.foto_item) {
      fotoMap.set(stokId, item.foto_item);
    }
  });

  return fotoMap;
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

  const stokIds = menus
    .map((item) => item.stok_id)
    .filter(Boolean);

  const fotoMap = await getFotoPengeluaran(stokIds);

  return menus.map((row) => {
    const fotoPengeluaran = row.stok_id
      ? fotoMap.get(String(row.stok_id))
      : null;

    return {
      ...mapRow(row),

      stok_id: row.stok_id || null,

      // Prioritaskan foto dari Pengeluaran.
      image: fotoPengeluaran || row.foto_url || null,
    };
  });
}

// =====================================================
// UPLOAD FOTO MENU
// =====================================================

const MAX_FOTO_BYTES = 2 * 1024 * 1024;

const MIME_DARI_EKSTENSI = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

async function bacaSebagaiArrayBuffer(uri) {
  if (Platform.OS !== 'web') {
    try {
      const { File } = require('expo-file-system');

      return await new File(uri).arrayBuffer();
    } catch (e) {
      // Gunakan fetch sebagai alternatif.
    }
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      'Gagal membaca foto dari perangkat.'
    );
  }

  return await response.arrayBuffer();
}

function tentukanTipe(uri) {
  const dataUrl = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(
    uri
  );

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

async function uploadPhoto(photo) {
  if (!photo) return null;

  // Jika sudah berupa URL, tidak perlu upload ulang.
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
    throw new Error(
      'Ukuran foto maksimal 2 MB.'
    );
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
// CREATE: TAMBAH MENU
// =====================================================

export async function createMenu(values) {
  const foto_url = await uploadPhoto(values.image);

  const payload = {
    nama: values.nama.trim(),
    kategori: values.kategori,
    harga: Number(values.harga),
    stok: Number(values.stok),
    satuan: 'pcs',
    status: (values.status || 'aktif').toLowerCase(),
    foto_url,

    // Hubungkan menu dengan stok bahan.
    stok_id: values.stok_id || null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

// =====================================================
// UPDATE: UBAH MENU
// =====================================================

export async function updateMenu(
  id,
  values,
  previous = {}
) {
  let foto_url = previous.image || null;

  const newPhoto =
    values.image &&
    values.image !== previous.image &&
    !(
      typeof values.image === 'string' &&
      /^https?:\/\//i.test(values.image)
    );

  if (newPhoto) {
    foto_url = await uploadPhoto(values.image);
  } else if (
    typeof values.image === 'string' &&
    /^https?:\/\//i.test(values.image)
  ) {
    foto_url = values.image;
  }

  const payload = {
    nama: values.nama.trim(),
    kategori: values.kategori,
    harga: Number(values.harga),
    stok: Number(values.stok),
    satuan: 'pcs',
    status: (values.status || 'aktif').toLowerCase(),
    foto_url,
    updated_at: new Date().toISOString(),
  };

  if (values.stok_id !== undefined) {
    payload.stok_id = values.stok_id || null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Hapus foto lama jika foto baru berhasil disimpan.
  if (newPhoto && previous.image) {
    const oldPath = previous.image.split(
      '/menu-seblak/'
    )[1];

    if (oldPath) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([
          decodeURIComponent(oldPath),
        ]);

      if (removeError) {
        console.warn(
          'Foto lama gagal dihapus:',
          removeError.message
        );
      }
    }
  }

  return mapRow(data);
}

// =====================================================
// DELETE: HAPUS MENU
// =====================================================

export async function deleteMenu(
  id,
  previous = {}
) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (previous.image) {
    const oldPath = previous.image.split(
      '/menu-seblak/'
    )[1];

    if (oldPath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([
          decodeURIComponent(oldPath),
        ]);

      if (storageError) {
        console.warn(
          'Menu terhapus, tetapi foto gagal dihapus:',
          storageError.message
        );
      }
    }
  }

  return true;
}