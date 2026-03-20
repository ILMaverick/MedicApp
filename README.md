# MedicApp ⚕️ 

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)](https://expo.dev/)

**MedicApp** è un'applicazione mobile innovativa progettata per assistere i professionisti sanitari durante le visite mediche. Sfrutta l'Intelligenza Artificiale (Small Language Models e Modelli Acustici) in esecuzione **esclusivamente in locale** sul dispositivo per trascrivere l'audio in tempo reale ed estrarre note cliniche strutturate, garantendo la totale privacy e sicurezza dei dati del paziente.

---

## ✨ Funzionalità Principali

* 🎙️ **Trascrizione Vocale Real-Time**: Integrazione nativa con Whisper.cpp per trascrizioni precise e veloci, completamente offline.
* 🧠 **Analisi Clinica IA Locale**: Estrazione automatica di note cliniche strutturate e dati del paziente tramite modelli Llama/Qwen (SLM) eseguiti on-device.
* 🛑 **Voice Activity Detection (VAD)**: Rilevamento automatico del silenzio per interrompere la registrazione o creare "slice" audio intelligenti.
* 🔒 **Privacy By Design**: Nessun dato vocale o testuale viene inviato a server cloud. Tutto viene elaborato nella RAM del dispositivo.
* ⚙️ **Motore Flessibile**: Scelta dinamica dei modelli IA dalle impostazioni (Whisper *tiny/base/small*, Qwen *0.5B/1.5B*) per bilanciare prestazioni e consumo di memoria.
* 📂 **Gestione Storico**: Salvataggio delle trascrizioni, consultazione dello storico paziente, condivisione delle cartelle cliniche in formato JSON e cancellazione sicura.

## 🛠️ Tecnologie Utilizzate

* **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
* **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS per React Native)
* **Navigazione**: [React Navigation](https://reactnavigation.org/)
* **Motori IA Nativi**: 
    * [`whisper.rn`]([https://github.com/mybigday/whisper.rn](https://github.com/mybigday/whisper.rn)) (Binding React Native per Whisper.cpp)
    * [`llama.rn`]([https://github.com/mybigday/llama.rn](https://github.com/mybigday/llama.rn)) (Binding React Native per Llama.cpp)

---

## 🚀 Installazione e Configurazione

Poiché MedicApp utilizza moduli nativi complessi (C++) per l'esecuzione dell'IA, non può essere eseguita tramite la semplice app "Expo Go". È necessario compilare un client di sviluppo o un file APK/IPA.

### 1. Prerequisiti
* [Node.js](https://nodejs.org/) (versione 18 o superiore)
* [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)
* Un account Expo (gratuito su expo.dev)

### 2. Clonare il repository e installare le dipendenze

```bash
git clone https://github.com/ILMaverick/MedicApp.git
cd MedicApp
npm install
```

### 3. Compilare l'applicazione (Esempio per Android)
Per generare un file `.apk` installabile direttamente sul tuo dispositivo Android:

```bash
eas build -p android --profile preview
```

*Al termine della compilazione, inquadra il QR Code fornito dal terminale o clicca sul link per scaricare e installare l'APK.*

---

## 📱 Modalità d'Uso

### Autenticazione (Ambiente di Test)
L'app include un database mock per testarne le funzionalità. Usa una di queste credenziali per accedere:
* **Email1**: `mario.rossi@clinica.it`
  * **Password**: `Password1!`

* **Email2**: `giulia.bianchi@clinica.it`
  * **Password**: `Password2!`

### Flusso di Lavoro Principale
1. **Inizia la Visita**: Dalla Home, premi il grande tasto blu **"Registra Nota"**. L'app chiederà i permessi del microfono al primo avvio.
2. **Dettatura**: Parla naturalmente descrivendo i sintomi del paziente. Il motore Whisper trascriverà il testo in tempo reale sullo schermo.
3. **Analisi Automatica**: Smetti di parlare per attivare lo stop automatico (VAD) oppure premi "Analizza". L'SLM locale prenderà il testo grezzo e lo formatterà in una nota clinica professionale, separando i dati anagrafici dal referto.
4. **Gestione Note**: Vai nell'area **Profilo** (icona 👤) per visualizzare lo storico delle note. Da qui puoi eliminare le note obsolete o condividerle tramite le API native del telefono in formato JSON strutturato.
5. **Personalizzazione**: Accedi alle **Impostazioni** (icona ⚙️ nel Profilo) per scaricare modelli IA più o meno pesanti o per regolare la durata del timeout di fine registrazione.

---

## 📁 Struttura del Progetto

Il codice è organizzato seguendo il pattern architetturale MVC (Model-View-Controller) adattato per React:

* `/components/view`: Le interfacce grafiche dell'app (Schermate e componenti UI).
* `/components/controllers`: Hook di controllo che gestiscono la logica di business e connettono la UI ai servizi.
* `/components/hooks`: Hook specifici per il ciclo di vita dell'IA (es. `useVoiceTranscription`, `useLlamaInference`).
* `/components/services`: Comunicazione a basso livello con i binding C++ (Llama e Whisper).
* `/components/context`: Provider globali (Autenticazione, Storico Note, Impostazioni utente).

---

## 📄 Licenza (Open Source)

Questo progetto è distribuito sotto licenza **MIT**.

```text
MIT License

Copyright (c) 2026 Matteo Pallotti

Il permesso è concesso gratuitamente a chiunque ottenga una copia di questo software e dei file di documentazione associati (il "Software"), di trattare il Software senza restrizioni, compresi, senza limitazioni, i diritti di usare, copiare, modificare, unire, pubblicare, distribuire, concedere in sublicenza e/o vendere copie del Software, e di consentire alle persone a cui il Software è fornito di farlo, alle seguenti condizioni:

L'avviso di copyright di cui sopra e questo avviso di autorizzazione devono essere inclusi in tutte le copie o parti sostanziali del Software.

IL SOFTWARE È FORNITO "COSÌ COM'È", SENZA GARANZIE DI ALCUN TIPO, ESPRESSE O IMPLICITE, COMPRESE, MA NON SOLO, LE GARANZIE DI COMMERCIABILITÀ, IDONEITÀ PER UNO SCOPO PARTICOLARE E NON VIOLAZIONE. IN NESSUN CASO GLI AUTORI O I TITOLARI DEL COPYRIGHT SARANNO RESPONSABILI PER QUALSIASI RECLAMO, DANNO O ALTRA RESPONSABILITÀ, SIA IN UN'AZIONE DI CONTRATTO, TORTO O ALTRO, DERIVANTE DA, FUORI O IN CONNESSIONE CON IL SOFTWARE O L'USO O ALTRI RAPPORTI NEL SOFTWARE.
```
