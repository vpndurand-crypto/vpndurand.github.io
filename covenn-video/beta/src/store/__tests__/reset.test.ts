import { describe, expect, it } from 'vitest';
import { seed } from '../../data/seed';
import { ackAlert, commitAdjustment, reimportModifiedBalance, resetDemo, saveTest, setPerimeter, signIn } from '../actions';
import { reducer } from '../reducer';
import { selectCovenantView } from '../selectors';
import { createInitialState } from '../state';

describe('réinitialisation', () => {
  it('restaure exactement l’état initial et ne modifie jamais le jeu gelé', () => {
    const before = JSON.stringify(seed);
    const AT = '2026-10-20T11:00:00';
    let s = createInitialState(false);
    s = reducer(s, signIn());
    s = reducer(s, setPerimeter(['ent-di']));
    s = reducer(s, commitAdjustment(s, 'cov-lev', '2026-09-30', '90000', 'Test', AT));
    s = reducer(s, reimportModifiedBalance(s, AT));
    s = reducer(s, saveTest(s, 'cov-lev', '2026-09-30', AT));
    s = reducer(s, ackAlert(s, 'alr-02', AT));
    const reset = reducer(s, resetDemo());
    expect(reset).toEqual(createInitialState(false));
    expect(JSON.stringify(seed)).toBe(before);
    const view = selectCovenantView(reset, 'cov-lev', '2026-09-30');
    expect(view.lifecycle).toBe('DRAFT');
    expect(view.current.result?.value).toBe('3.1333333333');
  });
});
