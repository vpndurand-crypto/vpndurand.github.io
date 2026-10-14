/**
 * Formats anglais du film (V5) : €20.0M, €500k, €142,000, 3.13x, −0.03x, 10.5%, Dec 31, 2029.
 * Mêmes règles d'arrondi que la bêta (décimal exact, arrondi « demi supérieur »), seules les conventions changent.
 */
import { D, fixed, type Decimal } from '../../beta/src/domain/decimal';

type Num = string | number | Decimal;

/** Vrai signe moins (typographie). */
export const MINUS = '−';

const group = (integer: string) => integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function num(value: Num, dp: number): string {
  const big = D(value);
  const rounded = fixed(big.abs(), dp);
  const [integer = '0', fraction] = rounded.split('.');
  const negative = big.lt(0) && D(rounded).gt(0);
  return `${negative ? MINUS : ''}${group(integer)}${fraction ? `.${fraction}` : ''}`;
}

/** Montant exact : €10,000,000 · €142,000. */
export function money(value: Num, dp = 0): string {
  const big = D(value);
  return `${big.lt(0) && D(fixed(big.abs(), dp)).gt(0) ? MINUS : ''}€${num(big.abs(), dp)}`;
}

/** Montant compact : €20.0M · €500k · €950. */
export function moneyCompact(value: Num): string {
  const big = D(value);
  const abs = big.abs();
  const sign = big.lt(0) ? MINUS : '';
  if (abs.gte(1_000_000)) return `${sign}€${num(abs.div(1_000_000), 1)}M`;
  if (abs.gte(1_000)) return `${sign}€${num(abs.div(1_000), 0)}k`;
  return `${sign}€${num(abs, 0)}`;
}

export const ratio = (value: Num, dp = 2): string => `${num(value, dp)}x`;

export function signedRatio(value: Num, dp = 2): string {
  const big = D(value);
  if (D(fixed(big, dp)).eq(0)) return ratio(big.abs(), dp);
  return `${big.gt(0) ? '+' : MINUS}${ratio(big.abs(), dp)}`;
}

export const percent = (fraction: Num, dp = 1): string => `${num(D(fraction).times(100), dp)}%`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 2029-12-31 → Dec 31, 2029. */
export function date(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
}

/** 2029-12-31 → December 31, 2029 (style des contrats). */
export function dateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS_LONG[(m ?? 1) - 1]} ${d}, ${y}`;
}

/** Nombre qui défile d'une valeur à l'autre (point décimal, vrai signe moins). */
export function rollNumber(from: number, to: number, t: number, dp: number): string {
  const v = from + (to - from) * Math.min(1, Math.max(0, t));
  const s = Math.abs(v).toFixed(dp);
  return `${v < 0 && Number(s) !== 0 ? MINUS : ''}${s}`;
}
