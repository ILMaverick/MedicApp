/**
 * @module VoiceTranscription
 * @description Hook per il controllo del flusso di registrazione e trascrizione audio.
 * @returns {Object} Metodi e stati per il controllo diretto della trascrizione (inizio, fine, errori, risultato).
 */
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AudioModule } from 'expo-audio';
import { useWhisperService } from '../services/useWhisperService';
import { useSettings } from '../context/SettingsContext';
import * as Device from 'expo-device';

export function useVoiceTranscription() {
  const [isVoiceTranscriptorReady, setisVoiceTranscriptorReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Avvio Transcriber...');
  const [realTimeResult, setRealtimeResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { settings } = useSettings();
  const finalResultRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const {
    whisperContextRef,
    transcriberRef,
    vadContextRef,
    initWhisperModel,
    initVADModel,
    initRealTimeTranscriber,
    cleanTranscriber,
    cleanAll,
  } = useWhisperService(
    (text: string) => {
      if (!finalResultRef.current) setRealtimeResult(text);
    },
    (msg: string) => setStatus(msg),
  );

  const totalMemory = Device.totalMemory || 0;
  const isLowEnd = totalMemory > 0 && totalMemory < 4 * 1024 ** 3;

  /**
   * @description Effetto "Unmount": All'uscita dal componente o chiusura dell'app, garantisce il rilascio sicuro di tutte le risorse C++ allocate (Modello Whisper, VAD, Transcriber) per prevenire memory leak nel dispositivo.
   * @returns {Function} Funzione di cleanup asincrona.
   */
  useEffect(() => {
    const clean = async () => {
      await cleanAll();
    };
    return () => {
      clean();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * @description Effetto "Mount/Update": Gestisce il caricamento iniziale dei modelli AI vocali e si ri-attiva nel caso in cui l'utente cambi il modello selezionato dalle impostazioni.
   * Monitora inoltre se il componente è ancora montato prima di aggiornare gli stati.
   * @returns {Function} Funzione per invalidare la reference se il componente viene smontato durante il caricamento.
   */
  useEffect(() => {
    isMountedRef.current = true;

    const loadModels = async () => {
      try {
        setisVoiceTranscriptorReady(false);
        setStatus('Caricamento Modelli Whisper...');
        // I messaggi di stato vengono gestiti dentro initWhisperModel/initVADModel tramite onStatusChange()
        await initWhisperModel(settings.whisperModel);
        await initVADModel();
        setStatus('Modelli Whisper e VAD pronti');
      } catch (e) {
        console.error('[VoiceTranscription] Errore caricamento modelli', e);
        setError('Impossibile caricare i modelli Whisper e VAD');
        setStatus('Errore Modelli');
      } finally {
        if (isMountedRef.current) setisVoiceTranscriptorReady(true);
      }
    };

    loadModels();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.whisperModel]);

  /**
   * @description Avvia la registrazione instanziando il transcriber con le impostazioni correnti. Chiede i permessi per il microfono ed effettua la creazione di una nuova istanza C++ se non esiste.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Se l'inizializzazione del Transcriber fallisce internamente o mancano i permessi.
   */
  const startRealtimeTranscription = async (): Promise<void> => {
    try {
      setStatus('Richiesta permessi microfono');
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permesso negato', 'Abilita il microfono nelle impostazioni.');
        setStatus('Permessi mancanti');
        return;
      }

      if (!whisperContextRef.current || !vadContextRef.current) {
        Alert.alert('Attendi', 'Modelli AI non ancora caricati.');
        setStatus('Modelli mancanti');
        return;
      }

      setError(null);
      setRealtimeResult('');
      setIsRecording(true);
      finalResultRef.current = null;
      setStatus('In ascolto...');

      if (!transcriberRef.current) {
        console.log('[VoiceTranscription] Creazione nuova istanza Transcriber...');
        // initRealTimeTranscriber aggiornerà lo status internamente
        await initRealTimeTranscriber(isLowEnd, settings);
      }

      if (!transcriberRef.current) throw new Error('Inizializzazione Transcriber fallita');

      await transcriberRef.current.start();
      console.log('[VoiceTranscription] Trascrizione Live avviata');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[VoiceTranscription] Errore avvio trascrizione:`, msg);
      setError(msg);
      setIsRecording(false);
      setStatus('Errore avvio trascrizione');
    }
  };

  /**
   * @description Ferma la registrazione attiva e chiude il motore di ascolto. Gestisce un ritardo fittizio ("flush") per consentire alla pipeline di decodificare l'audio residuo prima di trarre il risultato finale.
   * @async
   * @param {boolean} [saveNote=false] - Flag indicativo. Se true, solidifica il risultato in `finalResultRef`. Se false, la trascrizione viene scartata.
   * @returns {Promise<void>}
   */
  const stopRealtimeTranscription = async (saveNote: boolean = false): Promise<void> => {
    try {
      if (transcriberRef.current) await cleanTranscriber();

      // Attendo il Transcriber che fisce l'elaborazione
      console.log('[VoiceTranscription] Attesa flush Transcriber...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = realTimeResult.trim();
      if (saveNote && result !== '') {
        finalResultRef.current = result;
        setStatus('Registrazione Salvata');
        console.log('[VoiceTranscription] Registrazione salvata');
        return;
      }

      setStatus('Registrazione annullata');
      console.log('[VoiceTranscription] Registrazione annullata');
    } catch (err) {
      console.error('[VoiceTranscription] Errore annullamento Transcriber:', err);
      setStatus('Errore annullamento Transcriber');
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsRecording(false);
      setRealtimeResult('');
    }
  };

  return {
    isRecording,
    isVoiceTranscriptorReady,
    realTimeResult,
    finalResult: finalResultRef.current,
    status,
    error,
    startRealtimeTranscription,
    stopRealtimeTranscription,
  };
}
