import { describe, expect, it } from 'vitest';
import { seed } from '../../data/seed';
import { computeAggregates, metricFormula, metricValue } from '../accounting/aggregates';
import { findRule } from '../accounting/mapping';
import { ltmPlan } from '../accounting/ltm';
import { addMonths, previousFiscalYearEnd } from '../dates';
import { fixed } from '../decimal';

const mapping = seed.mappings.find((m) => m.entity_id === 'ent-di')!;
const balance = (id: string) => seed.balances.find((b) => b.id === id)!;

describe('douze mois glissants et agrégats', () => {
  it('plan LTM : cumul + exercice précédent − cumul un an plus tôt ; à la clôture, le cumul seul', () => {
    expect(ltmPlan('2026-09-30', 12, 31)).toEqual({ kind: 'ROLLING', ytd: '2026-09-30', fiscalYear: '2025-12-31', ytdPrior: '2025-09-30' });
    expect(ltmPlan('2025-12-31', 12, 31)).toEqual({ kind: 'FISCAL_YEAR_END', ytd: '2025-12-31' });
    expect(previousFiscalYearEnd('2025-12-31', 12, 31)).toBe('2024-12-31');
  });
  it('fins de mois conservées', () => {
    expect(addMonths('2026-03-31', 3)).toBe('2026-06-30');
    expect(addMonths('2026-09-30', -12)).toBe('2025-09-30');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15');
  });
  it('EBITDA comptable (MC-30) et intérêts (MC-08) par balance', () => {
    const mc = (id: string, code: 'MC-30' | 'MC-08' | 'MC-32' | 'MC-19' | 'MC-13') => fixed(metricValue(computeAggregates(balance(id), mapping), code), 0);
    expect(mc('tb-di-2026-09-30', 'MC-30')).toBe('2000000');
    expect(mc('tb-di-2025-12-31', 'MC-30')).toBe('2650000');
    expect(mc('tb-di-2025-09-30', 'MC-30')).toBe('1800000');
    expect(mc('tb-di-2026-06-30', 'MC-30')).toBe('1350000');
    expect(mc('tb-di-2026-03-31', 'MC-30')).toBe('700000');
    expect(mc('tb-di-2026-09-30', 'MC-08')).toBe('340000');
    expect(mc('tb-di-2026-09-30', 'MC-32')).toBe('600000');
    expect(mc('tb-di-2026-09-30', 'MC-19')).toBe('12000000');
    expect(mc('tb-di-2026-09-30', 'MC-13')).toBe('10000000');
  });
  it('formule de la trésorerie et préfixe le plus long', () => {
    expect(metricFormula(computeAggregates(balance('tb-di-2026-09-30'), mapping), 'MC-32').replace(/\u202F/g, ' ')).toBe('MC-17 588 000,00 + MC-18 12 000,00');
    expect(findRule('681120', mapping)?.metric_code).toBe('MC-07');
    expect(findRule('661100', mapping)?.metric_code).toBe('MC-08');
    expect(findRule('164100', mapping)?.metric_code).toBe('MC-13');
  });
});
