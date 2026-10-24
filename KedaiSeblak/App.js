import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { KasirProvider } from './src/context/KasirContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <KasirProvider>
        <NavigationContainer independent={true}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </KasirProvider>
    </SafeAreaProvider>
  );
}