/** Libellés centralisés : statuts, sources, catégories. Aucun composant n'écrit ces textes lui-même. */
import type { AuditAction, CalcStatus, Comparison, DocumentType, FinancingCategory, MetricCode, ProvenanceRef, ScheduleKind } from './types';

export type Tone = 'ok' | 'watch' | 'risk' | 'na';

/** Statut d'un covenant : libellé, ton (couleur) et ordre de gravité (1 = le plus grave). */
export const STATUS_META: Record<CalcStatus, { label: string; short: string; tone: Tone; severity: number }> = {
  BREACH: { label: 'Covenant non respecté', short: 'Non respecté', tone: 'risk', severity: 1 },
  NOT_MEANINGFUL: { label: 'Ratio non significatif', short: 'Non significatif', tone: 'risk', severity: 2 },
  CRITICAL: { label: 'Covenant respecté — marge critique', short: 'Marge critique', tone: 'risk', severity: 3 },
  WATCH: { label: 'Covenant respecté — vigilance', short: 'Vigilance', tone: 'watch', severity: 4 },
  COMPLIANT: { label: 'Covenant respecté', short: 'Respecté', tone: 'ok', severity: 5 },
  NOT_COMPUTABLE: { label: 'Non calculable — données manquantes', short: 'Non calculable', tone: 'na', severity: 6 },
};
export const TONE_COLOR_NAME: Record<Tone, string> = { ok: 'VERT', watch: 'ORANGE', risk: 'ROUGE', na: 'GRIS' };

export const METRIC_LABELS: Record<MetricCode, string> = {
  'MC-01': 'Chiffre d’affaires', 'MC-02': 'Autres produits d’exploitation', 'MC-03': 'Achats et charges externes',
  'MC-04': 'Impôts et taxes', 'MC-05': 'Charges de personnel', 'MC-06': 'Autres charges d’exploitation',
  'MC-07': 'Dotations nettes aux amortissements et provisions', 'MC-08': 'Charges d’intérêts', 'MC-09': 'Autres charges financières',
  'MC-10': 'Produits financiers', 'MC-11': 'Résultat exceptionnel', 'MC-12': 'Impôt sur les résultats et participation',
  'MC-13': 'Dette bancaire', 'MC-14': 'Autres dettes financières', 'MC-15': 'Comptes courants d’associés',
  'MC-16': 'Concours bancaires courants', 'MC-17': 'Disponibilités', 'MC-18': 'Valeurs mobilières de placement',
  'MC-19': 'Capitaux propres', 'MC-99': 'Exclu des agrégats', 'MC-30': 'EBITDA comptable',
  'MC-31': 'Dette financière brute comptable', 'MC-32': 'Trésorerie comptable', 'MC-33': 'Résultat d’exploitation',
};

export const COMPARISON_LABELS: Record<Comparison, string> = {
  LTE: 'inférieur ou égal à', LT: 'strictement inférieur à', GTE: 'supérieur ou égal à', GT: 'strictement supérieur à',
};
export const FINANCING_CATEGORY_LABELS: Record<FinancingCategory, string> = {
  BANK_MLT: 'Crédit bancaire moyen terme', LEASE: 'Crédit-bail', REVOLVING_CT: 'Crédit renouvelable',
};
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = { CONTRACT: 'Contrat', OTHER: 'Justificatif' };
export const PROVENANCE_TYPE_LABELS: Record<ProvenanceRef['type'], string> = {
  CONTRACT: 'Contrat', IMPORT: 'Balance importée', MANUAL_ENTRY: 'Saisie', CALCULATION: 'Calcul',
};
export const FREQUENCY_LABELS = { QUARTERLY: 'Trimestrielle', SEMI_ANNUAL: 'Semestrielle', ANNUAL: 'Annuelle' } as const;
export const SCHEDULE_KIND_LABELS: Record<ScheduleKind, string> = {
  COVENANT_TEST: 'Test de covenants', INSTALLMENT: 'Échéance', MATURITY: 'Maturité', THRESHOLD_STEP: 'Marche de seuil',
};
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  ORGANIZATION_CREATED: 'Organisation créée', ENTITY_CREATED: 'Société créée', FINANCING_CREATED: 'Financement créé',
  DOCUMENT_UPLOADED: 'Document ajouté', TRIAL_BALANCE_IMPORTED: 'Balance importée', MAPPING_VALIDATED: 'Mapping validé',
  DEFINITION_VALIDATED: 'Définition validée', OUTSTANDING_DECLARED: 'Encours déclaré', ADJUSTMENT_SAVED: 'Retraitement enregistré',
  ADJUSTMENT_RESTORED: 'Retraitement restauré', CALCULATION_RUN: 'Calcul exécuté', TEST_CLOSED: 'Calcul enregistré',
  ALERT_ACKNOWLEDGED: 'Alerte prise en compte',
};
