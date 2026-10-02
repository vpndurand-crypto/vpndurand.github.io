import type { ClauseRef, Covenant, CovenantDefinition } from './types';

const clause = (page: number, clause_id: string, article: string, excerpt: string): ClauseRef => ({ document_id: 'doc-01', page, clause_id, article, excerpt });

export const CLAUSES = {
  endettementNet: clause(12, 'def-endettement-financier-net', '1.1', '« Endettement Financier Net » : l’encours en principal du Crédit, diminué de la Trésorerie de l’Emprunteur.'),
  tresorerie: clause(12, 'def-tresorerie', '1.1', '« Trésorerie » : les disponibilités et valeurs mobilières de placement figurant dans les comptes de l’Emprunteur.'),
  ebitda: clause(13, 'def-ebitda', '1.1', '« EBITDA » : l’excédent brut d’exploitation de la Période de Référence, augmenté des Coûts Non Récurrents dûment justifiés, sans plafond.'),
  periodeReference: clause(13, 'def-periode-reference', '1.1', '« Période de Référence » : chaque période de douze mois se terminant à une Date de Test.'),
  datesTest: clause(47, 'art-19-1', '19.1', 'Tests au 31 mars, 30 juin, 30 septembre et 31 décembre, la première Date de Test étant le 31 mars 2026.'),
  leverage: clause(47, 'art-19-2', '19.2', 'Endettement Financier Net / EBITDA ne devra pas excéder 3,50x jusqu’au 30 juin 2027 inclus, puis 3,25x à compter du 1er juillet 2027.'),
  gearing: clause(47, 'art-19-3', '19.3', 'Endettement Financier Net / Fonds Propres ne devra pas excéder 1,00x à chaque Date de Test.'),
  icr: clause(48, 'art-19-4', '19.4', 'EBITDA / Charges d’Intérêts ne devra pas être inférieur à 4,00x à chaque Date de Test.'),
} as const;

export const covenants: Covenant[] = [
  { id: 'cov-lev', label: 'Leverage — Endettement financier net / EBITDA', short_label: 'Leverage', covenant_type: 'LEVERAGE', form: 'RATIO', entity_id: 'ent-di', financing_ids: ['fin-01'], source_document_id: 'doc-01', source_note: 'Article 19.2, page 47', status: 'ACTIVE' },
  { id: 'cov-gea', label: 'Gearing — Endettement financier net / Fonds propres', short_label: 'Gearing', covenant_type: 'CUSTOM', form: 'RATIO', entity_id: 'ent-di', financing_ids: ['fin-01'], source_document_id: 'doc-01', source_note: 'Article 19.3, page 47', status: 'ACTIVE' },
  { id: 'cov-icr', label: 'Couverture des intérêts — EBITDA / Charges d’intérêts', short_label: 'Couverture des intérêts', covenant_type: 'CUSTOM', form: 'RATIO', entity_id: 'ent-di', financing_ids: ['fin-01'], source_document_id: 'doc-01', source_note: 'Article 19.4, page 48', status: 'ACTIVE' },
];

const common = { status: 'VALIDATED' as const, version: 1, effective_from: '2026-01-01', effective_to: null, frequency: 'QUARTERLY' as const, first_test_date: '2026-03-31', calculation_basis: 'LTM' as const, validated_by: 'usr-cl' };

export const definitions: CovenantDefinition[] = [
  {
    ...common, id: 'def-lev-v1', covenant_id: 'cov-lev', comparison: 'LTE', validated_at: '2026-01-06T11:00:00',
    numerator_label: 'Endettement financier net', denominator_label: 'EBITDA contractuel',
    components: [
      { id: 'c-lev-n1', side: 'NUMERATOR', sequence: 1, label: 'Dette financière brute', sign: 1, source_kind: 'REGISTRY_OUTSTANDING', metric_code: null, basis: null, financing_ids: ['fin-01'], clause: CLAUSES.endettementNet },
      { id: 'c-lev-n2', side: 'NUMERATOR', sequence: 2, label: 'Trésorerie', sign: -1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-32', basis: null, financing_ids: [], clause: CLAUSES.tresorerie },
      { id: 'c-lev-d1', side: 'DENOMINATOR', sequence: 1, label: 'EBITDA comptable sur douze mois', sign: 1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-30', basis: 'LTM', financing_ids: [], clause: CLAUSES.ebitda },
    ],
    threshold_steps: [
      { id: 'ts-lev-1', from_date: '2026-01-01', threshold: '3.50', clause: CLAUSES.leverage },
      { id: 'ts-lev-2', from_date: '2027-07-01', threshold: '3.25', clause: CLAUSES.leverage },
    ],
    adjustment_categories: [
      { id: 'ac-lev-nr', label: 'Coûts non récurrents', side: 'DENOMINATOR', direction: 1, cap_type: 'NONE', cap_value: null, cap_reference_component_id: null, clause: CLAUSES.ebitda },
    ],
    delta_labels: { numerator: 'Dette supplémentaire mobilisable', denominator: 'Baisse d’EBITDA absorbable' },
  },
  {
    ...common, id: 'def-gea-v1', covenant_id: 'cov-gea', comparison: 'LTE', validated_at: '2026-01-06T11:01:00',
    numerator_label: 'Endettement financier net', denominator_label: 'Fonds propres',
    components: [
      { id: 'c-gea-n1', side: 'NUMERATOR', sequence: 1, label: 'Dette financière brute', sign: 1, source_kind: 'REGISTRY_OUTSTANDING', metric_code: null, basis: null, financing_ids: ['fin-01'], clause: CLAUSES.endettementNet },
      { id: 'c-gea-n2', side: 'NUMERATOR', sequence: 2, label: 'Trésorerie', sign: -1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-32', basis: null, financing_ids: [], clause: CLAUSES.tresorerie },
      { id: 'c-gea-d1', side: 'DENOMINATOR', sequence: 1, label: 'Fonds propres', sign: 1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-19', basis: null, financing_ids: [], clause: CLAUSES.gearing },
    ],
    threshold_steps: [{ id: 'ts-gea-1', from_date: '2026-01-01', threshold: '1.00', clause: CLAUSES.gearing }],
    adjustment_categories: [],
    delta_labels: { numerator: 'Dette supplémentaire mobilisable', denominator: 'Baisse de fonds propres absorbable' },
  },
  {
    ...common, id: 'def-icr-v1', covenant_id: 'cov-icr', comparison: 'GTE', validated_at: '2026-01-06T11:02:00',
    numerator_label: 'EBITDA contractuel', denominator_label: 'Charges d’intérêts',
    components: [
      { id: 'c-icr-n1', side: 'NUMERATOR', sequence: 1, label: 'EBITDA comptable sur douze mois', sign: 1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-30', basis: 'LTM', financing_ids: [], clause: CLAUSES.ebitda },
      { id: 'c-icr-d1', side: 'DENOMINATOR', sequence: 1, label: 'Charges d’intérêts sur douze mois', sign: 1, source_kind: 'FINANCIAL_DATA', metric_code: 'MC-08', basis: 'LTM', financing_ids: [], clause: CLAUSES.icr },
    ],
    threshold_steps: [{ id: 'ts-icr-1', from_date: '2026-01-01', threshold: '4.00', clause: CLAUSES.icr }],
    adjustment_categories: [
      { id: 'ac-icr-nr', label: 'Coûts non récurrents', side: 'NUMERATOR', direction: 1, cap_type: 'NONE', cap_value: null, cap_reference_component_id: null, clause: CLAUSES.ebitda },
    ],
    delta_labels: { numerator: 'Baisse d’EBITDA absorbable', denominator: 'Hausse des charges d’intérêts absorbable' },
  },
];
