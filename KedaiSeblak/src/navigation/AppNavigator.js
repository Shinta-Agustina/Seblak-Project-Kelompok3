import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardKasirScreen from '../screens/kasir/DashboardKasirScreen';
import DashboardOwnerScreen from '../screens/owner/DashboardOwnerScreen';
import MenuHargaScreen from '../screens/owner/MenuHargaScreen';
import PengeluaranScreen from '../screens/owner/PengeluaranScreen';
import LaporanKeuanganScreen from '../screens/owner/LaporanKeuanganScreen';
import { useKasir } from '../context/KasirContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useKasir();
  const isOwner = user?.role === 'Owner' || user?.role === 'owner';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : isOwner ? (
        <>
          <Stack.Screen name="DashboardOwner" component={DashboardOwnerScreen} />
          <Stack.Screen name="MenuHarga" component={MenuHargaScreen} />
          <Stack.Screen name="Pengeluaran" component={PengeluaranScreen} />
          <Stack.Screen name="Transaksi" component={PengeluaranScreen} />
          <Stack.Screen name="LaporanKeuangan" component={LaporanKeuanganScreen} />
        </>
      ) : (
        <Stack.Screen name="Dashboard" component={DashboardKasirScreen} />
      )}
    </Stack.Navigator>
  );
}