import type { OutstandingDeclaration } from './types';

/** Encours déclarés. Un document n'est cité que s'il justifie le montant à la date (correction d'audit C-05). */
export const outstanding: OutstandingDeclaration[] = [
  { id: 'od-01', financing_id: 'fin-01', as_of_date: '2026-03-31', amount: '10000000.00', comment: 'Tableau d’amortissement du prêteur', document_id: null, created_by: 'usr-cl', created_at: '2026-04-10T09:15:00' },
  { id: 'od-02', financing_id: 'fin-01', as_of_date: '2026-06-30', amount: '10000000.00', comment: 'Tableau d’amortissement du prêteur', document_id: null, created_by: 'usr-cl', created_at: '2026-07-10T09:05:00' },
  { id: 'od-03', financing_id: 'fin-01', as_of_date: '2026-09-30', amount: '10000000.00', comment: 'Tableau d’amortissement du prêteur au 30/09/2026', document_id: 'doc-02', created_by: 'usr-cl', created_at: '2026-10-14T10:05:00' },
  { id: 'od-04', financing_id: 'fin-02', as_of_date: '2026-06-30', amount: '2250000.00', comment: 'Échéancier du prêteur, capital restant dû', document_id: null, created_by: 'usr-cl', created_at: '2026-07-10T09:08:00' },
  { id: 'od-05', financing_id: 'fin-02', as_of_date: '2026-09-30', amount: '2125000.00', comment: 'Échéancier du prêteur, capital restant dû', document_id: null, created_by: 'usr-cl', created_at: '2026-10-14T10:07:00' },
  { id: 'od-06', financing_id: 'fin-03', as_of_date: '2026-09-30', amount: '1375000.00', comment: 'Échéancier du bailleur', document_id: null, created_by: 'usr-cl', created_at: '2026-10-14T10:09:00' },
  { id: 'od-07', financing_id: 'fin-04', as_of_date: '2026-09-30', amount: '500000.00', comment: 'Relevé bancaire au 30/09/2026', document_id: 'doc-07', created_by: 'usr-cl', created_at: '2026-10-14T10:11:00' },
];
