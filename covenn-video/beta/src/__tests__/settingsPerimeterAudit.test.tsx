import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTER_FUTURE, routeObjects } from '../app/router';
import { DemoProvider } from '../store/DemoStore';
import { createInitialState } from '../store/state';

const plain = (t: string | null | undefined) => (t ?? '').replace(/[\u202F\u00A0]/g, ' ');
const body = () => plain(document.body.textContent);
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 3000 });
function openPage(path: string) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path], future: ROUTER_FUTURE });
  return render(<DemoProvider initialState={createInitialState(false)}><RouterProvider router={router} future={{ v7_startTransition: true }} /></DemoProvider>);
}
async function saveLeverage() {
  fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer le calcul' }));
  fireEvent.click(within(await screen.findByRole('dialog', { name: 'Enregistrer le calcul ?' })).getByRole('button', { name: 'Confirmer' }));
  await waitFor(() => expect(body()).toContain('— figé'));
}
afterEach(cleanup);

describe('BETA-07 — périmètre', () => {
  it('décocher Démo Logistique SAS → 10,5 M€ et 2 financements ; recocher → valeurs initiales', async () => {
    openPage('/');
    await h1('Vue groupe');
    expect(body()).toContain('14,0 M€');
    expect(body()).toContain('4 financements actifs · 4 prêteurs');
    fireEvent.click(screen.getByRole('button', { name: 'Périmètre : 3 sociétés sur 3' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Démo Logistique SAS' }));
    await waitFor(() => expect(body()).toContain('10,5 M€'));
    expect(body()).toContain('2 financements actifs · 2 prêteurs');
    fireEvent.click(screen.getByRole('link', { name: 'Financements' }));
    await h1('Financements');
    expect(screen.getAllByRole('row').filter((r) => (r.getAttribute('aria-label') ?? '').startsWith('Ouvrir la fiche'))).toHaveLength(2);
    expect(body()).toContain('10 500 000,00 €');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Démo Logistique SAS' }));
    fireEvent.click(screen.getByRole('link', { name: 'Vue groupe' }));
    await h1('Vue groupe');
    expect(body()).toContain('14,0 M€');
    expect(body()).toContain('4 financements actifs · 4 prêteurs');
    expect(screen.getByRole('button', { name: 'Périmètre : 3 sociétés sur 3' })).toBeTruthy();
  });

  it('la dernière société ne peut pas être décochée', async () => {
    openPage('/');
    await h1('Vue groupe');
    fireEvent.click(screen.getByRole('button', { name: 'Périmètre : 3 sociétés sur 3' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Démo Logistique SAS' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Démo Services SAS' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Démo Industrie SAS' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Périmètre : 1 société sur 3' })).toBeTruthy());
  });
});

describe('BETA-11 — réimport modifié et journal', () => {
  it('le calcul enregistré reste figé ; la fiche signale « Données modifiées » et +0,03x ; le journal trace les deux événements', async () => {
    openPage('/covenants/cov-lev');
    await h1('Leverage');
    await saveLeverage();
    fireEvent.click(screen.getByRole('link', { name: 'Paramètres' }));
    await h1('Paramètres');
    fireEvent.click(screen.getByRole('button', { name: 'Réimporter la balance modifiée' }));
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Réimporter la balance modifiée ?' })).getByRole('button', { name: 'Réimporter' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Voir l’effet sur le Leverage' }));
    await h1('Leverage');
    const text = body();
    expect(text).toContain('Données modifiées depuis l’enregistrement');
    expect(text).toContain('+0,03x');
    expect(text).toContain('Enregistré le 20/10/2026 à 10:30 par Camille Laurent — figé');
    expect(screen.getAllByRole('button', { name: /^3,13x — voir la provenance$/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('link', { name: 'Journal' }));
    await h1('Journal');
    const rows = screen.getAllByRole('row').map((r) => plain(r.textContent));
    const saved = rows.find((r) => r.includes('Calcul enregistré') && r.includes('Leverage au 30/09/2026'));
    expect(saved).toBeDefined();
    for (const part of ['20/10/2026 à 10:30', 'Camille Laurent', 'Démo Industrie', 'Senior Facility Agreement', 'valeur : 3,13x', 'statut : Covenant respecté — vigilance', 'empreinte : 069afaa81530']) {
      expect(saved, part).toContain(part);
    }
    expect(rows.some((r) => r.includes('Balance importée') && r.includes('Pendant la démonstration'))).toBe(true);
  });
});

describe('Espace de calcul', () => {
  it('« Calculer » déroule les étapes puis affiche le résultat du moteur, enregistrable', async () => {
    openPage('/covenants/cov-lev/calcul');
    await h1('Espace de calcul');
    expect(body()).toContain('10 000 000,00 €');
    expect(body()).toContain('150 000,00 €');
    fireEvent.click(screen.getByRole('button', { name: 'Calculer' }));
    await waitFor(() => expect(body()).toContain('Covenant respecté — vigilance'), { timeout: 3000 });
    expect(body()).toContain('3,13x');
    expect(body()).toContain('0,37x · 10,5 %');
    expect(body()).toContain('1 100 000,00 €');
    expect(body()).toContain('314 285,71 €');
    expect(screen.getByRole('button', { name: 'Enregistrer le calcul' })).toBeTruthy();
  });
});
