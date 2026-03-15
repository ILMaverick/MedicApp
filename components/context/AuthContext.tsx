/**
 * @module AuthContext
 * @description Provider dell'autenticazione. Espone lo stato di login globale permettendo o negando la navigazione (RootNavigator).
 */
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { MOCK_USERS } from '../utils/mockUsers';

interface AuthContextType {
  userId: string | null;
  isLogged: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * @description Tenta l'accesso validando le credenziali sul mock database. In caso di esito positivo salva l'ID utente.
   * @param {string} email - L'indirizzo email inserito.
   * @param {string} pass - La password in chiaro inserita.
   * @returns {boolean} `true` se il login va a buon fine, `false` se le credenziali sono errate.
   */
  const login = (email: string, pass: string): boolean => {
    // Verifichiamo le credenziali
    const foundUser = MOCK_USERS.find((u) => u.email === email && u.password === pass);
    if (foundUser) {
      setUserId(foundUser.id); // Il lasciapassare è valido, salviamo l'ID
      return true;
    }
    return false;
  };

  /**
   * @description Azzera lo `userId`, invalidando l'accesso e causando il blocco delle route protette in automatico.
   * @returns {void}
   */
  const logout = (): void => setUserId(null);

  return (
    <AuthContext.Provider value={{ userId, isLogged: userId !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
