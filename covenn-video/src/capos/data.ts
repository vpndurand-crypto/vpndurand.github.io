/**
 * Données du film Capital OS : toutes viennent de la bêta « Covenn — Capital operating system »
 * (beta-capital-os/covenn-capital-os-demo-en.html), calculées par son propre moteur et extraites telles quelles
 * dans snapshot.json par scripts/extract-capos.mjs (montants, ratios, statuts, libellés, dates, formats).
 *
 * Le film n'invente aucun chiffre : il choisit, regroupe et met en scène. Les seules valeurs calculées ici sont des
 * sommes ou des sélections de valeurs de la bêta (par exemple « book equity + outstanding debt »), formatées avec les
 * règles de la bêta (format.ts). La scène 9 (accès au capital) est une vision : familles de financeurs, sans nom ni offre.
 */
import S from './snapshot.json';
import { compact, date, ratio } from './format';

function need<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Donnée absente de la bêta : ${what}`);
  return value;
}
/** Les montants du moteur sont en centimes. */
const euros = (cents: number) => cents / 100;

export const SOURCE = S.source;

export type StatusCode = 'COMPLIANT' | 'WATCH' | 'CRITICAL' | 'BREACH' | 'NOT_COMPUTABLE';
export type CheckCode = 'AVAILABLE' | 'LINKED' | 'REVIEW' | 'MISSING';

const entityByName = (name: string) => need(S.entities.find((e) => e.name === name), `société ${name}`);
const facility = (id: string) => need(S.facilities.find((f) => f.id === id), `financement ${id}`);
const countryCode = (name: string) => need(Object.entries(S.countries).find(([, n]) => n === name)?.[0], `pays ${name}`);
const providersOf = (entityId: string) => [...new Set(S.facilities.filter((f) => f.entityId === entityId).map((f) => f.lender))];
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export interface Slice { key: string; label: string; amount: string; share: string; shareRounded: string; fraction: number }
const slice = (g: { key: string; share: number; fmt: { outstanding: string; share0: string; share1: string } }): Slice =>
  ({ key: g.key, label: g.key, amount: g.fmt.outstanding, share: g.fmt.share1, shareRounded: g.fmt.share0, fraction: g.share });

// ---------------------------------------------------------------------------
// Le groupe (vue consolidée)
// ---------------------------------------------------------------------------
const homeCountry = 'FR';
export const GROUP = {
  name: S.organization,
  scope: `${S.organization} · all entities`,
  asOf: S.fmtAsOf,
  outstanding: S.kpis.outstanding.fmt,
  outstandingExact: S.kpis.exact.outstanding,
  entityCount: S.entities.length,
  countryCount: S.groups.country.length,
  facilityCount: S.facilities.length,
  providerCount: S.groups.provider.length,
  entitiesHome: S.entities.filter((e) => e.country === homeCountry).length,
  entitiesAbroad: S.entities.filter((e) => e.country !== homeCountry).length,
  currencies: S.groups.currency.map((c) => c.key),
  fxNote: `GBP translated at ${need(S.fx.GBP, 'cours GBP')} (demonstration rate)`,
  netLeverage: S.kpis.netLeverage.fmt,
  byCountry: S.groups.country.map((g) => {
    const code = countryCode(g.key);
    const members = S.entities.filter((e) => e.country === code)
      .map((e) => ({ e, g: need(S.groups.entity.find((x) => x.key === e.name), `encours de ${e.name}`) }))
      .sort((a, b) => b.g.outstanding - a.g.outstanding);
    return {
      ...slice(g), key: code, country: code, sub: plural(members.length, 'entity', 'entities'),
      currency: members.find((m) => m.e.currency !== 'EUR')?.e.currency ?? 'EUR',
      entities: members.map((m) => ({ id: m.e.id, name: m.e.name, short: m.e.short, amount: m.g.fmt.outstanding, providers: providersOf(m.e.id).join(' · ') })),
    };
  }),
  byProvider: S.groups.provider.map(slice),
  byInstrument: S.groups.instrument.map(slice),
  byCurrency: S.groups.currency.map(slice),
} as const;

// ---------------------------------------------------------------------------
// La société ouverte depuis la vue groupe, et son covenant (contrat SFA)
// ---------------------------------------------------------------------------
const sfa = facility('fin-01');
const sfaDoc = need(S.documents.find((d) => d.id === 'doc-01'), 'contrat SFA');
const cov = S.covenant;
const nextStep = need(cov.nextStep, 'marche de seuil');

export const SUBSIDIARY = {
  name: sfa.entity,
  short: sfa.entityShort,
  country: sfa.country,
  facility: sfa.label,
  ref: sfa.ref,
  lender: sfa.lender,
  amount: sfa.fmt.eur,
  amountCompact: sfa.fmt.compact,
  maturity: sfa.fmt.maturity,
} as const;

export const COVENANT = {
  label: cov.short,
  definition: need(cov.label.split(' — ')[1], 'définition du ratio'),
  context: `${sfa.entity} · ${sfa.label} (${sfa.ref}) · ${sfa.lender}`,
  value: cov.fmt.value,
  valueNumber: Number(cov.value),
  threshold: cov.fmt.threshold,
  thresholdNumber: Number(cov.threshold),
  headroomPct: cov.fmt.headroomPct,
  headroomFraction: cov.headroomPct,
  status: cov.status as StatusCode,
  absorb: [
    { label: cov.deltaLabels.numerator, value: cov.fmt.deltaNumerator },
    { label: cov.deltaLabels.denominator, value: cov.fmt.deltaDenominator },
  ],
  thresholds: cov.thresholds.map((t) => ({ from: t.fmtFrom, value: t.fmt, current: t.current })),
  nextThreshold: `≤ ${ratio(Number(nextStep.threshold))}`,
  nextThresholdNumber: Number(nextStep.threshold),
  nextFrom: nextStep.fmtFrom,
  nextFromIso: nextStep.from,
  sourceNote: cov.sourceNote,
  clause: { id: 'art-19-2', page: 47 },
  contractFile: sfaDoc.file_name,
  contractPages: sfaDoc.page_count,
  tightest: need(cov.tightest, 'covenant le plus tendu'),
} as const;

// ---------------------------------------------------------------------------
// Extraction assistée (aperçu de la bêta : propositions relues et validées par une personne)
// ---------------------------------------------------------------------------
const EXTRACT_STATUS: Record<string, { tone: string; label: string }> = {
  SUGGESTED: { tone: 'b-info', label: 'Suggested extraction' },
  REVIEWED: { tone: 'b-watch', label: 'Human-reviewed' },
  CORRECTED: { tone: 'b-brand', label: 'Corrected by reviewer' },
  VALIDATED: { tone: 'b-ok', label: 'Validated' },
};
const proposal = (id: string) => need(S.extraction.find((x) => x.id === id), `extraction ${id}`);
export const EXTRACTION = {
  file: sfaDoc.file_name,
  fields: ['aip-01', 'aip-05', 'aip-03', 'aip-07'].map((id) => {
    const x = proposal(id);
    return { key: id, label: x.field_label, value: need(x.final_value, `valeur validée ${id}`), proposed: x.proposed_value, page: x.page, status: need(EXTRACT_STATUS[x.status], `statut ${x.status}`) };
  }),
} as const;

/** Registre des financements (page Debt & facilities), dans l'ordre de la bêta. */
export const REGISTRY = S.facilities.map((f) => ({
  id: f.id, entity: f.entityShort, country: f.country, lender: f.lender, label: f.label, amount: f.fmt.compact,
  local: f.currency !== 'EUR' ? f.fmt.localCompact : null,
}));

// ---------------------------------------------------------------------------
// Échéancier (onglet « Repayment schedule » de la bêta, et registre pour la maturité du SFA)
// ---------------------------------------------------------------------------
const row = (kind: string, test: (r: (typeof S.schedule)[number]) => boolean) => need(S.schedule.find((r) => r.kind === kind && test(r)), `échéance ${kind}`);
const test = row('Covenant test', () => true);
const instalment = row('Instalment', (r) => r.ref === 'PMT-2024-117');
const rcf = row('Maturity', (r) => r.ref === 'RCF-2024-009');
const step = row('Threshold step', () => true);
const rcfFacility = facility('fin-04');
/** « Leverage — Lumenvale Industrie, Gearing, Interest cover » → « Leverage, Gearing, Interest cover ». */
const [testFirst = '', testRest = ''] = need(test.text, 'test de covenant').split(' — ');
const testTitle = [testFirst, ...testRest.split(', ').slice(1)].join(', ');
const baseCase = need(S.scenarios.find((s) => s.id === 'sc-base'), 'scénario de base');
const levAtHorizon = need(baseCase.covenants.find((c) => c.id === 'cov-lev'), 'leverage projeté');
/** Mois entiers entre aujourd'hui (date de la démonstration) et l'échéance : l'alerte arrive avec cette avance. */
function monthsAhead(iso: string): number {
  const [y0, m0, d0] = S.today.split('-').map(Number);
  const [y1, m1, d1] = iso.split('-').map(Number);
  return ((y1 ?? 0) - (y0 ?? 0)) * 12 + ((m1 ?? 0) - (m0 ?? 0)) - ((d1 ?? 0) < (d0 ?? 0) ? 1 : 0);
}
export const TIMELINE = {
  today: S.today,
  events: [
    { id: 'test', date: test.date, kind: 'Covenant test', title: testTitle, sub: `${sfa.entityShort} · ${sfa.ref}`, tone: 'info' as const },
    { id: 'installment', date: instalment.date, kind: 'Instalment', title: need(instalment.facility, 'financement'), sub: `${instalment.fmtPrincipal} · ${instalment.lender}`, tone: 'info' as const },
    { id: 'maturity-rcf', date: rcf.date, kind: 'Maturity', title: need(rcf.facility, 'financement'), sub: `${rcf.fmtPrincipal} drawn of ${compact(euros(rcfFacility.committedEur))} · ${rcf.lender}`, tone: 'info' as const },
    { id: 'step', date: step.date, kind: 'Threshold step', title: `Leverage threshold steps down to ${ratio(Number(nextStep.threshold))}`, sub: `Headroom ${cov.fmt.headroomPct} → ${levAtHorizon.fmt.headroom} · flagged ${monthsAhead(step.date)} months ahead`, tone: 'crit' as const },
    { id: 'maturity-sfa', date: sfa.maturity, kind: 'Maturity', title: sfa.label, sub: `${sfa.fmt.eur} · bullet · ${sfa.lender}`, tone: 'info' as const },
  ],
  /** Libellé de la priorité de la bêta pour cette marche de seuil. */
  stepTag: need(S.priorities.find((x) => x.id === 'pri-step-cov-lev')?.tag, 'priorité marche de seuil'),
} as const;

// ---------------------------------------------------------------------------
// Scénario : Project Falcon (page Forecast & scenarios de la bêta)
// ---------------------------------------------------------------------------
const acq = need(S.scenarios.find((s) => s.id === 'sc-acq'), 'scénario Project Falcon');
const acqLev = need(acq.covenants.find((c) => c.id === 'cov-lev'), 'leverage projeté (Falcon)');
const inputMoney = (v: string) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
export const SCENARIO = {
  name: acq.name,
  type: acq.typeLabel,
  entity: need(acq.entity, 'société du scénario'),
  description: acq.description,
  horizon: acq.fmtHorizon,
  perimeter: `Group perimeter · ${S.fmtAsOf} → ${acq.fmtHorizon}`,
  inputs: [
    { label: 'Acquisition price (incl. costs)', value: inputMoney(acq.inputs.deal) },
    { label: 'Acquired LTM EBITDA', value: inputMoney(acq.inputs.incremental_ebitda) },
    { label: 'New borrowing', value: inputMoney(acq.inputs.new_borrowing) },
  ],
  cash: inputMoney(acq.inputs.cash_contribution),
  newBorrowing: compact(Number(acq.inputs.new_borrowing)),
  /** Dette nette / EBITDA du groupe : aujourd'hui → à l'horizon. */
  leverage: { before: acq.start.fmt.leverage, after: acq.end.fmt.leverage, from: acq.start.leverage, to: acq.end.leverage },
  debt: { before: acq.start.fmt.debtCompact, after: acq.end.fmt.debtCompact, from: euros(acq.start.debt), to: euros(acq.end.debt) },
  liquidity: { before: acq.start.fmt.liquidityCompact, after: acq.end.fmt.liquidityCompact, from: euros(acq.start.liquidity), to: euros(acq.end.liquidity) },
  /** Covenant de levier du contrat SFA (Lumenvale Industrie) projeté à l'horizon : la marche de seuil s'applique. */
  covenant: {
    value: acqLev.fmt.value, valueNumber: acqLev.value,
    thresholdBefore: acqLev.fmt.currentThreshold, thresholdAfter: acqLev.fmt.threshold,
    thresholdFrom: Number(acqLev.currentThreshold), thresholdTo: Number(acqLev.threshold),
    headroomBefore: cov.fmt.headroomPct, headroomAfter: acqLev.fmt.headroom,
    headroomFrom: cov.headroomPct, headroomTo: acqLev.headroomPct,
    statusBefore: cov.status as StatusCode, statusAfter: acqLev.status as StatusCode,
  },
  profileBefore: acq.profileStart.map((y) => ({ year: Number(y.year), amount: y.fmt, value: euros(y.eur) / 1e6 })),
  profileAfter: acq.profileEnd.map((y) => ({ year: Number(y.year), amount: y.fmt, value: euros(y.eur) / 1e6 })),
} as const;

// ---------------------------------------------------------------------------
// Demande de financement (Financing workspace de la bêta) : Project Falcon
// ---------------------------------------------------------------------------
const req = need(S.requests.find((r) => r.id === 'req-acq'), 'demande Project Falcon');
const CHECK_BADGE: Record<CheckCode, string> = { AVAILABLE: 'b-ok', LINKED: 'b-brand', REVIEW: 'b-watch', MISSING: 'b-neutral' };
export const REQUEST = {
  title: req.title,
  entity: req.entity,
  purpose: req.purpose,
  amount: req.fmt.amount,
  amountCompact: req.fmt.compact,
  instrument: req.instrument,
  tenor: `${req.tenor} years`,
  target: req.fmt.targetDate,
  checklist: req.checklist.map((c) => ({ key: c.key, label: c.label, hint: c.hint, status: c.status as CheckCode, statusLabel: c.statusLabel, tone: CHECK_BADGE[c.status as CheckCode] })),
  prep: req.prep,
  stages: S.stages,
  /** Étape montrée à la fin de la préparation dans le film (voir README : la démonstration est plus avancée). */
  readyStage: 2,
} as const;

// ---------------------------------------------------------------------------
// Structure du capital (pages Capital overview et Capital structure de la bêta)
// ---------------------------------------------------------------------------
const CLASS_COLOR: Record<string, string> = { 'Book equity': '#3b3760', 'Senior debt': 'var(--c1)', 'Revolving facilities': 'var(--c2)', Leasing: 'var(--c3)' };
const funded = S.kpis.equity.value + S.kpis.outstanding.value;
export const CAPITAL = {
  sub: `${plural(S.entities.length, 'entity', 'entities')} · ${plural(S.groups.country.length, 'country', 'countries')} · ${S.facilities.length} facilities with ${S.groups.provider.length} capital providers`,
  segments: [
    { key: 'equity', label: 'Book equity', amount: S.kpis.equity.fmt, value: S.kpis.equity.value, color: need(CLASS_COLOR['Book equity'], 'couleur') },
    ...S.groups.instrument.map((g) => ({ key: g.key, label: g.key, amount: g.fmt.outstanding, value: g.outstanding, color: need(CLASS_COLOR[g.key], `couleur ${g.key}`) })),
  ],
  undrawn: { label: 'Undrawn committed', amount: S.kpis.undrawn.fmt, value: S.kpis.undrawn.value },
  funded: compact(euros(funded)),
  kpis: [
    { label: 'Outstanding debt', value: S.kpis.outstanding.fmt, sub: 'All facilities in scope' },
    { label: 'Committed facilities', value: S.kpis.committed.fmt, sub: 'Term loans fully drawn; revolving at limit' },
    { label: 'Undrawn committed', value: S.kpis.undrawn.fmt, sub: 'Available to draw — not debt' },
    { label: 'Book equity', value: S.kpis.equity.fmt, sub: 'Share capital and reserves' },
    { label: 'Net debt / book equity', value: S.kpis.netDebtToEquity.fmt, sub: 'Management gearing' },
  ],
  scenarios: S.scenarios.map((s) => ({ id: s.id, name: s.name, type: s.typeLabel, debt: s.end.fmt.debtCompact, liquidity: s.end.fmt.liquidityCompact, leverage: s.end.fmt.leverage })),
  horizon: acq.fmtHorizon,
  pipeline: {
    total: S.pipelineTotal.fmt,
    requests: S.requests.map((r) => ({
      id: r.id, title: r.title, entity: entityByName(r.entity).short, purpose: r.purpose, amount: r.fmt.compact,
      // Project Falcon : l'étape atteinte à la fin de la scène 7 ; les autres demandes gardent leur étape de la bêta.
      stage: r.id === req.id ? need(S.stages[2], 'étape') : r.stageLabel, stageIndex: r.id === req.id ? 2 : r.stageIndex, prep: r.prep.pct,
    })),
  },
} as const;

// ---------------------------------------------------------------------------
// Accès au capital (S9, vision « Future capability » de la bêta) : familles de financeurs, sans nom ni offre
// ---------------------------------------------------------------------------
export const PROVIDERS = [
  { key: 'banks', label: 'Banks', detail: 'Commercial and digital banks', icon: 'providers' as const },
  { key: 'private', label: 'Private Debt', detail: 'Private debt funds · direct lending', icon: 'financing' as const },
  { key: 'markets', label: 'Capital Markets', detail: 'Regulated capital markets', icon: 'scenarios' as const },
] as const;

export const COMPANY = {
  name: S.organization,
  sub: `Structured financial data · ${plural(S.entities.length, 'entity', 'entities')} · ${plural(S.groups.country.length, 'country', 'countries')}`,
  rows: [
    { key: 'debt', label: 'Outstanding debt', value: S.kpis.outstanding.fmt },
    { key: 'equity', label: 'Book equity', value: S.kpis.equity.fmt },
    { key: 'lev', label: 'Net debt / EBITDA', value: S.kpis.netLeverage.fmt },
    { key: 'cov', label: `${cov.short} (SFA)`, value: cov.fmt.value },
  ],
  need: req.fmt.compact,
  needLabel: `Financing requirement · ${acq.name.replace(' acquisition', '')}`,
  prep: `Preparation ${req.prep.done}/${req.prep.total}`,
} as const;

export const DEMO = { asOf: S.fmtAsOf, today: date(S.today), user: S.user } as const;
