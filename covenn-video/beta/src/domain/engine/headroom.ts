import type { Decimal } from '../decimal';
import type { Comparison } from '../../data/types';

const isUpperBound = (comparison: Comparison) => comparison === 'LTE' || comparison === 'LT';

export function isCompliant(value: Decimal, threshold: Decimal, comparison: Comparison): boolean {
  switch (comparison) {
    case 'LTE': return value.lte(threshold);
    case 'LT': return value.lt(threshold);
    case 'GTE': return value.gte(threshold);
    case 'GT': return value.gt(threshold);
  }
}

/** Marge absolue, positive quand le covenant est respecté. */
export function headroomOf(value: Decimal, threshold: Decimal, comparison: Comparison): Decimal {
  return isUpperBound(comparison) ? threshold.minus(value) : value.minus(threshold);
}

/** Marge relative d'un ratio, calculée sur les montants exacts : (seuil × D − N) / (seuil × D). Null si le seuil est nul. */
export function headroomPctRatio(numerator: Decimal, denominator: Decimal, threshold: Decimal, comparison: Comparison): Decimal | null {
  const limit = threshold.times(denominator);
  if (limit.eq(0)) return null;
  return (isUpperBound(comparison) ? limit.minus(numerator) : numerator.minus(limit)).div(limit);
}

export function headroomPctAmount(value: Decimal, threshold: Decimal, comparison: Comparison): Decimal | null {
  if (threshold.eq(0)) return null;
  return headroomOf(value, threshold, comparison).div(threshold);
}

/** Conversions en montants (BR-187) : variation du numérateur ou du dénominateur qui amènerait le ratio exactement au seuil. */
export function conversions(numerator: Decimal, denominator: Decimal, threshold: Decimal, comparison: Comparison): { deltaNumerator: Decimal; deltaDenominator: Decimal | null } {
  const limit = threshold.times(denominator);
  if (isUpperBound(comparison)) {
    return { deltaNumerator: limit.minus(numerator), deltaDenominator: threshold.eq(0) ? null : denominator.minus(numerator.div(threshold)) };
  }
  return { deltaNumerator: numerator.minus(limit), deltaDenominator: threshold.eq(0) ? null : numerator.div(threshold).minus(denominator) };
}
