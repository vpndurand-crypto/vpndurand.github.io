import { describe, expect, it } from 'vitest';
import Big from 'big.js';
import { seed } from '../seed';
import { reimportBalanceV2 } from '../balances';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('cohérence du jeu de démonstration', () => {
  it('balances équilibrées, lignes numérotées dans l’ordre des comptes', () => {
    for (const b of [...seed.balances, reimportBalanceV2]) {
      const debit = b.lines.reduce((acc, l) => acc.plus(l.debit), new Big(0));
      const credit = b.lines.reduce((acc, l) => acc.plus(l.credit), new Big(0));
      expect(debit.eq(credit)).toBe(true);
      expect(debit.eq(b.total_debit) && credit.eq(b.total_credit)).toBe(true);
      expect(b.lines.map((l) => l.row)).toEqual(b.lines.map((_, i) => i + 2));
      expect([...b.lines.map((l) => l.account_number)].sort()).toEqual(b.lines.map((l) => l.account_number));
      for (const l of b.lines) expect(new Big(l.debit).minus(l.credit).eq(l.balance)).toBe(true);
    }
    const totals = Object.fromEntries(seed.balances.map((b) => [b.id, b.total_debit]));
    expect(totals['tb-di-2026-09-30']).toBe('50470000.00');
    expect(totals['tb-dl-2026-09-30']).toBe('9435000.00');
    expect(totals['tb-ds-2026-09-30']).toBe('4420000.00');
    expect(seed.balances).toHaveLength(9);
  });
  it('lignes citées par le plan : 508000 ligne 20, 512100 ligne 21, 701000 ligne 35', () => {
    const b = seed.balances.find((x) => x.id === 'tb-di-2026-09-30')!;
    const row = (acc: string) => b.lines.find((l) => l.account_number === acc)?.row;
    expect([row('508000'), row('512100'), row('701000')]).toEqual([20, 21, 35]);
    expect(reimportBalanceV2.lines.find((l) => l.account_number === '512100')?.balance).toBe('312000.00');
  });
  it('identifiants uniques et références résolues', () => {
    const ids = (xs: Array<{ id: string }>) => xs.map((x) => x.id);
    for (const list of [seed.entities, seed.lenders, seed.financings, seed.outstanding, seed.documents, seed.covenants, seed.definitions, seed.adjustments, seed.audit, seed.importJobs, seed.accounts]) {
      expect(unique(ids(list))).toBe(true);
    }
    const has = (list: Array<{ id: string }>, id: string | null) => id === null || list.some((x) => x.id === id);
    for (const f of seed.financings) {
      expect(has(seed.entities, f.entity_id) && has(seed.lenders, f.lender_id)).toBe(true);
      for (const d of f.document_ids) expect(has(seed.documents, d)).toBe(true);
    }
    for (const od of seed.outstanding) expect(has(seed.financings, od.financing_id) && has(seed.documents, od.document_id) && has(seed.users, od.created_by)).toBe(true);
    for (const b of seed.balances) expect(has(seed.importJobs, b.import_job_id)).toBe(true);
    for (const e of seed.audit) expect(has(seed.users, e.user_id)).toBe(true);
  });
  it('chaque clause citée existe à la page indiquée du document', () => {
    const clauses = seed.definitions.flatMap((d) => [...d.components.map((c) => c.clause), ...d.threshold_steps.map((s) => s.clause), ...d.adjustment_categories.map((c) => c.clause)]);
    for (const c of clauses) {
      const page = seed.contractPages.find((p) => p.document_id === c.document_id && p.page === c.page);
      expect(page?.blocks.some((b) => b.id === c.clause_id), `${c.clause_id} p. ${c.page}`).toBe(true);
      expect(seed.documents.find((d) => d.id === c.document_id)?.excerpt_pages).toContain(c.page);
    }
  });
  it('encours au 30/09/2026 : 14 000 000 €, journal de 48 événements sans valeur de ratio écrite', () => {
    const total = seed.outstanding.filter((o) => o.as_of_date === '2026-09-30').reduce((acc, o) => acc.plus(o.amount), new Big(0));
    expect(total.toFixed(2)).toBe('14000000.00');
    expect(seed.audit).toHaveLength(48);
    expect(JSON.stringify(seed.audit)).not.toContain('3,13');
    expect(Object.isFrozen(seed) && Object.isFrozen(seed.balances[0])).toBe(true);
  });
});
