import { useState, useEffect } from 'react';
import { useLlamaService } from '../services/useLlamaService';

export function useLlamaInference() {
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const { llamaContext, isLlamaReady, initLlamaContext } = useLlamaService();

  // Inizializza il modello appena l'hook viene montato
  useEffect(() => {
    initLlamaContext('Qwen 2.5 (0.5B)'); // TODO inserito modello piccolo per test
  }, [initLlamaContext]);

  const generateResponse = async (userText: string) => {
    if (!llamaContext) {
      console.warn('Llama context non pronto.');
      setAiStatus('Modello AI non caricato');
      return;
    }

    if (!userText || userText.trim().length < 2) {
      console.warn('Testo utente troppo breve.');
      return;
    }

    try {
      setIsThinking(true);
      setAiStatus('Sto pensando...');
      setAiResponse('');

      // Prompt Engineering specifico per Qwen/Llama 3
      // Chiediamo un JSON puro
      const systemPrompt = `Sei un assistente medico. Estrai i dati in JSON. Non aggiungere altro testo. 
      Esempio: {"obbiettivo": "nota", "paziente": "Mario", "data": "oggi"}`;

      // Formato ChatML
      const prompt = `<|im_start|>system
      ${systemPrompt}<|im_end|>
      <|im_start|>user
      ${userText}<|im_end|>
      <|im_start|>assistant
      `;

      console.log('[Llama] Inizio inferenza...');

      const { text } = await llamaContext.completion(
        {
          prompt,
          n_predict: 250, // Limitiamo la lunghezza per velocità
          temperature: 0.1,
          stop: ['<|im_end|>'], // Stop token
        },
        (data) => {
          // Streaming della risposta (opzionale, ma bello da vedere)
          setAiResponse((prev) => prev + data.token);
        },
      );

      console.log('[Llama] Risposta completa:', text);
      return text;
    } catch (e) {
      console.error('[Llama] Inference error:', e);
      setAiResponse('Errore elaborazione AI.');
    } finally {
      setIsThinking(false);
      setAiStatus('Pronto');
    }
  };

  return {
    aiResponse,
    aiStatus,
    isThinking,
    isLlamaReady,
    generateResponse,
  };
}
