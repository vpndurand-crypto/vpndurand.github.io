import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ROUTER_FUTURE, routeObjects } from '../app/router';
import { STORAGE_KEY } from '../config/demo';
import { DemoProvider } from '../store/DemoStore';

/**
 * BETA-12 : la démonstration se rejoue dans le même onglet. Le magasin est monté sans état imposé :
 * il lit le stockage local comme au chargement réel de la page, et la fermeture de la page déclenche « pagehide ».
 */
const plain = (t: string | null | undefined) => (t ?? '').replace(/[\u202F\u00A0]/g, ' ');
const body = () => plain(document.body.textContent);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 3000 });

function openPage(path: string) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path], future: ROUTER_FUTURE });
  return render(<DemoProvider><RouterProvider router={router} future={{ v7_startTransition: true }} /></DemoProvider>);
}
function closePage(view: ReturnType<typeof openPage>) {
  window.dispatchEvent(new Event('pagehide'));
  view.unmount();
  cleanup();
}
const savedCount = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { savedTests: unknown[] }).savedTests.length : 0;
};
async function saveLeverage() {
  fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer le calcul' }));
  const dialog = await screen.findByRole('dialog', { name: 'Enregistrer le calcul ?' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
  await waitFor(() => expect(body()).toContain('Enregistré le 20/10/2026 à 10:30 par Camille Laurent — figé'));
}
async function resetFromSettings() {
  fireEvent.click(screen.getByRole('link', { name: 'Paramètres' }));
  await h1('Paramètres');
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser la démonstration' }));
  const dialog = await screen.findByRole('dialog', { name: 'Réinitialiser la démonstration ?' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser la démonstration' }));
  await h1('Vue groupe');
  expect(body()).toContain('3 calculs au 30/09/2026 à enregistrer');
}
async function takeFromFinancings() {
  fireEvent.click(screen.getByRole('link', { name: 'Financements' }));
  await h1('Financements');
  fireEvent.click(screen.getByRole('row', { name: 'Ouvrir la fiche Senior Facility Agreement' }));
  await h1('Senior Facility Agreement');
  fireEvent.click(screen.getByRole('link', { name: 'Voir le covenant Leverage' }));
  await h1('Leverage');
  expect(body()).toContain('Calcul en cours — non enregistré');
  await saveLeverage();
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('BETA-12 — démonstration répétable dans le même onglet', () => {
  it('prise 1 → réinitialisation → prise 2 → réinitialisation + rechargement → enregistrement + rechargement', async () => {
    // Prise 1
    let page = openPage('/');
    await h1('Vue groupe');
    await takeFromFinancings();
    closePage(page);
    expect(savedCount()).toBe(1);
    // Rechargement : le calcul enregistré est conservé
    page = openPage('/covenants/cov-lev');
    await h1('Leverage');
    expect(body()).toContain('Enregistré le 20/10/2026 à 10:30 par Camille Laurent — figé');
    // Réinitialisation explicite, puis contrôle du journal
    await resetFromSettings();
    fireEvent.click(screen.getByRole('link', { name: 'Journal' }));
    await h1('Journal');
    expect(body()).toContain('48 événements · aucun ajouté pendant la démonstration');
    const rows = screen.getAllByRole('row').map((r) => plain(r.textContent));
    expect(rows.some((r) => r.includes('Calcul enregistré') && r.includes('Leverage au 30/09/2026'))).toBe(false);
    // Prise 2 : le calcul peut de nouveau être enregistré, avec la même heure
    await takeFromFinancings();
    // Réinitialisation + rechargement : l'ancien calcul n'est pas réinjecté
    await resetFromSettings();
    closePage(page);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    page = openPage('/covenants/cov-lev');
    await h1('Leverage');
    expect(body()).toContain('Calcul en cours — non enregistré');
    expect(body()).not.toContain('— figé');
    // Enregistrement + rechargement : le calcul persiste
    await saveLeverage();
    closePage(page);
    page = openPage('/covenants/cov-lev');
    await h1('Leverage');
    expect(body()).toContain('Enregistré le 20/10/2026 à 10:30 par Camille Laurent — figé');
  });

  it('défaut de l’audit : vider le stockage puis fermer la page ne réinjecte plus l’ancien calcul', async () => {
    const page = openPage('/covenants/cov-lev');
    await h1('Leverage');
    await saveLeverage();
    await sleep(350); // écriture différée effectuée
    expect(savedCount()).toBe(1);
    localStorage.clear();
    closePage(page);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    openPage('/covenants/cov-lev');
    await h1('Leverage');
    expect(body()).toContain('Calcul en cours — non enregistré');
  });

  it('réinitialisation suivie d’une fermeture immédiate, avant l’écriture différée', async () => {
    const page = openPage('/covenants/cov-lev');
    await h1('Leverage');
    await saveLeverage();
    await sleep(350);
    await resetFromSettings();
    closePage(page);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    openPage('/covenants/cov-lev');
    await h1('Leverage');
    expect(body()).toContain('Calcul en cours — non enregistré');
  });
});
