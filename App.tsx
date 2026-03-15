/**
 * @file App.js
 * @description Punto di ingresso dell'applicazione "MedicApp".
 *
 * @author Matteo Pallotti - mat.100823
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';

import { AuthProvider } from './components/context/AuthContext';
import RootNavigator from './components/navigation/RootNavigator';
import { StatusBar } from 'react-native';
import { UserProvider } from './components/context/UserContext';
import { HistoryProvider } from './components/context/HistoryContext';
import { SettingsProvider } from './components/context/SettingsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <AuthProvider>
        <UserProvider>
          <SettingsProvider>
            <HistoryProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </HistoryProvider>
          </SettingsProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
