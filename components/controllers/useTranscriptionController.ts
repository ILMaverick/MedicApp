import { useEffect } from 'react';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import { useLlamaInference } from '../hooks/useLlamaInference';

export function useTranscriptionController() {
  const transcription = useVoiceTranscription();
  const ai = useLlamaInference();

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

  const handlePress = async () => {
    if (transcription.isRecording) {
      await transcription.stopRealtimeTranscription();
    } else {
      await transcription.startRealtimeTranscription();
    }
  };

  // Appena la trascrizione finisce, parte la risposta dell'AI
  useEffect(() => {
    if (transcription.finalResult && ai.isLlamaReady) {
      console.log(
        '[Transcription Controller] Trascrizione Whisper terminata. Generazione risposta AI',
      );
      ai.generateResponse(transcription.finalResult);
    }
  }, [transcription.finalResult, ai.isLlamaReady]); // Rimosso ai.generateResponse dalle dipendenze per evitare loop

  /**
   * Gestisce il toggle della registrazione (Start/Stop).
   * @async
   */

  return {
    transcriptionText: transcription.realTimeResult || transcription.finalResult,
    aiResponse: ai.aiResponse,
    status: currentStatus,

    isRecording: transcription.isRecording,
    isThinking: ai.isThinking,
    isLoadingModels: isGlobalLoading,
    canRecord: !isGlobalLoading && !isBusy,

    handlePress,

    debug: {
      isLlamaReady: ai.isLlamaReady,
      error: transcription.error,
    },
  };
}
