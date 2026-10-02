import type { AiProposal } from '../types';

/** Aperçu : ce que l'extraction assistée a proposé sur le contrat SFA et ce que l'utilisatrice a validé. Aucun appel à une IA. */
export const aiProposals: AiProposal[] = [
  { id: 'aip-01', document_id: 'doc-01', field_label: 'Montant du crédit', proposed_value: '10 000 000 €', final_value: '10 000 000 €', page: 9, clause_id: 'art-2-1', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-02', document_id: 'doc-01', field_label: 'Date de signature', proposed_value: '15/12/2025', final_value: '15/12/2025', page: 1, clause_id: null, confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-03', document_id: 'doc-01', field_label: 'Date d’échéance finale', proposed_value: '31/12/2029', final_value: '31/12/2029', page: 18, clause_id: 'art-7-1', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-04', document_id: 'doc-01', field_label: 'Profil d’amortissement', proposed_value: 'In fine', final_value: 'In fine', page: 18, clause_id: 'art-7-1', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-05', document_id: 'doc-01', field_label: 'Taux d’intérêt', proposed_value: 'Euribor 3 mois + 2,25 %', final_value: 'Euribor 3 mois + 2,50 %', page: 21, clause_id: 'art-9-1', confidence: 'MEDIUM', status: 'CORRECTED' },
  { id: 'aip-06', document_id: 'doc-01', field_label: 'Dates de test', proposed_value: 'Trimestrielles, à partir du 31/03/2026', final_value: 'Trimestrielles, à partir du 31/03/2026', page: 47, clause_id: 'art-19-1', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-07', document_id: 'doc-01', field_label: 'Seuil du ratio de levier', proposed_value: '≤ 3,50x', final_value: '≤ 3,50x jusqu’au 30/06/2027', page: 47, clause_id: 'art-19-2', confidence: 'MEDIUM', status: 'CORRECTED' },
  { id: 'aip-08', document_id: 'doc-01', field_label: 'Marche de seuil du ratio de levier', proposed_value: '≤ 3,25x à compter du 01/07/2027', final_value: '≤ 3,25x à compter du 01/07/2027', page: 47, clause_id: 'art-19-2', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-09', document_id: 'doc-01', field_label: 'Définition de l’endettement financier net', proposed_value: 'Encours du Crédit − Trésorerie', final_value: 'Encours du Crédit − Trésorerie', page: 12, clause_id: 'def-endettement-financier-net', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-10', document_id: 'doc-01', field_label: 'Définition de la trésorerie', proposed_value: 'Disponibilités + valeurs mobilières de placement', final_value: 'Disponibilités + valeurs mobilières de placement', page: 12, clause_id: 'def-tresorerie', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-11', document_id: 'doc-01', field_label: 'Définition de l’EBITDA', proposed_value: 'EBE sur 12 mois + coûts non récurrents justifiés', final_value: 'EBE sur 12 mois + coûts non récurrents justifiés', page: 13, clause_id: 'def-ebitda', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-12', document_id: 'doc-01', field_label: 'Plafond des retraitements', proposed_value: 'Sans plafond', final_value: 'Sans plafond', page: 13, clause_id: 'def-ebitda', confidence: 'MEDIUM', status: 'VALIDATED' },
  { id: 'aip-13', document_id: 'doc-01', field_label: 'Période de référence', proposed_value: '12 mois glissants', final_value: '12 mois glissants', page: 13, clause_id: 'def-periode-reference', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-14', document_id: 'doc-01', field_label: 'Seuil du ratio de gearing', proposed_value: '≤ 1,00x', final_value: '≤ 1,00x', page: 47, clause_id: 'art-19-3', confidence: 'HIGH', status: 'VALIDATED' },
  { id: 'aip-15', document_id: 'doc-01', field_label: 'Seuil de couverture des intérêts', proposed_value: '≥ 4,00x', final_value: '≥ 4,00x', page: 48, clause_id: 'art-19-4', confidence: 'HIGH', status: 'VALIDATED' },
];
