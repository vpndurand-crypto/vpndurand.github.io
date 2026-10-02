import { computeAggregates, metricAccounts, metricFormula, metricValue } from './accounting/aggregates';
import { D, ZERO, money, type Decimal } from './decimal';
import { formatDate } from './format';
import { balanceLineProvenance, calculationProvenance, formulaFromTerms, nodeId, outstandingProvenance } from './provenance';
import { activeMapping, findActiveBalance, latestDeclaration } from './resolver';
import { FINANCING_CATEGORY_LABELS } from '../data/labels';
import type { DecimalString, DecompositionNode, Id, IsoDate, SeedData } from '../data/types';

/** Indicateurs du périmètre choisi, chacun avec son arbre de provenance (plan technique, K-01, K-13, K-14). */
export interface KpiSet {
  date: IsoDate;
  outstanding: DecompositionNode;
  cash: DecompositionNode;
  netDebt: DecompositionNode;
  financingCount: number;
  entityCount: number;
  byLender: Array<{ lenderId: Id; label: string; amount: DecimalString; share: DecimalString }>;
  /** Encours par type de financement et par année de maturité (BETA-06, plan 18.1). */
  byCategory: Distribution[];
  byMaturityYear: Distribution[];
  lenderCount: number;
  missing: string[];
}

export interface Distribution { key: string; label: string; amount: DecimalString; share: DecimalString }

function distribute(groups: Map<string, { label: string; amount: Decimal }>, total: Decimal, order: (a: Distribution, b: Distribution) => number): Distribution[] {
  return [...groups.entries()]
    .map(([key, g]) => ({ key, label: g.label, amount: money(g.amount), share: total.eq(0) ? '0' : g.amount.div(total).toFixed(6) }))
    .sort(order);
}

export function computeKpis(data: SeedData, perimeter: readonly Id[], date: IsoDate): KpiSet {
  const financings = data.financings.filter((f) => perimeter.includes(f.entity_id) && f.status === 'ACTIVE');
  const missing: string[] = [];

  const outstandingChildren: DecompositionNode[] = [];
  let outstandingTotal = ZERO;
  const byLender = new Map<Id, Decimal>();
  const byCategory = new Map<string, { label: string; amount: Decimal }>();
  const byYear = new Map<string, { label: string; amount: Decimal }>();
  for (const financing of financings) {
    const od = latestDeclaration(data, financing.id, date);
    if (!od) {
      missing.push(`encours déclaré de ${financing.label} au ${formatDate(date)}`);
      continue;
    }
    outstandingTotal = outstandingTotal.plus(D(od.amount));
    byLender.set(financing.lender_id, (byLender.get(financing.lender_id) ?? ZERO).plus(D(od.amount)));
    const category = byCategory.get(financing.category) ?? { label: FINANCING_CATEGORY_LABELS[financing.category], amount: ZERO };
    byCategory.set(financing.category, { ...category, amount: category.amount.plus(D(od.amount)) });
    const year = financing.maturity_date.slice(0, 4);
    const maturity = byYear.get(year) ?? { label: year, amount: ZERO };
    byYear.set(year, { ...maturity, amount: maturity.amount.plus(D(od.amount)) });
    outstandingChildren.push({
      id: nodeId('kpi', 'encours', od.id), label: financing.label, value: money(D(od.amount)), unit: 'EUR', sign: 1, role: 'OUTSTANDING',
      provenance: outstandingProvenance(od), clause: null, missing: [], children: [],
    });
  }
  const outstanding: DecompositionNode = {
    id: nodeId('kpi', 'encours'), label: 'Encours total', value: money(outstandingTotal), unit: 'EUR', sign: 1, role: 'AGGREGATE',
    provenance: calculationProvenance('K-01', formulaFromTerms(outstandingChildren.map((c) => ({ value: D(c.value ?? '0'), sign: 1 as const }))), outstandingChildren.map((c) => c.id)),
    clause: null, missing: [], children: outstandingChildren,
  };

  const cashChildren: DecompositionNode[] = [];
  let cashTotal = ZERO;
  for (const entity of data.entities.filter((e) => perimeter.includes(e.id))) {
    const balance = findActiveBalance(data, entity.id, date);
    const mapping = activeMapping(data, entity.id);
    if (!balance || !mapping) {
      missing.push(`balance de ${entity.name} au ${formatDate(date)}`);
      continue;
    }
    const aggregates = computeAggregates(balance, mapping);
    const value = metricValue(aggregates, 'MC-32');
    cashTotal = cashTotal.plus(value);
    const id = nodeId('kpi', 'tresorerie', entity.id);
    const job = data.importJobs.find((j) => j.id === balance.import_job_id);
    const accounts = metricAccounts(aggregates, 'MC-32').map(({ account, sign }): DecompositionNode => ({
      id: nodeId(id, account.accountNumber), label: `${account.accountNumber} ${account.label}`, value: money(account.contribution), unit: 'EUR', sign,
      role: 'ACCOUNT', provenance: balanceLineProvenance(balance, job, account.line), clause: null, missing: [], children: [],
    }));
    cashChildren.push({
      id, label: entity.name, value: money(value), unit: 'EUR', sign: 1, role: 'AGGREGATE',
      provenance: calculationProvenance('BR-166', metricFormula(aggregates, 'MC-32'), accounts.map((a) => a.id)), clause: null, missing: [], children: accounts,
    });
  }
  const cash: DecompositionNode = {
    id: nodeId('kpi', 'tresorerie'), label: 'Trésorerie comptable', value: money(cashTotal), unit: 'EUR', sign: 1, role: 'AGGREGATE',
    provenance: calculationProvenance('K-13', formulaFromTerms(cashChildren.map((c) => ({ value: D(c.value ?? '0'), sign: 1 as const }))), cashChildren.map((c) => c.id)),
    clause: null, missing: [], children: cashChildren,
  };
  const netDebt: DecompositionNode = {
    id: nodeId('kpi', 'dette-nette'), label: 'Dette nette de gestion', value: money(outstandingTotal.minus(cashTotal)), unit: 'EUR', sign: 1, role: 'AGGREGATE',
    provenance: calculationProvenance('K-14', formulaFromTerms([{ value: outstandingTotal, sign: 1 }, { value: cashTotal, sign: -1 }]), [outstanding.id, cash.id]),
    clause: null, missing: [], children: [outstanding, { ...cash, sign: -1 }],
  };
  return {
    date, outstanding, cash, netDebt, financingCount: financings.length, entityCount: perimeter.length,
    byLender: [...byLender.entries()]
      .map(([lenderId, amount]) => ({ lenderId, label: data.lenders.find((l) => l.id === lenderId)?.name ?? lenderId, amount: money(amount), share: outstandingTotal.eq(0) ? '0' : amount.div(outstandingTotal).toFixed(6) }))
      .sort((a, b) => (D(b.amount).cmp(D(a.amount)))),
    byCategory: distribute(byCategory, outstandingTotal, (a, b) => D(b.amount).cmp(D(a.amount))),
    byMaturityYear: distribute(byYear, outstandingTotal, (a, b) => a.key.localeCompare(b.key)),
    lenderCount: byLender.size,
    missing,
  };
}
