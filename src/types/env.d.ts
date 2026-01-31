declare module "whisper.rn" {
  /**
   * Dichiariamo il modulo in modo generico.
   * TypeScript smetterà di lamentarsi e tratterà tutto ciò che importi
   * da 'whisper.rn' come 'any' (nessun controllo errore specifico).
   */
  const content: any;
  export = content;

  // Se vuoi essere più specifico (opzionale), puoi esportare le funzioni che usi:
  export function initWhisper(options: { filePath: string }): Promise<any>;
}
