/**
 * Données du film « vision » : un seul groupe fictif, cohérent d'un écran à l'autre.
 *
 * - Socle bêta : le Groupe Démonstration de la bêta (trois sociétés françaises, quatre prêteurs fictifs,
 *   quatre financements, encours au 30/09/2026, Leverage 3,13x calculé par le moteur, échéancier et alertes d'aperçu).
 * - Projection : trois filiales étrangères fictives et un scénario d'acquisition, ajoutés pour illustrer la vision produit.
 *   Ils ne viennent pas de la bêta ; le film les signale par la mention « Projection produit ».
 *
 * Tous les totaux, parts, ratios et marges sont calculés ici en décimal exact (big.js) et formatés par les fonctions de la bêta.
 */
import { organization } from '../../beta/src/data/organization';
import { entities } from '../../beta/src/data/entities';
import { lenders } from '../../beta/src/data/lenders';
import { financings } from '../../beta/src/data/financings';
import { outstanding } from '../../beta/src/data/outstanding';
import { documents } from '../../beta/src/data/documents';
import { scheduleEvents } from '../../beta/src/data/preview/schedule';
import { alerts } from '../../beta/src/data/preview/alerts';
import { aiProposals } from '../../beta/src/data/preview/aiProposals';
import { CLAUSES } from '../../beta/src/data/covenants';
import { FINANCING_CATEGORY_LABELS } from '../../beta/src/data/labels';
import type { FinancingCategory } from '../../beta/src/data/types';
import { DATE_ARRETE, DEMO_TODAY } from '../../beta/src/config/demo';
import { D, sum, type Decimal } from '../../beta/src/domain/decimal';
import { formatDate, formatMoney, formatMoneyCompact, formatPercent, formatRatio, formatSignedRatio } from '../../beta/src/domain/format';
import { RAW, V } from '../bridge/demo';

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Donnée absente : ${what}`);
  return value;
}

export type Country = 'FR' | 'ES' | 'DE' | 'US';
export const COUNTRY_NAMES: Record<Country, string> = { FR: 'France', ES: 'Espagne', DE: 'Allemagne', US: 'États-Unis' };

export interface GroupEntity { id: string; name: string; short: string; country: Country; currency: 'EUR' | 'USD'; origin: 'beta' | 'projection' }
export interface GroupFinancing {
  id: string; entityId: string; lenderId: string; label: string; reference: string; category: FinancingCategory;
  amount: Decimal; maturity: string; origin: 'beta' | 'projection';
}

// --- Socle bêta -----------------------------------------------------------
// Les sociétés de la bêta sont des SAS françaises (la bêta ne porte pas de champ « pays »).
const betaEntities: GroupEntity[] = entities.map((e) => ({ id: e.id, name: e.name, short: e.short_name, country: 'FR', currency: 'EUR', origin: 'beta' }));

/** Encours de chaque financement à la date d'arrêté de la bêta (30/09/2026). */
function outstandingAt(financingId: string): Decimal {
  const od = required(outstanding.find((o) => o.financing_id === financingId && o.as_of_date === DATE_ARRETE), `encours ${financingId} au ${DATE_ARRETE}`);
  return D(od.amount);
}
const betaFinancings: GroupFinancing[] = financings.map((f) => ({
  id: f.id, entityId: f.entity_id, lenderId: f.lender_id, label: f.label, reference: f.external_reference, category: f.category,
  amount: outstandingAt(f.id), maturity: f.maturity_date, origin: 'beta',
}));

// --- Projection : filiales étrangères (fictives), financées par les prêteurs fictifs de la bêta ---------------
const projectionEntities: GroupEntity[] = [
  { id: 'ent-ib', name: 'Démo Iberia S.L.', short: 'Démo Iberia', country: 'ES', currency: 'EUR', origin: 'projection' },
  { id: 'ent-de', name: 'Démo Deutschland GmbH', short: 'Démo Deutschland', country: 'DE', currency: 'EUR', origin: 'projection' },
  { id: 'ent-us', name: 'Démo USA Inc.', short: 'Démo USA', country: 'US', currency: 'USD', origin: 'projection' },
];
const projectionFinancings: GroupFinancing[] = [
  { id: 'fin-p1', entityId: 'ent-ib', lenderId: 'lnd-aur', label: 'Prêt moyen terme', reference: 'PMT-IB-01', category: 'BANK_MLT', amount: D('2500000'), maturity: '2031-06-30', origin: 'projection' },
  { id: 'fin-p2', entityId: 'ent-de', lenderId: 'lnd-mer', label: 'Prêt moyen terme', reference: 'PMT-DE-01', category: 'BANK_MLT', amount: D('2000000'), maturity: '2030-09-30', origin: 'projection' },
  // Ligne en dollars, convertie en euros dans la vue groupe (contre-valeur fictive).
  { id: 'fin-p3', entityId: 'ent-us', lenderId: 'lnd-exe', label: 'Ligne de crédit en USD', reference: 'RCF-US-01', category: 'REVOLVING_CT', amount: D('1500000'), maturity: '2028-03-31', origin: 'projection' },
];

export const GROUP_ENTITIES: readonly GroupEntity[] = [...betaEntities, ...projectionEntities];
export const GROUP_FINANCINGS: readonly GroupFinancing[] = [...betaFinancings, ...projectionFinancings];

const entityOf = (id: string) => required(GROUP_ENTITIES.find((e) => e.id === id), `société ${id}`);
const lenderOf = (id: string) => required(lenders.find((l) => l.id === id), `prêteur ${id}`);

const total = sum(GROUP_FINANCINGS.map((f) => f.amount));
const share = (amount: Decimal) => amount.div(total);

export interface Slice { key: string; label: string; amount: string; share: string; fraction: number; sub?: string }
function slice(key: string, label: string, amount: Decimal, sub?: string): Slice {
  const s: Slice = { key, label, amount: formatMoneyCompact(amount), share: formatPercent(share(amount)), fraction: Number(share(amount).toFixed(6)) };
  if (sub !== undefined) s.sub = sub;
  return s;
}
const byDesc = (a: Slice, b: Slice) => b.fraction - a.fraction;

const COUNTRIES: Country[] = ['FR', 'ES', 'DE', 'US'];
const countryAmount = (c: Country) => sum(GROUP_FINANCINGS.filter((f) => entityOf(f.entityId).country === c).map((f) => f.amount));
const countryEntities = (c: Country) => GROUP_ENTITIES.filter((e) => e.country === c);

/** Vue groupe consolidée (projection). */
export const GROUP = {
  name: organization.name,
  asOf: formatDate(DATE_ARRETE),
  today: formatDate(DEMO_TODAY),
  total: formatMoneyCompact(total),
  totalExact: formatMoney(total),
  entityCount: GROUP_ENTITIES.length,
  countryCount: COUNTRIES.length,
  lenderCount: new Set(GROUP_FINANCINGS.map((f) => f.lenderId)).size,
  financingCount: GROUP_FINANCINGS.length,
  byCountry: COUNTRIES.map((c) => ({
    ...slice(c, COUNTRY_NAMES[c], countryAmount(c), `${countryEntities(c).length} ${countryEntities(c).length > 1 ? 'sociétés' : 'société'}`),
    country: c,
    currency: countryEntities(c).some((e) => e.currency === 'USD') ? 'USD' : 'EUR',
    entities: countryEntities(c).map((e) => {
      const fins = GROUP_FINANCINGS.filter((f) => f.entityId === e.id);
      const amount = sum(fins.map((f) => f.amount));
      return { id: e.id, name: e.name, short: e.short, amount: formatMoneyCompact(amount), fraction: Number(amount.div(countryAmount(c)).toFixed(6)), lenders: [...new Set(fins.map((f) => lenderOf(f.lenderId).name))].join(' · '), financings: fins.length };
    }),
  })),
  byLender: [...new Set(GROUP_FINANCINGS.map((f) => f.lenderId))]
    .map((id) => slice(id, lenderOf(id).name, sum(GROUP_FINANCINGS.filter((f) => f.lenderId === id).map((f) => f.amount))))
    .sort(byDesc),
  byCategory: [...new Set(GROUP_FINANCINGS.map((f) => f.category))]
    .map((c) => slice(c, FINANCING_CATEGORY_LABELS[c], sum(GROUP_FINANCINGS.filter((f) => f.category === c).map((f) => f.amount))))
    .sort(byDesc),
} as const;

// --- La filiale ouverte dans le cockpit : Démo Industrie (bêta) ------------
const sfa = required(betaFinancings.find((f) => f.id === 'fin-01'), 'SFA');
export const SUBSIDIARY = {
  name: entityOf(sfa.entityId).name,
  country: COUNTRY_NAMES[entityOf(sfa.entityId).country],
  financing: sfa.label,
  reference: sfa.reference,
  lender: lenderOf(sfa.lenderId).name,
  amount: formatMoneyCompact(sfa.amount),
  maturity: formatDate(sfa.maturity),
  covenant: V.covenant.value,
  status: V.covenant.status,
} as const;

// --- Le covenant (bêta, moteur de calcul) -----------------------------------
export const COVENANT = {
  label: V.covenant.label,
  context: `${SUBSIDIARY.name} · ${sfa.label} · ${SUBSIDIARY.lender}`,
  value: V.covenant.value,
  threshold: V.covenant.threshold,
  thresholdShort: V.covenant.thresholdShort,
  headroom: V.covenant.headroom,
  headroomPct: V.covenant.headroomPct,
  status: V.covenant.status,
  tone: V.covenant.tone,
  gauge: V.covenant.gauge,
  clause: { article: CLAUSES.leverage.article, page: CLAUSES.leverage.page, excerpt: CLAUSES.leverage.excerpt },
  sourceChip: V.contract.chip,
  contractFile: V.contract.fileName,
  contractPage: V.contract.page47,
} as const;

// --- Extraction (aperçu de la bêta : propositions validées sur le contrat SFA) ------
const proposal = (id: string) => required(aiProposals.find((a) => a.id === id), `proposition ${id}`);
const sfaDoc = required(documents.find((d) => d.id === 'doc-01'), 'contrat SFA');
export const EXTRACTION = {
  file: sfaDoc.file_name,
  fields: [
    { key: 'contrat', label: 'Contrat', value: `${sfa.label} · ${sfa.reference}`, page: 1 },
    { key: 'taux', label: 'Taux', value: proposal('aip-05').final_value, page: proposal('aip-05').page },
    { key: 'echeance', label: 'Échéance', value: proposal('aip-03').final_value, page: proposal('aip-03').page },
    { key: 'covenant', label: 'Covenant', value: `Leverage ${V.covenant.threshold}`, page: proposal('aip-07').page },
    { key: 'encours', label: 'Encours', value: formatMoneyCompact(sfa.amount), page: proposal('aip-01').page },
  ],
} as const;

/** Registre des financements du groupe, dans l'ordre d'apparition à l'écran. */
export const REGISTRY = GROUP_FINANCINGS.map((f) => ({
  id: f.id, entity: entityOf(f.entityId).short, country: entityOf(f.entityId).country, lender: lenderOf(f.lenderId).name,
  label: f.label, amount: formatMoneyCompact(f.amount), origin: f.origin,
}));

// --- Échéancier (aperçu de la bêta : événements saisis et alertes) ---------------
const event = (id: string) => required(scheduleEvents.find((e) => e.id === id), `événement ${id}`);
const alert = (id: string) => required(alerts.find((a) => a.id === id), `alerte ${id}`);
export const TIMELINE = {
  today: DEMO_TODAY,
  events: [
    { id: 'test', date: event('sch-01').event_date, kind: 'Test de covenant', title: 'Test du Leverage', sub: entityOf(event('sch-01').entity_id).short, tone: 'info' as const },
    { id: 'installment', date: event('sch-02').event_date, kind: 'Échéance', title: 'Prêt équipement', sub: formatMoney(required(event('sch-02').total, 'échéance'), { dp: 0 }), tone: 'info' as const },
    { id: 'maturity-rcf', date: event('sch-07').event_date, kind: 'Refinancement', title: 'Crédit renouvelable à renouveler', sub: lenderOf('lnd-mer').name, tone: 'info' as const },
    { id: 'step', date: event('sch-08').event_date, kind: 'Marche de seuil', title: alert('alr-02').title.replace(/ le \d{2}\/\d{2}\/\d{4}$/, ''), sub: 'Marge réduite', tone: 'watch' as const },
    { id: 'maturity-sfa', date: sfa.maturity, kind: 'Maturité', title: `${sfa.label}`, sub: `${formatMoneyCompact(sfa.amount)} in fine`, tone: 'info' as const },
  ],
  stepThreshold: formatRatio(RAW.nextThreshold.threshold),
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
  return [...years.entries()].sort((a, b) => a[0] - b[0]).map(([year, amount]) => ({ year, amount: formatMoneyCompact(amount), value: Number(amount.div(1_000_000).toFixed(4)) }));
}

export const SIMULATION = {
  scenario: 'Nouvelle acquisition',
  inputs: [
    { label: 'Financement par dette', value: formatMoneyCompact(ACQUISITION_DEBT) },
    { label: 'EBITDA de la cible', value: formatMoneyCompact(TARGET_EBITDA) },
  ],
  acquisitionYear: 2033,
  groupBefore: GROUP.total,
  groupAfter: formatMoneyCompact(groupAfter),
  leverageBefore: V.covenant.value,
  leverageAfter: formatRatio(leverageAfter),
  leverageAfterValue: Number(leverageAfter.toFixed(6)),
  headroomBefore: V.covenant.headroom,
  headroomAfter: formatSignedRatio(headroomAfter),
  breach: headroomAfter.lt(0),
  threshold: V.covenant.threshold,
  thresholdValue: Number(RAW.threshold),
  netDebtAfter: formatMoneyCompact(netDebtAfter),
  ebitdaAfter: formatMoneyCompact(ebitdaAfter),
  profileBefore: maturityProfile(null),
  profileAfter: maturityProfile({ year: 2033, amount: ACQUISITION_DEBT }),
} as const;

// --- Dossier de financement (projection) -----------------------------------------
const years = GROUP_FINANCINGS.map((f) => Number(f.maturity.slice(0, 4)));
export const DOSSIER = {
  title: 'Dossier de financement',
  project: 'Projet d’acquisition',
  blocks: [
    { key: 'data', title: 'Données financières consolidées', detail: `${GROUP.entityCount} sociétés · ${GROUP.countryCount} pays`, icon: 'data' as const },
    { key: 'debt', title: 'Structure de dette', detail: `${GROUP.total} · ${GROUP.lenderCount} prêteurs`, icon: 'financings' as const },
    { key: 'schedule', title: 'Échéanciers', detail: `Maturités ${Math.min(...years)} → ${Math.max(...years)}`, icon: 'schedule' as const },
    { key: 'covenants', title: 'Ratios et covenants', detail: `Leverage ${V.covenant.value} · seuil ${V.covenant.threshold}`, icon: 'covenants' as const },
    { key: 'scenario', title: 'Scénario de financement', detail: `Acquisition · ${formatMoneyCompact(ACQUISITION_DEBT)} · ${formatRatio(leverageAfter)} projeté`, icon: 'calculator' as const },
    { key: 'proofs', title: 'Pièces justificatives', detail: 'Contrats · balances · relevés', icon: 'documents' as const },
  ],
} as const;
