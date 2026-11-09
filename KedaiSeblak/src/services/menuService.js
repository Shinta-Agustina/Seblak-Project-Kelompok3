import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { TOPPING_ITEMS } from '../data/mockData';

const TABLE = 'menu_topping';
const BUCKET = 'menu-seblak';

const mapRow = (row) => ({
  id: row.id,
  nama: row.nama,
  kategori: row.kategori,
  harga: Number(row.harga),
  berat: row.berat || '1 pcs',
  stok: Number(row.stok || 0),
  status: row.status || 'Aktif',
  emoji: row.emoji || '🍲',
  image: row.foto_url || null,
  foto_path: row.foto_path || null,
});


export async function seedInitialMenusIfEmpty() {
  const { count, error: countError } = await supabase
    .from(TABLE).select('id', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count > 0) return false;
  const rows = TOPPING_ITEMS.map((item, index) => ({
    nama: item.nama, kategori: item.kategori, harga: Number(item.harga),
    stok: 20 + ((index * 7) % 30), berat: item.berat || '1 pcs',
    status: 'Aktif', emoji: item.emoji || '🍲',
    foto_url: item.image || null, foto_path: null,
  }));
  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) throw error;
  return true;
}

export async function getMenus({ includeInactive = true } = {}) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (!includeInactive) query = query.eq('status', 'Aktif');
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const MIME_DARI_EKSTENSI = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

// Foto dari image picker berupa URI lokal (file:///...) yang HANYA dimengerti perangkat.
// Supabase Storage butuh data biner, jadi URI diubah dulu menjadi ArrayBuffer.
async function bacaSebagaiArrayBuffer(uri) {
  if (Platform.OS !== 'web') {
    try {
      // API baru expo-file-system (SDK 54+): new File(uri).arrayBuffer()
      const { File } = require('expo-file-system');
      return await new File(uri).arrayBuffer();
    } catch (e) {
      // lanjut ke fetch bila API File tidak tersedia / gagal
    }
  }
  const response = await fetch(uri); // web: uri berupa data URL / blob URL
  if (!response.ok) throw new Error('Gagal membaca foto dari perangkat.');
  return await response.arrayBuffer();
}

function tentukanTipe(uri) {
  const dataUrl = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(uri);
  if (dataUrl) return dataUrl[1].toLowerCase();
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  return MIME_DARI_EKSTENSI[ext] || 'image/jpeg';
}

async function uploadPhoto(photo) {
  if (!photo) return { foto_url: null, foto_path: null };
  if (typeof photo === 'string' && /^https?:\/\//i.test(photo)) {
    return { foto_url: photo, foto_path: null }; // foto lama / URL eksternal: tidak diunggah ulang
  }
  const uri = typeof photo === 'string' ? photo : photo.uri;
  if (!uri) throw new Error('Foto tidak valid.');

  const contentType = tentukanTipe(uri);
  const buffer = await bacaSebagaiArrayBuffer(uri);
  if (buffer.byteLength > MAX_FOTO_BYTES) throw new Error('Ukuran foto maksimal 2 MB.');

  const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
  // Nama file unik: timestamp + acak, supaya tidak pernah tabrakan.
  const path = `produk/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { foto_url: data.publicUrl, foto_path: path };
}

export async function createMenu(values) {
  const photo = await uploadPhoto(values.image);
  const payload = {
    nama: values.nama.trim(), kategori: values.kategori,
    harga: Number(values.harga), stok: Number(values.stok),
    status: values.status || 'Aktif', berat: values.berat || '1 pcs',
    emoji: values.emoji || '🍲', ...photo,
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) {
    if (photo.foto_path) await supabase.storage.from(BUCKET).remove([photo.foto_path]);
    throw error;
  }
  return mapRow(data);
}

export async function updateMenu(id, values, previous = {}) {
  let photo = { foto_url: previous.image || null, foto_path: previous.foto_path || null };
  const newPhoto = values.image && values.image !== previous.image && !(typeof values.image === 'string' && /^https?:\/\//i.test(values.image));
  if (newPhoto) photo = await uploadPhoto(values.image);
  const payload = {
    nama: values.nama.trim(), kategori: values.kategori,
    harga: Number(values.harga), stok: Number(values.stok),
    status: values.status || 'Aktif', berat: values.berat || '1 pcs',
    emoji: values.emoji || previous.emoji || '🍲',
    foto_url: photo.foto_url, foto_path: photo.foto_path,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) {
    if (newPhoto && photo.foto_path) await supabase.storage.from(BUCKET).remove([photo.foto_path]);
    throw error;
  }
  if (newPhoto && previous.foto_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([previous.foto_path]);
    if (removeError) console.warn('Data menu tersimpan, tetapi foto lama gagal dihapus:', removeError.message);
  }
  return mapRow(data);
}

export async function deleteMenu(id, previous = {}) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  if (previous.foto_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([previous.foto_path]);
    if (storageError) throw new Error(`Menu terhapus, tetapi foto gagal dihapus: ${storageError.message}`);
  }
}
