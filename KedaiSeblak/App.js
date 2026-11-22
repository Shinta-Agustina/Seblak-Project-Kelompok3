import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

// Menangani penutupan otomatis browser auth session saat kembali dari OAuth
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {}

import { AuthProvider } from './src/context/AuthContext';
import { KasirProvider } from './src/context/KasirContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <KasirProvider>
          <NavigationContainer independent={true}>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </KasirProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
