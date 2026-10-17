/**
 * Données du film V6 : toutes viennent de la bêta « Capital operating system ». Les valeurs sont celles de son moteur et
 * les libellés ceux de ses écrans, lus dans la page rendue (src/capos/snapshot.json, écrit par scripts/extract-capos.mjs :
 * `screens` contient le texte affiché de la vue groupe, du scénario, de la demande, de la comparaison et de la vision).
 * Le film suit un seul cas de la démonstration : le financement de l'acquisition Project Falcon par Lumenvale Deutschland
 * GmbH (€7.5m, dont €6.5m de dette nouvelle). La séquence du réseau (S5) est une vision : familles de financeurs et
 * structures d'illustration, sans nom ni offre (« Open capital infrastructure — Future capability » dans la bêta).
 */
import S from '../capos/snapshot.json';
import { COVENANT, GROUP, REQUEST, SCENARIO, SUBSIDIARY, type StatusCode } from '../capos/data';
import type { IconName, Section } from '../capos/kit';

export { COVENANT, GROUP, REQUEST, SCENARIO, SUBSIDIARY };

function need<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Donnée absente de la bêta : ${what}`);
  return value;
}
/** Le texte doit figurer tel quel dans l'écran de la bêta (sinon le film s'arrête : rien n'est inventé). */
function shown(key: ScreenKey, text: string): string {
  if (!S.screens[key].text?.includes(text)) throw new Error(`Texte absent de l'écran « ${key} » de la bêta : ${text}`);
  return text;
}
const doc = (id: string) => need(S.documents.find((d) => d.id === id), `document ${id}`);
type ScreenKey = keyof typeof S.screens;
const card = (key: ScreenKey, title: string) => need(S.screens[key].cards.find((c) => c.title === title), `carte « ${title} » (${key})`);
type Cell = string[];
/** Ligne d'un tableau de la bêta, repérée par le libellé de sa première cellule. */
function row(rows: Cell[][], label: string): Cell[] {
  return need(rows.find((r) => r[0]?.[0] === label), `ligne « ${label} »`);
}
const part = (r: Cell[], i: number, j = 0) => need(r[i]?.[j], `cellule ${i}.${j}`);
const STATUS_COLOR: Record<StatusCode, string> = { COMPLIANT: 'var(--ok)', WATCH: 'var(--watch)', CRITICAL: 'var(--crit)', BREACH: 'var(--breach)', NOT_COMPUTABLE: 'var(--ink-3)' };
const cov = S.covenant;

// ---------------------------------------------------------------------------
// S1 — Quatre sources isolées : échéancier, contrat, calcul de covenant, relevé du prêteur
// ---------------------------------------------------------------------------
export const FRAGMENTS = {
  /** Onglet « Repayment schedule » de la bêta : prochaines échéances (instalments), toutes devises. */
  schedule: S.schedule.filter((r) => r.kind !== 'Covenant test' && r.kind !== 'Threshold step').slice(0, 6)
    .map((r) => ({ date: r.fmtDate, kind: r.kind, facility: need(r.facility, 'financement'), lender: need(r.lender, 'prêteur'), amount: need(r.fmtPrincipal, 'montant') })),
  /** Calcul du covenant de levier au 30 Sep 2026 (moteur de la bêta) : numérateur, dénominateur, ratio, seuil, clause. */
  covenant: {
    title: `${cov.short} — ${SUBSIDIARY.name}`,
    test: S.fmtAsOf,
    lines: [
      { label: cov.numeratorLabel, value: cov.fmt.numerator },
      { label: cov.denominatorLabel, value: cov.fmt.denominator },
    ],
    value: cov.fmt.value,
    threshold: cov.fmt.threshold,
    source: cov.sourceNote,
  },
  agreement: { docId: 'doc-01', title: doc('doc-01').title },
  statement: { docId: 'doc-12', title: doc('doc-12').title },
} as const;

// ---------------------------------------------------------------------------
// S2 — Page « Capital overview » : indicateurs et deux cartes du groupe (pays et sociétés, prêteurs)
// ---------------------------------------------------------------------------
const ov = S.screens.overview;
const distribution = card('overview', 'Distribution by country and entity');
const exposure = card('overview', 'Exposure by capital provider');
export interface BarRow { label: string; amount: string; share: string | null; fraction: number }
function bar(b: { label: string | null; value: string | null; width: string | null }): BarRow {
  const [amount = '', share = null] = need(b.value, 'valeur').split(' ');
  return { label: need(b.label, 'libellé'), amount, share, fraction: Number.parseFloat(need(b.width, 'largeur')) / 100 };
}
const nCountries = S.groups.country.length;
export const OVERVIEW = {
  title: need(ov.title, 'titre de la vue groupe'),
  sub: need(ov.sub, 'sous-titre de la vue groupe'),
  actions: ov.actions as string[],
  kpis: ov.kpis.map((k) => ({ label: need(k.label, 'indicateur'), value: need(k.value, 'valeur'), desc: need(k.desc, 'définition') })),
  /** La marge de covenant est colorée selon le statut du covenant le plus tendu (Watch). */
  headroomColor: STATUS_COLOR[cov.status as StatusCode],
  distribution: {
    title: need(distribution.title, 'carte pays'),
    sub: need(distribution.sub, 'sous-titre pays'),
    countries: distribution.bars.slice(0, nCountries).map((b) => {
      const r = bar(b);
      return { ...r, entities: S.entities.filter((e) => e.countryName === r.label).map((e) => e.name) };
    }),
    entities: distribution.bars.slice(nCountries).map(bar),
  },
  exposure: { title: need(exposure.title, 'carte prêteurs'), sub: need(exposure.sub, 'sous-titre prêteurs'), providers: exposure.bars.map(bar) },
} as const;

// ---------------------------------------------------------------------------
// S3 — Page du scénario Project Falcon : hypothèses, aujourd'hui contre l'horizon, covenant projeté
// ---------------------------------------------------------------------------
const sc = S.screens.scenario;
const acq = need(S.scenarios.find((s) => s.id === 'sc-acq'), 'scénario Project Falcon');
const versus = card('scenario', 'Today versus scenario').rows as Cell[][];
const projected = card('scenario', `Projected SFA covenants — ${SUBSIDIARY.name}`).rows as Cell[][];
const lev = row(projected, cov.short);
const metric = (label: string) => {
  const r = row(versus, label);
  return { label, today: part(r, 1), horizon: part(r, 2), change: part(r, 3) };
};
const monthsBetween = (a: string, b: string) => {
  const [y0 = 0, m0 = 0] = a.split('-').map(Number);
  const [y1 = 0, m1 = 0] = b.split('-').map(Number);
  return (y1 - y0) * 12 + (m1 - m0);
};
const acqLev = need(acq.covenants.find((c) => c.id === 'cov-lev'), 'levier projeté');
export const SCENARIO_PAGE = {
  crumbs: sc.crumbs as string[],
  title: need(sc.title, 'titre du scénario'),
  sub: need(sc.sub, 'description du scénario'),
  typeTag: acq.typeLabel,
  forecastTag: shown('scenario', 'Illustrative forecast'),
  perimeter: shown('scenario', `Group perimeter · ${S.fmtAsOf} → ${acq.fmtHorizon}`),
  cta: shown('scenario', 'Create financing request from scenario'),
  /** Champs du formulaire « Assumptions » de la bêta (valeurs du scénario enregistré). */
  fields: {
    entity: { label: 'Acting entity (borrower and buyer/investor)', value: need(acq.entity, 'société') },
    horizon: { label: 'Forecast horizon', value: `${monthsBetween(S.asOf, acq.horizon)} months`, hint: `Results at ${acq.fmtHorizon}` },
    typed: [...SCENARIO.inputs.slice(0, 2).map((i): { label: string; value: string } => ({ label: i.label, value: i.value })), { label: 'Cash contribution', value: SCENARIO.cash }],
    borrowing: need(SCENARIO.inputs[2], 'nouvel emprunt'),
    rate: { label: 'All-in rate', value: (acq.inputs.new_rate_bp / 100).toFixed(2), suffix: '%' },
    rateType: { label: 'Rate type', value: acq.inputs.new_rate_type === 'FIXED' ? 'Fixed' : 'Floating' },
  },
  head: versus[0]?.map((c) => c[0] ?? '') ?? [],
  metrics: [metric('Outstanding debt'), metric('Available liquidity'), metric('Net debt / EBITDA')],
  leverage: { from: acq.start.leverage, to: acq.end.leverage },
  covenant: {
    title: `Projected SFA covenants — ${SUBSIDIARY.name}`,
    head: projected[0]?.map((c) => c[0] ?? '') ?? [],
    name: part(lev, 0),
    note: part(lev, 0, 1),
    current: part(lev, 1),
    currentVs: part(lev, 1, 1),
    projected: part(lev, 2),
    threshold: part(lev, 3),
    thresholdNote: part(lev, 3, 1),
    status: part(lev, 4),
    headroom: part(lev, 5),
    /** Jauge : ratio projeté, seuil d'aujourd'hui puis seuil à l'horizon (marche), marges correspondantes. */
    value: acqLev.value,
    thresholdFrom: Number(acqLev.currentThreshold),
    thresholdTo: Number(acqLev.threshold),
    headroomFrom: cov.fmt.headroomPct,
    headroomFromValue: cov.headroomPct,
    headroomTo: acqLev.headroomPct,
    statusFrom: cov.status as StatusCode,
    statusTo: acqLev.status as StatusCode,
    tag: shown('scenario', 'Projected — not a covenant test'),
  },
} as const;

// ---------------------------------------------------------------------------
// S4 — La demande de financement Project Falcon (Financing workspace), préparée à partir des données de Covenn
// ---------------------------------------------------------------------------
const rq = S.screens.request;
const check = (key: string) => need(REQUEST.checklist.find((c) => c.key === key), `pièce ${key}`);
const agreements = S.documents.filter((d) => d.document_type === 'FACILITY_AGREEMENT').length;
const savedCalcs = cov.history.filter((h) => h.saved).length;
export interface PackItem { key: string; label: string; detail: string; status: string; tone: string; from: Section; icon: IconName }
const item = (key: string, detail: string, from: Section, icon: IconName): PackItem => {
  const c = check(key);
  return { key, label: c.label, detail, status: c.statusLabel, tone: c.tone, from, icon };
};
const docTitle = (id: string) => need(doc(id).title.split(' — ')[0], `titre ${id}`);
export const REQUEST_PAGE = {
  crumbs: rq.crumbs as string[],
  title: need(rq.title, 'titre de la demande'),
  sub: need(rq.sub, 'résumé de la demande'),
  actions: rq.actions as string[],
  tabs: rq.tabs.map((t) => ({ label: need(t.label, 'onglet'), count: t.count })),
  /** Les sept pièces disponibles ou reliées aux données existantes, dans l'ordre de la liste de préparation de la bêta. */
  items: [
    item('fs', docTitle('doc-09'), 'data', 'data'),
    item('mgmt', doc('doc-08').title, 'data', 'data'),
    item('debt', `${GROUP.facilityCount} facilities · ${GROUP.outstanding} outstanding · ${GROUP.countryCount} countries`, 'debt', 'debt'),
    item('agreements', `${agreements} facility agreements · incl. ${SUBSIDIARY.ref}`, 'debt', 'file'),
    item('covenants', `${cov.short} ${cov.fmt.value} · ${savedCalcs} saved calculations`, 'covenants', 'covenants'),
    item('forecast', `${SCENARIO.name} · ${SCENARIO.leverage.after} at ${SCENARIO.horizon.slice(3)}`, 'scenarios', 'scenarios'),
    item('transaction', 'Non-binding offer letter · target summary financials', 'data', 'file'),
  ],
  review: check('uop'),
  checklistTitle: need(card('preparation', 'Preparation checklist').title, 'liste de préparation'),
  done: REQUEST.prep.done,
  total: REQUEST.prep.total,
  /** « 7 of 8 available or linked » · « 1 needs review · 0 missing » (en-tête de la liste de la bêta). */
  summary: shown('preparation', `${REQUEST.prep.done} of ${REQUEST.prep.total} available or linked`),
  summaryRight: shown('preparation', `${REQUEST.prep.review} needs review · ${REQUEST.prep.missing} missing`),
  brief: { title: need(card('preparation', 'Financing brief').title, 'carte du dossier'), button: shown('preparation', 'Generate brief') },
  /** Carte « Linked scenario » de la demande (onglet Overview). */
  linked: {
    title: need(card('request', 'Linked scenario').title, 'scénario lié'),
    name: SCENARIO.name,
    cells: [
      { label: 'New borrowing', value: SCENARIO.newBorrowing },
      { label: `Net debt / EBITDA at ${SCENARIO.horizon.slice(3)}`, value: SCENARIO.leverage.after },
      { label: 'Liquidity at horizon', value: SCENARIO.liquidity.after },
      { label: 'SFA leverage (projected)', value: SCENARIO.covenant.value, crit: true },
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// S5 — La vision : une entreprise, un profil de financement, plusieurs sources de capital
// ---------------------------------------------------------------------------
const vision = card('vision', 'From debt visibility to capital access');
const openLayer = need(vision.layers.find((l) => l.title === 'Open capital infrastructure'), 'couche « Open capital infrastructure »');
/** Titre de la page « Product vision » de la bêta : la phrase de positionnement de la carte de fin. */
export const VISION_TITLE = need(S.screens.vision.title, 'titre de la page de vision');
export const VISION = {
  layer: openLayer.title as string,
  state: need(openLayer.state, 'état de la couche'),
  items: openLayer.items as [string, string][],
  notClaimed: card('vision', 'What it does not claim').items as string[],
} as const;

export const COMPANY = {
  group: S.organization,
  project: 'Project Falcon',
  need: REQUEST.amountCompact,
  detail: `${REQUEST.instrument} · ${REQUEST.tenor}`,
  borrower: REQUEST.entity,
  prep: `Preparation ${REQUEST.prep.done}/${REQUEST.prep.total}`,
} as const;

/** Données qui circulent de l'entreprise vers Covenn (S5, premier temps) : les rubriques de la bêta. */
export const PROFILE_PACKETS: { label: string; icon: IconName }[] = [
  { label: 'Capital structure', icon: 'capital' },
  { label: 'Covenants', icon: 'covenants' },
  { label: 'Forecast', icon: 'scenarios' },
  { label: 'Documents', icon: 'data' },
];

/** Les trois voies vers le capital : familles et structures d'illustration (aucun nom, aucune offre). */
export const PATHWAYS = [
  { key: 'banks', n: '01', label: 'Banks', detail: 'Traditional bank financing', structure: 'Senior debt', icon: 'providers' as IconName, accent: '#4a33b3', soft: '#efecfb', future: false },
  { key: 'private', n: '02', label: 'Private Debt', detail: 'Private credit and institutional debt providers', structure: 'Unitranche', icon: 'financing' as IconName, accent: '#2b8a7e', soft: '#e5f3ee', future: false },
  { key: 'markets', n: '03', label: 'Capital Markets', detail: 'Regulated market-based financing channels', structure: 'Future market-based financing', icon: 'scenarios' as IconName, accent: '#5679b3', soft: '#e7eef8', future: true },
] as const;
export type PathwayKey = (typeof PATHWAYS)[number]['key'];

// ---------------------------------------------------------------------------
// S6 — Onglet « Terms comparison » de la demande : les trois propositions indicatives de la démonstration
// ---------------------------------------------------------------------------
const terms = S.screens.terms;
const table = need(terms.cards[0], 'tableau de comparaison').rows as Cell[][];
const providerHead = need(table[0], 'en-tête des propositions').slice(1);
const termRow = (label: string) => row(table, label).slice(1);
const assumptions = need(/Common assumptions: .*? at year end\./.exec(need(terms.text, 'texte de la comparaison'))?.[0], 'hypothèses communes');
export const COMPARISON = {
  tabs: terms.tabs.map((t) => ({ label: need(t.label, 'onglet'), count: t.count, on: t.on })),
  assumptions,
  sensitivity: ['Base', '+50 bp', '+100 bp', '+200 bp'].map((t) => shown('terms', t)),
  proposals: S.comparison.proposals.map((p, i) => ({
    id: p.id,
    provider: p.provider,
    meta: need(providerHead[i]?.[1], `catégorie de ${p.provider}`),
    pathway: (p.categoryCode === 'PRIVATE_DEBT' ? 'private' : 'banks') as PathwayKey,
    covers: p.covers,
    headroomStatus: p.status as StatusCode,
  })),
  /** Lignes montrées, dans l'ordre de la bêta (sections Offer, Pricing, Structure, Illustrative costs). */
  sections: [
    { title: 'Offer', rows: ['Instrument', 'Amount', 'Tenor'] },
    { title: 'Pricing', rows: ['Rate', 'All-in rate under assumptions'] },
    { title: 'Structure', rows: ['Amortisation', 'Pro forma covenant check'] },
    { title: 'Illustrative costs', rows: ['Estimated cash cost over the tenor'] },
  ].map((s) => ({ title: s.title, rows: s.rows.map((label) => ({ label, cells: termRow(label) })) })),
  select: shown('terms', 'Select for negotiation'),
  /** Note de la bêta sous le tableau (dernière phrase : les conditions indicatives ne sont ni des offres ni des engagements). */
  note: need(terms.notes.find((n) => n.startsWith('No proposal is ranked')), 'note de la comparaison'),
  /** Proposition retenue pour négociation dans le film : la seule qui couvre le montant demandé. Un choix de travail. */
  selected: need(S.comparison.proposals.find((p) => p.covers), 'proposition couvrant la demande').id,
} as const;
const chosen = need(S.comparison.proposals.find((p) => p.id === COMPARISON.selected), 'proposition retenue');
/** Message de la bêta après « Select for negotiation » (Actions.selectProposal → toast). */
export const SELECTED_TOAST = {
  text: `${chosen.provider} selected for negotiation`,
  detail: 'This records a choice only. Current debt and capital structure are unchanged.',
  badge: 'Selected for negotiation',
} as const;

export const DEMO = { asOf: S.fmtAsOf, organization: S.organization } as const;
