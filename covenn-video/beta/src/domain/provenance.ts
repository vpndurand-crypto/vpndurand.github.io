import type { Decimal } from './decimal';
import { formatMoney, MINUS } from './format';
import type {
  ClauseRef, CovenantAdjustment, Id, ImportJob, IsoDateTime, OutstandingDeclaration, ProvenanceRef, Side, TestKey, TrialBalance, TrialBalanceLine,
} from '../data/types';

/** Identifiants de nœuds stables (plan technique, section 11.2) : `${clé}/N/${composante}/...`. */
export const nodeId = (...parts: string[]): string => parts.join('/');
export const sideLetter = (side: Side): 'N' | 'D' => (side === 'NUMERATOR' ? 'N' : 'D');
export const sideNodeId = (key: TestKey, side: Side): string => nodeId(key, sideLetter(side));
export const componentNodeId = (key: TestKey, side: Side, componentId: Id): string => nodeId(key, sideLetter(side), componentId);
export const thresholdNodeId = (key: TestKey): string => nodeId(key, 'threshold');

export function calculationProvenance(rule: string, formula: string, inputs: string[]): ProvenanceRef {
  return { type: 'CALCULATION', rule, formula, inputs };
}
export function contractProvenance(clause: ClauseRef, validatedBy: Id, validatedAt: IsoDateTime): ProvenanceRef {
  return { type: 'CONTRACT', documentId: clause.document_id, page: clause.page, clauseId: clause.clause_id, article: clause.article, excerpt: clause.excerpt, validatedBy, validatedAt };
}
export function outstandingProvenance(declaration: OutstandingDeclaration): ProvenanceRef {
  return {
    type: 'MANUAL_ENTRY', userId: declaration.created_by, recordedAt: declaration.created_at, justification: declaration.comment,
    documentId: declaration.document_id, object: { kind: 'OUTSTANDING', id: declaration.id },
  };
}
export function adjustmentProvenance(adjustment: CovenantAdjustment): ProvenanceRef {
  return {
    type: 'MANUAL_ENTRY', userId: adjustment.created_by, recordedAt: adjustment.created_at, justification: adjustment.justification,
    documentId: adjustment.document_id, object: { kind: 'ADJUSTMENT', id: adjustment.id },
  };
}
export function balanceLineProvenance(balance: TrialBalance, job: ImportJob | undefined, line: TrialBalanceLine): ProvenanceRef {
  return {
    type: 'IMPORT', balanceId: balance.id, balanceVersion: balance.version, importJobId: balance.import_job_id, fileName: job?.file_name ?? '',
    rows: [line.row], accounts: [line.account_number], column: line.balance.startsWith('-') ? 'Crédit' : 'Débit',
  };
}

export interface Term { value: Decimal; sign: 1 | -1 }
/** « 10 000 000,00 − 600 000,00 » : chaque terme avec son signe effectif. */
export function formulaFromTerms(terms: readonly Term[]): string {
  return terms
    .map((term, index) => {
      const negative = term.sign * (term.value.lt(0) ? -1 : 1) < 0;
      const amount = formatMoney(term.value.abs(), { currency: false });
      if (index === 0) return negative ? `${MINUS}${amount}` : amount;
      return `${negative ? MINUS : '+'} ${amount}`;
    })
    .join(' ');
}
