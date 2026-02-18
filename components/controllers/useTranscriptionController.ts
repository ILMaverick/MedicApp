/* import { useEffect, useRef, useState } from 'react';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';

export function useTranscriptionController() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);
  const { isRecording, startRealtimeTranscription, stopRealtimeTranscription } =
    useVoiceTranscription();

  useEffect(() => {
    setStatus('Avvio Modelli...');
  }, []);

  // Inizializzazione Modelli
  useEffect(() => {
    isMountedRef.current = true;

    const loadModels = async () => {
      try {
        setIsLoading(true);
        // Carica Whisper se non c'è
        if (!whisperContext) await initWhisperModel();
        // Carica VAD se non c'è
        if (!isVadContextReady) await initVADModel();
      } catch (err) {
        console.error('Errore caricamento modelli', err);
        setError('Impossibile caricare i modelli AI');
      }
    };

    loadModels();

    // Cleanup totale
    return () => {
      isMountedRef.current = false;

      cleanAll();
    };
    // Disabilita il warning solo per questa riga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper per gestire il pulsante
  const handlePress = async () => {
    if (!isRecording) {
      await startRealtimeTranscription();
    } else {
      await stopRealtimeTranscription();
    }
  };

  return {
    status,
    handlePress,
  };
}
 */
