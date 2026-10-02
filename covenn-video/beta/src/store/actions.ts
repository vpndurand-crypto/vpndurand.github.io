import { CURRENT_USER_ID, DEMO_TODAY } from '../config/demo';
import { reimportBalanceV2 } from '../data/balances';
import { STATUS_META } from '../data/labels';
import type { AuditEvent, DecimalString, Id, IsoDate, IsoDateTime, SavedTest, TestKey } from '../data/types';
import { computeAggregates, metricValue } from '../domain/accounting/aggregates';
import { buildSavedTest, testKey } from '../domain/covenantTests';
import { D, money } from '../domain/decimal';
import { formatCovenantValue, formatDate, formatMoney } from '../domain/format';
import { selectCovenantView, selectDataView } from './selectors';
import type { AdjustmentOverride, AlertAck, BalanceReimport, DemoState, DrawerTarget, PersistedState, SimulationShocks } from './state';

/** Événement de journal préparé par une action ; le réducteur lui attribue son identifiant séquentiel. */
export type AuditDraft = Omit<AuditEvent, 'id' | 'organization_id' | 'origin'>;

export type DemoAction =
  | { type: 'SIGN_IN' }
  | { type: 'SET_PERIMETER'; entityIds: Id[] }
  | { type: 'COMMIT_ADJUSTMENT'; testKey: TestKey; override: AdjustmentOverride; audit: AuditDraft[] }
  | { type: 'RESTORE_ADJUSTMENT'; testKey: TestKey; audit: AuditDraft[] }
  | { type: 'SAVE_TEST'; test: SavedTest; audit: AuditDraft[] }
  | { type: 'REIMPORT_BALANCE'; reimport: BalanceReimport; audit: AuditDraft[] }
  | { type: 'ACK_ALERT'; ack: AlertAck; audit: AuditDraft[] }
  | { type: 'OPEN_PROVENANCE'; target: DrawerTarget }
  | { type: 'PUSH_PROVENANCE'; target: DrawerTarget }
  | { type: 'POP_PROVENANCE'; depth: number }
  | { type: 'CLOSE_PROVENANCE' }
  | { type: 'SHOW_TOAST'; text: string; detail: string | null }
  | { type: 'DISMISS_TOAST'; id: number }
  | { type: 'SET_SIMULATION'; covenantId: Id; shocks: SimulationShocks }
  | { type: 'RESET_SIMULATION'; covenantId: Id }
  | { type: 'HYDRATE'; persisted: PersistedState }
  | { type: 'RESET_DEMO' };

/**
 * Horodatage d'une action : jour de démonstration (20/10/2026), 10:30 pour la première action de la session,
 * puis une minute par événement déjà ajouté au journal. Deux prises identiques affichent donc les mêmes heures.
 */
export function demoStamp(state: DemoState): IsoDateTime {
  const minutes = 10 * 60 + 30 + state.auditAppended.length;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${DEMO_TODAY}T${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}:00`;
}

function covenantContext(state: DemoState, covenantId: Id, date: IsoDate) {
  const data = selectDataView(state);
  const covenant = data.covenants.find((c) => c.id === covenantId);
  if (!covenant) throw new Error(`Covenant inconnu : ${covenantId}`);
  return { data, covenant, key: testKey(covenantId, date), label: `${covenant.short_label} au ${formatDate(date)}` };
}

function calculationRun(entityId: Id, key: TestKey, label: string, at: IsoDateTime): AuditDraft {
  return { entity_id: entityId, user_id: CURRENT_USER_ID, action: 'CALCULATION_RUN', target_type: 'TEST', target_id: key, target_label: label, before: null, after: { déclencheur: 'modification d’une entrée' }, created_at: at };
}

export const signIn = (): DemoAction => ({ type: 'SIGN_IN' });
export const setPerimeter = (entityIds: Id[]): DemoAction => ({ type: 'SET_PERIMETER', entityIds });

export function commitAdjustment(state: DemoState, covenantId: Id, date: IsoDate, amount: DecimalString, justification: string, at: IsoDateTime = demoStamp(state)): DemoAction {
  const { data, covenant, key, label } = covenantContext(state, covenantId, date);
  const previous = data.adjustments.find((a) => a.test_key === key);
  const value = money(D(amount));
  return {
    type: 'COMMIT_ADJUSTMENT', testKey: key, override: { amount: value, justification, at },
    audit: [
      { entity_id: covenant.entity_id, user_id: CURRENT_USER_ID, action: 'ADJUSTMENT_SAVED', target_type: 'ADJUSTMENT', target_id: previous?.id ?? `adj-demo-${key}`, target_label: `Retraitement ${label}`, before: { montant: previous ? formatMoney(previous.amount) : 'aucun' }, after: { montant: formatMoney(value), justification }, created_at: at },
      calculationRun(covenant.entity_id, key, label, at),
    ],
  };
}

export function restoreAdjustment(state: DemoState, covenantId: Id, date: IsoDate, at: IsoDateTime = demoStamp(state)): DemoAction {
  const { data, covenant, key, label } = covenantContext(state, covenantId, date);
  const current = data.adjustments.find((a) => a.test_key === key);
  const original = selectDataView({ ...state, adjustmentOverrides: {} }).adjustments.find((a) => a.test_key === key);
  return {
    type: 'RESTORE_ADJUSTMENT', testKey: key,
    audit: [
      { entity_id: covenant.entity_id, user_id: CURRENT_USER_ID, action: 'ADJUSTMENT_RESTORED', target_type: 'ADJUSTMENT', target_id: current?.id ?? `adj-demo-${key}`, target_label: `Retraitement ${label}`, before: { montant: current ? formatMoney(current.amount) : 'aucun' }, after: { montant: original ? formatMoney(original.amount) : 'aucun' }, created_at: at },
      calculationRun(covenant.entity_id, key, label, at),
    ],
  };
}

export function saveTest(state: DemoState, covenantId: Id, date: IsoDate, at: IsoDateTime = demoStamp(state)): DemoAction {
  const { covenant, key, label } = covenantContext(state, covenantId, date);
  const view = selectCovenantView(state, covenantId, date);
  const test = buildSavedTest(view.current, { occurrence: view.saved.length + 1, closedBy: CURRENT_USER_ID, closedAt: at });
  const result = test.snapshot.result;
  return {
    type: 'SAVE_TEST', test,
    audit: [{
      entity_id: covenant.entity_id, user_id: CURRENT_USER_ID, action: 'TEST_CLOSED', target_type: 'TEST', target_id: key, target_label: label, before: null,
      after: {
        valeur: result.valueExact ? formatCovenantValue(result.valueExact, result.threshold, result.form) : '—',
        statut: STATUS_META[result.status].label, occurrence: String(test.occurrence), empreinte: test.snapshot.inputs_hash.slice(0, 12),
      },
      created_at: at,
    }],
  };
}

export function reimportModifiedBalance(state: DemoState, at: IsoDateTime = demoStamp(state)): DemoAction {
  const data = selectDataView(state);
  const previous = data.balances.find((b) => b.entity_id === reimportBalanceV2.entity_id && b.period_end === reimportBalanceV2.period_end && b.version === reimportBalanceV2.version - 1);
  const mapping = data.mappings.find((m) => m.entity_id === reimportBalanceV2.entity_id);
  const entity = data.entities.find((e) => e.id === reimportBalanceV2.entity_id);
  const cash = (b: typeof previous) => (b && mapping ? formatMoney(metricValue(computeAggregates(b, mapping), 'MC-32')) : '—');
  return {
    type: 'REIMPORT_BALANCE', reimport: { balanceId: reimportBalanceV2.id, at },
    audit: [{
      entity_id: reimportBalanceV2.entity_id, user_id: CURRENT_USER_ID, action: 'TRIAL_BALANCE_IMPORTED', target_type: 'TRIAL_BALANCE', target_id: reimportBalanceV2.id,
      target_label: `Balance ${entity?.name ?? ''} au ${formatDate(reimportBalanceV2.period_end)}, version ${reimportBalanceV2.version}`,
      before: { version: String(reimportBalanceV2.version - 1), trésorerie: cash(previous) }, after: { version: String(reimportBalanceV2.version), trésorerie: cash(reimportBalanceV2) }, created_at: at,
    }],
  };
}

export function ackAlert(state: DemoState, alertId: Id, at: IsoDateTime = demoStamp(state)): DemoAction {
  const alert = selectDataView(state).preview.alerts.find((a) => a.id === alertId);
  return {
    type: 'ACK_ALERT', ack: { alertId, by: CURRENT_USER_ID, at },
    audit: [{ entity_id: alert?.entity_id ?? null, user_id: CURRENT_USER_ID, action: 'ALERT_ACKNOWLEDGED', target_type: 'ALERT', target_id: alertId, target_label: alert?.title ?? alertId, before: null, after: null, created_at: at }],
  };
}

export const openProvenance = (target: DrawerTarget): DemoAction => ({ type: 'OPEN_PROVENANCE', target });
export const pushProvenance = (target: DrawerTarget): DemoAction => ({ type: 'PUSH_PROVENANCE', target });
export const popProvenance = (depth: number): DemoAction => ({ type: 'POP_PROVENANCE', depth });
export const closeProvenance = (): DemoAction => ({ type: 'CLOSE_PROVENANCE' });
export const showToast = (text: string, detail: string | null = null): DemoAction => ({ type: 'SHOW_TOAST', text, detail });
export const dismissToast = (id: number): DemoAction => ({ type: 'DISMISS_TOAST', id });
export const setSimulation = (covenantId: Id, shocks: SimulationShocks): DemoAction => ({ type: 'SET_SIMULATION', covenantId, shocks });
export const resetSimulation = (covenantId: Id): DemoAction => ({ type: 'RESET_SIMULATION', covenantId });
export const hydrate = (persisted: PersistedState): DemoAction => ({ type: 'HYDRATE', persisted });
export const resetDemo = (): DemoAction => ({ type: 'RESET_DEMO' });
