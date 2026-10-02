import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTER_FUTURE, routeObjects } from '../app/router';
import { DemoProvider } from '../store/DemoStore';
import { createInitialState } from '../store/state';

afterEach(cleanup);
const plain = (text: string | null | undefined) => (text ?? '').replace(/[\u202F\u00A0]/g, ' ');
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name });

describe('parcours de démonstration HEXA (plan technique, parcours vidéo)', () => {
  it('Vue groupe → Financements → SFA → Leverage → 600 000 € → ≤ 3,50x → Enregistrer → Confirmer → Vue groupe', async () => {
    const router = createMemoryRouter(routeObjects, { initialEntries: ['/'], future: ROUTER_FUTURE });
    render(<DemoProvider initialState={createInitialState(false)}><RouterProvider router={router} future={{ v7_startTransition: true }} /></DemoProvider>);

    await h1('Vue groupe');
    expect(plain(document.body.textContent)).toContain('3 calculs au 30/09/2026 à enregistrer');
    expect(plain(document.body.textContent)).toContain('Leverage, Gearing, Couverture des intérêts : calcul en cours, non figé');

    fireEvent.click(screen.getByRole('link', { name: 'Financements' }));
    await h1('Financements');
    fireEvent.click(screen.getByRole('row', { name: 'Ouvrir la fiche Senior Facility Agreement' }));
    await h1('Senior Facility Agreement');
    const sfa = plain(document.body.textContent);
    for (const expected of ['10 000 000,00 €', '600 000,00 €', '3,13x', '≤ 3,50x', 'Covenant respecté — vigilance']) expect(sfa).toContain(expected);

    fireEvent.click(screen.getByRole('link', { name: 'Voir le covenant Leverage' }));
    await h1('Leverage');
    const page = plain(document.body.textContent);
    for (const expected of ['10 000 000,00 €', '600 000,00 €', '9 400 000,00 €', '2 850 000,00 €', '150 000,00 €', '3 000 000,00 €', '3,13x', '≤ 3,50x', '0,37x', '10,5 %',
      '1 100 000,00 €', '314 285,71 €', 'Dette supplémentaire mobilisable', 'Baisse d’EBITDA absorbable', 'Covenant respecté — vigilance', 'Calcul en cours — non enregistré']) {
      expect(page, expected).toContain(expected);
    }

    fireEvent.click(screen.getAllByRole('button', { name: /^600\s000,00\s€ — voir la provenance$/ })[0]!);
    const panel = await screen.findByRole('complementary', { name: 'Provenance du chiffre' });
    await waitFor(() => expect(plain(panel.textContent)).toContain('MC-17 588 000,00 + MC-18 12 000,00'));
    expect(within(panel).getByRole('link', { name: /Ouvrir la balance \(4 comptes surlignés\)/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^≤ 3,50x — voir la provenance$/ }));
    await waitFor(() => expect(plain(screen.getByRole('complementary', { name: 'Provenance du chiffre' }).textContent)).toContain('Origine : clause du contrat'));
    expect(plain(screen.getByRole('complementary', { name: 'Provenance du chiffre' }).textContent)).toContain('ne devra pas excéder 3,50x');

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le calcul' }));
    const dialog = await screen.findByRole('dialog', { name: 'Enregistrer le calcul ?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(plain(document.body.textContent)).toMatch(/Enregistré le 20\/10\/2026 à \d\d:\d\d par Camille Laurent — figé/));
    expect(screen.getByRole('status').textContent).toContain('Calcul enregistré');
    expect(screen.queryByRole('button', { name: 'Enregistrer le calcul' })).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Vue groupe' }));
    await h1('Vue groupe');
    const overview = plain(document.body.textContent);
    expect(overview).toContain('Leverage au 30/09/2026 : calcul enregistré');
    expect(overview).toContain('2 calculs au 30/09/2026 à enregistrer');
    expect(overview).toContain('Calcul enregistré le 20/10/2026 — figé');
    expect(overview).toContain('14,0 M€');
    expect(overview).toContain('1,3 M€');
    expect(overview).toContain('12,7 M€');
  });
});
