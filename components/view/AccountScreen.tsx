import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useHistory } from '../context/HistoryContext';
import NoteCard from './NoteCard';
import { RootStackParamList } from '../navigation/RootNavigator';

/**
 * @component AccountScreen
 * @description Schermata del profilo utente. Mostra i dati del medico autenticato, le statistiche (numero di note totali) e la lista cronologica delle trascrizioni salvate.
 * @returns {React.JSX.Element | null} Il componente renderizzato, oppure null se i dati utente non sono ancora caricati.
 */
export default function AccountScreen(): React.JSX.Element | null {
  const { logout } = useAuth();
  const { user } = useUser();
  const { notes } = useHistory();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!user) return null;

  /**
   * @description Funzione per il rendering del singolo elemento della FlatList.
   * @param {Object} props - Le proprietà fornite dalla FlatList.
   * @param {any} props.item - L'oggetto rappresentante il record della nota.
   * @returns {React.JSX.Element} Il componente NoteCard popolato con i dati.
   */
  const renderNoteItem = ({ item }: { item: any }): React.JSX.Element => <NoteCard item={item} />;

  /**
   * @description Funzione per il rendering dell'intestazione (Header) della lista. Contiene i dati del profilo e il pulsante di logout.
   * @returns {React.JSX.Element} Il blocco visivo superiore del profilo.
   */
  const renderProfileHeader = (): React.JSX.Element => (
    <View className="px-5 mb-6">
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-2">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center self-center mb-4">
          <Text className="text-blue-600 text-4xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text className="text-2xl font-bold text-center text-slate-800">
          Dott. {user.name} {user.surname}
        </Text>
        <Text className="text-slate-500 text-center mb-6">{user.email}</Text>

        <View className="flex-row justify-between border-t border-slate-100 pt-5 mb-6">
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">
              Specializzazione
            </Text>
            <Text className="text-slate-700 font-medium">{user.role}</Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Note Totali</Text>
            <Text className="text-blue-600 font-bold text-lg">{notes.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={logout}
          className="bg-red-50 py-4 rounded-xl items-center border border-red-200"
        >
          <Text className="text-red-600 font-bold text-lg">Esci </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xl font-bold text-slate-800 mt-8 mb-2 ml-1">Storico Note</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      {/* Header Fisso in alto */}
      <View className="flex-row items-center justify-between px-5 pt-4 mb-2 pb-2">
        {/* Parte Sinistra: Tasto Indietro e Titolo */}
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Text className="text-blue-600 font-bold text-lg">⬅️ Indietro</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-800">Il mio Profilo</Text>
        </View>

        {/* Parte Destra: il tasto impostazioni */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          className="bg-slate-200 p-2 rounded-full shadow-sm"
        >
          <Text className="text-xl">⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* La Lista */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={() => (
          <Text className="text-center text-slate-400 mt-10 mx-5">
            Nessuna nota registrata finora.
          </Text>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
