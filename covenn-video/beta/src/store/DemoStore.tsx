import { createContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import type { DemoAction } from './actions';
import { isStorageAvailable, loadPersisted, pickPersisted, savePersisted } from './persistence';
import { reducer } from './reducer';
import { createInitialState, type DemoState } from './state';

export const DemoStateContext = createContext<DemoState | null>(null);
export const DemoDispatchContext = createContext<Dispatch<DemoAction> | null>(null);

function initialize(): DemoState {
  const available = isStorageAvailable();
  const base = createInitialState(available);
  if (!available) return base;
  const persisted = loadPersisted();
  return persisted ? reducer(base, { type: 'HYDRATE', persisted }) : base;
}

/** Source de vérité unique de la démonstration ; sauvegarde locale différée de 250 ms. */
export function DemoProvider({ children, initialState }: { children: ReactNode; initialState?: DemoState }) {
  const [state, dispatch] = useReducer(reducer, initialState ?? null, (init: DemoState | null) => init ?? initialize());
  const persisted = useMemo(
    () => pickPersisted(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.session, state.perimeter, state.adjustmentOverrides, state.savedTests, state.balanceReimports, state.alertAcks, state.auditAppended],
  );
  const latest = useRef(persisted);
  latest.current = persisted;
  /** Vrai entre un changement et son écriture différée : seul ce cas justifie une écriture à la fermeture de la page. */
  const pending = useRef(false);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return undefined;
    }
    if (!state.ui.storageAvailable) return undefined;
    pending.current = true;
    const timer = window.setTimeout(() => {
      savePersisted(persisted);
      pending.current = false;
    }, 250);
    return () => window.clearTimeout(timer);
  }, [persisted, state.ui.storageAvailable]);
  // À la fermeture ou au rechargement, seule une écriture encore en attente est faite : aucune action ne se perd dans le délai
  // de 250 ms, et un stockage vidé ou réinitialisé n'est jamais regarni avec un état plus ancien (audit, P0 BETA-12).
  useEffect(() => {
    if (!state.ui.storageAvailable) return undefined;
    const flush = () => {
      if (!pending.current) return;
      savePersisted(latest.current);
      pending.current = false;
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [state.ui.storageAvailable]);
  return (
    <DemoStateContext.Provider value={state}>
      <DemoDispatchContext.Provider value={dispatch}>{children}</DemoDispatchContext.Provider>
    </DemoStateContext.Provider>
  );
}
