import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { supabase } from '../lib/supabase';
import {
  signIn,
  signUp as authSignUp,
  signInWithGoogle,
  signOut,
  getCurrentSession,
  syncOrCreateProfile,
} from '../services/Authservice';

import {
  getCashiers,
  createCashierAccount,
  updateCashier as updateCashierService,
  updateCashierPassword as updateCashierPasswordService,
  setCashierStatus as setCashierStatusService,
  deleteCashier as deleteCashierService,
} from '../services/kasirService';

// =====================================================
// CONTEXT
// =====================================================
const AuthContext = createContext(null);

// Pemetaan data kasir untuk komponen UI
const mapCashier = (cashier) => ({
  ...cashier,
  id: cashier.id,
  name: cashier.nama || cashier.name || '',
  email: cashier.username || cashier.email || '',
  phone: cashier.no_telepon || cashier.phone || '',
  status: cashier.status,
  kode_kasir: cashier.kode_kasir || '',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  // Khusus login Google: dipakai AppNavigator untuk menahan layar loading
  // sehingga layar Login tidak "mampir" sebelum masuk dashboard.
  const [googleLoading, setGoogleLoading] = useState(false);
  const [cashiers, setCashiers] = useState([]);

  // =====================================================
  // MEMUAT DATA KASIR (UNTUK OWNER ATAU REFERENSI)
  // =====================================================
  const loadCashiers = useCallback(async () => {
    try {
      const data = await getCashiers();
      const mapped = (Array.isArray(data) ? data : []).map(mapCashier);
      setCashiers(mapped);
      return mapped;
    } catch (err) {
      console.warn('Gagal memuat data kasir:', err.message);
      return [];
    }
  }, []);

  // =====================================================
  // MEMBANGUN OBJEK USER UNTUK APLIKASI
  // =====================================================
  const buildUserObject = useCallback((authUser, userProfile, currentCashiers = []) => {
    if (!authUser || !userProfile) return null;

    const normalizedRole =
      String(userProfile.role || '').toLowerCase() === 'owner' ? 'Owner' : 'Kasir';

    const emailUsername = String(authUser.email || '')
      .trim()
      .toLowerCase()
      .split('@')[0];

    const cashierRecord =
      normalizedRole === 'Kasir'
        ? currentCashiers.find((c) => {
          const u = String(c.username || c.email || '').trim().toLowerCase();
          return (
            u === emailUsername ||
            u === String(authUser.email || '').trim().toLowerCase() ||
            String(c.id) === String(authUser.id)
          );
        })
        : null;

    const displayName =
      userProfile.nama ||
      authUser.user_metadata?.nama ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'Pengguna';

    return {
      id: authUser.id,
      kasirId: cashierRecord?.id || authUser.id,
      email: authUser.email,
      nama: displayName,
      name: displayName,
      role: normalizedRole,
      peran: normalizedRole,
      status: userProfile.status || 'aktif',
      avatar:
        normalizedRole === 'Owner'
          ? { uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' }
          : require('../../assets/images/avatar-kasir.png'),
    };
  }, []);

  // =====================================================
  // TERAPKAN SESI LOGIN
  // =====================================================
  const applySession = useCallback(
    async (sessionData) => {
      if (!sessionData) {
        setUser(null);
        setProfile(null);
        setSession(null);
        return;
      }

      const { user: authUser, profile: userProfile, session: rawSession } = sessionData;

      // Muat data kasir dulu, baru set semua state sekaligus.
      // Sebelumnya profile di-set lebih dulu sementara user masih null,
      // sehingga ada celah waktu di mana layar Login sempat tampil.
      let currentCashiers = [];
      try {
        currentCashiers = await loadCashiers();
      } catch { }

      const mappedUser = buildUserObject(authUser, userProfile, currentCashiers);
      setSession(rawSession || null);
      setProfile(userProfile);
      setUser(mappedUser);
      return mappedUser;
    },
    [buildUserObject, loadCashiers]
  );

  // =====================================================
  // PEMULIHAN SESI AWAL & AUTH LISTENER
  // =====================================================
  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then(async (result) => {
        if (mounted && result) {
          await applySession(result);
        }
      })
      .catch((err) => {
        console.warn('Pemulihan sesi Supabase gagal:', err.message);
      })
      .finally(() => {
        if (mounted) {
          setInitializing(false);
        }
      });

    // Listener perubahan status autentikasi Supabase
    // Menangani redirect Google OAuth di Web maupun perubahan token.
    // Callback sengaja TIDAK async/await: memanggil query Supabase langsung
    // di dalam callback ini bisa membuat proses setSession macet (deadlock).
    // Pekerjaan berat dijalankan setelah callback selesai lewat setTimeout.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const userProfile = await syncOrCreateProfile(newSession.user);
              if (!mounted) return;
              await applySession({
                user: newSession.user,
                profile: userProfile,
                session: newSession,
              });
            } catch (err) {
              console.warn('Gagal sinkronisasi sesi onAuthStateChange:', err.message);
            }
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        setCashiers([]);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [applySession]);

  // =====================================================
  // METODE LOGIN
  // =====================================================
  const login = useCallback(
    async (identifier, password) => {
      setLoading(true);
      try {
        const result = await signIn(identifier, password);
        await applySession(result);
        return result.profile;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  // =====================================================
  // METODE LOGIN GOOGLE
  // =====================================================
  const loginGoogle = useCallback(async () => {
    setLoading(true);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) {
        return null; // Untuk Web: browser berpindah ke Google OAuth, atau dibatalkan
      }
      await applySession(result);
      return result.profile;
    } finally {
      // Selalu dimatikan di semua jalur: berhasil, dibatalkan, atau error.
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [applySession]);

  // =====================================================
  // METODE SIGN UP (PENDAFTARAN)
  // =====================================================
  const signUp = useCallback(
    async (emailOrUsername, password, nama, role = 'kasir') => {
      setLoading(true);
      try {
        const result = await authSignUp(emailOrUsername, password, nama, role);
        if (result?.user && result?.profile) {
          await applySession(result);
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  // =====================================================
  // METODE LOGOUT
  // =====================================================
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setCashiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // MANAJEMEN AKUN KASIR (SESUAI MODUL OWNER & SUPABASE)
  // =====================================================
  const addCashier = useCallback(
    async (values) => {
      const row = await createCashierAccount(values);
      const mapped = mapCashier(row);

      setCashiers((prev) => [
        ...prev.filter((item) => String(item.id) !== String(mapped.id)),
        mapped,
      ]);

      return mapped;
    },
    []
  );

  const updateCashier = useCallback(
    async (id, values) => {
      const row = await updateCashierService(id, values);
      const mapped = mapCashier(row);

      setCashiers((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...item, ...mapped } : item))
      );

      return mapped;
    },
    []
  );

  const updateCashierPassword = useCallback(async (id, password) => {
    return await updateCashierPasswordService(id, password);
  }, []);

  const setCashierStatus = useCallback(async (id, status) => {
    const row = await setCashierStatusService(id, status);
    const mapped = mapCashier(row);

    setCashiers((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, ...mapped } : item))
    );

    return mapped;
  }, []);

  const deleteCashier = useCallback(async (id) => {
    const hasil = await deleteCashierService(id); // 'dihapus' | 'nonaktif'

    setCashiers((prev) =>
      hasil === 'dihapus'
        ? prev.filter((item) => String(item.id) !== String(id))
        : prev.map((item) =>
          String(item.id) === String(id) ? { ...item, status: 'nonaktif' } : item
        )
    );

    return hasil;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      initializing,
      loading,
      googleLoading,
      login,
      loginGoogle,
      signUp,
      logout,
      // Manajemen Akun Kasir
      cashiers,
      loadCashiers,
      addCashier,
      updateCashier,
      updateCashierPassword,
      setCashierStatus,
      deleteCashier,
    }),
    [
      user,
      profile,
      session,
      initializing,
      loading,
      googleLoading,
      login,
      loginGoogle,
      signUp,
      logout,
      cashiers,
      loadCashiers,
      addCashier,
      updateCashier,
      updateCashierPassword,
      setCashierStatus,
      deleteCashier,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook kustom useAuth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

export default AuthContext;