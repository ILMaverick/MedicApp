/**
 * @module WhisperService
 * @description Gestisce il ciclo di vita dei modelli vocali (Whisper/VAD) e la trascrizione in tempo reale interagendo con i moduli nativi in C++.
 * @param {Function} [onRealtimeUpdate] - Callback opzionale invocata ad ogni nuovo frammento di testo trascritto in tempo reale.
 * @param {Function} [onStatusChange] - Callback opzionale invocata per comunicare variazioni di stato del motore alla UI.
 * @returns {Object} Istanze Ref dei modelli e funzioni per il loro ciclo di vita.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  initWhisper,
  initWhisperVad,
  WhisperContext,
  WhisperVadContext,
} from 'whisper.rn/index.js';
import { getFileFromUrlOrCache } from '../utils/utils';
import { RealtimeTranscriber } from 'whisper.rn/realtime-transcription/RealtimeTranscriber.js';
import { AudioPcmStreamAdapter } from 'whisper.rn/realtime-transcription/adapters/AudioPcmStreamAdapter.js';
import { AppSettings } from '../context/SettingsContext';
import { VAD_MODEL, WHISPER_MODELS } from '../utils/models';

const MODELS_DIR = 'whisper-models';

export function useWhisperService(
  onRealtimeUpdate?: (text: string) => void,
  onStatusChange?: (status: string) => void,
) {
  const whisperContextRef = useRef<WhisperContext | null>(null);
  const vadContextRef = useRef<WhisperVadContext | null>(null);
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isWhisperReady, setIsWhisperReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isVadReady, setIsVadReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTranscriberReady, setIsTranscriberReady] = useState(false);

  const currentNameModelRef = useRef<string | null>(null);

  const externalUpdateRef = useRef(onRealtimeUpdate);
  const externalStatusRef = useRef(onStatusChange);

  /**
   * @description Effetto di sincronizzazione: Mantiene aggiornate le reference interne alle funzioni di callback passate come argomento dall'esterno.
   * Evita problemi di stale closure se i componenti padri si ri-renderizzano.
   * @returns {void}
   */
  useEffect(() => {
    externalUpdateRef.current = onRealtimeUpdate;
    externalStatusRef.current = onStatusChange;
  }, [onRealtimeUpdate, onStatusChange]);

  /**
   * @description Helper interno per emettere messaggi di stato verso il componente chiamante.
   * @param {string} msg - Il messaggio di stato da emettere.
   * @returns {void}
   */
  const updateStatus = (msg: string) => {
    if (externalStatusRef.current) externalStatusRef.current(msg);
  };

  /**
   * @description Rilascia l'istanza del Transcriber dalla memoria RAM, fermando eventuali processi di ascolto attivi.
   * @async
   * @returns {Promise<void>}
   */
  const cleanTranscriber = useCallback(async () => {
    if (transcriberRef.current) {
      try {
        await transcriberRef.current.release();
        console.log('[WhisperService] Pulizia del Transcriber effettuata');
      } catch (e) {
        console.warn('[WhisperService]Errore rilascio Transcriber:', e);
      } finally {
        transcriberRef.current = null;
        if (isTranscriberReady) setIsTranscriberReady(false);
      }
    }
  }, [isTranscriberReady]);

  /**
   * @description Rilascia il contesto di Whisper (il modello acustico) dalla memoria RAM del dispositivo.
   * @async
   * @returns {Promise<void>}
   */
  const cleanWhisperContext = useCallback(async () => {
    if (whisperContextRef.current) {
      try {
        await whisperContextRef.current.release();
        console.log('[WhisperService] Pulizia del Whisper effettuata');
      } catch (e) {
        console.error('[WhisperService] Errore rilascio Whisper:', e);
      } finally {
        whisperContextRef.current = null;
        if (isWhisperReady) setIsWhisperReady(false);
      }
    }
  }, [isWhisperReady]);

  /**
   * @description Rilascia il contesto del Voice Activity Detection (Silero VAD) dalla memoria RAM del dispositivo.
   * @async
   * @returns {Promise<void>}
   */
  const cleanVADContext = useCallback(async () => {
    if (vadContextRef.current) {
      try {
        await vadContextRef.current.release();
        console.log('[WhisperService] Pulizia del VAD effettuata');
      } catch (e) {
        console.error('[WhisperService] Errore rilascio VAD Context:', e);
      } finally {
        vadContextRef.current = null;
        if (isVadReady) setIsVadReady(false);
      }
    }
  }, [isVadReady]);

  /**
   * @description Funzione aggregatore: richiama in sequenza i cleaner di tutte le risorse native (Transcriber, Whisper, VAD) per garantire un rilascio completo.
   * @async
   * @returns {Promise<void>}
   */
  const cleanAll = useCallback(async () => {
    updateStatus('Rilascio risorse...');

    await cleanTranscriber();
    await cleanWhisperContext();
    await cleanVADContext();

    updateStatus('Risorse liberate');
  }, [cleanTranscriber, cleanWhisperContext, cleanVADContext]);

  /**
   * @description Inizializza o aggiorna il modello Whisper selezionato. Gestisce autonomamente il download e l'allocazione C++ del contesto acustico.
   * @async
   * @param {string} [modelName='base'] - Il nome del modello da caricare (es. 'tiny', 'base', 'small').
   * @returns {Promise<void>}
   * @throws {Error} Lancia un'eccezione se il file del modello non viene trovato o l'allocazione fallisce.
   */
  const initWhisperModel = useCallback(
    async (modelName: string) => {
      try {
        updateStatus(`Verifica modello Whisper ${modelName}...`);
        setIsWhisperReady(false);
        console.log(`[WhisperService] Richiesto modello: ${modelName}`);
        const model = WHISPER_MODELS.find((m) => m.modelName === modelName);
        if (!model) throw new Error(`[WhisperService] Modello ${modelName} sconosciuto`);

        if (whisperContextRef.current) {
          if (currentNameModelRef.current === modelName) {
            console.log(`[WhisperService] Modello ${modelName} già caricato`);
            setIsWhisperReady(true);
            return;
          }
          await cleanWhisperContext();
        }

        const whisperPath = await getFileFromUrlOrCache(model.fileName, model.url, MODELS_DIR);

        if (whisperPath) {
          console.log('[WhisperService] File pronto. Inizializzazione Context...');
          updateStatus('Inizializzazione Motore di registrazione...');
          const wContext = await initWhisper({ filePath: whisperPath });

          whisperContextRef.current = wContext;
          currentNameModelRef.current = modelName;
          setIsWhisperReady(true);
          console.log('[WhisperService] ✅ Whisper Context Pronto');
          updateStatus('Motore di registrazione Pronto');
        } else {
          setIsWhisperReady(false);
          throw new Error('Impossibile inizializzare il Whisper Context: path vuoto');
        }
      } catch (e) {
        setIsWhisperReady(false);
        console.error('[WhisperService] Errore critico Whisper:', e);
        Alert.alert('Errore', 'Problema nel caricamento Whisper!');
        updateStatus('Errore caricamento Whisper!');
      }
    },
    [cleanWhisperContext],
  );

  /**
   * @description Inizializza il modello VAD (Voice Activity Detection), lo strumento che rileva il silenzio.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Se il path del VAD scaricato risulta nullo.
   */
  const initVADContext = useCallback(async () => {
    try {
      setIsVadReady(false);
      updateStatus(`Verifica modello VAD`);
      if (vadContextRef.current) {
        console.log('[WhisperService] ✅ VAD Context già caricato');
        setIsVadReady(true);
        updateStatus('VAD Pronto');
        return;
      }

      console.log('[WhisperService] Avvio inizializzazione VAD...');
      updateStatus('Caricamento VAD...');

      const vadPath = await getFileFromUrlOrCache(VAD_MODEL.filename, VAD_MODEL.url, MODELS_DIR);

      if (vadPath) {
        const vContext = await initWhisperVad({ filePath: vadPath });
        vadContextRef.current = vContext;
        setIsVadReady(true);
        console.log('[WhisperService] ✅ VAD Context Pronto');
        updateStatus('VAD Pronto');
      } else {
        setIsVadReady(false);
        throw new Error('[WhisperService] Path VAD nullo');
      }
    } catch (e) {
      setIsVadReady(false);
      console.error('[WhisperService] Errore critico VAD:', e);
      Alert.alert('Errore', 'Problema nel caricamento VAD!');
      updateStatus('Errore caricamento VAD');
    }
  }, []);

  /**
   * @description Istanzia il Transcriber che unisce Whisper e VAD elaborando lo stream audio. Esegue in automatico il cleanup di istanze precedenti per prevenire crash nativi.
   * @async
   * @param {boolean} isLowEnd - Se true, ottimizza le dimensioni dello slice audio per dispositivi con poca RAM.
   * @param {AppSettings} settings - Oggetto contenente le impostazioni globali dell'utente (es. continuousRecording).
   * @returns {Promise<void>}
   */
  const initRealTimeTranscriber = useCallback(
    async (isLowEnd: boolean, settings: AppSettings) => {
      setIsTranscriberReady(false);
      updateStatus('Preparazione Transcriber...');

      if (transcriberRef.current) {
        console.log('[WhisperService] Pulizia Transcriber...');
        await cleanTranscriber();
      }

      const audioStream = new AudioPcmStreamAdapter();

      if (whisperContextRef.current && vadContextRef.current) {
        transcriberRef.current = new RealtimeTranscriber(
          {
            whisperContext: whisperContextRef.current,
            vadContext: vadContextRef.current,
            audioStream,
          },
          {
            audioSliceSec: isLowEnd ? 10 : 20,
            vadPreset: 'default',
            autoSliceOnSpeechEnd: !settings.continuousRecording,
            transcribeOptions: { language: 'it' },
          },
          {
            onTranscribe: (event) => {
              const text = event.data?.result;
              if (text) {
                externalUpdateRef.current?.(text);
                console.log(
                  `[WhisperService] Live: ${new Date().toLocaleTimeString('it-IT')} - `,
                  text,
                );
              }
            },
            onError: (err) => {
              console.error('[WhisperService] Errore Transcriber :', err);
              updateStatus('Errore trascrizione');
            },
          },
        );
        setIsTranscriberReady(true);
        console.log('[WhisperService] ✅ Transcriber Pronto');
        updateStatus('Pronto a registrare');
      } else {
        setIsTranscriberReady(false);
        console.warn('[WhisperService] Tentativo di init Transcriber senza contesti pronti');
        updateStatus('Errore: Modelli non pronti');
      }
    },
    [cleanTranscriber],
  );

  return {
    whisperContextRef,
    vadContextRef,
    transcriberRef,
    initWhisperModel,
    initVADModel: initVADContext,
    initRealTimeTranscriber,
    cleanTranscriber,
    cleanWhisperContext,
    cleanVADContext,
    cleanAll,
  };
}
