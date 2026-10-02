// Données littérales figées à partir de la matrice du plan technique (section 7.6). Ne pas modifier sans mettre à jour le plan.
import type { ImportJob } from './types';

export const importJobs: ImportJob[] = [
  { id: 'imp-di-2025-03-31', entity_id: 'ent-di', balance_id: 'tb-di-2025-03-31', file_name: 'Balance_DemoIndustrie_2025-03-31.xlsx', period_end: '2025-03-31', row_count: 36, created_by: 'usr-jm', created_at: '2026-01-06T09:30:00', status: 'COMPLETED' },
  { id: 'imp-di-2025-06-30', entity_id: 'ent-di', balance_id: 'tb-di-2025-06-30', file_name: 'Balance_DemoIndustrie_2025-06-30.xlsx', period_end: '2025-06-30', row_count: 36, created_by: 'usr-jm', created_at: '2026-01-06T09:31:00', status: 'COMPLETED' },
  { id: 'imp-di-2025-09-30', entity_id: 'ent-di', balance_id: 'tb-di-2025-09-30', file_name: 'Balance_DemoIndustrie_2025-09-30.xlsx', period_end: '2025-09-30', row_count: 36, created_by: 'usr-jm', created_at: '2026-01-06T09:32:00', status: 'COMPLETED' },
  { id: 'imp-di-2025-12-31', entity_id: 'ent-di', balance_id: 'tb-di-2025-12-31', file_name: 'Balance_DemoIndustrie_2025-12-31.xlsx', period_end: '2025-12-31', row_count: 36, created_by: 'usr-jm', created_at: '2026-02-12T16:20:00', status: 'COMPLETED' },
  { id: 'imp-di-2026-03-31', entity_id: 'ent-di', balance_id: 'tb-di-2026-03-31', file_name: 'Balance_DemoIndustrie_2026-03-31.xlsx', period_end: '2026-03-31', row_count: 36, created_by: 'usr-jm', created_at: '2026-04-15T11:05:00', status: 'COMPLETED' },
  { id: 'imp-di-2026-06-30', entity_id: 'ent-di', balance_id: 'tb-di-2026-06-30', file_name: 'Balance_DemoIndustrie_2026-06-30.xlsx', period_end: '2026-06-30', row_count: 36, created_by: 'usr-jm', created_at: '2026-07-16T15:40:00', status: 'COMPLETED' },
  { id: 'imp-di-2026-09-30', entity_id: 'ent-di', balance_id: 'tb-di-2026-09-30', file_name: 'Balance_DemoIndustrie_2026-09-30.xlsx', period_end: '2026-09-30', row_count: 36, created_by: 'usr-jm', created_at: '2026-10-16T09:12:00', status: 'COMPLETED' },
  { id: 'imp-dl-2026-09-30', entity_id: 'ent-dl', balance_id: 'tb-dl-2026-09-30', file_name: 'Balance_DemoLogistique_2026-09-30.xlsx', period_end: '2026-09-30', row_count: 17, created_by: 'usr-jm', created_at: '2026-10-16T09:14:00', status: 'COMPLETED' },
  { id: 'imp-ds-2026-09-30', entity_id: 'ent-ds', balance_id: 'tb-ds-2026-09-30', file_name: 'Balance_DemoServices_2026-09-30.xlsx', period_end: '2026-09-30', row_count: 14, created_by: 'usr-jm', created_at: '2026-10-16T09:16:00', status: 'COMPLETED' },
];

/** Import du scénario « réimport » : horodaté au moment de l'action dans la démonstration. */
export const reimportImportJobV2: ImportJob = { id: 'imp-di-2026-09-30-v2', entity_id: 'ent-di', balance_id: 'tb-di-2026-09-30-v2', file_name: 'Balance_DemoIndustrie_2026-09-30_v2.xlsx', period_end: '2026-09-30', row_count: 36, created_by: 'usr-cl', created_at: '2026-10-20T00:00:00', status: 'COMPLETED' };
