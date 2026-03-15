/**
 * @module LlamaInference
 * @description Hook per gestire le richieste di inferenza testuale verso il modello Llama locale, passando un system prompt preconfigurato per l'estrazione JSON dei dati.
 * @returns {Object} Oggetto con gli stati dell'AI (isReady, isThinking, error, ecc.) e le funzioni per inviare prompt o resettare le risposte.
 */
import { useState, useEffect, useRef } from 'react';
import { useLlamaService } from '../services/useLlamaService';
import { useSettings } from '../context/SettingsContext';

export function useLlamaInference() {
  const [response, setResponse] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { settings } = useSettings();
  const { llamaModelRef, initLlamaContext } = useLlamaService();
  const isMountedRef = useRef<boolean>(true);

  /**
   * @description Effetto "Mount/Update": Inizializza il contesto del modello Llama non appena l'hook viene montato o quando le impostazioni globali variano.
   * Protegge le variazioni di stato tramite `isMountedRef`.
   * @returns {Function} Funzione di cleanup per aggiornare il ref alla chiusura.
   */
  useEffect(() => {
    isMountedRef.current = true;

    const initLlama = async () => {
      setIsReady(false);
      setStatus(`Caricamento ${settings.llamaModel}...`);
      await initLlamaContext(settings.llamaModel);
      if (isMountedRef.current) {
        setIsReady(true);
        setStatus('Modello AI Pronto');
      }
    };

    initLlama();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.llamaModel]);

  /**
   * @description Invia il testo trascritto al modello SLM per l'estrazione dati basandosi su un prompt di sistema rigido. Si aspetta una risposta rigidamente formattata tramite un grammar constraint (`response_format`).
   * @async
   * @param {string} userText - Il testo grezzo appena trascritto da elaborare.
   * @returns {Promise<void>}
   * @throws {Error} Nel caso in cui l'inferenza di llama.cpp restituisca errori o blocchi, lo stato `error` viene esposto all'esterno.
   */
  const generateResponse = async (userText: string): Promise<void> => {
    if (!llamaModelRef.current || !userText || userText.trim().length < 2) return;

    try {
      setIsThinking(true);
      setStatus('Sto pensando...');
      setResponse('');

      setError(null);

      const prompt = `<|im_start|>system
Sei un assistente specializzato in estrazione dati. Il tuo unico scopo è estrarre informazioni e restituire UNICAMENTE un oggetto JSON valido.
TASSATIVO: NON aggiungere NESSUN campo oltre a "note" e "patient". Sono severamente vietati campi come età, date, sesso o misure.

Regole per i campi:
- "note": riscrivi il testo dell'utente RIMUOVENDO il nome e il cognome, siano essi scritti in minuscolo o in maiuscolo. La frase deve mantenere il suo senso medico.
- "patient": inserisci nome e cognome, con entrambe le iniziali in maiuscolo.

Esempio di trasformazione:
Testo utente: "Mario rossi ha una forte tosse."
{
  "note": "Il paziente ha una forte tosse.",
  "patient": {"name": "Mario", "surname": "Rossi"}
}
<|im_end|>
<|im_start|>user
Testo da analizzare: "${userText}"
<|im_end|>
<|im_start|>assistant
`;

      console.log('[LlamaInference] Inizio inferenza...');
      const { text } = await llamaModelRef.current.completion({
        prompt,
        n_predict: 400,
        temperature: 0,
        response_format: {
          type: 'json_object',
          schema: {
            type: 'object',
            properties: {
              patient: {
                type: 'object',
                properties: { name: { type: 'string' }, surname: { type: 'string' } },
                required: ['name', 'surname'],
              },
              note: { type: 'string' },
            },
            required: ['patient', 'note'],
          },
        },
        stop: ['<|im_end|>'],
      });

      console.log('[LlamaInference] Risposta completa:', text);
      setResponse(text);
    } catch (e) {
      setResponse('Errore elaborazione AI.');
      setError(
        e instanceof Error ? e.message : "[LlamaInference] Errore sconosciuto durante l'inferenza",
      );
    } finally {
      setIsThinking(false);
    }
  };

  /**
   * @description Pulisce lo stato visivo della risposta generata dall'AI (senza invalidare il contesto), preparandolo per una nuova richiesta di inferenza pulita.
   * @returns {void}
   */
  const resetAi = () => {
    setResponse('');
  };

  return {
    response,
    status,
    isThinking,
    isReady,
    generateResponse,
    resetAi,
    error,
  };
}
