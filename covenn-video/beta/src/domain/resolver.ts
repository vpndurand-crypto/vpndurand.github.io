import { computeAggregates, metricAccounts, metricFormula, metricValue } from './accounting/aggregates';
import { ltmPlan } from './accounting/ltm';
import { yearOf } from './dates';
import { D, ZERO, money, type Decimal } from './decimal';
import { formatDate } from './format';
import {
  adjustmentProvenance, balanceLineProvenance, calculationProvenance, componentNodeId, formulaFromTerms, nodeId, outstandingProvenance,
} from './provenance';
import type { ResolvedAdjustment, ResolvedComponent } from './engine/types';
import { METRIC_LABELS } from '../data/labels';
import type {
  AccountingMapping, Covenant, CovenantComponent, CovenantDefinition, DecompositionNode, Entity, Id, IsoDate, MetricCode, MissingInput,
  OutstandingDeclaration, SeedData, SnapshotVersions, TestKey, TrialBalance,
} from '../data/types';

export interface ResolvedInputs { components: ResolvedComponent[]; adjustments: ResolvedAdjustment[]; versions: SnapshotVersions }

export function findActiveBalance(data: SeedData, entityId: Id, date: IsoDate): TrialBalance | null {
  let best: TrialBalance | null = null;
  for (const b of data.balances) {
    if (b.entity_id === entityId && b.period_end === date && b.status === 'ACTIVE' && (!best || b.version > best.version)) best = b;
  }
  return best;
}
export function activeMapping(data: SeedData, entityId: Id): AccountingMapping | null {
  return data.mappings.find((m) => m.entity_id === entityId && m.status === 'ACTIVE') ?? null;
}
export function latestDeclaration(data: SeedData, financingId: Id, date: IsoDate): OutstandingDeclaration | null {
  let best: OutstandingDeclaration | null = null;
  for (const od of data.outstanding) {
    if (od.financing_id === financingId && od.as_of_date === date && (!best || od.created_at > best.created_at)) best = od;
  }
  return best;
}

type MetricResult = { value: Decimal; children: DecompositionNode[]; formula: string; balance: TrialBalance } | { missing: MissingInput };

/** Transforme une définition et une date en composantes résolues, chacune avec son origine (plan technique, section 8.3). */
export function resolveInputs(data: SeedData, covenant: Covenant, definition: CovenantDefinition, date: IsoDate, key: TestKey): ResolvedInputs {
  const entity: Entity | undefined = data.entities.find((e) => e.id === covenant.entity_id);
  if (!entity) throw new Error(`Société inconnue : ${covenant.entity_id}`);
  const mapping = activeMapping(data, entity.id);
  const usedBalances = new Map<Id, TrialBalance>();
  const usedOutstanding = new Set<Id>();

  const metricAt = (at: IsoDate, code: MetricCode, id: string): MetricResult => {
    const balance = findActiveBalance(data, entity.id, at);
    if (!balance) return { missing: { code: 'BALANCE_MISSING', label: `balance de ${entity.name} au ${formatDate(at)}`, entityId: entity.id, financingId: null, date: at } };
    if (!mapping) return { missing: { code: 'MAPPING_INCOMPLETE', label: `mapping comptable de ${entity.name}`, entityId: entity.id, financingId: null, date: at } };
    const aggregates = computeAggregates(balance, mapping);
    if (aggregates.unmapped.length > 0) {
      return { missing: { code: 'MAPPING_INCOMPLETE', label: `mapping des comptes de la balance de ${entity.name} au ${formatDate(at)}`, entityId: entity.id, financingId: null, date: at } };
    }
    usedBalances.set(balance.id, balance);
    const job = data.importJobs.find((j) => j.id === balance.import_job_id);
    const children = metricAccounts(aggregates, code).map(({ account, sign }): DecompositionNode => ({
      id: nodeId(id, account.accountNumber), label: `${account.accountNumber} ${account.label}`, value: money(account.contribution), unit: 'EUR',
      sign, role: 'ACCOUNT', provenance: balanceLineProvenance(balance, job, account.line), clause: null, missing: [], children: [],
    }));
    return { value: metricValue(aggregates, code), children, formula: metricFormula(aggregates, code), balance };
  };

  const resolve = (component: CovenantComponent): ResolvedComponent => {
    const id = componentNodeId(key, component.side, component.id);
    const base = { componentId: component.id, side: component.side, sequence: component.sequence, sign: component.sign, label: component.label, clause: component.clause };
    const noSources = { balances: [], outstanding: [] };

    if (component.source_kind === 'REGISTRY_OUTSTANDING') {
      const missing: MissingInput[] = [];
      const declarations: OutstandingDeclaration[] = [];
      for (const financingId of component.financing_ids) {
        const financing = data.financings.find((f) => f.id === financingId);
        const declaration = latestDeclaration(data, financingId, date);
        if (!declaration) {
          missing.push({ code: 'OUTSTANDING_MISSING', label: `encours déclaré de ${financing?.label ?? financingId} au ${formatDate(date)}`, entityId: entity.id, financingId, date });
        } else {
          declarations.push(declaration);
          usedOutstanding.add(declaration.id);
        }
      }
      const total = declarations.reduce<Decimal>((acc, od) => acc.plus(D(od.amount)), ZERO);
      const single = declarations.length === 1 && component.financing_ids.length === 1 ? declarations[0] : undefined;
      const children = single ? [] : declarations.map((od): DecompositionNode => ({
        id: nodeId(id, od.id), label: `Encours déclaré — ${data.financings.find((f) => f.id === od.financing_id)?.label ?? od.financing_id}`,
        value: money(D(od.amount)), unit: 'EUR', sign: 1, role: 'OUTSTANDING', provenance: outstandingProvenance(od), clause: null, missing: [], children: [],
      }));
      return {
        ...base, value: missing.length > 0 ? null : money(total), missing, children,
        provenance: single ? outstandingProvenance(single) : calculationProvenance('Somme des encours déclarés', formulaFromTerms(declarations.map((od) => ({ value: D(od.amount), sign: 1 as const }))), children.map((c) => c.id)),
        sources: { balances: [], outstanding: declarations.map((od) => od.id).sort() },
      };
    }

    if (component.source_kind === 'MANUAL_VALUE' || component.metric_code === null) {
      return {
        ...base, value: null, children: [], provenance: calculationProvenance('Saisie attendue', 'Valeur à saisir', []), sources: noSources,
        missing: [{ code: 'MANUAL_VALUE_MISSING', label: `valeur « ${component.label} » au ${formatDate(date)}`, entityId: entity.id, financingId: null, date }],
      };
    }

    const code = component.metric_code;
    if (component.basis === null) {
      const result = metricAt(date, code, id);
      if ('missing' in result) {
        return { ...base, value: null, children: [], missing: [result.missing], provenance: calculationProvenance('BR-166', `${code} au ${formatDate(date)}`, []), sources: noSources };
      }
      return {
        ...base, value: money(result.value), children: result.children, missing: [],
        provenance: calculationProvenance('BR-166', result.formula, result.children.map((c) => c.id)),
        sources: { balances: [{ id: result.balance.id, version: result.balance.version }], outstanding: [] },
      };
    }

    const plan = ltmPlan(date, entity.fiscal_year_end_month, entity.fiscal_year_end_day);
    const name = METRIC_LABELS[code];
    const parts = plan.kind === 'FISCAL_YEAR_END'
      ? [{ at: plan.ytd, sign: 1 as const, slug: `fy-${yearOf(plan.ytd)}`, label: `${name}, exercice ${yearOf(plan.ytd)}` }]
      : [
          { at: plan.ytd, sign: 1 as const, slug: `ytd-${plan.ytd}`, label: `${name}, cumul au ${formatDate(plan.ytd)}` },
          { at: plan.fiscalYear, sign: 1 as const, slug: `fy-${yearOf(plan.fiscalYear)}`, label: `${name}, exercice ${yearOf(plan.fiscalYear)}` },
          { at: plan.ytdPrior, sign: -1 as const, slug: `ytd-${plan.ytdPrior}`, label: `${name}, cumul au ${formatDate(plan.ytdPrior)}` },
        ];
    const children: DecompositionNode[] = [];
    const missing: MissingInput[] = [];
    const balances: Array<{ id: Id; version: number }> = [];
    let total = ZERO;
    for (const part of parts) {
      const partId = nodeId(id, part.slug);
      const result = metricAt(part.at, code, partId);
      if ('missing' in result) {
        missing.push(result.missing);
        continue;
      }
      total = total.plus(result.value.times(part.sign));
      balances.push({ id: result.balance.id, version: result.balance.version });
      children.push({
        id: partId, label: part.label, value: money(result.value), unit: 'EUR', sign: part.sign, role: 'AGGREGATE',
        provenance: calculationProvenance('BR-166', result.formula, result.children.map((c) => c.id)), clause: null, missing: [], children: result.children,
      });
    }
    const formula = missing.length > 0 ? 'Non calculable : balance manquante' : formulaFromTerms(children.map((c) => ({ value: D(c.value ?? '0'), sign: c.sign ?? 1 })));
    return {
      ...base, value: missing.length > 0 ? null : money(total), children, missing,
      provenance: calculationProvenance('BR-179', formula, children.map((c) => c.id)),
      sources: { balances: balances.sort((a, b) => a.id.localeCompare(b.id)), outstanding: [] },
    };
  };

  const components = [...definition.components]
    .sort((a, b) => (a.side === b.side ? a.sequence - b.sequence : a.side === 'NUMERATOR' ? -1 : 1))
    .map(resolve);
  const adjustments: ResolvedAdjustment[] = data.adjustments
    .filter((a) => a.test_key === key)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => ({ adjustmentId: a.id, categoryId: a.category_id, label: a.label, amountEntered: a.amount, provenance: adjustmentProvenance(a) }));
  const versions: SnapshotVersions = {
    balances: [...usedBalances.values()].map((b) => ({ id: b.id, version: b.version })).sort((a, b) => a.id.localeCompare(b.id)),
    outstanding: [...usedOutstanding].sort(),
    mapping: mapping ? { id: mapping.id, version: mapping.version } : null,
  };
  return { components, adjustments, versions };
}
