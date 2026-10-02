import type { Financing } from './types';

const recorded = (id: string, documentId: string, minute: string) => ({
  type: 'MANUAL_ENTRY' as const, userId: 'usr-cl', recordedAt: `2026-01-05T09:${minute}:00`,
  justification: 'Conditions reprises du contrat signé', documentId, object: { kind: 'FINANCING' as const, id },
});

export const financings: Financing[] = [
  {
    id: 'fin-01', label: 'Senior Facility Agreement', external_reference: 'SFA-2025-001', entity_id: 'ent-di', lender_id: 'lnd-exe',
    category: 'BANK_MLT', initial_amount: '10000000.00', authorized_limit: null,
    signature_date: '2025-12-15', availability_date: '2025-12-31', maturity_date: '2029-12-31',
    rate_type: 'FLOATING', fixed_rate: null, floating_index: 'Euribor 3 mois', margin: '0.0250',
    amortization_profile: 'In fine', status: 'ACTIVE', document_ids: ['doc-01', 'doc-02', 'doc-03'], provenance: recorded('fin-01', 'doc-01', '20'),
  },
  {
    id: 'fin-02', label: 'Prêt moyen terme équipement', external_reference: 'PMT-2024-117', entity_id: 'ent-dl', lender_id: 'lnd-aur',
    category: 'BANK_MLT', initial_amount: '3000000.00', authorized_limit: null,
    signature_date: '2024-12-10', availability_date: '2024-12-31', maturity_date: '2030-12-31',
    rate_type: 'FIXED', fixed_rate: '0.0320', floating_index: null, margin: null,
    amortization_profile: 'Trimestriel, 125 000 € de capital', status: 'ACTIVE', document_ids: ['doc-04'], provenance: recorded('fin-02', 'doc-04', '21'),
  },
  {
    id: 'fin-03', label: 'Crédit-bail plateforme logistique', external_reference: 'CB-2021-044', entity_id: 'ent-dl', lender_id: 'lnd-fbe',
    category: 'LEASE', initial_amount: '1800000.00', authorized_limit: null,
    signature_date: '2021-03-15', availability_date: '2021-03-31', maturity_date: '2031-03-31',
    rate_type: 'FIXED', fixed_rate: '0.0240', floating_index: null, margin: null,
    amortization_profile: 'Selon échéancier du bailleur', status: 'ACTIVE', document_ids: ['doc-05'], provenance: recorded('fin-03', 'doc-05', '22'),
  },
  {
    id: 'fin-04', label: 'Crédit renouvelable', external_reference: 'RCF-2024-009', entity_id: 'ent-ds', lender_id: 'lnd-mer',
    category: 'REVOLVING_CT', initial_amount: null, authorized_limit: '2000000.00',
    signature_date: '2024-06-20', availability_date: '2024-06-30', maturity_date: '2027-06-30',
    rate_type: 'FLOATING', fixed_rate: null, floating_index: 'Euribor 1 mois', margin: '0.0150',
    amortization_profile: 'Tirages', status: 'ACTIVE', document_ids: ['doc-06', 'doc-07'], provenance: recorded('fin-04', 'doc-06', '23'),
  },
];
