import { canonicalize } from './canonicalJson';
import { EngineError, type EngineErrorCode } from './engine/types';
import { evaluate } from './engine/evaluate';
import { formatDate } from './format';
import { resolveInputs, type ResolvedInputs } from './resolver';
import { sha256Hex } from './sha256';
import { isContractualTestDate } from './testDates';
import type {
  CanonicalInputs, Covenant, CovenantDefinition, EvaluationResult, Id, IsoDate, IsoDateTime, SavedTest, SeedData, SnapshotVersions, TestKey,
} from '../data/types';

export function testKey(covenantId: Id, date: IsoDate): TestKey {
  return `${covenantId}@${date}`;
}

export interface CovenantEvaluation {
  key: TestKey;
  covenant: Covenant;
  definition: CovenantDefinition | null;
  date: IsoDate;
  result: EvaluationResult | null;
  error: { code: EngineErrorCode; message: string } | null;
  canonical: CanonicalInputs | null;
  inputsHash: string | null;
  versions: SnapshotVersions;
}

const NO_VERSIONS: SnapshotVersions = { balances: [], outstanding: [], mapping: null };

/** Définition validée en vigueur à la date. */
export function definitionAt(data: SeedData, covenantId: Id, date: IsoDate): CovenantDefinition | null {
  return data.definitions
    .filter((d) => d.covenant_id === covenantId && d.status === 'VALIDATED' && d.effective_from <= date && (d.effective_to === null || d.effective_to >= date))
    .sort((a, b) => b.version - a.version)[0] ?? null;
}

export function canonicalInputs(result: EvaluationResult, definition: CovenantDefinition, resolved: ResolvedInputs): CanonicalInputs {
  return {
    covenant_id: result.covenantId,
    definition_id: definition.id,
    definition_version: definition.version,
    calc_date: result.calcDate,
    comparison: definition.comparison,
    threshold_step: { id: result.thresholdStep.id, from_date: result.thresholdStep.from_date, threshold: result.threshold },
    components: resolved.components.map((c) => {
      const component = definition.components.find((x) => x.id === c.componentId);
      return {
        id: c.componentId, side: c.side, sign: c.sign, source_kind: component?.source_kind ?? 'MANUAL_VALUE',
        metric_code: component?.metric_code ?? null, basis: component?.basis ?? null, value: c.value ?? '', sources: c.sources,
      };
    }),
    adjustments: [...result.adjustmentsRetained]
      .sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.adjustmentId.localeCompare(b.adjustmentId))
      .map((a) => ({ category_id: a.categoryId, entered: a.entered, retained: a.retained })),
  };
}

function compute(data: SeedData, covenantId: Id, date: IsoDate): CovenantEvaluation {
  const covenant = data.covenants.find((c) => c.id === covenantId);
  if (!covenant) throw new Error(`Covenant inconnu : ${covenantId}`);
  const key = testKey(covenantId, date);
  const definition = definitionAt(data, covenantId, date);
  const failed = (code: EngineErrorCode, message: string): CovenantEvaluation => ({
    key, covenant, definition, date, result: null, error: { code, message }, canonical: null, inputsHash: null, versions: NO_VERSIONS,
  });
  if (!definition) return failed('NO_DEFINITION', `Aucune définition validée en vigueur au ${formatDate(date)}`);
  try {
    const resolved = resolveInputs(data, covenant, definition, date, key);
    const result = evaluate({
      covenantId, covenantLabel: covenant.short_label, testKey: key, definition, form: covenant.form, calcDate: date,
      isContractualTestDate: isContractualTestDate(definition, date), components: resolved.components, adjustments: resolved.adjustments,
    });
    const canonical = result.status === 'NOT_COMPUTABLE' ? null : canonicalInputs(result, definition, resolved);
    return { key, covenant, definition, date, result, error: null, canonical, inputsHash: canonical ? sha256Hex(canonicalize(canonical)) : null, versions: resolved.versions };
  } catch (error) {
    if (error instanceof EngineError) return failed(error.code, error.message);
    throw error;
  }
}

const cache = new WeakMap<SeedData, Map<TestKey, CovenantEvaluation>>();

/** Évalue un covenant à une date sur une vue de données ; résultat mémorisé tant que la vue ne change pas. */
export function evaluateCovenantAt(data: SeedData, covenantId: Id, date: IsoDate): CovenantEvaluation {
  let byKey = cache.get(data);
  if (!byKey) {
    byKey = new Map();
    cache.set(data, byKey);
  }
  const key = testKey(covenantId, date);
  const hit = byKey.get(key);
  if (hit) return hit;
  const evaluation = compute(data, covenantId, date);
  byKey.set(key, evaluation);
  return evaluation;
}

/** Fige un calcul : entrées canoniques, empreinte, résultat et versions des sources (BR-188). */
export function buildSavedTest(evaluation: CovenantEvaluation, meta: { occurrence: number; closedBy: Id; closedAt: IsoDateTime }): SavedTest {
  const { result, canonical, inputsHash, definition } = evaluation;
  if (!result || !canonical || !inputsHash || !definition) throw new Error(`Calcul non enregistrable : ${evaluation.key}`);
  return {
    key: evaluation.key, occurrence: meta.occurrence, covenant_id: evaluation.covenant.id, definition_id: definition.id, test_date: evaluation.date,
    is_contractual_test_date: result.isContractualTestDate, closed_by: meta.closedBy, closed_at: meta.closedAt,
    snapshot: { definition_version: definition.version, inputs: canonical, inputs_hash: inputsHash, result, versions: evaluation.versions },
  };
}
