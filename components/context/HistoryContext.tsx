/**
 * @module HistoryContext
 * @description Provider che gestisce il database locale delle note mediche elaborate e salvate.
 */
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { MOCK_USERS, HistoryRecord } from '../utils/mockUsers';
import { useAuth } from './AuthContext';

interface HistoryContextType {
  notes: HistoryRecord[];
  addNote: (
    transcription: string,
    aiResponse: { note: string; patient: { name: string; surname: string } },
  ) => void;
  deleteNote: (id: string) => void;
}

const HistoryContext = createContext<HistoryContextType>({} as HistoryContextType);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth();
  const [notes, setNotes] = useState<HistoryRecord[]>([]);

  /**
   * @description Effetto logico: Al variare del `userId` (login/logout) recupera la cronologia caricando lo storico pregresso associato all'account.
   * @returns {void}
   */
  useEffect(() => {
    if (userId) {
      const dbUser = MOCK_USERS.find((u) => u.id === userId);
      if (dbUser && dbUser.history) {
        setNotes(dbUser.history);
      }
    } else {
      setNotes([]); // clean dello storico al logout
    }
  }, [userId]);

  /**
   * @description Inserisce una nuova nota medica appena generata dall'AI in cima allo storico globale dell'utente.
   * @param {string} transcription - La trascrizione vocale grezza fornita da Whisper.
   * @param {Object} aiResponse - Il risultato dell'inferenza in formato JSON.
   * @returns {void}
   */
  const addNote = (
    transcription: string,
    aiResponse: { note: string; patient: { name: string; surname: string } },
  ): void => {
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('it-IT'),
      hour: new Date().toLocaleTimeString('it-IT'),
      transcription,
      aiResponse,
    };
    // Aggiunge la nota in cima alla lista
    setNotes((prevNotes) => [newRecord, ...prevNotes]);
  };

  /**
   * @description Elimina una nota dallo storico globale basandosi sul suo identificativo univoco.
   * @param {string} id - L'identificativo `id` della nota da rimuovere.
   * @returns {void}
   */
  const deleteNote = (id: string): void => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  };

  return (
    <HistoryContext.Provider value={{ notes, addNote, deleteNote }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);
