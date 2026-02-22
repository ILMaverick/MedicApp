import { useState, useEffect, useRef } from 'react';
import { useLlamaService } from '../services/useLlamaService';

export function useLlamaInference() {
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const { llamaContext, isLlamaReady, initLlamaContext } = useLlamaService();

  // Assicura che l'init parta UNA sola volta
  // const hasRequestedInit = useRef(false);

  // Inizializza il modello appena l'hook viene montato
  useEffect(() => {
    setAiStatus('Modello AI in caricamento...');
    initLlamaContext('Qwen 2.5 (1.5B)'); // TODO inserito modello grande per test
    setAiStatus('Modello AI Pronto');
  }, []);

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

      const oggi = new Date().toLocaleDateString('it-IT');
      const ora = new Date().toLocaleTimeString('it-IT');

      // Chiediamo un JSON puro
      const prompt = `<|im_start|>system
Regole per i campi:
- "nota": devi copiare e incollare il testo dell'utente omettendo il nome e il cognome.
- "paziente": estrai nome e cognome.
- "data": "${oggi}".
- "ora": "${ora}".

Esempio di output desiderato:
{
  "nota": "il paziente ha la febbre",
  "paziente": {"nome": "Mario", "cognome": "Rossi"},
  "data": "${oggi}",
  "ora": "${ora}"
}
<|im_end|>
<|im_start|>user
Testo da analizzare: "${userText}"
<|im_end|>
<|im_start|>assistant
`;

      console.log('[Llama] Inizio inferenza...');

      const { text } = await llamaContext.completion(
        {
          prompt,
          n_predict: 400, // Limitiamo la lunghezza per velocità
          temperature: 0,
          response_format: {
            type: 'json_object',
            schema: {
              type: 'object',
              properties: {
                paziente: {
                  type: 'object',
                  properties: {
                    nome: { type: 'string' },
                    cognome: { type: 'string' },
                  },
                  required: ['nome', 'cognome'],
                },
                nota: { type: 'string' },
                data: { type: 'string' },
                ora: { type: 'string' },
              },
              required: ['paziente', 'nota', 'data', 'ora'],
            },
          },
          stop: ['<|im_end|>'], // Stop token
        },
        (data) => {
          // Streaming della risposta
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
