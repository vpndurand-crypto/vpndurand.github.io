import type { RouteObject } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RouteErrorPage } from './RouteErrorPage';
import { ROUTE_PATTERNS as R } from './routes';
import { createStandaloneRouter } from './standaloneRouter';
import { AuditPage } from '../pages/AuditPage';
import { BalancePage } from '../pages/BalancePage';
import { CalculationPage } from '../pages/CalculationPage';
import { CovenantPage } from '../pages/CovenantPage';
import { CovenantsPage } from '../pages/CovenantsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { DocumentViewerPage } from '../pages/DocumentViewerPage';
import { FinancialDataPage } from '../pages/FinancialDataPage';
import { FinancingPage } from '../pages/FinancingPage';
import { FinancingsPage } from '../pages/FinancingsPage';
import { GroupOverviewPage } from '../pages/GroupOverviewPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RoadmapPage } from '../pages/RoadmapPage';
import { SchedulePage } from '../pages/SchedulePage';
import { SettingsPage } from '../pages/SettingsPage';

export const ROUTER_FUTURE = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;

const child = (pattern: string) => pattern.slice(1);

/** 16 routes : 15 pages et la page introuvable (plan technique, section 12). */
export const routeObjects: RouteObject[] = [
  { path: R.login, element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    path: R.overview,
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <GroupOverviewPage /> },
      { path: child(R.financings), element: <FinancingsPage /> },
      { path: child(R.financing), element: <FinancingPage /> },
      { path: child(R.covenants), element: <CovenantsPage /> },
      { path: child(R.covenant), element: <CovenantPage /> },
      { path: child(R.calculation), element: <CalculationPage /> },
      { path: child(R.documents), element: <DocumentsPage /> },
      { path: child(R.document), element: <DocumentViewerPage /> },
      { path: child(R.data), element: <FinancialDataPage /> },
      { path: child(R.balance), element: <BalancePage /> },
      { path: child(R.schedule), element: <SchedulePage /> },
      { path: child(R.audit), element: <AuditPage /> },
      { path: child(R.settings), element: <SettingsPage /> },
      { path: child(R.roadmap), element: <RoadmapPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/** Routeur de l'application : fonctionne en http(s), en file:// et dans un aperçu about:srcdoc (voir standaloneRouter). */
export function createAppRouter() {
  return createStandaloneRouter(routeObjects, ROUTER_FUTURE);
}
