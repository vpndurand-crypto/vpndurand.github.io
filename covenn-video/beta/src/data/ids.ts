/** Identifiants stables du jeu de démonstration, utilisés par les tests et le scénario console. */
export const IDS = {
  organization: 'org-demo',
  users: { camille: 'usr-cl', julien: 'usr-jm' },
  entities: { industrie: 'ent-di', logistique: 'ent-dl', services: 'ent-ds' },
  financings: { sfa: 'fin-01', pmt: 'fin-02', creditBail: 'fin-03', rcf: 'fin-04' },
  covenants: { leverage: 'cov-lev', gearing: 'cov-gea', icr: 'cov-icr' },
  documents: { sfa: 'doc-01', amortization: 'doc-02', nonRecurring: 'doc-03' },
  balances: { di20260930: 'tb-di-2026-09-30', di20260930v2: 'tb-di-2026-09-30-v2' },
} as const;
