import { useCallback, useEffect, useState } from 'react';
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
    description:
      'Ultra Veloce - Ideale per dispositivi low-end. Se il dispositivo risponde in maniera errata o non comprende pienamente la risposta, prova la versione 1.5B (Se il dispositivo lo permette)',
    fileName: 'qwen2.5-0.5b-instruct-q5_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q5_k_m.gguf',
  },
  {
    modelName: 'Qwen 2.5 (1.5B)',
    description:
      'Bilanciato - Buon compromesso tra velocità e prestazioni. Se il dispositivo risulta lento nel rispondere, si blocca o chiude inavvertitamente, usa la versione 0.5B',
    fileName: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
];

export function useLlamaService() {
  const [llamaContext, setLlamaContext] = useState<LlamaContext | null>(null);
  const [isLlamaReady, setIsLlamaReady] = useState(false);

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (llamaContext) {
        console.log('[Llama] Rilascio risorse RAM');
        setIsLlamaReady(false);
        llamaContext.release().catch((err) => console.warn('Errore release:', err));
      }
    };
  }, [llamaContext]);

  const initLlamaContext = useCallback(async (modelName: string = 'Qwen 2.5 (0.5B)') => {
    if (llamaContext) {
      console.log('[Llama] Init saltato: Contesto già pronto.');
      setIsLlamaReady(true);
      return;
    }

    console.log(`[Llama] Richiesto modello: ${modelName}`);
    const model = LLAMA_MODELS.find((m) => m.modelName === modelName);
    if (!model) {
      console.error(`[Llama] Modello ${modelName} non trovato nella lista`);
      return;
    }

    try {
      console.log('[Llama] Controllo file modello...');
      const fileUri = await getFileFromUrlOrCache(model.fileName, model.url, MODELS_DIR);

      // Inizializzazione context
      console.log('[Llama] Inizializzazione context...');
      const context = await initLlama({
        model: fileUri,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 0,
      });

      setLlamaContext(context);
      setIsLlamaReady(true);
      console.log('✅ Llama pronto');
    } catch (e) {
      console.error('[Llama] Errore critico:', e);
      setIsLlamaReady(false);
      throw e;
    }
  }, []);

  return { llamaContext, isLlamaReady, initLlamaContext };
}
