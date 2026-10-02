import { D, fixed, type Decimal } from './decimal';
import type { Comparison, CovenantForm } from '../data/types';

/** Conventions françaises (plan technique, section 16.3) : espace fine insécable pour les milliers, insécable avant € et %, vrai signe moins. */
export const NNBSP = '\u202F';
export const NBSP = '\u00A0';
export const MINUS = '\u2212';
export const COMPARISON_SYMBOL: Record<Comparison, string> = { LTE: '≤', LT: '<', GTE: '≥', GT: '>' };

type Num = string | Decimal;

function group(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
}

export function formatNumber(value: Num, dp: number): string {
  const big = D(value);
  const rounded = fixed(big.abs(), dp);
  const [integer = '0', fraction] = rounded.split('.');
  const negative = big.lt(0) && D(rounded).gt(0);
  return `${negative ? MINUS : ''}${group(integer)}${fraction ? `,${fraction}` : ''}`;
}

export function formatMoney(value: Num, options: { dp?: number; currency?: boolean } = {}): string {
  const { dp = 2, currency = true } = options;
  return `${formatNumber(value, dp)}${currency ? `${NBSP}€` : ''}`;
}

export function formatSignedMoney(value: Num): string {
  const big = D(value);
  const text = formatMoney(big.abs());
  if (D(fixed(big, 2)).eq(0)) return text;
  return `${big.gt(0) ? '+' : MINUS}${text}`;
}

/** Montant compact pour les cartes : « 14,0 M€ », « 600 k€ ». */
export function formatMoneyCompact(value: Num): string {
  const big = D(value);
  const abs = big.abs();
  if (abs.gte(1_000_000)) return `${formatNumber(big.div(1_000_000), 1)}${NBSP}M€`;
  if (abs.gte(1_000)) return `${formatNumber(big.div(1_000), 0)}${NBSP}k€`;
  return formatMoney(big, { dp: 0 });
}

export function formatRatio(value: Num, dp = 2): string {
  return `${formatNumber(value, dp)}x`;
}

export function formatSignedRatio(value: Num, dp = 2): string {
  const big = D(value);
  if (D(fixed(big, dp)).eq(0)) return formatRatio(big.abs(), dp);
  return `${big.gt(0) ? '+' : MINUS}${formatRatio(big.abs(), dp)}`;
}

export function formatPercent(fraction: Num, dp = 1): string {
  return `${formatNumber(D(fraction).times(100), dp)}${NBSP}%`;
}

/**
 * Valeur d'un covenant : deux décimales ; si l'arrondi affiché égale le seuil sans l'égaler exactement,
 * on ajoute quatre décimales pour lever l'ambiguïté (« 3,50x (3,5004) »).
 */
export function formatCovenantValue(valueExact: Num, threshold: Num, form: CovenantForm = 'RATIO'): string {
  if (form === 'AMOUNT') return formatMoney(valueExact);
  const value = D(valueExact);
  const shown = D(fixed(value, 2));
  if (shown.eq(D(threshold)) && !value.eq(D(threshold))) return `${formatRatio(value)} (${formatNumber(value, 4)})`;
  return formatRatio(value);
}

export function formatThreshold(comparison: Comparison, threshold: Num, form: CovenantForm = 'RATIO'): string {
  return `${COMPARISON_SYMBOL[comparison]} ${form === 'AMOUNT' ? formatMoney(threshold) : formatRatio(threshold)}`;
}

export function formatDate(iso: string): string {
  const [y = '', m = '', d = ''] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${iso.slice(11, 16)}`;
}

/** Saisie d'un montant : « 150 000 », « 150000,5 », « 150 000,00 € » → '150000.00' ; null si invalide. */
export function parseMoneyInput(raw: string): string | null {
  const cleaned = raw.replace(/[\s\u00A0\u202F€]/g, '').replace(MINUS, '-').replace(',', '.');
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return fixed(D(cleaned), 2);
}
