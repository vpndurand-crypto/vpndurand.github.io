import { CURRENT_USER_ID, DATE_ARRETE } from '../config/demo';
import { reimportBalanceV2 } from '../data/balances';
import { reimportImportJobV2 } from '../data/importJobs';
import { seed } from '../data/seed';
import type { AlertItem, AuditEvent, CovenantAdjustment, DecimalString, EvaluationResult, Id, IsoDate, SavedTest, SeedData, TestKey } from '../data/types';
import { definitionAt, evaluateCovenantAt, testKey, type CovenantEvaluation } from '../domain/covenantTests';
import { D, fixed } from '../domain/decimal';
import { contractualTestDates, nextContractualTestDate } from '../domain/testDates';
import type {
  BaseMetricCode, CalcStatus, ClauseRef, Covenant, DecompositionNode, Entity, Financing, FinancingDocument, ImportJob, Lender, MetricCode,
  OutstandingDeclaration, TrialBalance, TrialBalanceLine, User,
} from '../data/types';
import { METRIC_LABELS } from '../data/labels';
import { findRule } from '../domain/accounting/mapping';
import { DERIVED_METRICS, flattenMetric } from '../domain/accounting/aggregates';
import { attribution } from '../domain/engine/attribution';
import { computeKpis, type KpiSet } from '../domain/kpis';
import { money, sum } from '../domain/decimal';
import { formatDate } from '../domain/format';
import { outstandingProvenance } from '../domain/provenance';
import { activeMapping, latestDeclaration } from '../domain/resolver';
import type { DrawerTarget } from './state';
import type { AdjustmentOverride, DemoState } from './state';

function applyOverrides(base: readonly CovenantAdjustment[], overrides: Record<TestKey, AdjustmentOverride>): CovenantAdjustment[] {
  const keys = Object.keys(overrides);
  const result = base.map((adjustment) => {
    const override = overrides[adjustment.test_key];
    return override ? { ...adjustment, amount: override.amount, justification: override.justification, created_by: CURRENT_USER_ID, created_at: override.at } : adjustment;
  });
  for (const key of keys) {
    const override = overrides[key];
    if (!override || base.some((a) => a.test_key === key)) continue;
    const covenantId = key.split('@')[0] ?? '';
    const category = seed.definitions.find((d) => d.covenant_id === covenantId)?.adjustment_categories[0];
    if (!category) continue;
    result.push({ id: `adj-demo-${key}`, test_key: key, category_id: category.id, label: category.label, amount: override.amount, justification: override.justification, document_id: null, created_by: CURRENT_USER_ID, created_at: override.at });
  }
  return result;
}

function buildDataView(state: DemoState): SeedData {
  const pristine = Object.keys(state.adjustmentOverrides).length === 0 && state.savedTests.length === 0 && state.balanceReimports.length === 0 && state.auditAppended.length === 0;
  if (pristine) return seed;
  let balances = seed.balances;
  let importJobs = seed.importJobs;
  for (const reimport of state.balanceReimports) {
    if (reimport.balanceId !== reimportBalanceV2.id || balances.some((b) => b.id === reimportBalanceV2.id)) continue;
    balances = [
      ...balances.map((b) => (b.entity_id === reimportBalanceV2.entity_id && b.period_end === reimportBalanceV2.period_end && b.status === 'ACTIVE'
        ? { ...b, status: 'SUPERSEDED' as const, superseded_at: reimport.at } : b)),
      reimportBalanceV2,
    ];
    importJobs = [...importJobs, { ...reimportImportJobV2, created_at: reimport.at }];
  }
  return {
    ...seed,
    balances,
    importJobs,
    adjustments: applyOverrides(seed.adjustments, state.adjustmentOverrides),
    savedTests: state.savedTests.length ? [...seed.savedTests, ...state.savedTests] : seed.savedTests,
    audit: state.auditAppended.length ? [...seed.audit, ...state.auditAppended] : seed.audit,
  };
}

let memo: { inputs: readonly unknown[]; view: SeedData } | null = null;

/** Vue unique des données : jeu initial + actions de la démonstration. Toutes les pages lisent cette vue. */
export function selectDataView(state: DemoState): SeedData {
  const inputs = [state.adjustmentOverrides, state.savedTests, state.balanceReimports, state.auditAppended];
  if (memo && memo.inputs.every((value, index) => value === inputs[index])) return memo.view;
  const view = buildDataView(state);
  memo = { inputs, view };
  return view;
}

export interface CovenantView {
  key: TestKey;
  current: CovenantEvaluation;
  saved: SavedTest[];
  latestSaved: SavedTest | null;
  lifecycle: 'DRAFT' | 'CLOSED';
  /** Les entrées ont changé depuis le dernier enregistrement (empreintes différentes). */
  modifiedSinceSave: boolean;
  /** Résultat affiché par défaut : l'instantané enregistré s'il existe, sinon le calcul courant. */
  displayed: EvaluationResult | null;
  /** Écart de valeur entre le calcul courant et l'instantané (10 décimales). */
  valueDelta: DecimalString | null;
}

const viewCache = new WeakMap<SeedData, Map<TestKey, CovenantView>>();

export function selectCovenantView(state: DemoState, covenantId: Id, date: IsoDate): CovenantView {
  const data = selectDataView(state);
  const key = testKey(covenantId, date);
  let byKey = viewCache.get(data);
  if (!byKey) {
    byKey = new Map();
    viewCache.set(data, byKey);
  }
  const hit = byKey.get(key);
  if (hit) return hit;
  const current = evaluateCovenantAt(data, covenantId, date);
  const saved = data.savedTests.filter((t) => t.key === key).sort((a, b) => b.occurrence - a.occurrence);
  const latestSaved = saved[0] ?? null;
  const modifiedSinceSave = Boolean(latestSaved && current.inputsHash !== latestSaved.snapshot.inputs_hash);
  const savedValue = latestSaved?.snapshot.result.value ?? null;
  const currentValue = current.result?.value ?? null;
  const view: CovenantView = {
    key, current, saved, latestSaved, lifecycle: latestSaved ? 'CLOSED' : 'DRAFT', modifiedSinceSave,
    displayed: latestSaved ? latestSaved.snapshot.result : current.result,
    valueDelta: modifiedSinceSave && savedValue !== null && currentValue !== null ? fixed(D(currentValue).minus(D(savedValue)), 10) : null,
  };
  byKey.set(key, view);
  return view;
}

/** Historique d'un covenant : dates de test contractuelles jusqu'à la prochaine date après l'arrêté. */
export function selectTestHistory(state: DemoState, covenantId: Id): Array<{ date: IsoDate; view: CovenantView }> {
  const data = selectDataView(state);
  const definition = definitionAt(data, covenantId, DATE_ARRETE);
  if (!definition) return [];
  const last = nextContractualTestDate(definition, DATE_ARRETE);
  return contractualTestDates(definition, definition.first_test_date, last).map((date) => ({ date, view: selectCovenantView(state, covenantId, date) }));
}

export function selectAudit(state: DemoState): AuditEvent[] {
  return [...selectDataView(state).audit].sort((a, b) => (a.created_at === b.created_at ? b.id.localeCompare(a.id) : b.created_at.localeCompare(a.created_at)));
}

export function selectAlerts(state: DemoState): Array<AlertItem & { acknowledged: boolean }> {
  return seed.preview.alerts.map((alert) => ({ ...alert, acknowledged: state.alertAcks.some((a) => a.alertId === alert.id) }));
}

// ---------------------------------------------------------------------------
// Sélecteurs d'écrans
// ---------------------------------------------------------------------------

export interface CovenantListItem {
  covenant: Covenant;
  entity: Entity | null;
  financing: Financing | null;
  lender: Lender | null;
  view: CovenantView;
  /** Résultat montré dans les listes (BR-201) : l'enregistré s'il est à jour, sinon le calcul actuel. */
  result: EvaluationResult | null;
  savedUpToDate: boolean;
  history: Array<{ date: IsoDate; value: DecimalString | null; status: CalcStatus | null }>;
  nextTestDate: IsoDate | null;
}

const covenantListCache = new WeakMap<SeedData, CovenantListItem[]>();
export function selectCovenantList(state: DemoState): CovenantListItem[] {
  const data = selectDataView(state);
  const hit = covenantListCache.get(data);
  if (hit) return hit;
  const items = data.covenants.map((covenant): CovenantListItem => {
    const view = selectCovenantView(state, covenant.id, DATE_ARRETE);
    const savedUpToDate = Boolean(view.latestSaved) && !view.modifiedSinceSave;
    const financing = data.financings.find((f) => covenant.financing_ids.includes(f.id)) ?? null;
    const definition = definitionAt(data, covenant.id, DATE_ARRETE);
    return {
      covenant, view, savedUpToDate, financing,
      entity: data.entities.find((e) => e.id === covenant.entity_id) ?? null,
      lender: financing ? data.lenders.find((l) => l.id === financing.lender_id) ?? null : null,
      result: savedUpToDate && view.latestSaved ? view.latestSaved.snapshot.result : view.current.result,
      history: selectTestHistory(state, covenant.id).map(({ date, view: v }) => ({ date, value: v.displayed?.value ?? null, status: v.displayed?.status ?? null })),
      nextTestDate: definition ? nextContractualTestDate(definition, DATE_ARRETE) : null,
    };
  });
  covenantListCache.set(data, items);
  return items;
}

export interface FinancingListItem {
  financing: Financing;
  entity: Entity | null;
  lender: Lender | null;
  outstanding: OutstandingDeclaration | null;
  declarations: OutstandingDeclaration[];
  covenants: CovenantListItem[];
  documents: FinancingDocument[];
}
const financingListCache = new WeakMap<SeedData, FinancingListItem[]>();
export function selectFinancingList(state: DemoState): FinancingListItem[] {
  const data = selectDataView(state);
  const hit = financingListCache.get(data);
  if (hit) return hit;
  const covenants = selectCovenantList(state);
  const items = data.financings.map((financing): FinancingListItem => ({
    financing,
    entity: data.entities.find((e) => e.id === financing.entity_id) ?? null,
    lender: data.lenders.find((l) => l.id === financing.lender_id) ?? null,
    outstanding: latestDeclaration(data, financing.id, DATE_ARRETE),
    declarations: data.outstanding.filter((o) => o.financing_id === financing.id).sort((a, b) => b.as_of_date.localeCompare(a.as_of_date)),
    covenants: covenants.filter((c) => c.covenant.financing_ids.includes(financing.id)),
    documents: data.documents.filter((d) => d.financing_ids.includes(financing.id)),
  }));
  financingListCache.set(data, items);
  return items;
}

/** Somme exacte de montants (pour les totaux de listes filtrées). */
export function sumAmounts(values: readonly DecimalString[]): DecimalString {
  return money(sum(values.map((v) => D(v))));
}

const kpiCache = new WeakMap<SeedData, Map<string, KpiSet>>();
export function selectKpis(state: DemoState): KpiSet {
  const data = selectDataView(state);
  const key = state.perimeter.join(',');
  let byPerimeter = kpiCache.get(data);
  if (!byPerimeter) {
    byPerimeter = new Map();
    kpiCache.set(data, byPerimeter);
  }
  const hit = byPerimeter.get(key);
  if (hit) return hit;
  const kpis = computeKpis(data, state.perimeter, DATE_ARRETE);
  byPerimeter.set(key, kpis);
  return kpis;
}

export interface BalanceView {
  balance: TrialBalance;
  entity: Entity | null;
  job: ImportJob | null;
  importedBy: User | null;
  rows: Array<{ line: TrialBalanceLine; metric: BaseMetricCode | null }>;
  aggregates: Array<{ code: MetricCode; label: string; accounts: string[] }>;
  replacement: TrialBalance | null;
}
export function selectBalanceView(state: DemoState, balanceId: Id): BalanceView | null {
  const data = selectDataView(state);
  const balance = data.balances.find((b) => b.id === balanceId);
  if (!balance) return null;
  const mapping = activeMapping(data, balance.entity_id);
  const job = data.importJobs.find((j) => j.id === balance.import_job_id) ?? null;
  const rows = balance.lines.map((line) => ({ line, metric: mapping ? findRule(line.account_number, mapping)?.metric_code ?? null : null }));
  const accountsOf = (code: MetricCode) => {
    const bases = new Set<BaseMetricCode>(flattenMetric(code).map((p) => p.code));
    return rows.filter((r) => r.metric && bases.has(r.metric)).map((r) => r.line.account_number);
  };
  const codes: MetricCode[] = [
    ...(Object.keys(DERIVED_METRICS) as MetricCode[]),
    ...[...new Set(rows.map((r) => r.metric).filter((m): m is BaseMetricCode => m !== null && m !== 'MC-99'))].sort(),
  ];
  return {
    balance, job, rows,
    entity: data.entities.find((e) => e.id === balance.entity_id) ?? null,
    importedBy: job ? data.users.find((u) => u.id === job.created_by) ?? null : null,
    aggregates: codes.map((code) => ({ code, label: METRIC_LABELS[code], accounts: accountsOf(code) })).filter((a) => a.accounts.length > 0),
    replacement: balance.status === 'SUPERSEDED'
      ? data.balances.find((b) => b.entity_id === balance.entity_id && b.period_end === balance.period_end && b.status === 'ACTIVE') ?? null
      : null,
  };
}

/** Attribution de la variation entre la date précédente et la date affichée (Aperçu, BR-190). */
export function selectVariation(state: DemoState, covenantId: Id, date: IsoDate) {
  const history = selectTestHistory(state, covenantId);
  const index = history.findIndex((h) => h.date === date);
  const previous = index > 0 ? history[index - 1]?.view.displayed : null;
  const current = index >= 0 ? history[index]?.view.displayed : null;
  if (!previous?.numerator || !previous.denominator || !current?.numerator || !current.denominator || !previous.value || !current.value) return null;
  const effects = attribution({ numerator: previous.numerator, denominator: previous.denominator }, { numerator: current.numerator, denominator: current.denominator });
  if (!effects) return null;
  return { fromDate: previous.calcDate, toDate: current.calcDate, fromValue: previous.value, toValue: current.value, ...effects };
}

export function findNode(root: DecompositionNode, id: string): DecompositionNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return null;
}

/** threshold : comparaison et forme du covenant, pour afficher un seuil avec son signe (« ≤ 3,50x »). */
export interface DrawerContent { target: DrawerTarget; node: DecompositionNode; context: string; snapshot: SavedTest | null; threshold: Pick<EvaluationResult, 'comparison' | 'form'> | null }
/** Résout la cible du panneau dans le calcul courant, dans un instantané figé, dans les indicateurs ou dans le registre des encours. */
export function selectDrawerContent(state: DemoState, target: DrawerTarget): DrawerContent | null {
  const data = selectDataView(state);
  if (target.scope === 'kpi') {
    const kpis = selectKpis(state);
    for (const root of [kpis.outstanding, kpis.cash, kpis.netDebt]) {
      const node = findNode(root, target.nodeId);
      if (node) return { target, node, context: `Groupe au ${formatDate(kpis.date)}`, snapshot: null, threshold: null };
    }
    return null;
  }
  if (target.scope === 'outstanding') {
    const od = data.outstanding.find((o) => o.id === target.nodeId);
    const financing = od ? data.financings.find((f) => f.id === od.financing_id) : undefined;
    if (!od || !financing) return null;
    return {
      target, snapshot: null, context: financing.label, threshold: null,
      node: { id: od.id, label: `Encours déclaré au ${formatDate(od.as_of_date)}`, value: od.amount, unit: 'EUR', sign: 1, role: 'OUTSTANDING', provenance: outstandingProvenance(od), clause: null, missing: [], children: [] },
    };
  }
  const [covenantId = '', date = ''] = target.scope.split('@');
  if (!data.covenants.some((c) => c.id === covenantId)) return null;
  const view = selectCovenantView(state, covenantId, date);
  const snapshot = target.occurrence === null ? null : view.saved.find((t) => t.occurrence === target.occurrence) ?? null;
  const result = snapshot ? snapshot.snapshot.result : view.current.result;
  const node = result ? findNode(result.tree, target.nodeId) : null;
  const covenant = data.covenants.find((c) => c.id === covenantId);
  return node && result
    ? { target, node, snapshot, context: `${covenant?.short_label ?? ''} au ${formatDate(date)}`, threshold: { comparison: result.comparison, form: result.form } }
    : null;
}

/** Clauses d'un document utilisées par des définitions de covenants. */
export function selectDocumentClauses(state: DemoState, documentId: Id): Array<{ clause: ClauseRef; usages: Array<{ covenant: Covenant; label: string }> }> {
  const data = selectDataView(state);
  const byClause = new Map<string, { clause: ClauseRef; usages: Array<{ covenant: Covenant; label: string }> }>();
  const add = (clause: ClauseRef, covenant: Covenant, label: string) => {
    if (clause.document_id !== documentId) return;
    const entry = byClause.get(clause.clause_id) ?? { clause, usages: [] };
    if (!entry.usages.some((u) => u.covenant.id === covenant.id && u.label === label)) entry.usages.push({ covenant, label });
    byClause.set(clause.clause_id, entry);
  };
  for (const definition of data.definitions) {
    const covenant = data.covenants.find((c) => c.id === definition.covenant_id);
    if (!covenant) continue;
    for (const c of definition.components) add(c.clause, covenant, c.label);
    for (const s of definition.threshold_steps) add(s.clause, covenant, 'Seuil');
    for (const a of definition.adjustment_categories) add(a.clause, covenant, `Retraitement — ${a.label}`);
  }
  return [...byClause.values()].sort((a, b) => a.clause.page - b.clause.page || a.clause.clause_id.localeCompare(b.clause.clause_id));
}

/** Une ligne du journal global : l'événement et son contexte (société, financement, covenant), lus dans les données courantes. */
export interface AuditRow {
  event: AuditEvent;
  user: User | null;
  entity: Entity | null;
  financing: Financing | null;
  covenant: Covenant | null;
  target: { kind: 'covenant'; id: Id; date: IsoDate | null } | { kind: 'financing'; id: Id } | { kind: 'document'; id: Id } | { kind: 'balance'; id: Id } | null;
}
export function selectAuditList(state: DemoState): AuditRow[] {
  const data = selectDataView(state);
  const financingOf = (covenant: Covenant | null) => (covenant ? data.financings.find((f) => covenant.financing_ids.includes(f.id)) ?? null : null);
  return selectAudit(state).map((event): AuditRow => {
    const base = { event, user: data.users.find((u) => u.id === event.user_id) ?? null, entity: data.entities.find((e) => e.id === event.entity_id) ?? null };
    switch (event.target_type) {
      case 'TEST': {
        const [covenantId = '', date = null] = event.target_id.split('@');
        const covenant = data.covenants.find((c) => c.id === covenantId) ?? null;
        return { ...base, covenant, financing: financingOf(covenant), target: covenant ? { kind: 'covenant', id: covenant.id, date } : null };
      }
      case 'COVENANT_DEFINITION': {
        const definition = data.definitions.find((d) => d.id === event.target_id);
        const covenant = data.covenants.find((c) => c.id === definition?.covenant_id) ?? null;
        return { ...base, covenant, financing: financingOf(covenant), target: covenant ? { kind: 'covenant', id: covenant.id, date: null } : null };
      }
      case 'ADJUSTMENT': {
        const adjustment = data.adjustments.find((a) => a.id === event.target_id);
        const [covenantId = '', date = null] = adjustment?.test_key.split('@') ?? [];
        const covenant = data.covenants.find((c) => c.id === covenantId) ?? null;
        return { ...base, covenant, financing: financingOf(covenant), target: covenant ? { kind: 'covenant', id: covenant.id, date } : null };
      }
      case 'FINANCING': {
        const financing = data.financings.find((f) => f.id === event.target_id) ?? null;
        return { ...base, covenant: null, financing, target: financing ? { kind: 'financing', id: financing.id } : null };
      }
      case 'OUTSTANDING': {
        const od = data.outstanding.find((o) => o.id === event.target_id);
        const financing = data.financings.find((f) => f.id === od?.financing_id) ?? null;
        return { ...base, covenant: null, financing, target: financing ? { kind: 'financing', id: financing.id } : null };
      }
      case 'DOCUMENT': {
        const document = data.documents.find((d) => d.id === event.target_id);
        const financing = data.financings.find((f) => document?.financing_ids.includes(f.id)) ?? null;
        return { ...base, covenant: null, financing, target: document ? { kind: 'document', id: document.id } : null };
      }
      case 'TRIAL_BALANCE':
        return { ...base, covenant: null, financing: null, target: data.balances.some((b) => b.id === event.target_id) ? { kind: 'balance', id: event.target_id } : null };
      default:
        return { ...base, covenant: null, financing: null, target: null };
    }
  });
}
