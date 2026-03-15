import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSettings } from '../context/SettingsContext';

/**
 * @component SettingsScreen
 * @description Schermata dedicata alle configurazioni dell'app. Permette all'utente di selezionare i modelli AI da utilizzare (Whisper per audio, Qwen per SLM) e di regolare i parametri di registrazione vocale.
 * @returns {React.JSX.Element} Il componente dedicato alle impostazioni.
 */
export default function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View className="flex-row items-center px-5 pt-4 mb-4 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-blue-600 font-bold text-lg">⬅️ Indietro</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-800">Impostazioni</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Modello Whisper */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-slate-700 mb-3">
            Modello Trascrizione (Whisper)
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden border border-slate-200">
            {['tiny', 'base', 'small'].map((model) => (
              <TouchableOpacity
                key={model}
                onPress={() => updateSettings({ whisperModel: model as any })}
                className={`p-4 border-b border-slate-100 flex-row justify-between items-center ${
                  settings.whisperModel === model ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <Text
                  className={`text-base ${settings.whisperModel === model ? 'text-blue-700 font-bold' : 'text-slate-600'}`}
                >
                  Whisper {model.toUpperCase()}
                </Text>
                {settings.whisperModel === model && <Text>✅</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modello Llama */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-slate-700 mb-3">Modello Analisi AI (Qwen)</Text>
          <View className="bg-white rounded-2xl overflow-hidden border border-slate-200">
            {['Qwen 2.5 (0.5B)', 'Qwen 2.5 (1.5B)'].map((model) => (
              <TouchableOpacity
                key={model}
                onPress={() => updateSettings({ llamaModel: model })}
                className={`p-4 border-b border-slate-100 flex-row justify-between items-center ${
                  settings.llamaModel === model ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <Text
                  className={`text-base ${settings.llamaModel === model ? 'text-blue-700 font-bold' : 'text-slate-600'}`}
                >
                  {model}
                </Text>
                {settings.llamaModel === model && <Text>✅</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Impostazioni Registrazione */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-slate-700 mb-3">Comportamento Registrazione</Text>
          <View className="bg-white rounded-2xl p-4 border border-slate-200">
            {/* Toggle Registrazione Continua */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1 pr-4">
                <Text className="text-base font-bold text-slate-700">Registrazione Continua</Text>
                <Text className="text-xs text-slate-500 mt-1">
                  Non fermare l'ascolto quando il medico smette di parlare.
                </Text>
              </View>
              <Switch
                value={settings.continuousRecording}
                onValueChange={(val) => updateSettings({ continuousRecording: val })}
                trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
              />
            </View>

            {/* Pulsantiera Timeout Silenzio */}
            <View>
              <Text className="text-base font-bold text-slate-700 mb-2">
                Pausa di fine discorso (VAD)
              </Text>
              <Text className="text-xs text-slate-500 mb-3">
                Quanti secondi di silenzio prima di fermare l'ascolto in automatico.
              </Text>
              <View className="flex-row gap-2">
                {[2, 5, 10].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => updateSettings({ vadTimeout: sec })}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      settings.vadTimeout === sec
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`font-bold ${settings.vadTimeout === sec ? 'text-white' : 'text-slate-600'}`}
                    >
                      {sec} sec
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
