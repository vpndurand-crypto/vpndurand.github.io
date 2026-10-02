import {
  formatCovenantValue, formatDate, formatDateTime, formatMoney, formatMoneyCompact, formatPercent, formatRatio, formatSignedMoney, formatSignedRatio, formatThreshold,
} from '../../domain/format';
import type { DecompositionNode } from '../../data/types';

/** Seul point d'accès des écrans aux formats français (BETA-020). */
export const fmt = {
  money: (v: string) => formatMoney(v),
  amount: (v: string) => formatMoney(v, { currency: false }),
  compact: (v: string) => formatMoneyCompact(v),
  signedMoney: (v: string) => formatSignedMoney(v),
  ratio: (v: string, dp = 2) => formatRatio(v, dp),
  signedRatio: (v: string) => formatSignedRatio(v),
  pct: (v: string, dp = 1) => formatPercent(v, dp),
  covenant: formatCovenantValue,
  threshold: formatThreshold,
  date: formatDate,
  dateTime: formatDateTime,
  node: (node: Pick<DecompositionNode, 'value' | 'unit'>) => (node.value === null ? '—' : node.unit === 'RATIO' ? formatRatio(node.value) : formatMoney(node.value)),
};
