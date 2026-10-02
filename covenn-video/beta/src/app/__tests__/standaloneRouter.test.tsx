import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { DemoProvider } from '../../store/DemoStore';
import { createInitialState } from '../../store/state';
import { ROUTER_FUTURE, routeObjects } from '../router';
import { createStandaloneRouter, pathFromHash } from '../standaloneRouter';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

function mount(router: ReturnType<typeof createStandaloneRouter>) {
  return render(
    <DemoProvider initialState={createInitialState(false)}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </DemoProvider>,
  );
}
const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

describe('routeur autonome (fichier ouvert directement ou aperçu encapsulé)', () => {
  it('lit le chemin dans le fragment de l’adresse', () => {
    expect(pathFromHash('')).toBe('/');
    expect(pathFromHash('#')).toBe('/');
    expect(pathFromHash('#section')).toBe('/');
    expect(pathFromHash('#/financements/fin-01')).toBe('/financements/fin-01');
    expect(pathFromHash('#/documents/doc-01?page=47&clause=art-19-2')).toBe('/documents/doc-01?page=47&clause=art-19-2');
  });

  it('démarre sur la route du fragment, rend des liens « #/… » et reflète la navigation dans l’adresse', async () => {
    window.location.hash = '#/financements/fin-01';
    mount(createStandaloneRouter(routeObjects, ROUTER_FUTURE, window));
    expect(await heading('Senior Facility Agreement')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Covenants' });
    expect(link.getAttribute('href')).toBe('#/covenants');
    fireEvent.click(link);
    expect(await heading('Covenants')).toBeTruthy();
    expect(window.location.hash).toBe('#/covenants');
  });

  it('suit un changement de fragment (saisie de l’adresse, retour arrière)', async () => {
    const router = createStandaloneRouter(routeObjects, ROUTER_FUTURE, window);
    mount(router);
    await heading('Vue groupe');
    act(() => {
      window.location.hash = '#/covenants/cov-lev';
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/covenants/cov-lev'));
    expect(await heading('Leverage')).toBeTruthy();
  });

  it('fonctionne quand l’adresse n’est ni lisible ni modifiable', async () => {
    const locked = {
      get location(): Location { throw new Error('refusé'); },
      addEventListener() { throw new Error('refusé'); },
    } as unknown as Window;
    mount(createStandaloneRouter(routeObjects, ROUTER_FUTURE, locked));
    expect(await heading('Vue groupe')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Financements' }));
    expect(await heading('Financements')).toBeTruthy();
  });
});
