import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable, FileSystemDownloadResult } from 'expo-file-system/legacy';

/**
 * Assicura che la directory specificata esista nel file system locale.
 * Se non esiste, viene creata.
 *
 * @param {string} nameDir - Il nome della directory da creare/cercare all'interno della document directory.
 * @returns {Directory} L'oggetto Directory puntato al path specificato.
 * @throws {Error} Se la document directory non è accessibile o la creazione fallisce.
 */
const getModelsDirectory = (nameDir: string): Directory => {
  try {
    const documentDirectory = Paths.document;
    if (!documentDirectory) throw new Error('[Utils] Document directory non disponibile');

    const directory = new Directory(documentDirectory, nameDir);
    if (!directory.exists) {
      directory.create();
    }
    return directory;
  } catch (error) {
    console.error('[Utils] Errore directory:', error);
    throw new Error('[Utils] Impossibile creare la cartella modelli.');
  }
};

/**
 * Scarica un file da un URL remoto se non è già presente nella cache locale.
 *
 * @param {string} fileName - Il nome del file da salvare (es. 'model.bin').
 * @param {string} url - L'URL remoto da cui scaricare il file.
 * @param {string} dirFile - Il nome della sottocartella in cui salvare il file.
 *
 * @returns {Promise<string>} L'URI locale (`file://...`) del file scaricato o recuperato dalla cache.
 * @async
 * @throws {Error} Se il download fallisce (status code diverso da 200) o se l'URL non è raggiungibile.
 */
export const getFileFromUrlOrCache = async (
  fileName: string,
  url: string,
  dirFile: string,
): Promise<string> => {
  const directory = getModelsDirectory(dirFile);
  const file = new File(directory, fileName);

  if (file.exists) {
    console.log(`[Utils] File in cache: ${fileName}`);
    return file.uri;
  }

  console.log(`[Utils] Inizio download: ${fileName}`);
  try {
    const downloadResumable = createDownloadResumable(url, file.uri);

    const result = (await downloadResumable.downloadAsync()) as
      | FileSystemDownloadResult
      | undefined;

    if (!result || result.status !== 200) {
      throw new Error(`Download fallito con status: ${result?.status}`);
    }

    console.log(`[Utils] Download completato: ${fileName}`);
    return result.uri;
  } catch (error) {
    // Pulizia file corrotto/parziale in caso di errore
    if (file.exists) {
      file.delete();
    }
    throw error;
  }
};
