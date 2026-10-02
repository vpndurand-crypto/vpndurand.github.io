import type { ContractPage } from './types';

/** Extraits rédigés des documents fictifs. L'identifiant d'un bloc est celui de la clause citée. */
const SFA = 'Senior Facility Agreement — Démo Industrie SAS';

export const contractPages: ContractPage[] = [
  { document_id: 'doc-01', page: 1, running_header: SFA, blocks: [
    { id: 'cover-title', kind: 'title', text: 'Senior Facility Agreement' },
    { id: 'cover-parties', kind: 'paragraph', text: 'entre Démo Industrie SAS, en qualité d’Emprunteur, et Banque Exemple, en qualité de Prêteur.' },
    { id: 'cover-amount', kind: 'paragraph', text: 'Crédit à terme d’un montant en principal de 10 000 000 €.' },
    { id: 'cover-date', kind: 'paragraph', text: 'Signé à Paris le 15 décembre 2025.' },
  ] },
  { document_id: 'doc-01', page: 9, running_header: SFA, blocks: [
    { id: 'art-2-title', kind: 'heading', text: 'Article 2 — Le Crédit' },
    { id: 'art-2-1', kind: 'paragraph', text: '2.1 Sous réserve des stipulations du présent Contrat, le Prêteur met à la disposition de l’Emprunteur un crédit à terme d’un montant maximal en principal de 10 000 000 € (le « Crédit »).' },
    { id: 'art-2-2', kind: 'paragraph', text: '2.2 Le Crédit est destiné au refinancement de l’endettement existant de l’Emprunteur et au financement de ses besoins généraux.' },
  ] },
  { document_id: 'doc-01', page: 12, running_header: SFA, blocks: [
    { id: 'art-1-1-title', kind: 'heading', text: 'Article 1.1 — Définitions (suite)' },
    { id: 'def-endettement-financier-net', kind: 'paragraph', text: '« Endettement Financier Net » désigne, à toute Date de Test, l’encours en principal du Crédit, diminué de la Trésorerie de l’Emprunteur.' },
    { id: 'def-tresorerie', kind: 'paragraph', text: '« Trésorerie » désigne les disponibilités et valeurs mobilières de placement figurant dans les comptes de l’Emprunteur.' },
  ] },
  { document_id: 'doc-01', page: 13, running_header: SFA, blocks: [
    { id: 'def-ebitda', kind: 'paragraph', text: '« EBITDA » désigne, pour toute Période de Référence, l’excédent brut d’exploitation de l’Emprunteur, augmenté des Coûts Non Récurrents dûment justifiés, sans plafond.' },
    { id: 'def-periode-reference', kind: 'paragraph', text: '« Période de Référence » désigne chaque période de douze mois se terminant à une Date de Test.' },
  ] },
  { document_id: 'doc-01', page: 18, running_header: SFA, blocks: [
    { id: 'art-7-title', kind: 'heading', text: 'Article 7 — Remboursement' },
    { id: 'art-7-1', kind: 'paragraph', text: '7.1 L’Emprunteur remboursera le Crédit en une seule fois, à la Date d’Échéance Finale fixée au 31 décembre 2029.' },
  ] },
  { document_id: 'doc-01', page: 21, running_header: SFA, blocks: [
    { id: 'art-9-title', kind: 'heading', text: 'Article 9 — Intérêts' },
    { id: 'art-9-1', kind: 'paragraph', text: '9.1 Le Crédit porte intérêt au taux Euribor 3 mois, augmenté d’une marge de 2,50 % l’an, payable trimestriellement à terme échu.' },
  ] },
  { document_id: 'doc-01', page: 47, running_header: SFA, blocks: [
    { id: 'art-19-title', kind: 'heading', text: 'Article 19 — Engagements financiers' },
    { id: 'art-19-1', kind: 'paragraph', text: '19.1 Dates de Test. Les engagements du présent article sont testés au 31 mars, 30 juin, 30 septembre et 31 décembre de chaque année, la première Date de Test étant le 31 mars 2026.' },
    { id: 'art-19-2', kind: 'paragraph', text: '19.2 Ratio de Levier. Le rapport Endettement Financier Net / EBITDA ne devra pas excéder 3,50x à chaque Date de Test jusqu’au 30 juin 2027 inclus, puis 3,25x à compter du 1er juillet 2027.' },
    { id: 'art-19-3', kind: 'paragraph', text: '19.3 Ratio de Gearing. Le rapport Endettement Financier Net / Fonds Propres ne devra pas excéder 1,00x à chaque Date de Test.' },
  ] },
  { document_id: 'doc-01', page: 48, running_header: SFA, blocks: [
    { id: 'art-19-4', kind: 'paragraph', text: '19.4 Couverture des intérêts. Le rapport EBITDA / Charges d’Intérêts ne devra pas être inférieur à 4,00x à chaque Date de Test.' },
    { id: 'art-19-5', kind: 'paragraph', text: '19.5 L’Emprunteur remettra au Prêteur, dans les quarante-cinq jours suivant chaque Date de Test, un certificat de conformité signé.' },
  ] },
  { document_id: 'doc-02', page: 1, running_header: 'Banque Exemple — Tableau d’amortissement', blocks: [
    { id: 'title', kind: 'title', text: 'Tableau d’amortissement — Crédit SFA-2025-001' },
    { id: 'crd-2026-09-30', kind: 'paragraph', text: 'Capital restant dû au 30 septembre 2026 : 10 000 000,00 €. Remboursement in fine le 31 décembre 2029.' },
  ] },
  { document_id: 'doc-03', page: 1, running_header: 'Démo Industrie SAS — Direction financière', blocks: [
    { id: 'title', kind: 'title', text: 'Note — Coûts non récurrents du troisième trimestre 2026' },
    { id: 'ncr-detail', kind: 'paragraph', text: 'Réorganisation de l’atelier de production : honoraires de conseil et indemnités, pour un total de 150 000 € comptabilisé en charges externes et de personnel.' },
  ] },
  { document_id: 'doc-04', page: 1, running_header: 'Banque Aurore — Contrat de prêt', blocks: [
    { id: 'title', kind: 'title', text: 'Contrat de prêt moyen terme — Démo Logistique SAS' },
    { id: 'terms', kind: 'paragraph', text: 'Prêt de 3 000 000 € au taux fixe de 3,20 %, amortissable trimestriellement par échéances de 125 000 € de capital, jusqu’au 31 décembre 2030.' },
  ] },
  { document_id: 'doc-05', page: 1, running_header: 'Finance Bail Exemple — Crédit-bail', blocks: [
    { id: 'title', kind: 'title', text: 'Contrat de crédit-bail immobilier — plateforme logistique' },
    { id: 'terms', kind: 'paragraph', text: 'Financement de 1 800 000 € sur dix ans à compter du 31 mars 2021, loyers selon l’échéancier du bailleur.' },
  ] },
  { document_id: 'doc-06', page: 1, running_header: 'Banque Méridienne — Crédit renouvelable', blocks: [
    { id: 'title', kind: 'title', text: 'Convention de crédit renouvelable — Démo Services SAS' },
    { id: 'terms', kind: 'paragraph', text: 'Ouverture de crédit d’un plafond de 2 000 000 €, tirages au taux Euribor 1 mois augmenté de 1,50 %, échéance le 30 juin 2027.' },
  ] },
  { document_id: 'doc-07', page: 1, running_header: 'Banque Méridienne — Relevé', blocks: [
    { id: 'title', kind: 'title', text: 'Relevé de compte au 30 septembre 2026' },
    { id: 'drawn', kind: 'paragraph', text: 'Tirage en cours sur le crédit renouvelable RCF-2024-009 : 500 000,00 €.' },
  ] },
];
