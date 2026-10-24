import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardKasirScreen from '../screens/kasir/DashboardKasirScreen';
import DashboardOwnerScreen from '../screens/owner/DashboardOwner';
import { useKasir } from '../context/KasirContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useKasir();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'Owner' ? (
        <Stack.Screen name="DashboardOwner" component={DashboardOwnerScreen} />
      ) : (
        <Stack.Screen name="DashboardKasir" component={DashboardKasirScreen} />
      )}
    </Stack.Navigator>
  );
}