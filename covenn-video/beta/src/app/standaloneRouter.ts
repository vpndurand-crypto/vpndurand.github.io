import { createMemoryRouter, NavigationType, type RouteObject } from 'react-router-dom';

type Future = NonNullable<Parameters<typeof createMemoryRouter>[1]>['future'];

/**
 * Routeur d'une application ouverte comme simple fichier.
 *
 * createHashRouter et createBrowserRouter partagent un historique qui construit ses URL avec
 * `new URL(chemin, location.origin || location.href)`. Dans un aperçu encapsulé (iframe about:srcdoc
 * à origine opaque), cette base vaut « about:srcdoc » et `new URL('/', 'about:srcdoc')` lève
 * « "/" cannot be parsed as a URL » dès le rendu du premier lien.
 *
 * Ici, la navigation vit en mémoire (historique React Router à base fixe, sans dépendance à l'origine) et
 * le fragment de l'adresse (#/financements) en est le miroir : liens ouvrables, rechargement sur la même page,
 * retour arrière du navigateur. Si l'adresse n'est ni lisible ni modifiable, la navigation reste interne.
 */
export function pathFromHash(hash: string): string {
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  return path.startsWith('/') ? path : '/';
}

export function createStandaloneRouter(routes: RouteObject[], future: Future, win: Window = window) {
  const readHash = (): string => {
    try {
      return win.location.hash;
    } catch {
      return '';
    }
  };
  const router = createMemoryRouter(routes, { initialEntries: [pathFromHash(readHash())], ...(future ? { future } : {}) });

  // Liens rendus sous la forme « #/covenants » : même apparence et même comportement qu'un routeur à fragment.
  const internalHref = router.createHref;
  router.createHref = (location) => `#${internalHref(location)}`;

  const current = () => `${router.state.location.pathname}${router.state.location.search}`;
  router.subscribe((state) => {
    const target = `#${state.location.pathname}${state.location.search}`;
    if (readHash() === target) return;
    try {
      if (state.historyAction === NavigationType.Push) win.location.hash = target;
      else win.location.replace(`${win.location.href.split('#')[0] ?? ''}${target}`);
    } catch {
      /* Adresse non modifiable dans cet environnement : la navigation reste interne. */
    }
  });
  try {
    win.addEventListener('hashchange', () => {
      const path = pathFromHash(readHash());
      if (path !== current()) void router.navigate(path, { replace: true });
    });
  } catch {
    /* Événements d'adresse indisponibles : la navigation reste interne. */
  }
  return router;
}
