/**
 * Seul endroit où un chemin de l'application est écrit (plan technique, section 12).
 * Les pages et composants construisent leurs liens avec `paths`.
 */
export const ROUTE_PATTERNS = {
  login: '/connexion',
  overview: '/',
  financings: '/financements',
  financing: '/financements/:financingId',
  covenants: '/covenants',
  covenant: '/covenants/:covenantId',
  calculation: '/covenants/:covenantId/calcul',
  documents: '/documents',
  document: '/documents/:documentId',
  data: '/donnees',
  balance: '/donnees/balances/:balanceId',
  schedule: '/echeances',
  audit: '/journal',
  settings: '/parametres',
  roadmap: '/feuille-de-route',
} as const;

export type FinancingTab = 'synthese' | 'encours' | 'covenants' | 'documents' | 'historique';
export type CovenantTab = 'suivi' | 'definition' | 'calculs';
export type DataTab = 'balances' | 'mapping' | 'agregats';
export type DocumentTab = 'document' | 'analyse';

type QueryValue = string | number | null | undefined;

function withQuery(path: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export const paths = {
  login: () => ROUTE_PATTERNS.login,
  overview: () => ROUTE_PATTERNS.overview,
  financings: (q: { societe?: string; preteur?: string; categorie?: string; q?: string } = {}) => withQuery(ROUTE_PATTERNS.financings, q),
  financing: (id: string, onglet?: FinancingTab) => withQuery(`${ROUTE_PATTERNS.financings}/${id}`, { onglet }),
  covenants: (q: { statut?: string; societe?: string } = {}) => withQuery(ROUTE_PATTERNS.covenants, q),
  covenant: (id: string, q: { date?: string; onglet?: CovenantTab } = {}) => withQuery(`${ROUTE_PATTERNS.covenants}/${id}`, q),
  calculation: (id: string, date?: string) => withQuery(`${ROUTE_PATTERNS.covenants}/${id}/calcul`, { date }),
  documents: (q: { type?: string; societe?: string } = {}) => withQuery(ROUTE_PATTERNS.documents, q),
  document: (id: string, q: { page?: number; clause?: string; retour?: string; onglet?: DocumentTab } = {}) =>
    withQuery(`${ROUTE_PATTERNS.documents}/${id}`, q),
  data: (q: { onglet?: DataTab; societe?: string } = {}) => withQuery(ROUTE_PATTERNS.data, q),
  balance: (id: string, q: { agregat?: string; comptes?: string } = {}) => withQuery(`${ROUTE_PATTERNS.data}/balances/${id}`, q),
  schedule: (q: { type?: string } = {}) => withQuery(ROUTE_PATTERNS.schedule, q),
  audit: (q: { type?: string; periode?: string } = {}) => withQuery(ROUTE_PATTERNS.audit, q),
  settings: () => ROUTE_PATTERNS.settings,
  roadmap: () => ROUTE_PATTERNS.roadmap,
};

/** Un paramètre `retour` n'est suivi que s'il désigne un chemin interne. */
export function isSafeReturnPath(value: string | null): value is string {
  return Boolean(value) && value!.startsWith('/') && !value!.startsWith('//');
}
