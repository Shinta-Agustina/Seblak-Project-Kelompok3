import { supabase } from '../../lib/supabase';

// Akun kasir/owner menggunakan format:
// username@kedaiseblak.com
export const EMAIL_DOMAIN = 'kedaiseblak.com';

// Mengubah username menjadi email untuk login.
export const toEmail = (value) => {
  const input = String(value || '').trim().toLowerCase();

  if (!input) {
    throw new Error('Username atau email wajib diisi.');
  }

  return input.includes('@')
    ? input
    : `${input}@${EMAIL_DOMAIN}`;
};

// Mengambil profil berdasarkan ID pengguna Supabase Auth.
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, role, status')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil profil: ${error.message}`);
  }

  return data;
}

// Memastikan profil tersedia dan akun aktif.
function assertActive(profile) {
  if (!profile) {
    throw new Error(
      'Profil pengguna tidak ditemukan. Hubungi owner.'
    );
  }

  const status = String(profile.status || '').toLowerCase();
  const role = String(profile.role || '').toLowerCase();

  if (status !== 'aktif') {
    throw new Error('Akun ini nonaktif. Hubungi owner.');
  }

  if (!['owner', 'kasir'].includes(role)) {
    throw new Error('Role pengguna tidak valid.');
  }
}

// Login menggunakan username atau email dan password.
export async function signIn(identifier, password) {
  if (!identifier || !String(identifier).trim()) {
    throw new Error('Username atau email wajib diisi.');
  }

  if (!password) {
    throw new Error('Password wajib diisi.');
  }

  const email = toEmail(identifier);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Username/email atau password salah.');
    }

    throw new Error(`Login gagal: ${error.message}`);
  }

  try {
    const profile = await fetchProfile(data.user.id);

    assertActive(profile);

    return {
      user: data.user,
      profile,
    };
  } catch (error) {
    // Logout jika profil tidak ditemukan, tidak aktif,
    // atau role pengguna tidak valid.
    if (
      error.message === 'Profil pengguna tidak ditemukan. Hubungi owner.' ||
      error.message === 'Akun ini nonaktif. Hubungi owner.' ||
      error.message === 'Role pengguna tidak valid.'
    ) {
      await supabase.auth.signOut();
    }

    throw error;
  }
}

// Logout pengguna.
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout gagal: ${error.message}`);
  }
}

// Memeriksa sesi ketika aplikasi dibuka kembali.
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Gagal memeriksa sesi: ${error.message}`);
  }

  const session = data?.session;

  if (!session) {
    return null;
  }

  try {
    const profile = await fetchProfile(session.user.id);

    assertActive(profile);

    return {
      user: session.user,
      profile,
    };
  } catch (error) {
    // Logout hanya jika akun memang tidak valid.
    // Jika terjadi gangguan jaringan atau RLS,
    // error diteruskan agar bisa ditangani aplikasi.
    if (
      error.message === 'Profil pengguna tidak ditemukan. Hubungi owner.' ||
      error.message === 'Akun ini nonaktif. Hubungi owner.' ||
      error.message === 'Role pengguna tidak valid.'
    ) {
      await supabase.auth.signOut();
      return null;
    }

    throw error;
  }
}