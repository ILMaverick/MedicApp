export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  history: HistoryRecord[];
}

export interface HistoryRecord {
  id: string;
  date: string;
  hour: string;
  transcription: string;
  aiResponse: {
    note: string;
    patient: {
      name: string;
      surname: string;
    };
  };
}

export const MOCK_USERS = [
  {
    id: '1',
    email: 'mario.rossi@clinica.it',
    password: 'Password1!',
    name: 'Mario',
    surname: 'Rossi',
    role: 'Medico di Base',
    history: [
      {
        id: 'rec_1',
        date: '25/02/2026',
        hour: '14:30:35',
        transcription:
          'Il paziente Luigi Verdi presenta forte emicrania da tre giorni. Prescritto paracetamolo.',
        aiResponse: {
          note: 'Il paziente presenta forte emicrania da tre giorni. Prescritto paracetamolo.',
          patient: { name: 'Luigi', surname: 'Verdi' },
        },
      },
    ],
  },
  {
    id: '2',
    email: 'giulia.bianchi@clinica.it',
    password: 'Password2!',
    name: 'Giulia',
    surname: 'Bianchi',
    role: 'Cardiologa',
    history: [
      {
        id: 'rec_1',
        date: '21/12/2025',
        hour: '17:21:57',
        transcription: 'La paziente Mara Gialli presenta una forte aritmia ventricolare',
        aiResponse: {
          note: 'La paziente presenta una forte aritmia ventricolare',
          patient: { name: 'Mara', surname: 'Gialli' },
        },
      },
    ],
  },
];
