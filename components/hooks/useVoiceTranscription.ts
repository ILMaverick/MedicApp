import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AudioModule } from 'expo-audio';
import { useWhisperService } from '../services/useWhisperService';
import * as Device from 'expo-device';

export function useVoiceTranscription() {
  const [areModelsLoading, setAreModelsLoading] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Avvio Sistema...');

  const [realTimeResult, setRealtimeResult] = useState<string>('');
  const [finalResult, setRealTimeFinalResult] = useState<string | null>(null); // serve anche null per la trascrizione live nella UI in homescreen.
  const [error, setError] = useState<string | null>(null);

  const latestTextRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);

  // Iniezione del setStatus e dei risultati in tempo reale nel servizio
  const {
    whisperContext,
    transcriberRef,
    isVadContextReady,
    initWhisperModel,
    initVADModel,
    initRealTimeTranscriber,
    cleanAll,
  } = useWhisperService(
    (text: string) => {
      setRealtimeResult(text);
      latestTextRef.current = text;
    },
    (msg: string) => {
      setStatus(msg);
    },
  );

  const totalMemory = Device.totalMemory || 0;
  const isLowEnd = totalMemory > 0 && totalMemory < 4 * 1024 ** 3;

  /**
   * Effetto: Caricamento iniziale dei modelli AI.
   * Viene eseguito una sola volta al mount.
   */
  useEffect(() => {
    isMountedRef.current = true;

    const loadModels = async () => {
      try {
        setAreModelsLoading(true);
        setStatus('Caricamento Modelli Whisper...');
        // I messaggi di stato vengono gestiti dentro initWhisperModel/initVADModel tramite onStatusChange()
        if (!whisperContext) await initWhisperModel();
        if (!isVadContextReady) await initVADModel();
      } catch (err) {
        console.error('[VoiceTranscription] Errore caricamento modelli', err);
        setError('Impossibile caricare i modelli AI');
        setStatus('Errore Modelli');
      } finally {
        if (isMountedRef.current) {
          setAreModelsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      isMountedRef.current = false;
      cleanAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Gestisce il toggle della registrazione (Start/Stop).
   * @async
   */
  const handlePress = async () => {
    if (isRecording) {
      await stopRealtimeTranscription();
    } else {
      await startRealtimeTranscription();
    }
  };

  /**
   * Avvia la trascrizione in tempo reale.
   * Crea un'istanza pulita del Transcriber se non esiste.
   * @async
   */
  const startRealtimeTranscription = async () => {
    try {
      setStatus('Richiesta permessi...');
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permesso negato', 'Abilita il microfono nelle impostazioni.');
        setStatus('Permessi mancanti');
        return;
      }

      if (!whisperContext || !isVadContextReady) {
        Alert.alert('Attendi', 'Modelli AI non ancora caricati.');
        return;
      }

      if (!transcriberRef.current) {
        console.log('[VoiceTranscription] Creazione nuova istanza Transcriber...');
        // initRealTimeTranscriber aggiornerà lo status internamente
        await initRealTimeTranscriber(isLowEnd);
      }

      if (!transcriberRef.current) {
        throw new Error('Inizializzazione Transcriber fallita');
      }

      // Reset Stato
      setError(null);
      setRealtimeResult('');
      latestTextRef.current = '';
      setRealTimeFinalResult(null);
      setIsRecording(true);
      setStatus('In ascolto...');

      await transcriberRef.current.start();
      console.log('[VoiceTranscription] Trascrizione Live avviata');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[VoiceTranscription] Errore start:`, msg);
      setError(msg);
      setIsRecording(false);
      setStatus('Errore avvio');
      transcriberRef.current = null;
    }
  };

  /**
   * Ferma la trascrizione.
   * Attende 2 sec. per permettere all'AI di elaborare gli ultimi chunk audio (flush).
   * @async
   */
  const stopRealtimeTranscription = async () => {
    try {
      setStatus('Elaborazione finale...');

      if (transcriberRef.current) {
        await transcriberRef.current.stop();
      }

      console.log('[VoiceTranscription] Attesa flush Transcriber...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const final = latestTextRef.current.trim();

      if (final) {
        setRealTimeFinalResult(final);
        console.log('[VoiceTranscription] Trascrizione salvata:', final);
      }

      // Distruzione istanza per evitare bug audio al riavvio
      transcriberRef.current = null;

      setIsRecording(false);
      setStatus('Nota salvata');
      console.log('[VoiceTranscription] Stop completato');

      // Reset status a "Pronto" dopo 2 secondi
      setTimeout(() => setStatus('Pronto'), 2000);
    } catch (err) {
      console.error('[VoiceTranscription] Errore stop:', err);
      transcriberRef.current = null;
      setIsRecording(false);
      setStatus('Errore stop');
    }
  };

  return {
    isRecording,
    areModelsLoading,
    realTimeResult,
    finalResult,
    status,
    error,
    handlePress,
  };
}
