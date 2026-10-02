import { describe, expect, it } from 'vitest';
import { seed } from '../../data/seed';
import type { DecompositionNode } from '../../data/types';
import { evaluateCovenantAt } from '../covenantTests';
import { formatCovenantValue } from '../format';

function find(node: DecompositionNode, id: string): DecompositionNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const hit = find(child, id);
    if (hit) return hit;
  }
  return null;
}
function leaves(node: DecompositionNode): DecompositionNode[] {
  return node.children.length === 0 ? [node] : node.children.flatMap(leaves);
}
const ev = evaluateCovenantAt(seed, 'cov-lev', '2026-09-30');
const r = ev.result!;
const K = 'cov-lev@2026-09-30';

describe('scénario Leverage calculé depuis le jeu de données', () => {
  it('reproduit les montants du plan', () => {
    expect(find(r.tree, `${K}/N/c-lev-n1`)?.value).toBe('10000000.00');
    expect(find(r.tree, `${K}/N/c-lev-n2`)?.value).toBe('600000.00');
    expect(r.numerator).toBe('9400000.00');
    expect(find(r.tree, `${K}/D/c-lev-d1/ytd-2026-09-30`)?.value).toBe('2000000.00');
    expect(find(r.tree, `${K}/D/c-lev-d1/fy-2025`)?.value).toBe('2650000.00');
    expect(find(r.tree, `${K}/D/c-lev-d1/ytd-2025-09-30`)?.value).toBe('1800000.00');
    expect(find(r.tree, `${K}/D/c-lev-d1`)?.value).toBe('2850000.00');
    expect(r.denominator).toBe('3000000.00');
    expect(r.value).toBe('3.1333333333');
    expect(r.status).toBe('WATCH');
    expect(r.deltaNumerator).toBe('1100000.00');
    expect(r.deltaDenominator).toBe('314285.71');
  });
  it('remonte chaque chiffre à sa ligne de balance, sa saisie ou sa clause', () => {
    const cashAccount = find(r.tree, `${K}/N/c-lev-n2/512100`);
    expect(cashAccount?.provenance).toMatchObject({ type: 'IMPORT', balanceId: 'tb-di-2026-09-30', rows: [21], column: 'Débit' });
    expect(find(r.tree, `${K}/N/c-lev-n2/508000`)?.provenance).toMatchObject({ type: 'IMPORT', rows: [20] });
    expect(find(r.tree, `${K}/D/c-lev-d1/ytd-2026-09-30/701000`)?.provenance).toMatchObject({ type: 'IMPORT', rows: [35], column: 'Crédit' });
    expect(find(r.tree, `${K}/N/c-lev-n1`)?.provenance).toMatchObject({ type: 'MANUAL_ENTRY', object: { kind: 'OUTSTANDING', id: 'od-03' }, documentId: 'doc-02' });
    expect(find(r.tree, `${K}/D/adj-01`)?.provenance).toMatchObject({ type: 'MANUAL_ENTRY', documentId: 'doc-03' });
    expect(find(r.tree, `${K}/threshold`)?.provenance).toMatchObject({ type: 'CONTRACT', documentId: 'doc-01', page: 47, clauseId: 'art-19-2' });
    expect(find(r.tree, `${K}/N/c-lev-n2`)?.provenance).toMatchObject({ type: 'CALCULATION', rule: 'BR-166' });
    const allLeaves = leaves(r.tree);
    expect(allLeaves.length).toBeGreaterThan(10);
    for (const leaf of allLeaves) expect(['CONTRACT', 'IMPORT', 'MANUAL_ENTRY']).toContain(leaf.provenance.type);
  });
  it('au 31/12/2026, non calculable avec deux manques nommés', () => {
    const future = evaluateCovenantAt(seed, 'cov-lev', '2026-12-31').result!;
    expect(future.status).toBe('NOT_COMPUTABLE');
    expect(future.missing.map((m) => m.label).sort()).toEqual(['balance de Démo Industrie SAS au 31/12/2026', 'encours déclaré de Senior Facility Agreement au 31/12/2026']);
  });
  it('historique enregistré : 2,79x puis 2,95x ; Gearing 0,78x et Couverture 6,67x au 30/09', () => {
    const saved = (key: string) => seed.savedTests.find((t) => t.key === key)!.snapshot.result;
    const lev0331 = saved('cov-lev@2026-03-31');
    const lev0630 = saved('cov-lev@2026-06-30');
    expect(formatCovenantValue(lev0331.valueExact!, lev0331.threshold)).toBe('2,79x');
    expect(formatCovenantValue(lev0630.valueExact!, lev0630.threshold)).toBe('2,95x');
    const gea = evaluateCovenantAt(seed, 'cov-gea', '2026-09-30').result!;
    const icr = evaluateCovenantAt(seed, 'cov-icr', '2026-09-30').result!;
    expect(formatCovenantValue(gea.valueExact!, gea.threshold)).toBe('0,78x');
    expect(gea.status).toBe('COMPLIANT');
    expect(formatCovenantValue(icr.valueExact!, icr.threshold)).toBe('6,67x');
    expect(icr.denominator).toBe('450000.00');
  });
  it('empreinte stable : mêmes données, même empreinte', () => {
    const copy = structuredClone(seed);
    expect(evaluateCovenantAt(copy, 'cov-lev', '2026-09-30').inputsHash).toBe(ev.inputsHash);
    expect(ev.inputsHash).toMatch(/^[0-9a-f]{64}$/);
    expect(seed.savedTests).toHaveLength(6);
    expect(seed.savedTests.every((t) => t.snapshot.inputs_hash.length === 64)).toBe(true);
  });
});
