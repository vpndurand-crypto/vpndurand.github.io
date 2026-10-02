import type { ReactNode } from 'react';
import { DemoDispatchContext, DemoStateContext } from '../../beta/src/store/DemoStore';
import type { DemoState } from '../../beta/src/store/state';

const ignore = (): void => undefined;

/**
 * Fournit aux composants de la bêta un état figé, sans persistance ni minuterie :
 * mêmes contextes que DemoProvider, mais aucune écriture locale et aucune action possible pendant le rendu.
 */
export function FrozenDemo({ state, children }: { state: DemoState; children: ReactNode }) {
  return (
    <DemoStateContext.Provider value={state}>
      <DemoDispatchContext.Provider value={ignore}>{children}</DemoDispatchContext.Provider>
    </DemoStateContext.Provider>
  );
}
