import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
 
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardKasirScreen from '../screens/kasir/DashboardKasirScreen';
import DashboardOwnerScreen from '../screens/owner/DashboardOwner';
import PengeluaranScreen from '../screens/owner/PengeluaranScreen';
import LaporanKeuanganScreen from '../screens/owner/LaporanKeuanganScreen';
import DetailTransaksiScreen from '../screens/kasir/DetailTransaksiScreen';
import { useKasir } from '../context/KasirContext';
 
const Stack = createNativeStackNavigator();
 
export default function AppNavigator() {
  // initializing = true selama sesi Supabase sedang dipulihkan saat aplikasi dibuka.
  const { user, initializing } = useKasir();
  const isOwner = String(user?.role || '').toLowerCase() === 'owner';
 
  // Tanpa layar ini, pengguna yang SUDAH login akan melihat layar Login
  // berkedip sesaat setiap kali aplikasi dibuka.
  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C62828" />
        <Text style={styles.loadingText}>Memuat sesi...</Text>
      </View>
    );
  }
 
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F5F2',
    gap: 12,
  },
  loadingText: { color: '#8D7B70', fontSize: 13, fontWeight: '600' },
});
