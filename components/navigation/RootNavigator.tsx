import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../view/LoginScreen';
import AccountScreen from '../view/AccountScreen';
import HomeScreen from '../view/HomeScreen';
import SettingsScreen from '../view/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Account: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator();

/**
 * @component RootNavigator
 * @description Gestore principale della navigazione (Stack Router). Definisce i percorsi accessibili basandosi sullo stato di autenticazione dell'utente, bloccando le schermate protette se non si è loggati.
 * @returns {React.JSX.Element} L'albero di navigazione di React Navigation.
 */
export default function RootNavigator(): React.JSX.Element {
  const { isLogged } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLogged ? (
        // Se sei loggato, puoi vedere Home e Account
        <Stack.Group>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Group>
      ) : (
        // Se non sei loggato, l'unica schermata che viene mostrata è il Login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
