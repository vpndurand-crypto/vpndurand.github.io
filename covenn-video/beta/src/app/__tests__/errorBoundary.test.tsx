import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from '../../config/demo';
import { ErrorBoundary } from '../ErrorBoundary';

afterEach(cleanup);

function Broken(): JSX.Element {
  throw new Error('panne simulée');
}

describe('écran de secours', () => {
  it('« Réinitialiser la démonstration » efface la sauvegarde locale', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.localStorage.setItem(STORAGE_KEY, '{"schemaVersion":1}');
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser la démonstration' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    silence.mockRestore();
  });
});
