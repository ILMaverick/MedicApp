export interface WhisperModel {
  modelName: string;
  fileName: string;
  url: string;
}

export const WHISPER_MODELS: WhisperModel[] = [
  {
    modelName: 'tiny',
    fileName: 'ggml-tiny-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin',
  },
  {
    modelName: 'base',
    fileName: 'ggml-base-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
  },
  {
    modelName: 'small',
    fileName: 'ggml-small-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
  },
  {
    modelName: 'medium',
    fileName: 'ggml-medium-q5_0.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin',
  },
];

export const VAD_MODEL = {
  url: 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin',
  filename: 'ggml-silero-v6.2.0.bin',
};
