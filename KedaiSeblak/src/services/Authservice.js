import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Akun kasir/owner dibuat dengan email <username>@kedaiseblak.com.
// Jadi pengguna boleh login dengan username saja ("siti") atau email lengkap.
export const EMAIL_DOMAIN = 'kedaiseblak.com';

export const toEmail = (value) => {
  const s = String(value || '').trim().toLowerCase();
  return s.includes('@') ? s : `${s}@${EMAIL_DOMAIN}`;
};

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, role, status')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function assertActive(profile) {
  if (!profile) throw new Error('Profil pengguna tidak ditemukan. Hubungi owner.');
  if (String(profile.status).toLowerCase() !== 'aktif') throw new Error('Akun ini nonaktif. Hubungi owner.');
}

// Dipakai KasirContext.login -> { user, profile }
export async function signIn(identifier, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(identifier),
    password,
  });
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Email/username atau password salah.'
        : error.message
    );
  }
  try {
    const profile = await fetchProfile(data.user.id);
    assertActive(profile);
    return { user: data.user, profile };
  } catch (e) {
    await supabase.auth.signOut();
    throw e;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Dipakai KasirContext saat aplikasi dibuka -> { user, profile } atau null
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session;
  if (!session) return null;
  const profile = await fetchProfile(session.user.id);
  if (!profile || String(profile.status).toLowerCase() !== 'aktif') {
    await supabase.auth.signOut();
    return null;
  }
  return { user: session.user, profile };
}

// Login Google (Supabase OAuth). Akun Google harus sudah terdaftar di tabel profiles (didaftarkan owner).
// Native: lewat proxy Expo (auth.expo.io) + PKCE. Web: redirect biasa, sesi dipulihkan saat halaman dimuat.
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (error) throw new Error(error.message);
    return null; // browser berpindah ke Google, lalu kembali ke aplikasi
  }
  let AuthSession; let WebBrowser;
  try {
    AuthSession = require('expo-auth-session');
    WebBrowser = require('expo-web-browser');
  } catch (e) {
    throw new Error('Paket expo-auth-session / expo-web-browser belum terpasang.');
  }
  WebBrowser.maybeCompleteAuthSession();
  const proxyUrl = 'https://auth.expo.io/@anonymous/kedai-seblak';
  const returnUrl = AuthSession.makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: proxyUrl, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  const startUrl = `${proxyUrl}/start?authUrl=${encodeURIComponent(data.url)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
  if (result.type !== 'success') throw new Error('Login Google dibatalkan.');
  const code = /[?&]code=([^&#]+)/.exec(result.url)?.[1];
  if (!code) throw new Error('Kode login Google tidak ditemukan.');
  const { data: sess, error: exErr } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
  if (exErr) throw new Error(exErr.message);
  try {
    const profile = await fetchProfile(sess.user.id);
    if (!profile) throw new Error('Akun Google ini belum terdaftar. Hubungi owner.');
    assertActive(profile);
    return { user: sess.user, profile };
  } catch (e) {
    await supabase.auth.signOut();
    throw e;
  }
}
