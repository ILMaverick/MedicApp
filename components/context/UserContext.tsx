/**
 * @module UserContext
 * @description Provider per la gestione del profilo utente. Recupera i dati di anagrafica depurati da password e cronologia pesante.
 */
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { MOCK_USERS } from '../utils/mockUsers';

// Definiamo il profilo senza dati sensibili o di dominio
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

interface UserContextType {
  user: UserProfile | null;
}

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useAuth(); // Legge dall'AuthContext
  const [user, setUser] = useState<UserProfile | null>(null);

  /**
   * @description Effetto logico: Monitora il `userId` dell'AuthContext. Al login popola lo stato globale estraendo l'utente dal Mock DB, al logout svuota i dati protetti.
   * @returns {void}
   */
  useEffect(() => {
    if (userId) {
      // Simuliamo la chiamata al database (es. fetch('/api/users/me'))
      const foundUser = MOCK_USERS.find((u) => u.id === userId);
      if (foundUser) {
        const { password, history, ...profileData } = foundUser;
        setUser(profileData);
      }
    } else {
      setUser(null); // Svuota i dati se facciamo logout
    }
  }, [userId]);

  return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
