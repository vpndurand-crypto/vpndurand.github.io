import type { AlertItem } from '../types';

export const alerts: AlertItem[] = [
  { id: 'alr-01', alert_type: 'COVENANT_STATUS', severity: 'WATCH', title: 'Leverage en vigilance au 30/09/2026', message: 'La marge sous le seuil contractuel est inférieure à 15 % : à surveiller avant le test du 31/12/2026.', due_date: '2026-12-31', entity_id: 'ent-di', target: { kind: 'COVENANT', id: 'cov-lev' }, created_at: '2026-10-20T09:00:00' },
  { id: 'alr-02', alert_type: 'THRESHOLD_STEP', severity: 'INFO', title: 'Seuil du Leverage abaissé à 3,25x le 01/07/2027', message: 'La marche contractuelle réduit la marge disponible : à intégrer dès maintenant aux prévisions.', due_date: '2027-07-01', entity_id: 'ent-di', target: { kind: 'COVENANT', id: 'cov-lev' }, created_at: '2026-10-20T09:00:00' },
  { id: 'alr-03', alert_type: 'MATURITY', severity: 'INFO', title: 'Maturité du crédit renouvelable le 30/06/2027', message: 'Anticiper le renouvellement de la ligne avec Banque Méridienne.', due_date: '2027-06-30', entity_id: 'ent-ds', target: { kind: 'FINANCING', id: 'fin-04' }, created_at: '2026-10-20T09:00:00' },
];
