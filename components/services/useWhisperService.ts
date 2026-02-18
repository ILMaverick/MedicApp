/**
 * @module WhisperService
 * @description Gestisce il ciclo di vita dei modelli di registrazione e attivazione vocale (Whisper e VAD) e del Transcriber in tempo reale.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  initWhisper,
  initWhisperVad,
  WhisperContext,
  WhisperVadContext,
} from 'whisper.rn/index.js';
import { getFileFromUrlOrCache } from '../utils/utils';
import { RealtimeTranscriber } from 'whisper.rn/realtime-transcription/RealtimeTranscriber.js';
import { AudioPcmStreamAdapter } from 'whisper.rn/realtime-transcription/adapters/AudioPcmStreamAdapter.js';
import { Alert } from 'react-native';

const MODELS_DIR = 'whisper-models';

interface WhisperModel {
  modelName: string;
  description: string;
  fileName: string;
  url: string;
}

const WHISPER_MODELS: WhisperModel[] = [
  {
    modelName: 'tiny',
    description: 'Il più veloce e leggero, ma il meno preciso',
    fileName: 'ggml-tiny-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin',
  },
  {
    modelName: 'base',
    description: 'Il giusto equilibrio',
    fileName: 'ggml-base-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
  },
  {
    modelName: 'small',
    description: 'Appena più preciso del base, ma più pesante',
    fileName: 'ggml-small-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
  },
  {
    modelName: 'medium',
    description: 'Il più preciso, ma anche il più pesante',
    fileName: 'ggml-medium-q5_0.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin',
  },
];

const VAD_MODEL = {
  url: 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin',
  filename: 'ggml-silero-v6.2.0.bin',
};

export function useWhisperService(
  onRealtimeUpdate?: (text: string) => void,
  onStatusChange?: (status: string) => void,
) {
  const vadContextRef = useRef<WhisperVadContext | null>(null);
  const [isVadContextReady, setisVadContextReady] = useState(false);

  const [whisperContext, setWhisperContext] = useState<WhisperContext | null>(null);

  const transcriberRef = useRef<RealtimeTranscriber | null>(null);

  // Refs per mantenere le callback aggiornate senza re-triggerare useEffect
  const externalUpdateRef = useRef(onRealtimeUpdate);
  const externalStatusRef = useRef(onStatusChange);

  useEffect(() => {
    externalUpdateRef.current = onRealtimeUpdate;
    externalStatusRef.current = onStatusChange;
  }, [onRealtimeUpdate, onStatusChange]);

  // Helper per aggiornare lo stato
  const updateStatus = (msg: string) => {
    if (externalStatusRef.current) {
      externalStatusRef.current(msg);
    }
  };

  /**
   * Inizializza il modello Whisper selezionato scaricandolo se necessario.
   * Imposta lo stato `whisperContext`.
   *
   * @param {string} [modelName='base'] - Il nome del modello ('tiny', 'base', 'small', 'medium').
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Se il modello non esiste o il path è vuoto.
   */

  const initWhisperContext = useCallback(async (modelName: string = 'base') => {
    try {
      console.log(`[WhisperService] Richiesto modello: ${modelName}`);
      const model = WHISPER_MODELS.find((m) => m.modelName === modelName);

      if (!model) throw new Error(`[WhisperService] Modello ${modelName} sconosciuto`);

      updateStatus(`Verifica modello ${modelName}...`);

      const whisperPath = await getFileFromUrlOrCache(model.fileName, model.url, MODELS_DIR);

      console.log('[WhisperService] File pronto. Inizializzazione Context...');
      updateStatus('Inizializzazione Motore di registrazione...');

      if (whisperPath) {
        const wContext = await initWhisper({ filePath: whisperPath });
        setWhisperContext(wContext);
        console.log('✅ Whisper Context Pronto');
        updateStatus('Motore di registrazione Pronto');
      } else {
        throw new Error('Impossibile inizializzare il Whisper Context: path vuoto');
      }
    } catch (e) {
      console.error('[WhisperService] Errore critico Whisper:', e);
      Alert.alert('Errore', 'Problema nel caricamento Whisper!');
      updateStatus('Errore caricamento Whisper!');
    }
  }, []);

  /**
   * Inizializza il modello VAD (Voice Activity Detection).
   * Imposta `isVadContextReady` a true al termine.
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Se il path del VAD è nullo.
   */
  const initVADContext = useCallback(async () => {
    try {
      console.log('[WhisperService] Avvio inizializzazione VAD...');
      updateStatus('Caricamento VAD...');

      const vadPath = await getFileFromUrlOrCache(VAD_MODEL.filename, VAD_MODEL.url, MODELS_DIR);

      if (vadPath) {
        vadContextRef.current = await initWhisperVad({ filePath: vadPath });
        console.log('✅ VAD Context Pronto');
        setisVadContextReady(true);
        updateStatus('VAD Pronto');
      } else throw new Error('[WhisperService] Path VAD nullo');
    } catch (e) {
      console.error('[WhisperService] Errore critico VAD:', e);
      Alert.alert('Errore', 'Problema nel caricamento VAD!');
      updateStatus('Errore caricamento VAD');
    }
  }, []);

  /**
   * Istanzia e configura il `RealtimeTranscriber`.
   * Esegue automaticamente il cleanup di eventuali istanze precedenti.
   *
   * @param {boolean} isLowEnd - Impostare a `true` per dispositivi con poca RAM (riduce slice audio).
   * @async
   * @returns {Promise<void>}
   */
  const initRealTimeTranscriber = useCallback(
    async (isLowEnd: boolean) => {
      updateStatus('Avvio Servizi Audio...');
      const audioStream = new AudioPcmStreamAdapter();

      // Cleanup preventivo
      if (transcriberRef.current) {
        console.log('[WhisperService] Ricaricamento Transcriber...');
        try {
          await transcriberRef.current.stop();
        } finally {
          transcriberRef.current = null;
        }
      }

      if (whisperContext && vadContextRef.current) {
        transcriberRef.current = new RealtimeTranscriber(
          { whisperContext: whisperContext, vadContext: vadContextRef.current, audioStream },
          {
            audioSliceSec: isLowEnd ? 10 : 20,
            vadPreset: 'default',
            autoSliceOnSpeechEnd: true,
            transcribeOptions: { language: 'it' },
          },
          {
            onTranscribe: (event) => {
              const text = event.data?.result;
              if (text) {
                externalUpdateRef.current?.(text);
                console.log('[VoiceTranscription] Live:', text);
              }
            },
            onError: (err) => {
              console.error('[VoiceTranscription] Errore Transcriber :', err);
              updateStatus('Errore trascrizione');
            },
          },
        );
        console.log('✅ Transcriber Pronto e Assegnato');
        updateStatus('Pronto a registrare');
      } else {
        console.warn('[WhisperService] Tentativo di init Transcriber senza contesti pronti');
        updateStatus('Errore: Modelli non pronti');
      }
    },
    [whisperContext],
  );

  /**
   * Ferma e rilascia il `RealtimeTranscriber`.
   * @async
   */
  const cleanRealTimeTranscriber = useCallback(async () => {
    if (transcriberRef.current) {
      console.log('[VoiceTranscription] Pulizia: Chiusura Transcriber...');
      updateStatus('Chiusura Audio...');
      try {
        await transcriberRef.current.stop();
      } catch (e) {
        console.warn('[VoiceTranscription] Stop Transcriber fallito (già chiuso?):', e);
      }
      transcriberRef.current = null;
    }
  }, []);

  /**
   * Rilascia il contesto Whisper.
   * @async
   */
  const cleanWhisperContext = useCallback(async () => {
    if (whisperContext) {
      console.log('[VoiceTranscription] Pulizia: Rilascio del Whisper Context');
      try {
        await whisperContext.release();
      } catch (e) {
        console.error('[VoiceTranscription] Errore rilascio Whisper Context:', e);
      }
      setWhisperContext(null);
    }
  }, [whisperContext]);

  /**
   * Rilascia tutte le risorse.
   * @async
   */
  const cleanAll = useCallback(async () => {
    updateStatus('Rilascio risorse...');
    await cleanRealTimeTranscriber();
    await cleanWhisperContext();
    if (vadContextRef.current) {
      console.log('[VoiceTranscription] Pulizia: Rilascio del VAD Context');
      try {
        await vadContextRef.current.release();
      } catch (e) {
        console.error('[VoiceTranscription] Errore rilascio VAD Context:', e);
      }
      vadContextRef.current = null;
    }
  }, [cleanRealTimeTranscriber, cleanWhisperContext]);

  return {
    whisperContext,
    vadContextRef,
    transcriberRef,
    isVadContextReady,
    initWhisperModel: initWhisperContext,
    initVADModel: initVADContext,
    initRealTimeTranscriber,
    cleanAll,
  };
}
