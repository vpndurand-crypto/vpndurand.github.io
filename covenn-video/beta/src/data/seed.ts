/**
 * Jeu de démonstration initial, assemblé et gelé (plan technique, section 7).
 * Seul fichier de data/ qui appelle le moteur : les instantanés des calculs déjà enregistrés
 * (31/03 et 30/06/2026) sont calculés, jamais écrits à la main.
 */
import { buildSavedTest, evaluateCovenantAt } from '../domain/covenantTests';
import { adjustmentsSeed } from './adjustmentsSeed';
import { audit } from './audit';
import { seedBalances } from './balances';
import { accounts } from './chartOfAccounts';
import { contractPages } from './contractPages';
import { covenants, definitions } from './covenants';
import { documents } from './documents';
import { entities } from './entities';
import { financings } from './financings';
import { importJobs } from './importJobs';
import { lenders } from './lenders';
import { mappings } from './mapping';
import { organization } from './organization';
import { outstanding } from './outstanding';
import { aiProposals } from './preview/aiProposals';
import { alerts } from './preview/alerts';
import { roadmap } from './preview/roadmap';
import { scheduleEvents, scheduleGaps } from './preview/schedule';
import { savedTestsSeed } from './savedTestsSeed';
import type { SeedData } from './types';
import { users } from './users';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

const initial: SeedData = {
  organization, users, entities, lenders, financings, outstanding, documents, contractPages, accounts,
  balances: seedBalances, importJobs, mappings, covenants, definitions, adjustments: adjustmentsSeed, savedTests: [], audit,
  preview: { schedule: scheduleEvents, scheduleGaps, alerts, aiProposals, roadmap },
};

const savedTests = savedTestsSeed.map((entry) =>
  buildSavedTest(evaluateCovenantAt(initial, entry.covenant_id, entry.test_date), { occurrence: entry.occurrence, closedBy: entry.closed_by, closedAt: entry.closed_at }),
);

export const seed: SeedData = deepFreeze({ ...initial, savedTests });
