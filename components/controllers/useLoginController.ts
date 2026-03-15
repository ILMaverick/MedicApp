/**
 * @module LoginController
 * @description Hook controller per la gestione della logica di business della schermata di login.
 * Gestisce lo stato dei campi di input, la validazione tramite regex e l'interazione con l'AuthContext.
 * @returns {Object} Oggetto contenente gli stati (email, password, errorMessage) e i metodi per gestire il form.
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useLoginController() {
  const { login } = useAuth();

  // Stati del form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Regole di validazione (Regex)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  /**
   * @description Valida i campi email e password e tenta l'accesso tramite il sistema di autenticazione.
   * In caso di errore (validazione o credenziali errate), imposta un messaggio d'errore visibile all'utente.
   * @returns {void}
   */
  const handleLogin = (): void => {
    setErrorMessage('');

    if (!emailRegex.test(email)) {
      setErrorMessage('Inserisci un indirizzo email valido.');
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'La password deve avere almeno 8 caratteri, una maiuscola, un numero e un carattere speciale.',
      );
      return;
    }

    // accesso nel mockUsers
    const isSuccess = login(email, password);

    if (!isSuccess) {
      setErrorMessage('Credenziali errate. Utente non trovato nel sistema.');
    }
  };

  /**
   * @description Aggiorna lo stato dell'email e, se presente, cancella il messaggio di errore a schermo durante la digitazione.
   * @param {string} text - Il testo digitato dall'utente.
   * @returns {void}
   */
  const onChangeEmail = (text: string): void => {
    setEmail(text);
    if (errorMessage) setErrorMessage('');
  };

  /**
   * @description Aggiorna lo stato della password e, se presente, cancella il messaggio di errore a schermo.
   * @param {string} text - Il testo digitato dall'utente.
   * @returns {void}
   */
  const onChangePassword = (text: string): void => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  };

  return {
    email,
    password,
    errorMessage,
    onChangeEmail,
    onChangePassword,
    handleLogin,
  };
}
