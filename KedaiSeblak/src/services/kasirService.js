import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { toEmail } from './Authservice';

const normalizeStatus = (s) => (String(s || 'aktif').toLowerCase() === 'nonaktif' ? 'nonaktif' : 'aktif');

// Dipakai KasirContext.loadReferenceData -> baris tabel kasir
export async function getCashiers() {
  const { data, error } = await supabase
    .from('kasir')
    .select('id, kode_kasir, nama, username, no_telepon, status')
    .order('kode_kasir', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function nextKodeKasir() {
  const { data, error } = await supabase.from('kasir').select('kode_kasir');
  if (error) throw error;
  const max = (data || []).reduce((m, r) => {
    const n = parseInt(String(r.kode_kasir || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `KSR-${String(max + 1).padStart(3, '0')}`;
}

// Membuat akun login + profil + data kasir.
// Memakai klien terpisah (tanpa menyimpan sesi) supaya sesi owner tidak tertimpa.
export async function createCashierAccount(values) {
  const nama = String(values.nama ?? values.name ?? '').trim();
  const username = String(values.username ?? values.email ?? '').trim().toLowerCase();
  const password = String(values.password ?? '');
  if (!nama || !username) throw new Error('Nama dan username/email wajib diisi.');
  if (password.length < 6) throw new Error('Password minimal 6 karakter.');
  const status = normalizeStatus(values.status);

  const signUpClient = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data: signUp, error: signUpError } = await signUpClient.auth.signUp({
    email: toEmail(username),
    password,
    options: { data: { nama } },
  });
  if (signUpError) throw new Error(signUpError.message);
  const id = signUp.user?.id;
  if (!id) throw new Error('Akun gagal dibuat.');

  const { error: profileError } = await supabase
    .from('profiles').insert({ id, nama, role: 'kasir', status });
  if (profileError) throw profileError;

  const kode_kasir = await nextKodeKasir();
  const { data, error } = await supabase
    .from('kasir')
    .insert({ id, kode_kasir, nama, username, no_telepon: values.no_telepon ?? values.phone ?? null, status })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCashier(id, values) {
  const patch = { updated_at: new Date().toISOString() };
  const nama = values.nama ?? values.name;
  if (nama !== undefined) patch.nama = String(nama).trim();
  const username = values.username ?? values.email;
  if (username !== undefined) patch.username = String(username).trim().toLowerCase();
  const phone = values.no_telepon ?? values.phone;
  if (phone !== undefined) patch.no_telepon = phone || null;
  if (values.status !== undefined) patch.status = normalizeStatus(values.status);

  const { data, error } = await supabase.from('kasir').update(patch).eq('id', id).select().single();
  if (error) throw error;

  const profilePatch = { updated_at: patch.updated_at };
  if (patch.nama !== undefined) profilePatch.nama = patch.nama;
  if (patch.status !== undefined) profilePatch.status = patch.status;
  const { error: profileError } = await supabase.from('profiles').update(profilePatch).eq('id', id);
  if (profileError) throw profileError;
  return data;
}

// Kasir yang sudah punya transaksi tidak boleh dihapus (relasi), jadi dinonaktifkan.
// Akun nonaktif otomatis ditolak saat login (lihat authService).
export async function deleteCashier(id) {
  const now = new Date().toISOString();
  const { error } = await supabase.from('kasir').update({ status: 'nonaktif', updated_at: now }).eq('id', id);
  if (error) throw error;
  const { error: profileError } = await supabase
    .from('profiles').update({ status: 'nonaktif', updated_at: now }).eq('id', id);
  if (profileError) throw profileError;
}
