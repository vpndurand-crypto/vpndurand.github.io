import { SCHEMA_VERSION } from '../config/demo';
import { entities } from '../data/entities';
import type { AuditEvent, DecimalString, Id, IsoDateTime, SavedTest, TestKey } from '../data/types';

/**
 * Cible du panneau de provenance : un nœud d'arbre.
 * scope = clé d'un test (« cov-lev@2026-09-30 »), « kpi » (indicateurs du groupe) ou « outstanding » (encours déclaré) ;
 * occurrence = numéro du calcul enregistré à lire (instantané figé), null pour le calcul en cours.
 */
export interface DrawerTarget { scope: string; nodeId: string; occurrence: number | null }
export interface SimulationShocks { debtDelta: DecimalString; denominatorPct: DecimalString; thresholdOverride: DecimalString | null }
export interface AdjustmentOverride { amount: DecimalString; justification: string; at: IsoDateTime }
export interface BalanceReimport { balanceId: Id; at: IsoDateTime }
export interface AlertAck { alertId: Id; by: Id; at: IsoDateTime }
export interface ToastMessage { id: number; text: string; detail: string | null }

/** État de la démonstration : uniquement les écarts au jeu initial (le jeu initial reste gelé dans data/seed). */
export interface DemoState {
  schemaVersion: typeof SCHEMA_VERSION;
  session: { signedIn: boolean };
  perimeter: Id[];
  adjustmentOverrides: Record<TestKey, AdjustmentOverride>;
  savedTests: SavedTest[];
  balanceReimports: BalanceReimport[];
  alertAcks: AlertAck[];
  auditAppended: AuditEvent[];
  simulation: Record<Id, SimulationShocks>;
  ui: { provenanceStack: DrawerTarget[]; toast: ToastMessage | null; toastSeq: number; storageAvailable: boolean };
}

export type PersistedState = Pick<DemoState, 'schemaVersion' | 'session' | 'perimeter' | 'adjustmentOverrides' | 'savedTests' | 'balanceReimports' | 'alertAcks' | 'auditAppended'>;

export const ALL_ENTITY_IDS: readonly Id[] = entities.map((e) => e.id);

export function createInitialState(storageAvailable = true): DemoState {
  return {
    schemaVersion: SCHEMA_VERSION,
    session: { signedIn: false },
    perimeter: [...ALL_ENTITY_IDS],
    adjustmentOverrides: {},
    savedTests: [],
    balanceReimports: [],
    alertAcks: [],
    auditAppended: [],
    simulation: {},
    ui: { provenanceStack: [], toast: null, toastSeq: 0, storageAvailable },
  };
}
