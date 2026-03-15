/**
 * @module SettingsContext
 * @description Provider globale per gestire e persistere le impostazioni dei modelli IA e del comportamento dell'app.
 */
import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface AppSettings {
  whisperModel: 'tiny' | 'base' | 'small' | 'medium';
  llamaModel: string;
  vadTimeout: number; // Secondi di silenzio prima di fermarsi
  continuousRecording: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>({
    whisperModel: 'base',
    llamaModel: 'Qwen 2.5 (0.5B)',
    vadTimeout: 2, // 2 secondi di default
    continuousRecording: false,
  });

  /**
   * @description Metodo di utilità per aggiornare dinamicamente i settaggi delle impostazioni preservando i valori non esplicitamente modificati (Partial merge).
   * @param {Partial<AppSettings>} newSettings - L'oggetto parziale contenente i nuovi valori.
   * @returns {void}
   */
  const updateSettings = (newSettings: Partial<AppSettings>): void => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
