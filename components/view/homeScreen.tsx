import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import { useLlamaInference } from '../hooks/useLlamaInference';

/**
 * Schermata principale per la trascrizione vocale.
 * Utilizza `useVoiceTranscription` per gestire la logica di registrazione e trascrizione.
 * Utilizza `useLlamaInference` per gestire il modello AI.
 *
 * @component
 */
export default function HomeScreen() {
  // Hook Trascrizione
  const { isRecording, areModelsLoading, status, realTimeResult, finalResult, handlePress } =
    useVoiceTranscription();

  // Hook AI
  const { aiResponse, isThinking, isLlamaReady, generateResponse } = useLlamaInference();

  // Quando finalResult cambia (e non è vuoto), chiama Llama
  useEffect(() => {
    if (finalResult && isLlamaReady) {
      console.log('Testo ricevuto in Home, invio a Llama...');
      generateResponse(finalResult);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalResult, isLlamaReady]); // Dipendenze: testo finale e stato modello

  // UI Variabili
  const displayedSpeechText = isRecording
    ? realTimeResult
    : finalResult || 'Tocca il pulsante per iniziare...';

  // Il pulsante è disabilitato se carica Whisper OPPURE se carica Llama
  const isGlobalLoading = areModelsLoading || (!isLlamaReady && !areModelsLoading);
  const isButtonDisabled = isGlobalLoading && !isRecording;

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <Text className="text-3xl font-bold text-center text-slate-800 mb-8">App Diary 🎙️</Text>

        {/* Card Controlli */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          {/* Status */}
          <Text className="text-base text-center text-slate-500 italic mb-4 font-medium h-6">
            {isLlamaReady && !areModelsLoading ? 'Pronto' : status}
          </Text>

          {/* Loading Spinner (Solo durante il caricamento modelli iniziale) */}
          {isGlobalLoading && !isRecording && (
            <ActivityIndicator size="large" className="text-blue-600 mb-4" />
          )}

          {/* Pulsante Azione */}
          <TouchableOpacity
            onPress={handlePress}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
            className={`
              py-4 rounded-xl items-center justify-center shadow-sm
              ${isRecording ? 'bg-red-500' : 'bg-blue-600'}
              ${isButtonDisabled ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <Text className="text-white font-bold text-lg tracking-wide uppercase">
              {isRecording ? 'Stop & Salva' : 'Registra Nota'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Area Testo */}
        <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Anteprima Testo
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
            <Text
              className={`text-lg leading-8 ${
                isRecording ? 'text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              {displayedSpeechText}
            </Text>
          </ScrollView>
        </View>
        <View className="flex-1 bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <Text className="text-xs font-bold text-blue-800 uppercase mb-2">Analisi AI</Text>
          <ScrollView nestedScrollEnabled>
            {isThinking ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <Text className="text-base text-blue-900 font-mono">
                {aiResponse || 'In attesa di input...'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
