import { D, ZERO, exact, fixed, minOf, money, type Decimal } from '../decimal';
import { formatMoney } from '../format';
import { calculationProvenance, contractProvenance, formulaFromTerms, nodeId, sideNodeId, thresholdNodeId, componentNodeId } from '../provenance';
import { conversions, headroomOf, headroomPctAmount, headroomPctRatio, isCompliant } from './headroom';
import { computeStatus } from './status';
import { selectThresholdSteps } from './threshold';
import { EngineError, type EngineInput, type ResolvedComponent } from './types';
import type { AdjustmentCategory, DecompositionNode, EvaluationResult, MissingInput, RetainedAdjustment, Side, ThresholdStep } from '../../data/types';

function dedupe(missing: readonly MissingInput[]): MissingInput[] {
  const seen = new Set<string>();
  return missing.filter((item) => (seen.has(item.label) ? false : (seen.add(item.label), true)));
}

function retainedAmount(entered: Decimal, category: AdjustmentCategory, components: readonly ResolvedComponent[]): Decimal {
  if (category.cap_type === 'NONE' || category.cap_value === null) return entered;
  if (category.cap_type === 'ABSOLUTE') return minOf(entered, D(category.cap_value));
  const reference = components.find((c) => c.componentId === category.cap_reference_component_id);
  return minOf(entered, D(category.cap_value).times(reference?.value ? D(reference.value) : ZERO));
}

interface Totals { numerator: Decimal | null; denominator: Decimal | null }

function buildTree(input: EngineInput, retained: readonly RetainedAdjustment[], categories: ReadonlyMap<string, AdjustmentCategory>, step: ThresholdStep, totals: Totals, value: string | null): DecompositionNode {
  const { testKey: key, definition: def } = input;
  const unit = input.form === 'RATIO' ? 'RATIO' : 'EUR';
  const sideNode = (side: Side, total: Decimal | null): DecompositionNode => {
    const id = sideNodeId(key, side);
    const components = input.components.filter((c) => c.side === side).sort((a, b) => a.sequence - b.sequence);
    const children: DecompositionNode[] = [
      ...components.map((c): DecompositionNode => ({
        id: componentNodeId(key, side, c.componentId), label: c.label, value: c.value, unit: 'EUR', sign: c.sign, role: 'COMPONENT',
        provenance: c.provenance, clause: c.clause, missing: c.missing, children: c.children,
      })),
      ...retained.filter((a) => a.side === side).map((a): DecompositionNode => {
        const source = input.adjustments.find((x) => x.adjustmentId === a.adjustmentId);
        return {
          id: nodeId(id, a.adjustmentId), label: a.label, value: a.retained, unit: 'EUR', sign: a.direction, role: 'ADJUSTMENT',
          provenance: source ? source.provenance : calculationProvenance('Retraitement', a.retained, []),
          clause: categories.get(a.categoryId)?.clause ?? null, missing: [], children: [],
        };
      }),
    ];
    const formula = total === null
      ? 'Non calculable : données manquantes'
      : formulaFromTerms(children.filter((c) => c.value !== null).map((c) => ({ value: D(c.value ?? '0'), sign: c.sign ?? 1 })));
    return {
      id, label: side === 'NUMERATOR' ? def.numerator_label : def.denominator_label, value: total === null ? null : money(total), unit: 'EUR', sign: null,
      role: side, provenance: calculationProvenance(`Définition v${def.version}`, formula, children.map((c) => c.id)), clause: null, missing: [], children,
    };
  };
  const numerator = sideNode('NUMERATOR', totals.numerator);
  const denominator = input.form === 'RATIO' ? sideNode('DENOMINATOR', totals.denominator) : null;
  const threshold: DecompositionNode = {
    id: thresholdNodeId(key), label: 'Seuil applicable', value: fixed(D(step.threshold), 2), unit, sign: null, role: 'THRESHOLD',
    provenance: contractProvenance(step.clause, def.validated_by, def.validated_at), clause: step.clause, missing: [], children: [],
  };
  const formula = totals.numerator === null
    ? 'Non calculable : données manquantes'
    : input.form === 'RATIO' && totals.denominator !== null
      ? `${formatMoney(totals.numerator, { currency: false })} / ${formatMoney(totals.denominator, { currency: false })}`
      : formatMoney(totals.numerator, { currency: false });
  const children = denominator ? [numerator, denominator, threshold] : [numerator, threshold];
  return {
    id: key, label: input.covenantLabel, value, unit, sign: null, role: 'RESULT',
    provenance: calculationProvenance('BR-186', formula, children.map((c) => c.id)), clause: null, missing: [], children,
  };
}

/** Moteur déterministe (plan technique, section 8.4) : aucune lecture de données, aucune date système, aucune IA. */
export function evaluate(input: EngineInput): EvaluationResult {
  const def = input.definition;
  const { current: step, next } = selectThresholdSteps(def.threshold_steps, input.calcDate);
  if (!step) throw new EngineError('NO_THRESHOLD', `Aucun seuil en vigueur au ${input.calcDate}`);
  const threshold = D(step.threshold);
  const categories = new Map(def.adjustment_categories.map((c) => [c.id, c] as const));

  const retained: RetainedAdjustment[] = input.adjustments.map((adjustment) => {
    const category = categories.get(adjustment.categoryId);
    if (!category) throw new EngineError('INVALID_ADJUSTMENT_CATEGORY', `Catégorie de retraitement inconnue : ${adjustment.categoryId}`);
    const entered = D(adjustment.amountEntered);
    return {
      adjustmentId: adjustment.adjustmentId, categoryId: category.id, label: adjustment.label, side: category.side, direction: category.direction,
      entered: money(entered), retained: money(retainedAmount(entered, category, input.components)),
    };
  });

  const common = {
    covenantId: input.covenantId, definitionId: def.id, definitionVersion: def.version, calcDate: input.calcDate,
    isContractualTestDate: input.isContractualTestDate, form: input.form, comparison: def.comparison, thresholdStep: step,
    nextThresholdStep: next, adjustmentsRetained: retained, threshold: fixed(threshold, 2), deltaLabels: def.delta_labels,
  };
  const empty = { valueExact: null, value: null, headroom: null, headroomPct: null, deltaNumerator: null, deltaDenominator: null };

  const missing = dedupe(input.components.flatMap((c) => c.missing));
  if (missing.length > 0) {
    return { ...common, ...empty, numerator: null, denominator: null, status: 'NOT_COMPUTABLE', missing, tree: buildTree(input, retained, categories, step, { numerator: null, denominator: null }, null) };
  }

  const total = (side: Side): Decimal => {
    let sum = ZERO;
    for (const c of input.components) if (c.side === side) sum = sum.plus(D(c.value ?? '0').times(c.sign));
    for (const a of retained) if (a.side === side) sum = sum.plus(D(a.retained).times(a.direction));
    return sum;
  };
  const numerator = total('NUMERATOR');

  if (input.form === 'AMOUNT') {
    const compliant = isCompliant(numerator, threshold, def.comparison);
    const headroom = headroomOf(numerator, threshold, def.comparison);
    const pct = headroomPctAmount(numerator, threshold, def.comparison);
    return {
      ...common, numerator: money(numerator), denominator: null, valueExact: money(numerator), value: money(numerator),
      status: computeStatus({ compliant, headroomPct: pct }), headroom: money(headroom), headroomPct: pct ? exact(pct) : null,
      deltaNumerator: null, deltaDenominator: null, missing: [],
      tree: buildTree(input, retained, categories, step, { numerator, denominator: null }, money(numerator)),
    };
  }

  const denominator = total('DENOMINATOR');
  if (denominator.lte(0)) {
    return {
      ...common, ...empty, numerator: money(numerator), denominator: money(denominator), status: 'NOT_MEANINGFUL', missing: [],
      tree: buildTree(input, retained, categories, step, { numerator, denominator }, null),
    };
  }
  const value = numerator.div(denominator);
  const compliant = isCompliant(value, threshold, def.comparison);
  const pct = headroomPctRatio(numerator, denominator, threshold, def.comparison);
  const deltas = conversions(numerator, denominator, threshold, def.comparison);
  return {
    ...common, numerator: money(numerator), denominator: money(denominator), valueExact: exact(value), value: fixed(value, 10),
    status: computeStatus({ compliant, headroomPct: pct }), headroom: exact(headroomOf(value, threshold, def.comparison)),
    headroomPct: pct ? exact(pct) : null, deltaNumerator: money(deltas.deltaNumerator),
    deltaDenominator: deltas.deltaDenominator ? money(deltas.deltaDenominator) : null, missing: [],
    tree: buildTree(input, retained, categories, step, { numerator, denominator }, fixed(value, 10)),
  };
}
