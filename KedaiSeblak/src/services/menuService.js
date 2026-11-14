import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { TOPPING_ITEMS } from '../data/mockData';

const TABLE = 'menu_topping';
const BUCKET = 'menu-seblak';

// Kolom asli menu_topping: id, nama, kategori, harga, deskripsi, stok, satuan, status, foto_url, created_at, updated_at
// status hanya boleh 'aktif' / 'nonaktif'. "berat" disimpan di deskripsi ("Per 50 gr").
const statusKeDb = (s) => (String(s || 'aktif').trim().toLowerCase() === 'aktif' ? 'aktif' : 'nonaktif');
const statusKeUi = (s) => (String(s || 'aktif').trim().toLowerCase() === 'aktif' ? 'Aktif' : 'Nonaktif');

const beratDariDeskripsi = (deskripsi) => {
  const m = /^\s*per\s+(.+)$/i.exec(String(deskripsi || ''));
  return m ? m[1].trim() : '1 pcs';
};
const satuanDariBerat = (berat) => String(berat || '1 pcs').trim().split(/\s+/).pop() || 'pcs';
const pathDariUrl = (url) => {
  const m = new RegExp(`/object/public/${BUCKET}/(.+)$`).exec(String(url || ''));
  return m ? decodeURIComponent(m[1]) : null;
};

const mapRow = (row) => ({
  id: row.id,
  nama: row.nama,
  kategori: row.kategori,
  harga: Number(row.harga),
  berat: beratDariDeskripsi(row.deskripsi),
  stok: Number(row.stok || 0),
  status: statusKeUi(row.status),
  emoji: row.emoji || '🍲',
  image: row.foto_url || null,
  foto_path: pathDariUrl(row.foto_url),
});

const kolomMenu = (values, berat) => ({
  nama: String(values.nama || '').trim(),
  kategori: values.kategori,
  harga: Number(values.harga),
  stok: Number(values.stok || 0),
  status: statusKeDb(values.status),
  deskripsi: `Per ${berat}`,
  satuan: satuanDariBerat(berat),
});

export async function seedInitialMenusIfEmpty() {
  const { count, error: countError } = await supabase
    .from(TABLE).select('id', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count > 0) return false;
  const rows = TOPPING_ITEMS.map((item, index) => ({
    ...kolomMenu({ ...item, stok: 20 + ((index * 7) % 30), status: 'aktif' }, item.berat || '1 pcs'),
    foto_url: item.image || null,
  }));
  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) throw error;
  return true;
}

export async function getMenus({ includeInactive = true } = {}) {
  let query = supabase.from(TABLE).select('*').order('kategori', { ascending: true }).order('nama', { ascending: true });
  if (!includeInactive) query = query.eq('status', 'aktif');
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const MIME_DARI_EKSTENSI = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

async function bacaSebagaiArrayBuffer(uri) {
  if (Platform.OS !== 'web') {
    try {
      const { File } = require('expo-file-system');
      return await new File(uri).arrayBuffer();
    } catch (e) {
      // lanjut ke fetch bila API File tidak tersedia / gagal
    }
  }
  const response = await fetch(uri);
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
    return { foto_url: photo, foto_path: pathDariUrl(photo) };
  }
  const uri = typeof photo === 'string' ? photo : photo.uri;
  if (!uri) throw new Error('Foto tidak valid.');

  const contentType = tentukanTipe(uri);
  const buffer = await bacaSebagaiArrayBuffer(uri);
  if (buffer.byteLength > MAX_FOTO_BYTES) throw new Error('Ukuran foto maksimal 2 MB.');

  const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
  const path = `produk/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { foto_url: data.publicUrl, foto_path: path };
}

export async function createMenu(values) {
  const photo = await uploadPhoto(values.image);
  const payload = { ...kolomMenu(values, values.berat || '1 pcs'), foto_url: photo.foto_url };
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
    ...kolomMenu(values, values.berat || previous.berat || '1 pcs'),
    foto_url: photo.foto_url,
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
