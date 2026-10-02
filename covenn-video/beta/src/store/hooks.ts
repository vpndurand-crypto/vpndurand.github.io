import { useCallback, useContext, type Dispatch } from 'react';
import type { Id, IsoDate, SeedData } from '../data/types';
import { resetDemo, type DemoAction } from './actions';
import { DemoDispatchContext, DemoStateContext } from './DemoStore';
import { clearPersisted } from './persistence';
import { selectAudit, selectCovenantView, selectDataView, selectTestHistory, type CovenantView } from './selectors';
import type { DemoState } from './state';

export function useDemoState(): DemoState {
  const state = useContext(DemoStateContext);
  if (!state) throw new Error('DemoProvider manquant');
  return state;
}
export function useDemoDispatch(): Dispatch<DemoAction> {
  const dispatch = useContext(DemoDispatchContext);
  if (!dispatch) throw new Error('DemoProvider manquant');
  return dispatch;
}
export function useDataView(): SeedData {
  return selectDataView(useDemoState());
}
export function useCovenantView(covenantId: Id, date: IsoDate): CovenantView {
  return selectCovenantView(useDemoState(), covenantId, date);
}
export function useTestHistory(covenantId: Id) {
  return selectTestHistory(useDemoState(), covenantId);
}
export function useAudit() {
  return selectAudit(useDemoState());
}
/** Réinitialise la démonstration : efface la clé locale et restaure exactement le jeu initial. */
export function useResetDemo(): () => void {
  const dispatch = useDemoDispatch();
  return useCallback(() => {
    clearPersisted();
    dispatch(resetDemo());
  }, [dispatch]);
}
