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
