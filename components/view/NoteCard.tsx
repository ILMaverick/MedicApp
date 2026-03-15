import React from 'react';
import { View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { HistoryRecord } from '../utils/mockUsers';
import { useHistory } from '../context/HistoryContext';

interface NoteCardProps {
  item: HistoryRecord;
}

/**
 * @component NoteCard
 * @description Card visiva che mostra i dettagli di una singola trascrizione medica, inclusa l'analisi AI, la data e il nome del paziente. Fornisce strumenti per la condivisione JSON e l'eliminazione.
 * @param {NoteCardProps} props - Le proprietà passate al componente.
 * @param {HistoryRecord} props.item - Il record della nota contenente tutti i dati associati.
 * @returns {React.JSX.Element} Il componente grafico NoteCard.
 */
export default function NoteCard({ item }: NoteCardProps): React.JSX.Element {
  const { deleteNote } = useHistory();

  /**
   * @description Costruisce un oggetto JSON formattato partendo dai dati della nota e lo invia al menu di condivisione nativo del dispositivo (Share API).
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Quando la Share API fallisce (l'errore viene intercettato e mostrato tramite Alert).
   */
  const handleShareNote = async (): Promise<void> => {
    try {
      const jsonObject = {
        note: item.aiResponse.note,
        patient: {
          name: item.aiResponse.patient.name,
          surname: item.aiResponse.patient.surname,
        },
        date: item.date,
        hour: item.hour,
      };

      const messageToShare = JSON.stringify(jsonObject, null, 2);

      const result = await Share.share({
        message: messageToShare,
      });

      if (result.action === Share.sharedAction) {
        console.log('JSON condiviso con successo!');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile condividere il JSON della nota.');
      console.error('Errore Share API:', error);
    }
  };

  /**
   * @description Genera un prompt di avviso (Alert nativo). Se l'utente conferma, procede alla rimozione definitiva della nota dallo storico tramite il Context.
   * @returns {void}
   */
  const handleDelete = (): void => {
    Alert.alert('Elimina Nota', 'Sei sicuro di voler eliminare questa trascrizione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => deleteNote(item.id),
      },
    ]);
  };

  const patientFullName = `${item.aiResponse.patient.name} ${item.aiResponse.patient.surname}`;

  return (
    <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 mx-5 relative">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">👤</Text>
          <Text className="text-blue-700 font-bold text-lg">{patientFullName}</Text>
        </View>
        <View className="flex-col items-end">
          <Text className="text-slate-400 text-xs font-medium">{item.hour}</Text>
          <Text className="text-slate-400 text-xs font-medium">{item.date}</Text>
        </View>
      </View>

      <View className="mb-4 pr-10">
        <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Trascrizione Audio</Text>
        <Text className="text-slate-600 italic">"{item.transcription}"</Text>
      </View>

      <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 pb-8">
        <Text className="text-blue-900 font-bold mb-1">Nota Clinica</Text>
        <Text className="text-blue-800 leading-5">{item.aiResponse.note}</Text>
      </View>

      <View className="absolute bottom-3 right-3 flex-row gap-2">
        <TouchableOpacity
          onPress={handleDelete}
          className="bg-red-50 p-2.5 rounded-full shadow-md border border-red-100 active:bg-red-100"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <Text>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShareNote}
          className="bg-white p-2.5 rounded-full shadow-md border border-slate-100 active:bg-slate-50"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <Text>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
