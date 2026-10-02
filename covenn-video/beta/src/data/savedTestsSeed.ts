import type { SavedTestSeed } from './types';

/** Calculs déjà enregistrés aux deux dates de test passées ; leurs instantanés sont calculés par le moteur (seed.ts). */
export const savedTestsSeed: SavedTestSeed[] = [
  { key: 'cov-lev@2026-03-31', occurrence: 1, covenant_id: 'cov-lev', test_date: '2026-03-31', closed_by: 'usr-cl', closed_at: '2026-04-17T10:12:00' },
  { key: 'cov-gea@2026-03-31', occurrence: 1, covenant_id: 'cov-gea', test_date: '2026-03-31', closed_by: 'usr-cl', closed_at: '2026-04-17T10:12:00' },
  { key: 'cov-icr@2026-03-31', occurrence: 1, covenant_id: 'cov-icr', test_date: '2026-03-31', closed_by: 'usr-cl', closed_at: '2026-04-17T10:12:00' },
  { key: 'cov-lev@2026-06-30', occurrence: 1, covenant_id: 'cov-lev', test_date: '2026-06-30', closed_by: 'usr-cl', closed_at: '2026-07-17T09:45:00' },
  { key: 'cov-gea@2026-06-30', occurrence: 1, covenant_id: 'cov-gea', test_date: '2026-06-30', closed_by: 'usr-cl', closed_at: '2026-07-17T09:45:00' },
  { key: 'cov-icr@2026-06-30', occurrence: 1, covenant_id: 'cov-icr', test_date: '2026-06-30', closed_by: 'usr-cl', closed_at: '2026-07-17T09:45:00' },
];
