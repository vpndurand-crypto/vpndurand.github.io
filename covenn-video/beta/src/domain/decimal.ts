import Big from 'big.js';

/** Arithmétique décimale exacte (T-01) : 20 décimales, arrondi « demi supérieur ». Aucun calcul financier en nombre flottant. */
Big.DP = 20;
Big.RM = Big.roundHalfUp;

export type Decimal = Big;
export const ZERO: Decimal = new Big(0);

export function D(value: string | number | Decimal): Decimal {
  return new Big(value);
}
export function sum(values: readonly Decimal[]): Decimal {
  return values.reduce<Decimal>((acc, value) => acc.plus(value), ZERO);
}
export function fixed(value: Decimal, dp: number): string {
  return value.toFixed(dp, Big.roundHalfUp);
}
/** Montant en euros, deux décimales. */
export const money = (value: Decimal): string => fixed(value, 2);
/** Valeur interne exacte, vingt décimales. */
export const exact = (value: Decimal): string => fixed(value, 20);
export function minOf(a: Decimal, b: Decimal): Decimal {
  return a.lt(b) ? a : b;
}
