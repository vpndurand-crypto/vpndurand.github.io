import { cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, matchPath, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTER_FUTURE, routeObjects } from '../app/router';
import { paths, ROUTE_PATTERNS } from '../app/routes';
import { DemoProvider } from '../store/DemoStore';
import { createInitialState } from '../store/state';

afterEach(cleanup);

async function renderAt(path: string) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path], future: ROUTER_FUTURE });
  const view = render(
    <DemoProvider initialState={createInitialState(false)}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </DemoProvider>,
  );
  await waitFor(() => expect(document.title).toMatch(/ — Covenn$/));
  return view;
}

const ROUTES: Array<[string, string]> = [
  [paths.login(), 'Connexion'],
  [paths.overview(), 'Vue groupe'],
  [paths.financings(), 'Financements'],
  [paths.financing('fin-01'), 'Senior Facility Agreement'],
  [paths.covenants(), 'Covenants'],
  [paths.covenant('cov-lev'), 'Leverage'],
  [paths.calculation('cov-lev', '2026-09-30'), 'Espace de calcul'],
  [paths.documents(), 'Documents'],
  [paths.document('doc-01', { page: 47, clause: 'art-19-2' }), 'Senior Facility Agreement — Démo Industrie SAS / Banque Exemple'],
  [paths.data(), 'Données financières'],
  [paths.balance('tb-di-2026-09-30'), 'Balance au 30/09/2026'],
  [paths.schedule(), 'Échéances'],
  [paths.audit(), 'Journal'],
  [paths.settings(), 'Paramètres'],
  [paths.roadmap(), 'Feuille de route'],
  ['/page-inexistante', 'Cette page n’existe pas'],
];

describe('les 16 routes s’affichent sans erreur', () => {
  it.each(ROUTES)('%s', async (path, heading) => {
    const { container, getAllByRole } = await renderAt(path);
    expect(getAllByRole('heading').some((h) => h.textContent === heading)).toBe(true);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/undefined|NaN|\[object/);
    expect(text, 'écran squelette visible').not.toMatch(/Écran prévu au ticket/);
    for (const link of Array.from(container.querySelectorAll('a[href]'))) {
      const href = (link.getAttribute('href') ?? '').split('?')[0] ?? '';
      const known = Object.values(ROUTE_PATTERNS).some((pattern) => matchPath({ path: pattern, end: true }, href));
      expect(known, `lien mort ${href}`).toBe(true);
    }
  });
  it.each([
    [paths.financing('fin-99'), 'Ce financement n’existe pas'],
    [paths.covenant('cov-99'), 'Ce covenant n’existe pas'],
    [paths.calculation('cov-99'), 'Ce covenant n’existe pas'],
    [paths.document('doc-99'), 'Ce document n’existe pas'],
    [paths.balance('tb-99'), 'Cette balance n’existe pas'],
  ])('identifiant inconnu %s', async (path, message) => {
    const { getByText } = await renderAt(path);
    expect(getByText(message)).toBeTruthy();
  });
});
