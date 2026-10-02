import type {
  ClauseRef, CovenantDefinition, CovenantForm, DecimalString, DecompositionNode, Id, IsoDate, MissingInput, ProvenanceRef, Side,
  SourceVersions, TestKey,
} from '../../data/types';

export type { EvaluationResult, DecompositionNode, ProvenanceRef, MissingInput, CalcStatus } from '../../data/types';

/** Composante résolue par le résolveur : valeur, origine et sous-arbre. */
export interface ResolvedComponent {
  componentId: Id;
  side: Side;
  sequence: number;
  sign: 1 | -1;
  label: string;
  value: DecimalString | null;
  provenance: ProvenanceRef;
  clause: ClauseRef;
  children: DecompositionNode[];
  missing: MissingInput[];
  sources: SourceVersions;
}
export interface ResolvedAdjustment {
  adjustmentId: Id;
  categoryId: Id;
  label: string;
  amountEntered: DecimalString;
  provenance: ProvenanceRef;
}
/** Entrée du moteur : tout est déjà résolu, le moteur ne lit aucune donnée lui-même (fonction pure). */
export interface EngineInput {
  covenantId: Id;
  covenantLabel: string;
  testKey: TestKey;
  definition: CovenantDefinition;
  form: CovenantForm;
  calcDate: IsoDate;
  isContractualTestDate: boolean;
  components: readonly ResolvedComponent[];
  adjustments: readonly ResolvedAdjustment[];
}

export type EngineErrorCode = 'NO_DEFINITION' | 'NO_THRESHOLD' | 'INVALID_ADJUSTMENT_CATEGORY';
export class EngineError extends Error {
  readonly code: EngineErrorCode;
  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
  }
}
