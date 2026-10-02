import { D, ZERO, type Decimal } from '../decimal';
import { formatMoney } from '../format';
import { findRule } from './mapping';
import type { AccountingMapping, BaseMetricCode, DerivedMetricCode, MetricCode, TrialBalance, TrialBalanceLine } from '../../data/types';

export const BASE_METRIC_CODES: readonly BaseMetricCode[] = [
  'MC-01', 'MC-02', 'MC-03', 'MC-04', 'MC-05', 'MC-06', 'MC-07', 'MC-08', 'MC-09', 'MC-10',
  'MC-11', 'MC-12', 'MC-13', 'MC-14', 'MC-15', 'MC-16', 'MC-17', 'MC-18', 'MC-19', 'MC-99',
];

interface Part { code: MetricCode; sign: 1 | -1 }
/** Agrégats calculés du cahier V1 (MC-30 à MC-33). */
export const DERIVED_METRICS: Record<DerivedMetricCode, readonly Part[]> = {
  'MC-30': [{ code: 'MC-01', sign: 1 }, { code: 'MC-02', sign: 1 }, { code: 'MC-03', sign: -1 }, { code: 'MC-04', sign: -1 }, { code: 'MC-05', sign: -1 }, { code: 'MC-06', sign: -1 }],
  'MC-31': [{ code: 'MC-13', sign: 1 }, { code: 'MC-14', sign: 1 }, { code: 'MC-16', sign: 1 }],
  'MC-32': [{ code: 'MC-17', sign: 1 }, { code: 'MC-18', sign: 1 }],
  'MC-33': [{ code: 'MC-30', sign: 1 }, { code: 'MC-07', sign: -1 }],
};

export function isDerived(code: MetricCode): code is DerivedMetricCode {
  return code in DERIVED_METRICS;
}

/** Décompose un agrégat en agrégats de base signés. */
export function flattenMetric(code: MetricCode, sign: 1 | -1 = 1): Array<{ code: BaseMetricCode; sign: 1 | -1 }> {
  if (!isDerived(code)) return [{ code, sign }];
  return DERIVED_METRICS[code].flatMap((part) => flattenMetric(part.code, (part.sign * sign) as 1 | -1));
}

export interface AccountContribution {
  accountNumber: string;
  label: string;
  row: number;
  line: TrialBalanceLine;
  /** Solde × signe de la règle : contribution positive à l'agrégat de base. */
  contribution: Decimal;
  metric: BaseMetricCode;
}
export interface BalanceAggregates {
  values: ReadonlyMap<MetricCode, Decimal>;
  contributions: ReadonlyMap<BaseMetricCode, readonly AccountContribution[]>;
  unmapped: readonly TrialBalanceLine[];
}

const cache = new WeakMap<TrialBalance, WeakMap<AccountingMapping, BalanceAggregates>>();

export function computeAggregates(balance: TrialBalance, mapping: AccountingMapping): BalanceAggregates {
  const byMapping = cache.get(balance) ?? new WeakMap<AccountingMapping, BalanceAggregates>();
  cache.set(balance, byMapping);
  const hit = byMapping.get(mapping);
  if (hit) return hit;

  const contributions = new Map<BaseMetricCode, AccountContribution[]>();
  const unmapped: TrialBalanceLine[] = [];
  for (const line of balance.lines) {
    const rule = findRule(line.account_number, mapping);
    if (!rule) {
      if (!D(line.balance).eq(0)) unmapped.push(line);
      continue;
    }
    const list = contributions.get(rule.metric_code) ?? [];
    list.push({ accountNumber: line.account_number, label: line.label, row: line.row, line, contribution: D(line.balance).times(rule.sign), metric: rule.metric_code });
    contributions.set(rule.metric_code, list);
  }
  const values = new Map<MetricCode, Decimal>();
  for (const code of BASE_METRIC_CODES) {
    values.set(code, (contributions.get(code) ?? []).reduce<Decimal>((acc, c) => acc.plus(c.contribution), ZERO));
  }
  for (const code of Object.keys(DERIVED_METRICS) as DerivedMetricCode[]) {
    values.set(code, flattenMetric(code).reduce<Decimal>((acc, part) => acc.plus((values.get(part.code) ?? ZERO).times(part.sign)), ZERO));
  }
  const result: BalanceAggregates = { values, contributions, unmapped };
  byMapping.set(mapping, result);
  return result;
}

export function metricValue(aggregates: BalanceAggregates, code: MetricCode): Decimal {
  return aggregates.values.get(code) ?? ZERO;
}

/** Comptes qui composent un agrégat, avec leur signe dans cet agrégat, dans l'ordre de la balance. */
export function metricAccounts(aggregates: BalanceAggregates, code: MetricCode): Array<{ account: AccountContribution; sign: 1 | -1 }> {
  return flattenMetric(code)
    .flatMap((part) => (aggregates.contributions.get(part.code) ?? []).map((account) => ({ account, sign: part.sign })))
    .sort((a, b) => a.account.row - b.account.row);
}

/** Formule lisible : « MC-17 588 000,00 + MC-18 12 000,00 » ou, pour un agrégat de base, la somme de ses comptes. */
export function metricFormula(aggregates: BalanceAggregates, code: MetricCode): string {
  const parts: Array<{ label: string; value: Decimal; sign: 1 | -1 }> = isDerived(code)
    ? DERIVED_METRICS[code].map((part) => ({ label: `${part.code} `, value: metricValue(aggregates, part.code), sign: part.sign }))
    : metricAccounts(aggregates, code).map(({ account, sign }) => ({ label: `${account.accountNumber} `, value: account.contribution, sign }));
  if (parts.length === 0) return `${code} : aucun compte`;
  return parts
    .map((part, index) => {
      const negative = part.sign * (part.value.lt(0) ? -1 : 1) < 0;
      const text = `${part.label}${formatMoney(part.value.abs(), { currency: false })}`;
      if (index === 0) return negative ? `− ${text}` : text;
      return `${negative ? '−' : '+'} ${text}`;
    })
    .join(' ');
}
