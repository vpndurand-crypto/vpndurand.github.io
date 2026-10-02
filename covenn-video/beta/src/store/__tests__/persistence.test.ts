import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../../config/demo';
import { saveTest, signIn } from '../actions';
import { clearPersisted, isStorageAvailable, loadPersisted, pickPersisted, savePersisted } from '../persistence';
import { reducer } from '../reducer';
import { createInitialState } from '../state';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}
const g = globalThis as unknown as { localStorage?: unknown };
afterEach(() => { delete g.localStorage; });

describe('stockage local', () => {
  it('aller-retour fidèle, y compris un calcul enregistré', () => {
    g.localStorage = new MemoryStorage();
    expect(isStorageAvailable()).toBe(true);
    let s = reducer(createInitialState(true), signIn());
    s = reducer(s, saveTest(s, 'cov-lev', '2026-09-30', '2026-10-20T10:00:00'));
    expect(savePersisted(pickPersisted(s))).toBe(true);
    expect(loadPersisted()).toEqual(pickPersisted(s));
  });
  it('état vierge : la clé est effacée ; contenu corrompu ou d’une autre version : ignoré', () => {
    const storage = new MemoryStorage();
    g.localStorage = storage;
    storage.setItem(STORAGE_KEY, 'x');
    savePersisted(pickPersisted(createInitialState(true)));
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    storage.setItem(STORAGE_KEY, '{pas du json');
    expect(loadPersisted()).toBeNull();
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...pickPersisted(createInitialState(true)), schemaVersion: 99 }));
    expect(loadPersisted()).toBeNull();
    clearPersisted();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('stockage indisponible ou refusé : repli sans erreur', () => {
    expect(isStorageAvailable()).toBe(false);
    g.localStorage = { getItem: () => { throw new Error('refusé'); }, setItem: () => { throw new Error('refusé'); }, removeItem: () => { throw new Error('refusé'); } };
    expect(isStorageAvailable()).toBe(false);
    expect(loadPersisted()).toBeNull();
    expect(savePersisted(pickPersisted(createInitialState(false)))).toBe(false);
    expect(() => clearPersisted()).not.toThrow();
  });
});
