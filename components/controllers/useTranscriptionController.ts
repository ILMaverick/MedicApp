import { useEffect, useState } from 'react';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import { useLlamaInference } from '../hooks/useLlamaInference';

export function useTranscriptionController() {
  const transcription = useVoiceTranscription();
  const ai = useLlamaInference();

  // Stato per nascondere il testo se l'utente annulla la nota
  const [isCancelled, setIsCancelled] = useState(false);
  // Stato per ricordare all'app che deve far partire l'AI appena Whisper si ferma
  const [isConfirmed, setIsConfirmed] = useState(false);

  const isGlobalLoading = transcription.areModelsLoading || !ai.isLlamaReady;
  const isBusy = transcription.isRecording || ai.isThinking;

  // Status combinati per averne uno solo da mostrare
  const currentStatus = ai.isThinking
    ? ai.aiStatus
    : transcription.isRecording
      ? 'Ti ascolto...'
      : isGlobalLoading
        ? transcription.status + ' - ' + ai.aiStatus
        : 'Pronto';

  // Funzione per quando l'utente avvia la registrazione
  const handleStart = async () => {
    setIsCancelled(false);
    setIsConfirmed(false);
    await transcription.startRealtimeTranscription();
  };

  // Funzione per quando l'utente annulla la registrazione. La trascrizione effettuata fino ad adesso viene cancellata.
  const handleCancel = async () => {
    setIsCancelled(true);
    if (transcription.isRecording) {
      await transcription.stopRealtimeTranscription();
    }
  };

  // Funzione per quando l'utente conferma la registrazione
  const handleConfirm = async () => {
    if (transcription.isRecording) {
      await transcription.stopRealtimeTranscription();
      setIsConfirmed(true);
    }
  };

  // Aspetta che Whisper sia completamente fermo e abbia prodotto il testo finale. Successivamente fa partire Llama.
  useEffect(() => {
    if (isConfirmed && !transcription.isRecording && transcription.finalResult && ai.isLlamaReady) {
      console.log('[Transcription Controller] Trascrizione finita. Avvio AI...');
      ai.generateResponse(transcription.finalResult);
    }
  }, [transcription.isRecording, transcription.finalResult, ai.isLlamaReady, isConfirmed]);

  // Determina cosa mostrare a video (nasconde se annullato)
  const displayTranscription = isCancelled
    ? ''
    : transcription.realTimeResult || transcription.finalResult;

  // Appena la trascrizione finisce, parte la risposta dell'AI
  // useEffect(() => {
  //   if (transcription.finalResult && ai.isLlamaReady) {
  //     console.log(
  //       '[Transcription Controller] Trascrizione Whisper terminata. Generazione risposta AI',
  //     );
  //     ai.generateResponse(transcription.finalResult);
  //   }
  // }, [transcription.finalResult, ai.isLlamaReady]);

  /**
   * Gestisce il toggle della registrazione (Start/Stop).
   * @async
   */

  return {
    transcriptionText: displayTranscription,
    aiResponse: ai.aiResponse,
    status: currentStatus,

    isRecording: transcription.isRecording,
    isThinking: ai.isThinking,
    isLoadingModels: isGlobalLoading,
    canRecord: !isGlobalLoading && !isBusy,

    handleStart,
    handleConfirm,
    handleCancel,

    debug: {
      isLlamaReady: ai.isLlamaReady,
      error: transcription.error,
    },
  };
}
