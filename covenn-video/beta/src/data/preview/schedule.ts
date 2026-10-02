import type { ScheduleEvent, ScheduleGap } from '../types';

/** Aperçu (niveau C) : échéancier des douze prochains mois, saisi à la main pour la démonstration. */
export const scheduleEvents: ScheduleEvent[] = [
  { id: 'sch-01', event_date: '2026-12-31', kind: 'COVENANT_TEST', label: 'Test trimestriel des covenants', entity_id: 'ent-di', financing_id: 'fin-01', covenant_ids: ['cov-lev', 'cov-gea', 'cov-icr'], principal: null, interest: null, total: null },
  { id: 'sch-02', event_date: '2026-12-31', kind: 'INSTALLMENT', label: 'Échéance du prêt moyen terme équipement', entity_id: 'ent-dl', financing_id: 'fin-02', covenant_ids: [], principal: '125000.00', interest: '17000.00', total: '142000.00' },
  { id: 'sch-03', event_date: '2027-03-31', kind: 'COVENANT_TEST', label: 'Test trimestriel des covenants', entity_id: 'ent-di', financing_id: 'fin-01', covenant_ids: ['cov-lev', 'cov-gea', 'cov-icr'], principal: null, interest: null, total: null },
  { id: 'sch-04', event_date: '2027-03-31', kind: 'INSTALLMENT', label: 'Échéance du prêt moyen terme équipement', entity_id: 'ent-dl', financing_id: 'fin-02', covenant_ids: [], principal: '125000.00', interest: '16000.00', total: '141000.00' },
  { id: 'sch-05', event_date: '2027-06-30', kind: 'COVENANT_TEST', label: 'Test trimestriel des covenants', entity_id: 'ent-di', financing_id: 'fin-01', covenant_ids: ['cov-lev', 'cov-gea', 'cov-icr'], principal: null, interest: null, total: null },
  { id: 'sch-06', event_date: '2027-06-30', kind: 'INSTALLMENT', label: 'Échéance du prêt moyen terme équipement', entity_id: 'ent-dl', financing_id: 'fin-02', covenant_ids: [], principal: '125000.00', interest: '15000.00', total: '140000.00' },
  { id: 'sch-07', event_date: '2027-06-30', kind: 'MATURITY', label: 'Maturité du crédit renouvelable', entity_id: 'ent-ds', financing_id: 'fin-04', covenant_ids: [], principal: null, interest: null, total: null },
  { id: 'sch-08', event_date: '2027-07-01', kind: 'THRESHOLD_STEP', label: 'Seuil du Leverage abaissé à 3,25x', entity_id: 'ent-di', financing_id: 'fin-01', covenant_ids: ['cov-lev'], principal: null, interest: null, total: null },
  { id: 'sch-09', event_date: '2027-09-30', kind: 'COVENANT_TEST', label: 'Test trimestriel des covenants', entity_id: 'ent-di', financing_id: 'fin-01', covenant_ids: ['cov-lev', 'cov-gea', 'cov-icr'], principal: null, interest: null, total: null },
  { id: 'sch-10', event_date: '2027-09-30', kind: 'INSTALLMENT', label: 'Échéance du prêt moyen terme équipement', entity_id: 'ent-dl', financing_id: 'fin-02', covenant_ids: [], principal: '125000.00', interest: '14000.00', total: '139000.00' },
];

/** Financements sans échéancier détaillé dans la démonstration (affichés comme tels, jamais inventés). */
export const scheduleGaps: ScheduleGap[] = [
  { financing_id: 'fin-01', note: 'Remboursement in fine le 31/12/2029 ; intérêts trimestriels non détaillés dans la démonstration.' },
  { financing_id: 'fin-03', note: 'Loyers selon l’échéancier du bailleur, non repris dans la démonstration.' },
  { financing_id: 'fin-04', note: 'Tirages et remboursements à l’initiative de l’emprunteur.' },
];
