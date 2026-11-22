import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardKasirScreen from '../screens/kasir/DashboardKasirScreen';
import DashboardOwnerScreen from '../screens/owner/DashboardOwner';
import PengeluaranScreen from '../screens/owner/PengeluaranScreen';
import LaporanKeuanganScreen from '../screens/owner/LaporanKeuanganScreen';
import DetailTransaksiScreen from '../screens/kasir/DetailTransaksiScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function LoadingView() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#C62828" />
      <Text style={styles.loadingText}>Memuat sesi...</Text>
    </View>
  );
}

// Selama login Google berjalan, yang terlihat HANYA layar "Memuat sesi...".
// LoginScreen tidak dihapus (hanya disembunyikan dengan display: 'none'), jadi
// pesan error dan isi form tetap ada kalau login Google dibatalkan atau gagal.
// Ini dilakukan di dalam layar Login sendiri, bukan overlay di atas navigator,
// karena overlay bisa tertutup layar native dari native-stack.
function LoginGate() {
  const { googleLoading } = useAuth();
  return (
    <View style={styles.root}>
      <View style={[styles.root, googleLoading && styles.hidden]}>
        <LoginScreen />
      </View>
      {googleLoading ? <LoadingView /> : null}
    </View>
  );
}

export default function AppNavigator() {
  // initializing = true selama sesi Supabase sedang dipulihkan saat aplikasi dibuka.
  const { user, profile, initializing } = useAuth();
  const isOwner = String(profile?.role || user?.role || '').toLowerCase() === 'owner';

  // Tahan di layar loading selama sesi dipulihkan, atau user sudah ada tapi
  // profile (role) belum termuat (supaya tidak sempat masuk dashboard yang salah).
  if (initializing || (user && !profile)) {
    return <LoadingView />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginGate} />
      ) : isOwner ? (
        <>
          <Stack.Screen
            name="DashboardOwner"
            component={DashboardOwnerScreen}
          />
          <Stack.Screen name="Pengeluaran" component={PengeluaranScreen} />
          <Stack.Screen
            name="LaporanKeuangan"
            component={LaporanKeuanganScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="DashboardKasir"
            component={DashboardKasirScreen}
          />
          <Stack.Screen
            name="DetailTransaksi"
            component={DetailTransaksiScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: 'none' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F5F2',
    gap: 12,
  },
  loadingText: { color: '#8D7B70', fontSize: 13, fontWeight: '600' },
});