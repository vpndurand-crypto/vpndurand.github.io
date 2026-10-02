import { D, fixed } from '../decimal';
import type { DecimalString } from '../../data/types';

/**
 * Attribution d'une variation de ratio entre deux dates (BR-190) :
 * effet numérateur = (N1 − N0) / D0 ; effet dénominateur = N1/D1 − N1/D0 ; la somme égale la variation totale.
 */
export function attribution(previous: { numerator: DecimalString; denominator: DecimalString }, current: { numerator: DecimalString; denominator: DecimalString }): { numeratorEffect: string; denominatorEffect: string; total: string } | null {
  const n0 = D(previous.numerator); const d0 = D(previous.denominator);
  const n1 = D(current.numerator); const d1 = D(current.denominator);
  if (d0.lte(0) || d1.lte(0)) return null;
  const numeratorEffect = n1.minus(n0).div(d0);
  const denominatorEffect = n1.div(d1).minus(n1.div(d0));
  const total = n1.div(d1).minus(n0.div(d0));
  return { numeratorEffect: fixed(numeratorEffect, 10), denominatorEffect: fixed(denominatorEffect, 10), total: fixed(total, 10) };
}
