/**
 * @module TranscriptionController
 * @description Controller che funge da ponte tra la UI, l'acquisizione vocale (Whisper) e l'elaborazione AI (Llama).
 * @returns {Object} Oggetto contenente gli stati consolidati per la UI e le funzioni di avvio/stop della trascrizione.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import { useLlamaInference } from '../hooks/useLlamaInference';
import { useHistory } from '../context/HistoryContext';

export function useTranscriptionController() {
  const transcription = useVoiceTranscription();
  const ai = useLlamaInference();
  const { addNote } = useHistory();

  const hasSavedRef = useRef(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const appState = useRef(AppState.currentState);
  const isRecordingRef = useRef(transcription.isRecording);

  const isGlobalLoading = !transcription.isVoiceTranscriptorReady || !ai.isReady;
  const isBusy = transcription.isRecording || ai.isThinking;

  // Status combinati per averne uno solo da mostrare
  const currentStatus = ai.isThinking
    ? ai.status
    : transcription.isRecording
      ? 'Ti ascolto...'
      : isGlobalLoading
        ? `${transcription.status} - ${ai.status}`
        : 'Pronto';

  /**
   * @description Avvia una nuova sessione di registrazione audio tramite il RealtimeTranscription di Whisper.
   * @async
   * @returns {Promise<void>}
   */
  const handleStart = async (): Promise<void> => {
    setIsCancelled(false);
    setIsConfirmed(false);
    hasSavedRef.current = false;
    await transcription.startRealtimeTranscription();
  };

  /**
   * @description Interrompe la registrazione in corso senza salvare la nota finale, scartando quanto detto fino a quel momento.
   * @async
   * @returns {Promise<void>}
   */
  const handleCancel = async (): Promise<void> => {
    setIsCancelled(true);
    if (transcription.isRecording) {
      await transcription.stopRealtimeTranscription(false);
    }
  };

  const handleCancelRef = useRef(handleCancel);

  /**
   * @description Effetto di sincronizzazione: Aggiorna la reference di `handleCancel` ad ogni render.
   * Questo garantisce che i listener in background usino sempre la versione più recente della funzione.
   * @returns {void}
   */
  useEffect(() => {
    handleCancelRef.current = handleCancel;
  });

  /**
   * @description Ferma la registrazione attiva e richiede il salvataggio della trascrizione finale per permettere all'AI di elaborarla.
   * @async
   * @returns {Promise<void>}
   */
  const handleConfirm = async (): Promise<void> => {
    if (transcription.isRecording) {
      await transcription.stopRealtimeTranscription(true);
      setIsConfirmed(true);
      console.log('[Transcription Controller] Trascrizione finita.');
    }
  };

  /**
   * @description Effetto di sincronizzazione: Mantiene allineato il `Ref` di `isRecording` con lo stato effettivo fornito dall'hook di trascrizione.
   * @returns {void}
   */
  useEffect(() => {
    isRecordingRef.current = transcription.isRecording;
  }, [transcription.isRecording]);

  /**
   * @description Effetto "Mount": Crea un ascoltatore globale di sistema (`AppState`) per monitorare se l'app viene messa in background.
   * In tal caso, disattiva automaticamente il microfono per prevenire crash nativi o registrazioni involontarie.
   * @returns {Function} Funzione di cleanup per rimuovere il listener alla distruzione del componente.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'active' && nextAppState === 'background') {
        console.log('[Transcription Controller] App andata in background.');

        if (isRecordingRef.current) {
          console.log(
            '[Transcription Controller] Interruzione registrazione per app in background.',
          );
          await handleCancelRef.current();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * @description Effetto logico: Monitora la fine della registrazione e l'eventuale conferma dell'utente.
   * Se le condizioni sono soddisfatte (nota confermata e modelli pronti), avvia automaticamente l'inferenza AI passando il testo finale trascritto.
   * @returns {void}
   */
  useEffect(() => {
    if (isConfirmed && !transcription.isRecording && transcription.finalResult && ai.isReady) {
      console.log('[Transcription Controller] Avvio generazione risposta AI...');
      ai.generateResponse(transcription.finalResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription.isRecording, transcription.finalResult, ai.isReady, isConfirmed]);

  // Determina cosa mostrare a video (nasconde se annullato)
  const transcriptionText = isCancelled
    ? ''
    : transcription.realTimeResult || transcription.finalResult;

  /**
   * @description Effetto logico: Monitora il completamento dell'elaborazione AI.
   * Quando l'AI restituisce una risposta, cerca di parsarla come JSON e di salvarla nello storico tramite il context `addNote`.
   * Gestisce anche il blocco di eventuali output non validi e resetta lo stato AI alla fine.
   * @returns {void}
   */
  useEffect(() => {
    if (
      isConfirmed &&
      !ai.isThinking &&
      ai.response &&
      transcription.finalResult &&
      !hasSavedRef.current &&
      !ai.error
    ) {
      try {
        const trimmedResponse = ai.response.trim();

        if (trimmedResponse.startsWith('{')) {
          const parsedAiResponse = JSON.parse(trimmedResponse);
          addNote(transcription.finalResult, parsedAiResponse);
          hasSavedRef.current = true;
          console.log('[Transcription Controller] Nota salvata con successo!');
        } else {
          console.warn(
            "[Transcription Controller] La risposta dell'AI non è un JSON valido. Risposta ricevuta:",
            trimmedResponse,
          );
        }
      } catch (error) {
        console.error("Errore nel parsing del JSON dell'AI durante il salvataggio:", error);
      } finally {
        ai.resetAi();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.isThinking, ai.response, transcription.finalResult, isConfirmed, ai.error, addNote]);

  return {
    transcriptionText,
    aiResponse: ai.response,
    status: currentStatus,
    isRecording: transcription.isRecording,
    isThinking: ai.isThinking,
    isLoadingModels: isGlobalLoading,
    canRecord: !isGlobalLoading && !isBusy,
    hasSavedRef,
    handleStart,
    handleConfirm,
    handleCancel,
    debug: {
      isLlamaReady: ai.isReady,
      error: transcription.error,
    },
  };
}
