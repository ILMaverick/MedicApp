import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginController } from '../controllers/useLoginController';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

/**
 * @component LoginScreen
 * @description Schermata di autenticazione dell'applicazione. Gestisce l'inserimento delle credenziali tramite l'aiuto del `useLoginController`.
 * @returns {React.JSX.Element} Il componente della schermata di login.
 */
export default function LoginScreen(): React.JSX.Element {
  const controller = useLoginController();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <Text className="text-4xl font-bold text-slate-800 text-center mb-2">MedicApp ⚕️</Text>
        <Text className="text-base text-slate-500 text-center mb-10">
          Accedi al tuo pannello medico
        </Text>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {controller.errorMessage !== '' && (
            <View className="bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
              <Text className="text-red-600 text-sm text-center font-medium">
                {controller.errorMessage}
              </Text>
            </View>
          )}

          <Text className="text-slate-700 font-bold mb-2">Email</Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-slate-800"
            placeholder="La tua email"
            value={controller.email}
            onChangeText={controller.onChangeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text className="text-slate-700 font-bold mb-2">Password</Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-8 text-slate-800"
            placeholder="••••••••"
            value={controller.password}
            onChangeText={controller.onChangePassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={controller.handleLogin}
            className="bg-blue-600 py-4 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Accedi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
