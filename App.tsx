/**
 * @file App.js
 * @description Punto di ingresso dell'applicazione "App - Diary".
 *
 * @author Matteo Pallotti - mat.100823
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import './global.css';
import HomeScreen from './components/view/homeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}
