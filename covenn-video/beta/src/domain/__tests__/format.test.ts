import { describe, expect, it } from 'vitest';
import { formatCovenantValue, formatDate, formatDateTime, formatMoney, formatMoneyCompact, formatPercent, formatRatio, formatSignedRatio, formatThreshold, parseMoneyInput } from '../format';

describe('formats français', () => {
  it('montants : espace fine insécable, insécable avant €, vrai signe moins', () => {
    expect(formatMoney('10000000')).toBe('10\u202F000\u202F000,00\u00A0€');
    expect(formatMoney('-1300000.5')).toBe('\u22121\u202F300\u202F000,50\u00A0€');
    expect(formatMoney('-0.001')).toBe('0,00\u00A0€');
    expect(formatMoneyCompact('14000000')).toBe('14,0\u00A0M€');
    expect(formatMoneyCompact('600000')).toBe('600\u00A0k€');
  });
  it('ratios, pourcentages, seuils et arrondi demi supérieur', () => {
    expect(formatRatio('0.725')).toBe('0,73x');
    expect(formatRatio('3.1333333333')).toBe('3,13x');
    expect(formatSignedRatio('0.0333333333')).toBe('+0,03x');
    expect(formatSignedRatio('-1.3')).toBe('\u22121,30x');
    expect(formatPercent('0.10476190476190476190')).toBe('10,5\u00A0%');
    expect(formatThreshold('LTE', '3.50')).toBe('≤ 3,50x');
    expect(formatThreshold('GTE', '4.00')).toBe('≥ 4,00x');
    expect(formatCovenantValue('3.50040000000000000000', '3.50')).toBe('3,50x (3,5004)');
    expect(formatCovenantValue('3.50000000000000000000', '3.50')).toBe('3,50x');
  });
  it('dates et saisies', () => {
    expect(formatDate('2026-09-30')).toBe('30/09/2026');
    expect(formatDateTime('2026-10-20T09:12:00')).toBe('20/10/2026 à 09:12');
    expect(parseMoneyInput('150 000')).toBe('150000.00');
    expect(parseMoneyInput('150\u202F000,5 €')).toBe('150000.50');
    expect(parseMoneyInput('1,234')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
  });
});
