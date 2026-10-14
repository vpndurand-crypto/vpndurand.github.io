/**
 * Données du film (V5, version anglaise) : un seul groupe fictif, cohérent d'un écran à l'autre.
 *
 * - Socle bêta : le groupe de démonstration de la bêta (trois sociétés françaises, quatre prêteurs fictifs,
 *   quatre financements, encours au 30/09/2026, Leverage 3,13x calculé par le moteur, échéancier et alertes d'aperçu).
 *   Les montants, dates et ratios viennent de la bêta ; seuls les libellés sont traduits (noms fictifs anglicisés,
 *   prêteurs rebaptisés « Bank A/B/C » et « Lease Co. » pour qu'aucun nom ne ressemble à une vraie banque).
 * - Projection : trois filiales étrangères fictives, un scénario d'acquisition, la structure du capital (S8) et les
 *   familles de financeurs (S9). Ils ne viennent pas de la bêta ; le film les signale (« Product vision », « Our vision »).
 *
 * Tous les totaux, parts, ratios et marges sont calculés ici en décimal exact (big.js), formatés à l'anglaise (format.ts).
 */
import { entities } from '../../beta/src/data/entities';
import { lenders } from '../../beta/src/data/lenders';
import { financings } from '../../beta/src/data/financings';
import { outstanding } from '../../beta/src/data/outstanding';
import { scheduleEvents } from '../../beta/src/data/preview/schedule';
import { aiProposals } from '../../beta/src/data/preview/aiProposals';
import { CLAUSES } from '../../beta/src/data/covenants';
import type { FinancingCategory } from '../../beta/src/data/types';
import { DATE_ARRETE, DEMO_TODAY } from '../../beta/src/config/demo';
import { D, sum, type Decimal } from '../../beta/src/domain/decimal';
import { RAW, V } from '../bridge/demo';
import { date, money, moneyCompact, percent, ratio, signedRatio } from './format';

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Donnée absente : ${what}`);
  return value;
}

export type Country = 'FR' | 'ES' | 'DE' | 'US';
export const COUNTRY_NAMES: Record<Country, string> = { FR: 'France', ES: 'Spain', DE: 'Germany', US: 'United States' };

/** Libellés anglais des objets de la bêta (par identifiant). Toute donnée sans traduction arrête le rendu. */
const ENTITY_EN: Record<string, { name: string; short: string }> = {
  'ent-di': { name: 'Demo Industries SAS', short: 'Demo Industries' },
  'ent-dl': { name: 'Demo Logistics SAS', short: 'Demo Logistics' },
  'ent-ds': { name: 'Demo Services SAS', short: 'Demo Services' },
};
export const LENDER_EN: Record<string, string> = { 'lnd-exe': 'Bank A', 'lnd-aur': 'Bank B', 'lnd-mer': 'Bank C', 'lnd-fbe': 'Lease Co.' };
const FINANCING_EN: Record<string, string> = {
  'fin-01': 'Senior Facility Agreement',
  'fin-02': 'Equipment term loan',
  'fin-03': 'Logistics platform lease',
  'fin-04': 'Revolving credit facility',
};
const CATEGORY_EN: Record<FinancingCategory, string> = { BANK_MLT: 'Bank term loans', LEASE: 'Leasing', REVOLVING_CT: 'Revolving credit' };
const en = <T>(table: Record<string, T>, id: string): T => required(table[id], `traduction de ${id}`);

export const GROUP_NAME = 'Demo Group';

export interface GroupEntity { id: string; name: string; short: string; country: Country; currency: 'EUR' | 'USD'; origin: 'beta' | 'projection' }
export interface GroupFinancing {
  id: string; entityId: string; lenderId: string; label: string; reference: string; category: FinancingCategory;
  amount: Decimal; maturity: string; origin: 'beta' | 'projection';
}

// --- Socle bêta -----------------------------------------------------------
// Les sociétés de la bêta sont des SAS françaises (la bêta ne porte pas de champ « pays »).
const betaEntities: GroupEntity[] = entities.map((e) => ({ id: e.id, ...en(ENTITY_EN, e.id), country: 'FR', currency: 'EUR', origin: 'beta' }));

/** Encours de chaque financement à la date d'arrêté de la bêta (30/09/2026). */
function outstandingAt(financingId: string): Decimal {
  const od = required(outstanding.find((o) => o.financing_id === financingId && o.as_of_date === DATE_ARRETE), `encours ${financingId} au ${DATE_ARRETE}`);
  return D(od.amount);
}
const betaFinancings: GroupFinancing[] = financings.map((f) => ({
  id: f.id, entityId: f.entity_id, lenderId: f.lender_id, label: en(FINANCING_EN, f.id), reference: f.external_reference, category: f.category,
  amount: outstandingAt(f.id), maturity: f.maturity_date, origin: 'beta',
}));

// --- Projection : filiales étrangères (fictives), financées par les prêteurs fictifs de la bêta ---------------
const projectionEntities: GroupEntity[] = [
  { id: 'ent-ib', name: 'Demo Iberia S.L.', short: 'Demo Iberia', country: 'ES', currency: 'EUR', origin: 'projection' },
  { id: 'ent-de', name: 'Demo Germany GmbH', short: 'Demo Germany', country: 'DE', currency: 'EUR', origin: 'projection' },
  { id: 'ent-us', name: 'Demo USA Inc.', short: 'Demo USA', country: 'US', currency: 'USD', origin: 'projection' },
];
const projectionFinancings: GroupFinancing[] = [
  { id: 'fin-p1', entityId: 'ent-ib', lenderId: 'lnd-aur', label: 'Term loan', reference: 'TL-IB-01', category: 'BANK_MLT', amount: D('2500000'), maturity: '2031-06-30', origin: 'projection' },
  { id: 'fin-p2', entityId: 'ent-de', lenderId: 'lnd-mer', label: 'Term loan', reference: 'TL-DE-01', category: 'BANK_MLT', amount: D('2000000'), maturity: '2030-09-30', origin: 'projection' },
  // Ligne en dollars, convertie en euros dans la vue groupe (contre-valeur fictive).
  { id: 'fin-p3', entityId: 'ent-us', lenderId: 'lnd-exe', label: 'USD credit line', reference: 'RCF-US-01', category: 'REVOLVING_CT', amount: D('1500000'), maturity: '2028-03-31', origin: 'projection' },
];

export const GROUP_ENTITIES: readonly GroupEntity[] = [...betaEntities, ...projectionEntities];
export const GROUP_FINANCINGS: readonly GroupFinancing[] = [...betaFinancings, ...projectionFinancings];

const entityOf = (id: string) => required(GROUP_ENTITIES.find((e) => e.id === id), `société ${id}`);
const lenderOf = (id: string) => {
  const l = required(lenders.find((x) => x.id === id), `prêteur ${id}`);
  return { ...l, name: en(LENDER_EN, id) };
};

const total = sum(GROUP_FINANCINGS.map((f) => f.amount));
const share = (amount: Decimal) => amount.div(total);

export interface Slice { key: string; label: string; amount: string; share: string; fraction: number; sub?: string }
function slice(key: string, label: string, amount: Decimal, sub?: string): Slice {
  const s: Slice = { key, label, amount: moneyCompact(amount), share: percent(share(amount)), fraction: Number(share(amount).toFixed(6)) };
  if (sub !== undefined) s.sub = sub;
  return s;
}
const byDesc = (a: Slice, b: Slice) => b.fraction - a.fraction;
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

const COUNTRIES: Country[] = ['FR', 'ES', 'DE', 'US'];
const countryAmount = (c: Country) => sum(GROUP_FINANCINGS.filter((f) => entityOf(f.entityId).country === c).map((f) => f.amount));
const countryEntities = (c: Country) => GROUP_ENTITIES.filter((e) => e.country === c);

/** Vue groupe consolidée (projection). */
export const GROUP = {
  name: GROUP_NAME,
  asOf: date(DATE_ARRETE),
  today: date(DEMO_TODAY),
  total: moneyCompact(total),
  totalExact: money(total, 2),
  entityCount: GROUP_ENTITIES.length,
  countryCount: COUNTRIES.length,
  lenderCount: new Set(GROUP_FINANCINGS.map((f) => f.lenderId)).size,
  bankCount: [...new Set(GROUP_FINANCINGS.map((f) => f.lenderId))].filter((id) => lenderOf(id).lender_type === 'BANK').length,
  leaseCount: [...new Set(GROUP_FINANCINGS.map((f) => f.lenderId))].filter((id) => lenderOf(id).lender_type === 'LEASING').length,
  entitiesFrance: GROUP_ENTITIES.filter((e) => e.country === 'FR').length,
  entitiesAbroad: GROUP_ENTITIES.filter((e) => e.country !== 'FR').length,
  financingCount: GROUP_FINANCINGS.length,
  byCountry: COUNTRIES.map((c) => ({
    ...slice(c, COUNTRY_NAMES[c], countryAmount(c), plural(countryEntities(c).length, 'entity', 'entities')),
    country: c,
    currency: countryEntities(c).some((e) => e.currency === 'USD') ? 'USD' : 'EUR',
    entities: countryEntities(c).map((e) => {
      const fins = GROUP_FINANCINGS.filter((f) => f.entityId === e.id);
      const amount = sum(fins.map((f) => f.amount));
      return { id: e.id, name: e.name, short: e.short, amount: moneyCompact(amount), fraction: Number(amount.div(countryAmount(c)).toFixed(6)), lenders: [...new Set(fins.map((f) => lenderOf(f.lenderId).name))].join(' · '), financings: fins.length };
    }),
  })),
  byLender: [...new Set(GROUP_FINANCINGS.map((f) => f.lenderId))]
    .map((id) => slice(id, lenderOf(id).name, sum(GROUP_FINANCINGS.filter((f) => f.lenderId === id).map((f) => f.amount))))
    .sort(byDesc),
  byCategory: [...new Set(GROUP_FINANCINGS.map((f) => f.category))]
    .map((c) => slice(c, CATEGORY_EN[c], sum(GROUP_FINANCINGS.filter((f) => f.category === c).map((f) => f.amount))))
    .sort(byDesc),
} as const;

// --- La filiale ouverte dans le cockpit : Demo Industries (bêta) ------------
const sfa = required(betaFinancings.find((f) => f.id === 'fin-01'), 'SFA');
export const SUBSIDIARY = {
  name: entityOf(sfa.entityId).name,
  short: entityOf(sfa.entityId).short,
  country: COUNTRY_NAMES[entityOf(sfa.entityId).country],
  financing: sfa.label,
  reference: sfa.reference,
  lender: lenderOf(sfa.lenderId).name,
  amount: moneyCompact(sfa.amount),
  maturity: date(sfa.maturity),
  covenant: ratio(RAW.value),
  status: V.covenant.status,
} as const;

// --- Le covenant (bêta, moteur de calcul) -----------------------------------
const sfaFile = 'SFA_DemoIndustries_BankA_2025-12-15.pdf';
export const COVENANT = {
  label: 'Net leverage',
  context: `${SUBSIDIARY.name} · ${sfa.label} · ${SUBSIDIARY.lender}`,
  value: ratio(RAW.value),
  threshold: `≤ ${ratio(RAW.threshold)}`,
  thresholdShort: ratio(RAW.threshold),
  headroom: ratio(RAW.headroom),
  headroomPct: percent(RAW.headroomPct),
  status: V.covenant.status,
  tone: V.covenant.tone,
  gauge: V.covenant.gauge,
  numerator: moneyCompact(RAW.numerator),
  denominator: moneyCompact(RAW.denominator),
  clause: { article: CLAUSES.leverage.article, page: CLAUSES.leverage.page },
  sourceChip: `${sfa.reference} · clause ${CLAUSES.leverage.article}, p. ${CLAUSES.leverage.page}`,
  contractFile: sfaFile,
  contractPages: 96,
} as const;

// --- Extraction (aperçu de la bêta : propositions validées sur le contrat SFA) ------
const proposal = (id: string) => required(aiProposals.find((a) => a.id === id), `proposition ${id}`);
/** Marge du taux validée dans la bêta (« Euribor 3 mois + 2,50 % » → 2.50%). */
const margin = required(/\+\s*([\d,]+)/.exec(proposal('aip-05').final_value)?.[1], 'marge du taux').replace(',', '.');
const sfaContract = required(financings.find((f) => f.id === 'fin-01'), 'SFA (bêta)');
export const EXTRACTION = {
  file: sfaFile,
  fields: [
    { key: 'amount', label: 'Facility amount', value: money(required(sfaContract.initial_amount, 'montant du crédit')), page: proposal('aip-01').page },
    { key: 'rate', label: 'Interest rate', value: `3M EURIBOR + ${margin}%`, page: proposal('aip-05').page },
    { key: 'maturity', label: 'Maturity date', value: date(sfa.maturity), page: proposal('aip-03').page },
    { key: 'covenant', label: 'Financial covenants', value: `Net leverage ≤ ${ratio(RAW.threshold)}`, page: proposal('aip-07').page },
  ],
} as const;

/** Registre des financements du groupe, dans l'ordre d'apparition à l'écran. */
export const REGISTRY = GROUP_FINANCINGS.map((f) => ({
  id: f.id, entity: entityOf(f.entityId).short, country: entityOf(f.entityId).country, lender: lenderOf(f.lenderId).name,
  label: f.label, amount: moneyCompact(f.amount), origin: f.origin,
}));

// --- Échéancier (aperçu de la bêta : événements saisis et alertes) ---------------
const event = (id: string) => required(scheduleEvents.find((e) => e.id === id), `événement ${id}`);
/** Mois entiers entre « aujourd'hui » (date de démonstration de la bêta) et l'événement : l'alerte arrive avec cette avance. */
function monthsAhead(iso: string): number {
  const [y0, m0, d0] = DEMO_TODAY.split('-').map(Number);
  const [y1, m1, d1] = iso.split('-').map(Number);
  return ((y1 ?? 0) - (y0 ?? 0)) * 12 + ((m1 ?? 0) - (m0 ?? 0)) - ((d1 ?? 0) < (d0 ?? 0) ? 1 : 0);
}
export const TIMELINE = {
  today: DEMO_TODAY,
  events: [
    { id: 'test', date: event('sch-01').event_date, kind: 'Covenant review', title: 'Net leverage test', sub: en(ENTITY_EN, event('sch-01').entity_id).short, tone: 'info' as const },
    { id: 'installment', date: event('sch-02').event_date, kind: 'Repayment', title: en(FINANCING_EN, required(event('sch-02').financing_id, 'financement')), sub: money(required(event('sch-02').total, 'échéance')), tone: 'info' as const },
    { id: 'maturity-rcf', date: event('sch-07').event_date, kind: 'Refinancing', title: en(FINANCING_EN, required(event('sch-07').financing_id, 'financement')), sub: lenderOf('lnd-mer').name, tone: 'info' as const },
    { id: 'step', date: event('sch-08').event_date, kind: 'Covenant step-down', title: `Leverage limit lowered to ${ratio(RAW.nextThreshold.threshold)}`, sub: `Headroom shrinks · flagged ${monthsAhead(event('sch-08').event_date)} months ahead`, tone: 'watch' as const },
    { id: 'maturity-sfa', date: sfa.maturity, kind: 'Debt maturity', title: sfa.label, sub: `${moneyCompact(sfa.amount)} bullet`, tone: 'info' as const },
  ],
  stepThreshold: ratio(RAW.nextThreshold.threshold),
} as const;

// --- Simulation (projection) : nouvelle acquisition financée par une tranche de dette ------------------------------
const ACQUISITION_DEBT = D('4000000');
const TARGET_EBITDA = D('800000');
const netDebtAfter = D(RAW.numerator).plus(ACQUISITION_DEBT);
const ebitdaAfter = D(RAW.denominator).plus(TARGET_EBITDA);
const leverageAfter = netDebtAfter.div(ebitdaAfter);
const headroomAfter = D(RAW.threshold).minus(leverageAfter);
const groupAfter = total.plus(ACQUISITION_DEBT);

/** Échéancier par année de maturité finale (même logique que la répartition « par maturité » de la bêta). */
function maturityProfile(extra: { year: number; amount: Decimal } | null) {
  const years = new Map<number, Decimal>();
  for (const f of GROUP_FINANCINGS) {
    const y = Number(f.maturity.slice(0, 4));
    years.set(y, (years.get(y) ?? D(0)).plus(f.amount));
  }
  if (extra) years.set(extra.year, (years.get(extra.year) ?? D(0)).plus(extra.amount));
  return [...years.entries()].sort((a, b) => a[0] - b[0]).map(([year, amount]) => ({ year, amount: moneyCompact(amount), value: Number(amount.div(1_000_000).toFixed(4)) }));
}

export const SIMULATION = {
  current: 'Current Position',
  scenario: 'New Scenario',
  scenarioName: 'Acquisition',
  inputs: [
    { label: 'Acquisition debt', value: moneyCompact(ACQUISITION_DEBT) },
    { label: 'Target EBITDA', value: moneyCompact(TARGET_EBITDA) },
  ],
  acquisitionYear: 2033,
  groupBefore: GROUP.total,
  groupAfter: moneyCompact(groupAfter),
  leverageBefore: ratio(RAW.value),
  leverageAfter: ratio(leverageAfter),
  leverageAfterValue: Number(leverageAfter.toFixed(6)),
  headroomBefore: ratio(RAW.headroom),
  headroomAfter: signedRatio(headroomAfter),
  breach: headroomAfter.lt(0),
  threshold: `≤ ${ratio(RAW.threshold)}`,
  thresholdValue: Number(RAW.threshold),
  netDebtAfter: moneyCompact(netDebtAfter),
  ebitdaAfter: moneyCompact(ebitdaAfter),
  profileBefore: maturityProfile(null),
  profileAfter: maturityProfile({ year: 2033, amount: ACQUISITION_DEBT }),
} as const;

// --- Dossier de financement (projection) -----------------------------------------
const years = GROUP_FINANCINGS.map((f) => Number(f.maturity.slice(0, 4)));
export const DOSSIER = {
  title: 'Financing Package',
  project: 'Acquisition project',
  need: moneyCompact(ACQUISITION_DEBT),
  blocks: [
    { key: 'debt', title: 'Consolidated debt structure', detail: `${GROUP.total} · ${GROUP.lenderCount} lenders · ${GROUP.financingCount} facilities`, icon: 'financings' as const },
    { key: 'data', title: 'Financial statements', detail: `${GROUP.entityCount} entities · ${GROUP.countryCount} countries`, icon: 'data' as const },
    { key: 'schedule', title: 'Maturity schedule', detail: `Maturities ${Math.min(...years)} → ${Math.max(...years)}`, icon: 'schedule' as const },
    { key: 'covenants', title: 'Covenant monitoring', detail: `Net leverage ${ratio(RAW.value)} · limit ≤ ${ratio(RAW.threshold)}`, icon: 'covenants' as const },
    { key: 'scenario', title: 'Financial scenarios', detail: `Acquisition · ${ratio(leverageAfter)} projected`, icon: 'calculator' as const },
    { key: 'need', title: 'Financing requirements', detail: `${moneyCompact(ACQUISITION_DEBT)} · acquisition project`, icon: 'save' as const },
  ],
} as const;

// --- Structure du capital (S8, vision, valeurs d'illustration) ------------------------
// La dette est celle du groupe (20,0 M€) ; fonds propres et autres instruments sont des valeurs d'illustration.
const EQUITY = D('24000000');
const OTHER_INSTRUMENTS = D('3500000');
const capitalTotal = total.plus(EQUITY).plus(OTHER_INSTRUMENTS);
const capShare = (x: Decimal) => ({ share: percent(x.div(capitalTotal)), fraction: Number(x.div(capitalTotal).toFixed(6)) });
export const CAPITAL = {
  total: moneyCompact(capitalTotal),
  categories: [
    { key: 'debt', label: 'Debt', amount: GROUP.total, detail: `${GROUP.financingCount} facilities · ${GROUP.lenderCount} lenders`, ...capShare(total) },
    { key: 'equity', label: 'Equity', amount: moneyCompact(EQUITY), detail: 'Share capital · reserves', ...capShare(EQUITY) },
    { key: 'other', label: 'Other capital instruments', amount: moneyCompact(OTHER_INSTRUMENTS), detail: 'Shareholder loans · convertible notes', ...capShare(OTHER_INSTRUMENTS) },
  ],
  modules: ['Capital Structure', 'Scenarios', 'Financing Strategy'],
  /** Même acquisition (4,0 M€, EBITDA de la cible 0,8 M€), trois façons de la financer : dette, moitié-moitié, fonds propres. */
  fundingScenarios: [
    { key: 'debt', label: 'Debt-funded', leverage: ratio(D(RAW.numerator).plus(ACQUISITION_DEBT).div(ebitdaAfter)), breach: D(RAW.numerator).plus(ACQUISITION_DEBT).div(ebitdaAfter).gt(RAW.threshold) },
    { key: 'mixed', label: '50 / 50 debt and equity', leverage: ratio(D(RAW.numerator).plus(ACQUISITION_DEBT.div(2)).div(ebitdaAfter)), breach: D(RAW.numerator).plus(ACQUISITION_DEBT.div(2)).div(ebitdaAfter).gt(RAW.threshold) },
    { key: 'equity', label: 'Equity-funded', leverage: ratio(D(RAW.numerator).div(ebitdaAfter)), breach: D(RAW.numerator).div(ebitdaAfter).gt(RAW.threshold) },
  ],
} as const;

// --- Accès au capital (S9, vision) : familles de financeurs, sans nom ni offre -----------------------
export const PROVIDERS = [
  { key: 'banks', label: 'Banks', detail: 'Term loans · revolving credit' },
  { key: 'private', label: 'Private Debt', detail: 'Unitranche · direct lending' },
  { key: 'markets', label: 'Capital Markets', detail: 'Bonds · private placements' },
] as const;
