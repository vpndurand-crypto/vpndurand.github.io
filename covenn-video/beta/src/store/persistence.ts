import { SCHEMA_VERSION, STORAGE_KEY } from '../config/demo';
import { createInitialState, type DemoState, type PersistedState } from './state';

/** Stockage local (T-07) : une seule clé, écarts au jeu initial uniquement, toute erreur ramène à l'état initial. */
export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const probe = 'covenn-probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function pickPersisted(state: DemoState): PersistedState {
  return {
    schemaVersion: state.schemaVersion, session: state.session, perimeter: state.perimeter, adjustmentOverrides: state.adjustmentOverrides,
    savedTests: state.savedTests, balanceReimports: state.balanceReimports, alertAcks: state.alertAcks, auditAppended: state.auditAppended,
  };
}

const PRISTINE = JSON.stringify(pickPersisted(createInitialState()));
export function isPristine(persisted: PersistedState): boolean {
  return JSON.stringify(persisted) === PRISTINE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION) return false;
  return isRecord(value.session) && typeof value.session.signedIn === 'boolean'
    && Array.isArray(value.perimeter) && value.perimeter.every((id) => typeof id === 'string')
    && isRecord(value.adjustmentOverrides) && Array.isArray(value.savedTests) && Array.isArray(value.balanceReimports)
    && Array.isArray(value.alertAcks) && Array.isArray(value.auditAppended);
}

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPersistedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePersisted(persisted: PersistedState): boolean {
  try {
    if (isPristine(persisted)) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    return true;
  } catch {
    return false;
  }
}

export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}
