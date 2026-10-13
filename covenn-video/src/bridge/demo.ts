/**
 * Pont vers la bêta : états de démonstration et valeurs affichées dans le film.
 *
 * Aucune valeur n'est saisie à la main ici : tout est lu dans le jeu de données de la bêta
 * et calculé par son moteur (sélecteurs, actions et formats d'origine, importés sans modification).
 * Les trois états sont ceux du parcours réel : calcul en cours, calcul enregistré, puis balance réimportée.
 */
import { createInitialState, type DemoState } from '../../beta/src/store/state';
import { reducer } from '../../beta/src/store/reducer';
import { reimportModifiedBalance, saveTest } from '../../beta/src/store/actions';
import { findNode, selectCovenantView, selectDataView, selectKpis } from '../../beta/src/store/selectors';
import { describeSource } from '../../beta/src/features/provenance/describeSource';
import { STATUS_META } from '../../beta/src/data/labels';
import { contractPages } from '../../beta/src/data/contractPages';
import { reimportImportJobV2 } from '../../beta/src/data/importJobs';
import { D } from '../../beta/src/domain/decimal';
import {
  NBSP, formatCovenantValue, formatDate, formatDateTime, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatRatio,
  formatSignedRatio, formatThreshold,
} from '../../beta/src/domain/format';
import type { DecompositionNode, EvaluationResult, SeedData } from '../../beta/src/data/types';
import type { SourceKind } from '../../beta/src/ui/SourceChip';

export const COVENANT_ID = 'cov-lev';
export const TEST_DATE = '2026-09-30';

// États du parcours réel (mêmes actions que les boutons « Enregistrer le calcul » et « Réimporter la balance modifiée »).
// storageAvailable = true : le bandeau de démonstration garde son texte normal ; aucune persistance n'est branchée dans le film.
export const stateInitial: DemoState = createInitialState(true);
export const stateSaved: DemoState = reducer(stateInitial, saveTest(stateInitial, COVENANT_ID, TEST_DATE));
export const stateModified: DemoState = reducer(stateSaved, reimportModifiedBalance(stateSaved));

const data: SeedData = selectDataView(stateInitial);

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Valeur absente de la bêta : ${what}`);
  return value;
}

/** Format compact de la bêta (« 9,4 M€ », « 600 k€ ») ; deux décimales seulement si une seule masquerait la valeur (2,85 M€). */
export function compact(value: string): string {
  const big = D(value);
  if (big.abs().gte(1_000_000)) {
    const millions = big.div(1_000_000);
    const exactOnOneDecimal = millions.times(10).mod(1).eq(0);
    return exactOnOneDecimal ? formatMoneyCompact(value) : `${formatNumber(millions, 2)}${NBSP}M€`;
  }
  return formatMoneyCompact(value);
}

const viewInitial = selectCovenantView(stateInitial, COVENANT_ID, TEST_DATE);
const result: EvaluationResult = required(viewInitial.current.result, 'résultat du Leverage');
const tree = result.tree;
const node = (id: string): DecompositionNode => required(findNode(tree, `${COVENANT_ID}@${TEST_DATE}${id}`), `nœud ${id}`);

const nNum = node('/N');
const nDen = node('/D');
const nDebt = node('/N/c-lev-n1');
const nCash = node('/N/c-lev-n2');
const nLtm = node('/D/c-lev-d1');
const nAdj = node('/D/adj-01');
const nThreshold = node('/threshold');
const chip = (n: DecompositionNode): { kind: SourceKind; label: string } => describeSource(n, data);

const kpis = selectKpis(stateInitial);
const viewModified = selectCovenantView(stateModified, COVENANT_ID, TEST_DATE);
const snapshot = required(viewModified.latestSaved, 'calcul enregistré');
const current: EvaluationResult = required(viewModified.current.result, 'calcul actuel après réimport');
const user = required(data.users.find((u) => u.id === snapshot.closed_by), 'auteur du calcul');
const cashNode = (r: EvaluationResult) => required(findNode(r.tree, `${COVENANT_ID}@${TEST_DATE}/N/c-lev-n2`), 'trésorerie');
const contract = required(data.documents.find((d) => d.id === 'doc-01'), 'contrat SFA');
const page47 = required(contractPages.find((p) => p.document_id === 'doc-01' && p.page === 47), 'page 47 du contrat');
const valueText = (r: EvaluationResult) => formatCovenantValue(required(r.valueExact, 'valeur exacte'), r.threshold, r.form);
const balanceFile = required(data.importJobs.find((j) => j.balance_id === 'tb-di-2026-09-30'), 'import de la balance au 30/09/2026');

export const V = {
  group: {
    outstanding: formatMoneyCompact(required(kpis.outstanding.value, 'encours')),
    cash: formatMoneyCompact(required(kpis.cash.value, 'trésorerie')),
    netDebt: formatMoneyCompact(required(kpis.netDebt.value, 'dette nette')),
    financingCount: kpis.financingCount,
    lenderCount: kpis.lenderCount,
    entityCount: kpis.entityCount,
  },
  covenant: {
    label: 'Leverage',
    dateLabel: `Leverage au ${formatDate(TEST_DATE)}`,
    context: 'Démo Industrie SAS · Senior Facility Agreement · Banque Exemple',
    value: valueText(result),
    threshold: formatThreshold(result.comparison, result.threshold, result.form),
    thresholdShort: formatRatio(result.threshold),
    headroom: formatRatio(required(result.headroom, 'headroom')),
    headroomPct: formatPercent(required(result.headroomPct, 'headroom %')),
    status: result.status,
    statusLabel: STATUS_META[result.status].label,
    tone: STATUS_META[result.status].tone,
    gauge: { value: Number(result.value), threshold: Number(result.threshold) },
    numeratorLabel: nNum.label,
    denominatorLabel: nDen.label,
    numerator: compact(required(nNum.value, 'numérateur')),
    numeratorExact: formatMoney(required(nNum.value, 'numérateur')),
    denominator: compact(required(nDen.value, 'dénominateur')),
    denominatorExact: formatMoney(required(nDen.value, 'dénominateur')),
    conversion: compact(required(result.deltaNumerator, 'conversion')),
    conversionExact: formatMoney(required(result.deltaNumerator, 'conversion')),
    conversionLabel: result.deltaLabels.numerator,
  },
  tree: {
    debt: { label: nDebt.label, value: compact(required(nDebt.value, 'dette')), exact: formatMoney(required(nDebt.value, 'dette')), chip: chip(nDebt) },
    cash: { label: nCash.label, value: compact(required(nCash.value, 'trésorerie')), exact: formatMoney(required(nCash.value, 'trésorerie')), chip: chip(nCash) },
    ltm: { label: nLtm.label, value: compact(required(nLtm.value, 'EBITDA LTM')), exact: formatMoney(required(nLtm.value, 'EBITDA LTM')), chip: chip(nLtm) },
    adjustment: { label: 'Coûts non récurrents', fullLabel: nAdj.label, value: `+${compact(required(nAdj.value, 'retraitement'))}`, exact: formatMoney(required(nAdj.value, 'retraitement')), chip: chip(nAdj) },
    threshold: { label: nThreshold.label, chip: chip(nThreshold) },
    accounts: nCash.children.map((leaf) => {
      const p = leaf.provenance;
      return { row: p.type === 'IMPORT' ? p.rows.join(', ') : '', label: leaf.label, amount: formatMoney(required(leaf.value, leaf.label)) };
    }),
    balanceFile: balanceFile.file_name,
    balanceVersion: 'version 1',
  },
  contract: {
    title: contract.title,
    fileName: contract.file_name,
    reference: contract.reference,
    pageCount: contract.page_count,
    page47,
    clauseId: 'art-19-2',
    chip: chip(nThreshold).label,
  },
  frozen: {
    closedAt: formatDateTime(snapshot.closed_at),
    by: `${user.first_name} ${user.last_name}`,
    hash8: snapshot.snapshot.inputs_hash.slice(0, 8),
    value: valueText(snapshot.snapshot.result),
    natureBefore: `Calcul en cours — non enregistré · définition v${result.definitionVersion} · recalculé à chaque consultation`,
    natureAfter: `Enregistré le ${formatDateTime(snapshot.closed_at)} par ${user.first_name} ${user.last_name} — figé · empreinte ${snapshot.snapshot.inputs_hash.slice(0, 8)}`,
    saveButton: 'Enregistrer le calcul',
  },
  modified: {
    fileName: reimportImportJobV2.file_name,
    cashBefore: compact(required(cashNode(result).value, 'trésorerie avant')),
    cashAfter: compact(required(cashNode(current).value, 'trésorerie après')),
    cashBeforeExact: formatMoney(required(cashNode(result).value, 'trésorerie avant')),
    cashAfterExact: formatMoney(required(cashNode(current).value, 'trésorerie après')),
    numeratorAfter: compact(required(current.numerator, 'numérateur après')),
    value: valueText(current),
    delta: formatSignedRatio(required(viewModified.valueDelta, 'écart')),
    statusAfter: current.status,
    bannerTitle: 'Données modifiées depuis l’enregistrement',
    bannerText: `Calcul actuel : ${valueText(current)} (${formatSignedRatio(required(viewModified.valueDelta, 'écart'))}). Le calcul enregistré reste figé.`,
    toastTitle: 'Balance version 2 importée',
    toastDetail: 'Les calculs enregistrés restent figés ; leur fiche signale l’écart.',
    currentNature: `Calcul en cours — non enregistré · définition v${current.definitionVersion} · recalculé à chaque consultation`,
  },
} as const;

export type DisplayValues = typeof V;

/** Valeurs exactes du moteur (chaînes décimales), base des projections du film « vision ». */
export const RAW = {
  numerator: required(result.numerator, 'numérateur'),
  denominator: required(result.denominator, 'dénominateur'),
  value: required(result.valueExact, 'valeur exacte'),
  threshold: result.threshold,
  nextThreshold: required(result.nextThresholdStep, 'marche de seuil suivante'),
} as const;
