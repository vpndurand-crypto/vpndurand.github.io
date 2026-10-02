import { describe, expect, it } from 'vitest';
import { definitions } from '../../data/covenants';
import type { CovenantDefinition, DecimalString } from '../../data/types';
import { attribution } from '../engine/attribution';
import { evaluate } from '../engine/evaluate';
import { EngineError, type EngineInput, type ResolvedAdjustment, type ResolvedComponent } from '../engine/types';
import { formatCovenantValue, formatPercent, formatRatio } from '../format';

const plain = (s: string) => s.replace(/[\u202F\u00A0]/g, ' ').replace(/\u2212/g, '-');
const def = (id: string): CovenantDefinition => {
  const found = definitions.find((d) => d.id === id);
  if (!found) throw new Error(id);
  return found;
};
const LEV = def('def-lev-v1');
const GEA = def('def-gea-v1');
const ICR = def('def-icr-v1');
const NO_SOURCE = { type: 'CALCULATION' as const, rule: 'test', formula: '', inputs: [] };

function component(definition: CovenantDefinition, componentId: string, value: DecimalString | null): ResolvedComponent {
  const c = definition.components.find((x) => x.id === componentId);
  if (!c) throw new Error(componentId);
  return {
    componentId, side: c.side, sequence: c.sequence, sign: c.sign, label: c.label, value, provenance: NO_SOURCE, clause: c.clause, children: [],
    missing: value === null ? [{ code: 'BALANCE_MISSING', label: `manque ${componentId}`, entityId: null, financingId: null, date: '2026-09-30' }] : [],
    sources: { balances: [], outstanding: [] },
  };
}
const adjustment = (categoryId: string, amount: DecimalString): ResolvedAdjustment => ({ adjustmentId: 'adj-t', categoryId, label: 'Coûts non récurrents', amountEntered: amount, provenance: NO_SOURCE });

function input(definition: CovenantDefinition, values: Record<string, DecimalString | null>, adjustments: ResolvedAdjustment[] = [], date = '2026-09-30', form: 'RATIO' | 'AMOUNT' = 'RATIO'): EngineInput {
  return {
    covenantId: definition.covenant_id, covenantLabel: 'Test', testKey: `${definition.covenant_id}@${date}`, definition, form, calcDate: date,
    isContractualTestDate: true, components: Object.entries(values).map(([id, v]) => component(definition, id, v)), adjustments,
  };
}
const lev = (debt: string, cash: string, ebitda: string, adj: string | null = '150000.00', date = '2026-09-30', definition: CovenantDefinition = LEV) =>
  evaluate(input(definition, { 'c-lev-n1': debt, 'c-lev-n2': cash, 'c-lev-d1': ebitda }, adj === null ? [] : [adjustment('ac-lev-nr', adj)], date));
const shown = (r: ReturnType<typeof evaluate>) => ({
  value: r.valueExact ? formatCovenantValue(r.valueExact, r.threshold) : null,
  headroom: r.headroom ? plain(formatRatio(r.headroom)) : null,
  pct: r.headroomPct ? plain(formatPercent(r.headroomPct)) : null,
  status: r.status,
});

describe('moteur — cas de référence du plan (section 23.1)', () => {
  it('1. cas principal Leverage : 3,13x, headroom 0,37x (10,5 %), ORANGE, conversions', () => {
    const r = lev('10000000.00', '600000.00', '2850000.00');
    expect(r.numerator).toBe('9400000.00');
    expect(r.denominator).toBe('3000000.00');
    expect(r.valueExact).toBe('3.13333333333333333333');
    expect(r.value).toBe('3.1333333333');
    expect(r.headroom).toBe('0.36666666666666666667');
    expect(r.headroomPct).toBe('0.10476190476190476190');
    expect(r.deltaNumerator).toBe('1100000.00');
    expect(r.deltaDenominator).toBe('314285.71');
    expect(shown(r)).toEqual({ value: '3,13x', headroom: '0,37x', pct: '10,5 %', status: 'WATCH' });
    expect(r.nextThresholdStep?.id).toBe('ts-lev-2');
  });
  it('2. sans retraitement : 3,30x, 5,8 %, ORANGE', () => {
    expect(shown(lev('10000000.00', '600000.00', '2850000.00', null))).toEqual({ value: '3,30x', headroom: '0,20x', pct: '5,8 %', status: 'WATCH' });
  });
  it('3. dette +1,1 M€ : exactement au seuil, respecté, marge critique', () => {
    expect(shown(lev('11100000.00', '600000.00', '2850000.00'))).toEqual({ value: '3,50x', headroom: '0,00x', pct: '0,0 %', status: 'CRITICAL' });
  });
  it('4. EBITDA contractuel −10 % : 3,48x, ROUGE', () => {
    expect(shown(lev('10000000.00', '600000.00', '2550000.00'))).toEqual({ value: '3,48x', headroom: '0,02x', pct: '0,5 %', status: 'CRITICAL' });
  });
  it('5. dette +5 M€ : 4,80x, non respecté', () => {
    expect(shown(lev('15000000.00', '600000.00', '2850000.00'))).toEqual({ value: '4,80x', headroom: '-1,30x', pct: '-37,1 %', status: 'BREACH' });
  });
  it('6. TC-C07 : 3,5004 affiché « 3,50x (3,5004) » et non respecté', () => {
    const r = lev('3500400.00', '0.00', '850000.00');
    expect(r.status).toBe('BREACH');
    expect(r.valueExact && formatCovenantValue(r.valueExact, r.threshold)).toBe('3,50x (3,5004)');
  });
  it('7. dénominateur nul : ratio non significatif, aucune valeur', () => {
    const r = lev('10000000.00', '600000.00', '-150000.00');
    expect(r.status).toBe('NOT_MEANINGFUL');
    expect(r.value).toBeNull();
    expect(r.denominator).toBe('0.00');
  });
  it('8. donnée manquante : non calculable, manques dédoublonnés', () => {
    const r = evaluate(input(LEV, { 'c-lev-n1': null, 'c-lev-n2': '600000.00', 'c-lev-d1': null }));
    expect(r.status).toBe('NOT_COMPUTABLE');
    expect(r.missing.map((m) => m.label)).toEqual(['manque c-lev-n1', 'manque c-lev-d1']);
    expect(r.value).toBeNull();
  });
  it('9. marche de seuil : 3,50x jusqu’au 30/06/2027, 3,25x ensuite', () => {
    expect(lev('10000000.00', '600000.00', '2850000.00', '150000.00', '2027-06-30').thresholdStep.id).toBe('ts-lev-1');
    const after = lev('10000000.00', '600000.00', '2850000.00', '150000.00', '2027-09-30');
    expect(after.thresholdStep.id).toBe('ts-lev-2');
    expect(shown(after)).toEqual({ value: '3,13x', headroom: '0,12x', pct: '3,6 %', status: 'CRITICAL' });
    expect(after.nextThresholdStep).toBeNull();
  });
  it('10. plafond absolu de retraitement : 150 000 saisis, 100 000 retenus', () => {
    const capped: CovenantDefinition = { ...LEV, adjustment_categories: LEV.adjustment_categories.map((c) => ({ ...c, cap_type: 'ABSOLUTE' as const, cap_value: '100000.00' })) };
    const r = lev('10000000.00', '600000.00', '2850000.00', '150000.00', '2026-09-30', capped);
    expect(r.adjustmentsRetained[0]).toMatchObject({ entered: '150000.00', retained: '100000.00' });
    expect(shown(r).value).toBe('3,19x');
  });
  it('11. plafond en pourcentage de la composante de référence', () => {
    const capped: CovenantDefinition = { ...LEV, adjustment_categories: LEV.adjustment_categories.map((c) => ({ ...c, cap_type: 'PERCENT' as const, cap_value: '0.04', cap_reference_component_id: 'c-lev-d1' })) };
    expect(lev('10000000.00', '600000.00', '2850000.00', '150000.00', '2026-09-30', capped).adjustmentsRetained[0]?.retained).toBe('114000.00');
  });
  it('12. Gearing : 0,78x, 21,7 %, VERT', () => {
    const r = evaluate(input(GEA, { 'c-gea-n1': '10000000.00', 'c-gea-n2': '600000.00', 'c-gea-d1': '12000000.00' }));
    expect(shown(r)).toEqual({ value: '0,78x', headroom: '0,22x', pct: '21,7 %', status: 'COMPLIANT' });
  });
  it('13. Couverture des intérêts (≥) : 6,67x, 66,7 %, conversions', () => {
    const r = evaluate(input(ICR, { 'c-icr-n1': '2850000.00', 'c-icr-d1': '450000.00' }, [adjustment('ac-icr-nr', '150000.00')]));
    expect(shown(r)).toEqual({ value: '6,67x', headroom: '2,67x', pct: '66,7 %', status: 'COMPLIANT' });
    expect(r.deltaNumerator).toBe('1200000.00');
    expect(r.deltaDenominator).toBe('300000.00');
  });
  it('14. attribution de la variation entre le 30/06 et le 30/09/2026', () => {
    expect(attribution({ numerator: '8700000.00', denominator: '2950000.00' }, { numerator: '9400000.00', denominator: '3000000.00' })).toEqual({
      numeratorEffect: '0.2372881356', denominatorEffect: '-0.0531073446', total: '0.1841807910',
    });
  });
  it('15. forme montant (TC-C21) : trésorerie minimale', () => {
    const minCash: CovenantDefinition = { ...GEA, comparison: 'GTE', components: [{ ...GEA.components[1]!, id: 'c-cash', side: 'NUMERATOR', sign: 1 }], threshold_steps: [{ ...GEA.threshold_steps[0]!, threshold: '500000.00' }] };
    const r = evaluate(input(minCash, { 'c-cash': '600000.00' }, [], '2026-09-30', 'AMOUNT'));
    expect(r).toMatchObject({ value: '600000.00', headroom: '100000.00', status: 'COMPLIANT', deltaNumerator: null, deltaDenominator: null });
    expect(r.headroomPct).toBe('0.20000000000000000000');
  });
  it('16. comparaisons strictes : au seuil exact, < et > ne sont pas respectés', () => {
    expect(lev('11100000.00', '600000.00', '2850000.00', '150000.00', '2026-09-30', { ...LEV, comparison: 'LT' }).status).toBe('BREACH');
    expect(evaluate(input({ ...ICR, comparison: 'GT' }, { 'c-icr-n1': '1800000.00', 'c-icr-d1': '450000.00' })).status).toBe('BREACH');
  });
  it('rejette une catégorie de retraitement inconnue (ERR-066)', () => {
    expect(() => evaluate(input(LEV, { 'c-lev-n1': '10000000.00', 'c-lev-n2': '600000.00', 'c-lev-d1': '2850000.00' }, [adjustment('ac-inconnue', '1.00')]))).toThrow(EngineError);
  });
  it('est une fonction pure : entrées gelées intactes, résultat identique', () => {
    const frozen = input(LEV, { 'c-lev-n1': '10000000.00', 'c-lev-n2': '600000.00', 'c-lev-d1': '2850000.00' }, [adjustment('ac-lev-nr', '150000.00')]);
    const before = JSON.stringify(frozen);
    Object.freeze(frozen);
    expect(JSON.stringify(evaluate(frozen))).toBe(JSON.stringify(evaluate(frozen)));
    expect(JSON.stringify(frozen)).toBe(before);
  });
});
