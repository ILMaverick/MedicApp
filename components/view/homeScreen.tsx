import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranscriptionController } from '../controllers/useTranscriptionController';
import { useNavigation } from '@react-navigation/native';
import NoteCard from './NoteCard';
import { useHistory } from '../context/HistoryContext';

/**
 * @component HomeScreen
 * @description Schermata principale per l'inserimento vocale. Mette a disposizione i comandi per avviare, annullare o confermare la dettatura clinica e ne mostra lo status in tempo reale.
 * @returns {React.JSX.Element} Il componente della home page.
 */
export default function HomeScreen(): React.JSX.Element {
  const controller = useTranscriptionController();
  const navigation = useNavigation<any>();
  const { notes } = useHistory();
  const ultimaNota = notes[0];

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-1 px-5 pt-4">
        <TouchableOpacity
          onPress={() => navigation.navigate('Account')}
          className="absolute right-5 top-5 z-10 bg-slate-200 p-2 rounded-full"
        >
          <Text>👤</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-center text-slate-800 mb-8">MedicApp ⚕️</Text>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <Text className="text-base text-center text-slate-500 italic mb-4 font-medium min-h-[24px]">
            {controller.status}
          </Text>

          {controller.isLoadingModels && (
            <ActivityIndicator size="large" className="text-blue-600 mb-4" />
          )}

          {controller.isRecording ? (
            <View className="flex-row justify-between space-x-3 mb-3 gap-3">
              <TouchableOpacity
                onPress={controller.handleCancel}
                activeOpacity={0.8}
                className="flex-1 py-4 bg-red-500 rounded-xl items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg uppercase">Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={controller.handleConfirm}
                activeOpacity={0.8}
                className="flex-1 py-4 bg-green-500 rounded-xl items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg uppercase">Analizza</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={controller.handleStart}
              disabled={!controller.canRecord}
              activeOpacity={0.8}
              className={`
                py-4 rounded-xl items-center justify-center shadow-sm mb-3 bg-blue-600
                ${!controller.canRecord ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <Text className="text-white font-bold text-lg tracking-wide uppercase">
                Registra Nota
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <Text
            className={`text-lg leading-8 ${controller.isRecording ? 'text-slate-800' : 'text-slate-600'}`}
          >
            {controller.transcriptionText || 'Premi registra...'}
          </Text>
        </View>

        <View className="flex-1 bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100 mb-4">
          <Text className="text-xs font-bold text-blue-800 uppercase mb-2">Analisi AI</Text>
          <ScrollView nestedScrollEnabled>
            {controller.isThinking ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <View>
                {controller.isRecording ? (
                  <Text className="text-base text-blue-900 font-mono">...</Text>
                ) : !controller.hasSavedRef.current ? (
                  <Text className="text-base text-blue-900 font-mono">
                    Bentornato! Dimmi pure cosa fare...
                  </Text>
                ) : (
                  ultimaNota && (
                    <View className="mt-2">
                      <Text className="mb-2 font-bold text-slate-500">Ultima Nota Salvata:</Text>
                      <NoteCard item={ultimaNota} />
                    </View>
                  )
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
