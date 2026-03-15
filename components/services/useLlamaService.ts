/**
 * @module LlamaService
 * @description Gestisce l'inizializzazione, il ciclo di vita e il rilascio del modello SLM (Small Language Model) locale interagendo con i binding C++ di llama.rn.
 * @returns {Object} Oggetto contenente la reference al modello C++ e le funzioni di lifecycle.
 */
import { useCallback, useState, useRef } from 'react';
import { initLlama, LlamaContext } from 'llama.rn';
import { getFileFromUrlOrCache } from '../utils/utils';

const MODELS_DIR = 'llama-models';

interface LlamaModel {
  modelName: string;
  description: string;
  fileName: string;
  url: string;
}

const LLAMA_MODELS: LlamaModel[] = [
  {
    modelName: 'Qwen 2.5 (0.5B)',
    description: 'Ultra Veloce - Ideale per dispositivi low-end.',
    fileName: 'qwen2.5-0.5b-instruct-q5_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q5_k_m.gguf',
  },
  {
    modelName: 'Qwen 2.5 (1.5B)',
    description: 'Bilanciato - Buon compromesso tra velocità e prestazioni.',
    fileName: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
];

export function useLlamaService() {
  const llamaModelRef = useRef<LlamaContext | null>(null);
  // State fittizio usato solo per il re-render del componente
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLlamaReady, setIsLlamaReady] = useState(false);
  const currentLlamaModelRef = useRef<string | null>(null);

  /**
   * @description De-alloca in modo sicuro l'istanza di Llama dalla memoria RAM del dispositivo per prevenire i leak.
   * @async
   * @returns {Promise<void>}
   */
  const cleanLlamaContext = useCallback(async () => {
    try {
      const contextToRelease = llamaModelRef.current;
      if (contextToRelease) {
        setIsLlamaReady(false);
        await contextToRelease.release();
        console.log(`[LlamaService] Pulizia dell'SLM effettuata`);
      }
    } catch (e) {
      console.warn('[LlamaService] Errore rilascio risorse Llama Context:', e);
    }
  }, []);

  /**
   * @description Verifica la presenza, eventualmente scarica e infine alloca in C++ il contesto Llama.
   * @async
   * @param {string} modelName - Nome del modello selezionato dalle impostazioni.
   * @returns {Promise<void>}
   * @throws {Error} Rilancia eventuali eccezioni per fallimenti critici nell'inizializzazione.
   */
  const initLlamaContext = useCallback(
    async (modelName: string) => {
      setIsLlamaReady(false);
      if (llamaModelRef.current && currentLlamaModelRef.current === modelName) {
        console.log(`[LlamaService] Modello ${modelName} già caricato`);
        setIsLlamaReady(true);
        return;
      }

      console.log(`[LlamaService] Richiesto modello: ${modelName}`);
      const model = LLAMA_MODELS.find((m) => m.modelName === modelName);
      if (!model) {
        console.error(`[LlamaService] Modello ${modelName} non trovato nella lista`);
        return;
      }

      try {
        if (llamaModelRef.current) {
          await cleanLlamaContext();
        }

        console.log('[LlamaService] Controllo file modello...');
        const fileUri = await getFileFromUrlOrCache(model.fileName, model.url, MODELS_DIR);

        // Inizializzazione context
        console.log('[LlamaService] Inizializzazione context...');
        const context = await initLlama({
          model: fileUri,
          use_mlock: true,
          n_ctx: 2048,
          n_gpu_layers: 0,
        });

        llamaModelRef.current = context;
        currentLlamaModelRef.current = modelName;
        setIsLlamaReady(true);
        console.log('[LlamaService] ✅ Llama pronto');
      } catch (e) {
        console.error('[LlamaService] Errore critico:', e);
        await cleanLlamaContext();
        setIsLlamaReady(false);
        throw e;
      }
    },
    [cleanLlamaContext],
  );

  return { llamaModelRef, initLlamaContext, cleanLlamaContext };
}
