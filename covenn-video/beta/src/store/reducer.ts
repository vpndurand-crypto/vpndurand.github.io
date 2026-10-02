import { ORGANIZATION_ID } from '../config/demo';
import type { AuditEvent } from '../data/types';
import type { AuditDraft, DemoAction } from './actions';
import { ALL_ENTITY_IDS, createInitialState, type DemoState } from './state';

function appendAudit(state: DemoState, drafts: readonly AuditDraft[]): AuditEvent[] {
  let sequence = state.auditAppended.length;
  const events = drafts.map((draft): AuditEvent => {
    sequence += 1;
    return { ...draft, id: `aud-demo-${String(sequence).padStart(3, '0')}`, organization_id: ORGANIZATION_ID, origin: 'DEMO' };
  });
  return [...state.auditAppended, ...events];
}

/** Réducteur pur : aucune date système, aucun accès au stockage (les actions arrivent horodatées). */
export function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'SIGN_IN':
      return state.session.signedIn ? state : { ...state, session: { signedIn: true } };
    case 'SET_PERIMETER': {
      const perimeter = ALL_ENTITY_IDS.filter((id) => action.entityIds.includes(id));
      return perimeter.length === 0 ? state : { ...state, perimeter };
    }
    case 'COMMIT_ADJUSTMENT':
      return { ...state, adjustmentOverrides: { ...state.adjustmentOverrides, [action.testKey]: action.override }, auditAppended: appendAudit(state, action.audit) };
    case 'RESTORE_ADJUSTMENT': {
      if (!(action.testKey in state.adjustmentOverrides)) return state;
      const adjustmentOverrides = Object.fromEntries(Object.entries(state.adjustmentOverrides).filter(([key]) => key !== action.testKey));
      return { ...state, adjustmentOverrides, auditAppended: appendAudit(state, action.audit) };
    }
    case 'SAVE_TEST':
      return { ...state, savedTests: [...state.savedTests, action.test], auditAppended: appendAudit(state, action.audit) };
    case 'REIMPORT_BALANCE':
      if (state.balanceReimports.some((r) => r.balanceId === action.reimport.balanceId)) return state;
      return { ...state, balanceReimports: [...state.balanceReimports, action.reimport], auditAppended: appendAudit(state, action.audit) };
    case 'ACK_ALERT':
      if (state.alertAcks.some((a) => a.alertId === action.ack.alertId)) return state;
      return { ...state, alertAcks: [...state.alertAcks, action.ack], auditAppended: appendAudit(state, action.audit) };
    case 'OPEN_PROVENANCE':
      return { ...state, ui: { ...state.ui, provenanceStack: [action.target] } };
    case 'PUSH_PROVENANCE':
      return { ...state, ui: { ...state.ui, provenanceStack: [...state.ui.provenanceStack, action.target] } };
    case 'POP_PROVENANCE':
      return { ...state, ui: { ...state.ui, provenanceStack: state.ui.provenanceStack.slice(0, Math.max(1, action.depth)) } };
    case 'CLOSE_PROVENANCE':
      return state.ui.provenanceStack.length === 0 ? state : { ...state, ui: { ...state.ui, provenanceStack: [] } };
    case 'SHOW_TOAST': {
      const id = state.ui.toastSeq + 1;
      return { ...state, ui: { ...state.ui, toastSeq: id, toast: { id, text: action.text, detail: action.detail } } };
    }
    case 'DISMISS_TOAST':
      return state.ui.toast?.id === action.id ? { ...state, ui: { ...state.ui, toast: null } } : state;
    case 'SET_SIMULATION':
      return { ...state, simulation: { ...state.simulation, [action.covenantId]: action.shocks } };
    case 'RESET_SIMULATION':
      return { ...state, simulation: Object.fromEntries(Object.entries(state.simulation).filter(([id]) => id !== action.covenantId)) };
    case 'HYDRATE':
      return { ...state, ...action.persisted, ui: state.ui, simulation: state.simulation };
    case 'RESET_DEMO':
      return createInitialState(state.ui.storageAvailable);
  }
}
