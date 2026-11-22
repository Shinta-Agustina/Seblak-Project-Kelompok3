import { Platform, NativeModules } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';

// Inisialisasi awal auth session untuk browser native jika diperlukan
try {
  WebBrowser.maybeCompleteAuthSession();
} catch { }

// Akun kasir/owner dibuat dengan email <username>@gmail.com bila tanpa domain.
// Domain terverifikasi mencegah penolakan format email dari Supabase Auth.
export const EMAIL_DOMAIN = 'gmail.com';

export const toEmail = (value) => {
  const s = String(value || '').trim().toLowerCase();
  return s.includes('@') ? s : `${s}@${EMAIL_DOMAIN}`;
};

// Ubah error Supabase Auth menjadi pesan bahasa Indonesia yang ramah dan aman.
export function pesanAuth(error) {
  const kode = String(error?.code || '').toLowerCase();
  const teks = String(error?.message || '').toLowerCase();

  if (kode === 'invalid_credentials' || teks.includes('invalid login credentials')) {
    return 'Email/username atau password salah.';
  }
  if (kode === 'user_banned' || teks.includes('banned')) {
    return 'Akun ini nonaktif. Hubungi owner.';
  }
  if (kode === 'email_not_confirmed' || teks.includes('not confirmed')) {
    return 'Email belum diverifikasi. Periksa kotak masuk email Anda.';
  }
  if (kode === 'over_email_send_rate_limit' || teks.includes('rate limit')) {
    return 'Batas pengiriman email verifikasi tercapai. Coba gunakan Login Google atau tunggu sejenak.';
  }
  if (teks.includes('signups not allowed') || kode === 'signup_disabled') {
    return 'Pendaftaran akun baru ditutup oleh server. Hubungi owner.';
  }
  if (kode === 'email_address_invalid' || teks.includes('invalid email')) {
    return 'Format alamat email tidak valid.';
  }
  return error?.message || 'Terjadi kesalahan saat memproses autentikasi.';
}

// Ekstrak pesan error dari parameter URL callback OAuth bila ada
function bacaErrorUrl(url) {
  const m = /[?&#]error_description=([^&#]+)/.exec(url || '');
  if (!m) return '';
  try {
    return decodeURIComponent(m[1].replace(/\+/g, ' '));
  } catch {
    return m[1];
  }
}

// Ambil profil langsung dari tabel public.profiles
export async function fetchProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Gagal membaca tabel profiles:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Error saat fetchProfile:', err);
    return null;
  }
}

// Pastikan profil berstatus aktif
export function assertActive(profile) {
  if (!profile) {
    throw new Error('Profil pengguna tidak ditemukan. Hubungi owner.');
  }
  if (String(profile.status || '').toLowerCase() === 'nonaktif') {
    throw new Error('Akun ini nonaktif. Hubungi owner.');
  }
}

// Sinkronisasi data akun Auth dengan tabel public.profiles (Sesuai Ketentuan No. 7).
// Profil HANYA dibaca dari database. Pembuatan profil dan penentuan peran
// dilakukan di server (trigger handle_new_user dan Edge Function manage-cashier),
// bukan di aplikasi, supaya peran tidak bisa dimanipulasi dari client.
// Mengembalikan null bila akun belum terdaftar, dan pemanggil menolak login.
export async function syncOrCreateProfile(authUser) {
  if (!authUser) return null;

  const existingProfile = await fetchProfile(authUser.id);
  if (!existingProfile) return null;

  const email = String(authUser.email || existingProfile.email || '').trim().toLowerCase();
  const meta = authUser.user_metadata || {};

  return {
    id: authUser.id,
    nama:
      existingProfile.nama ||
      meta.nama ||
      meta.full_name ||
      meta.name ||
      email.split('@')[0] ||
      'Pengguna',
    role: String(existingProfile.role || 'kasir').toLowerCase(),
    status: existingProfile.status || 'aktif',
    email,
  };
}

// Login dengan Email atau Username + Password
export async function signIn(identifier, password) {
  const email = toEmail(identifier);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(pesanAuth(error));

  try {
    const profile = await syncOrCreateProfile(data.user);
    assertActive(profile);
    return { user: data.user, profile, session: data.session };
  } catch (e) {
    await supabase.auth.signOut();
    throw e;
  }
}

// Sign up / Pendaftaran akun baru
export async function signUp(emailOrUsername, password, nama, role = 'kasir') {
  const email = toEmail(emailOrUsername);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama: nama || email.split('@')[0],
        role,
      },
    },
  });
  if (error) throw new Error(pesanAuth(error));

  if (data?.user) {
    const profile = await syncOrCreateProfile(data.user);
    if (data.session) {
      return { user: data.user, profile, session: data.session };
    }
    // Jika tidak ada session tapi akun berhasil dibuat, coba sign in
    try {
      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      if (signInRes.data?.session) {
        return { user: signInRes.data.user, profile, session: signInRes.data.session };
      }
    } catch { }
    return { user: data.user, profile, session: null };
  }
  return data;
}

// Logout dari Supabase Auth
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  // Reset koneksi Custom Tab di Android supaya login berikutnya mulai bersih.
  if (Platform.OS === 'android') {
    try { await WebBrowser.coolDownAsync(); } catch { }
  }
  if (error) throw error;
}

// Mendapatkan sesi login aktif saat ini
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session;
  if (!session?.user) return null;

  const profile = await syncOrCreateProfile(session.user);
  if (!profile || String(profile.status).toLowerCase() === 'nonaktif') {
    await supabase.auth.signOut();
    return null;
  }
  return { user: session.user, profile, session };
}

// Login Google (Supabase OAuth)
// Mendukung Web (redirect browser) dan Mobile / Expo Go / BlueStacks (WebBrowser AuthSession)
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) throw new Error(pesanAuth(error));
    return null; // Browser berpindah ke Google OAuth, sesi dipulihkan saat kembali
  }

  // Native: Expo Go, BlueStacks, Android & iOS
  try {
    WebBrowser.maybeCompleteAuthSession();
  } catch { }

  // Buat deep link dinamis yang akurat untuk Expo Go atau standalone APK.
  // Cadangan memakai Linking.createURL (bukan IP yang ditulis mati), supaya
  // selalu mengikuti jaringan/IP/port Metro yang sedang aktif.
  let redirectUrl;
  try {
    // 1. Deteksi IP & Port Metro aktif dari scriptURL React Native (paling akurat di development)
    const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
    const match = /https?:\/\/([^/:]+)(?::(\d+))?/.exec(scriptURL);
    if (match && match[1]) {
      const ip = match[1];
      const port = match[2] || '8081';
      if (ip === '10.0.2.2' || ip === '127.0.0.1' || ip === 'localhost') {
        redirectUrl = Linking.createURL('auth/callback');
      } else {
        redirectUrl = `exp://${ip}:${port}/--/auth/callback`;
      }
    } else {
      // 2. Deteksi dari Constants linkingUri atau hostUri
      const linkingUri = String(Constants.linkingUri || '');
      if (linkingUri.startsWith('exp://')) {
        const clean = linkingUri.replace(/\/--.*$/, '').replace(/\/$/, '');
        redirectUrl = `${clean}/--/auth/callback`;
      } else {
        const host =
          Constants.expoConfig?.hostUri ||
          Constants.manifest?.debuggerHost ||
          Constants.manifest2?.extra?.expoGo?.debuggerHost;
        if (host) {
          redirectUrl = `exp://${host}/--/auth/callback`;
        } else {
          redirectUrl = Linking.createURL('auth/callback');
        }
      }
    }
  } catch {
    redirectUrl = Linking.createURL('auth/callback');
  }

  // Jika hasil bukan URL valid atau berisi tripel slash kedaiseblak:///
  if (!redirectUrl || redirectUrl.includes('kedaiseblak:///') || redirectUrl === 'kedaiseblak://') {
    redirectUrl = Linking.createURL('auth/callback');
  }

  console.log('[Google Auth] Memulai OAuth dengan Redirect URL:', redirectUrl);

  const isAndroid = Platform.OS === 'android';

  // Reset koneksi Custom Tab sebelum mulai. Di Android, dismissBrowser /
  // dismissAuthSession tidak menutup apa pun, jadi yang dipakai coolDownAsync.
  if (isAndroid) {
    try { await WebBrowser.coolDownAsync(); } catch { }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
      // Selalu tampilkan pilihan akun agar halaman Google dimuat segar.
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw new Error(pesanAuth(error));
  if (!data?.url) throw new Error('URL autentikasi Google tidak ditemukan dari Supabase.');

  // Parameter unik supaya Chrome tidak memakai ulang halaman yang tersimpan di cache.
  // Kalau Supabase menolaknya, ganti baris ini menjadi: const authUrl = data.url;
  const authUrl = `${data.url}${data.url.includes('?') ? '&' : '?'}_t=${Date.now()}`;

  if (isAndroid) {
    try { await WebBrowser.warmUpAsync(); } catch { }
  }

  let result;
  try {
    result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
  } finally {
    // Lepas koneksi Custom Tab setelah selesai, apa pun hasilnya.
    if (isAndroid) {
      try { await WebBrowser.coolDownAsync(); } catch { }
    }
  }

  // Jangan cetak result.url, isinya token login.
  console.log('[Google Auth] Hasil browser session:', result.type);

  // Di Android, Custom Tab kadang tetap menutupi app setelah redirect sukses.
  // Membuka deep link ke app sendiri membawa Expo Go ke depan dan menutupi tab itu.
  if (isAndroid && result.type === 'success') {
    try { await Linking.openURL(Linking.createURL('/')); } catch { }
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error('Login Google dibatalkan atau tidak selesai.');
  }

  const url = result.url;
  const matchCode = /[?&]code=([^&#]+)/.exec(url);
  const code = matchCode ? decodeURIComponent(matchCode[1]) : null;

  const matchAccess = /[?&#]access_token=([^&#]+)/.exec(url);
  const accessToken = matchAccess ? decodeURIComponent(matchAccess[1]) : null;

  const matchRefresh = /[?&#]refresh_token=([^&#]+)/.exec(url);
  const refreshToken = matchRefresh ? decodeURIComponent(matchRefresh[1]) : null;

  let authUser = null;
  if (code) {
    const { data: sess, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw new Error(pesanAuth(exErr));
    authUser = sess?.user;
  } else if (accessToken && refreshToken) {
    const { data: sess, error: setErr } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setErr) throw new Error(pesanAuth(setErr));
    authUser = sess?.user;
  } else {
    const detail = bacaErrorUrl(url);
    throw new Error(detail ? pesanAuth({ message: detail }) : 'Kode atau token login Google tidak ditemukan.');
  }

  if (!authUser) {
    const { data: cur } = await supabase.auth.getUser();
    authUser = cur?.user;
  }

  if (!authUser) throw new Error('Gagal memproses sesi login Google.');

  try {
    const profile = await syncOrCreateProfile(authUser);
    assertActive(profile);
    // Sertakan session agar AuthContext menyimpan state session dengan benar
    const { data: cur } = await supabase.auth.getSession();
    return { user: authUser, profile, session: cur?.session || null };
  } catch (e) {
    await supabase.auth.signOut();
    throw e;
  }
}