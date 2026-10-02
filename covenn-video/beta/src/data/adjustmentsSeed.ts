import type { CovenantAdjustment } from './types';

const LABEL = 'Coûts non récurrents — réorganisation de l’atelier de production, T3 2026';
const JUSTIFICATION = 'Réorganisation de l’atelier de production au troisième trimestre 2026 : honoraires de conseil et indemnités (note jointe).';

export const adjustmentsSeed: CovenantAdjustment[] = [
  { id: 'adj-01', test_key: 'cov-lev@2026-09-30', category_id: 'ac-lev-nr', label: LABEL, amount: '150000.00', justification: JUSTIFICATION, document_id: 'doc-03', created_by: 'usr-cl', created_at: '2026-10-19T14:10:00' },
  { id: 'adj-02', test_key: 'cov-icr@2026-09-30', category_id: 'ac-icr-nr', label: LABEL, amount: '150000.00', justification: JUSTIFICATION, document_id: 'doc-03', created_by: 'usr-cl', created_at: '2026-10-19T14:11:00' },
];
