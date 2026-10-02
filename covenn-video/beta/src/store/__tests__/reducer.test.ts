import { describe, expect, it } from 'vitest';
import { formatCovenantValue, formatPercent, formatRatio, formatSignedRatio } from '../../domain/format';
import { ackAlert, closeProvenance, commitAdjustment, dismissToast, openProvenance, popProvenance, pushProvenance, reimportModifiedBalance, restoreAdjustment, saveTest, setPerimeter, showToast, signIn } from '../actions';
import { reducer } from '../reducer';
import { selectAlerts, selectAudit, selectCovenantView, selectDataView, selectTestHistory } from '../selectors';
import { createInitialState, type DemoState } from '../state';

const AT = '2026-10-20T10:00:00';
const plain = (s: string) => s.replace(/[\u202F\u00A0]/g, ' ');
const lev = (s: DemoState) => selectCovenantView(s, 'cov-lev', '2026-09-30');
const shown = (s: DemoState, id = 'cov-lev') => {
  const r = selectCovenantView(s, id, '2026-09-30').current.result!;
  return { value: formatCovenantValue(r.valueExact!, r.threshold), pct: plain(formatPercent(r.headroomPct!)), headroom: formatRatio(r.headroom!), status: r.status };
};

describe('réducteur et sélecteurs', () => {
  const s0 = createInitialState(false);

  it('état initial : Leverage non enregistré au 30/09, historique de 4 dates', () => {
    expect(lev(s0).lifecycle).toBe('DRAFT');
    expect(shown(s0)).toEqual({ value: '3,13x', pct: '10,5 %', headroom: '0,37x', status: 'WATCH' });
    expect(selectTestHistory(s0, 'cov-lev').map((h) => `${h.date}:${h.view.lifecycle}`)).toEqual(['2026-03-31:CLOSED', '2026-06-30:CLOSED', '2026-09-30:DRAFT', '2026-12-31:DRAFT']);
    expect(selectDataView(s0)).toBe(selectDataView(createInitialState(false)));
  });
  it('connexion et périmètre', () => {
    const s = reducer(reducer(s0, signIn()), setPerimeter(['ent-dl', 'ent-di']));
    expect(s.session.signedIn).toBe(true);
    expect(s.perimeter).toEqual(['ent-di', 'ent-dl']);
    expect(reducer(s, setPerimeter([])).perimeter).toEqual(['ent-di', 'ent-dl']);
  });
  it('retraitement ramené à 100 000 € : 3,19x ; restauration : 3,13x ; journal séquentiel', () => {
    const s1 = reducer(s0, commitAdjustment(s0, 'cov-lev', '2026-09-30', '100000', 'Montant revu', AT));
    expect(shown(s1).value).toBe('3,19x');
    expect(s1.auditAppended.map((e) => `${e.id}:${e.action}`)).toEqual(['aud-demo-001:ADJUSTMENT_SAVED', 'aud-demo-002:CALCULATION_RUN']);
    const s2 = reducer(s1, restoreAdjustment(s1, 'cov-lev', '2026-09-30', AT));
    expect(shown(s2).value).toBe('3,13x');
    expect(s2.auditAppended.at(-2)?.id).toBe('aud-demo-003');
    expect(selectAudit(s2)[0]?.origin).toBe('DEMO');
  });
  it('réimport de la balance corrigée : Leverage 3,17x (9,5 %), Gearing 0,79x, Couverture inchangée ; idempotent', () => {
    const s1 = reducer(s0, reimportModifiedBalance(s0, AT));
    expect(shown(s1)).toEqual({ value: '3,17x', pct: '9,5 %', headroom: '0,33x', status: 'WATCH' });
    expect(shown(s1, 'cov-gea')).toEqual({ value: '0,79x', pct: '20,8 %', headroom: '0,21x', status: 'COMPLIANT' });
    expect(shown(s1, 'cov-icr').value).toBe('6,67x');
    const data = selectDataView(s1);
    expect(data.balances.find((b) => b.id === 'tb-di-2026-09-30')?.status).toBe('SUPERSEDED');
    expect(data.balances.find((b) => b.id === 'tb-di-2026-09-30-v2')?.status).toBe('ACTIVE');
    expect(reducer(s1, reimportModifiedBalance(s1, AT))).toBe(s1);
  });
  it('enregistrer le calcul : figé, puis modifié après réimport (+0,03x), puis deuxième enregistrement', () => {
    const s1 = reducer(s0, saveTest(s0, 'cov-lev', '2026-09-30', AT));
    const v1 = lev(s1);
    expect(v1.lifecycle).toBe('CLOSED');
    expect(v1.latestSaved?.occurrence).toBe(1);
    expect(v1.latestSaved?.snapshot.inputs_hash).toBe(lev(s0).current.inputsHash);
    expect(v1.modifiedSinceSave).toBe(false);
    expect(s1.auditAppended[0]?.after?.statut).toBe('Covenant respecté — vigilance');
    const s2 = reducer(s1, reimportModifiedBalance(s1, AT));
    const v2 = lev(s2);
    expect(v2.modifiedSinceSave).toBe(true);
    expect(formatSignedRatio(v2.valueDelta!)).toBe('+0,03x');
    expect(formatCovenantValue(v2.displayed!.valueExact!, v2.displayed!.threshold)).toBe('3,13x');
    const s3 = reducer(s2, saveTest(s2, 'cov-lev', '2026-09-30', AT));
    expect(lev(s3).latestSaved?.occurrence).toBe(2);
    expect(lev(s3).modifiedSinceSave).toBe(false);
  });
  it('alertes, panneau de provenance, notifications', () => {
    const s1 = reducer(s0, ackAlert(s0, 'alr-01', AT));
    expect(selectAlerts(s1).find((a) => a.id === 'alr-01')?.acknowledged).toBe(true);
    expect(reducer(s1, ackAlert(s1, 'alr-01', AT))).toBe(s1);
    const t = { scope: 'cov-lev@2026-09-30', nodeId: 'x', occurrence: null };
    const p = reducer(reducer(reducer(s0, openProvenance(t)), pushProvenance({ ...t, nodeId: 'y' })), pushProvenance({ ...t, nodeId: 'z' }));
    expect(p.ui.provenanceStack.map((x) => x.nodeId)).toEqual(['x', 'y', 'z']);
    expect(reducer(p, popProvenance(1)).ui.provenanceStack.map((x) => x.nodeId)).toEqual(['x']);
    expect(reducer(p, closeProvenance()).ui.provenanceStack).toEqual([]);
    const toast = reducer(s0, showToast('Calcul enregistré', 'Leverage'));
    expect(toast.ui.toast).toEqual({ id: 1, text: 'Calcul enregistré', detail: 'Leverage' });
    expect(reducer(toast, dismissToast(1)).ui.toast).toBeNull();
    expect(reducer(toast, dismissToast(2)).ui.toast).not.toBeNull();
  });
});
