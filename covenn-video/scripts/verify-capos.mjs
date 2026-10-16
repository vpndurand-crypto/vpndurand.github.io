// Vérifie le film Capital OS : la bêta utilisée est bien celle livrée (empreinte SHA-256), et chaque chiffre affiché
// (src/capos/data.ts) vient du moteur de la bêta (snapshot.json) et reste cohérent avec les autres : totaux, parts,
// ratios, marges, scénario, liste de préparation, structure du capital, financements en préparation.
// Usage : node scripts/verify-capos.mjs
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'covenn-capos-'));
const out = join(dir, 'data.mjs');
await build({ entryPoints: [join(root, 'src/capos/data.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const data = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });
const S = JSON.parse(readFileSync(join(root, 'src/capos/snapshot.json'), 'utf8'));
const { GROUP, SUBSIDIARY, COVENANT, EXTRACTION, REGISTRY, TIMELINE, SCENARIO, REQUEST, CAPITAL, PROVIDERS, COMPANY, SOURCE } = data;

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${label.padEnd(66)} ${detail}`);
};
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
/** Montant compact de la bêta (Fmt.compact), en euros. */
const compact = (cents) => {
  const v = Math.abs(cents) / 100;
  if (v >= 999500) { const m = v / 1e6; return `€${(m >= 10 ? m.toFixed(1) : m.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '')}m`; }
  return v >= 1e3 ? `€${Math.round(v / 1e3)}k` : `€${Math.round(v)}`;
};
const pct1 = (x) => `${(x * 100).toFixed(1)}%`;

// --- La bêta utilisée -------------------------------------------------------------------------------------------
const html = readFileSync(join(root, 'beta-capital-os/covenn-capital-os-demo-en.html'));
const sha = createHash('sha256').update(html).digest('hex');
const sums = readFileSync(join(root, 'beta-capital-os/SHA256SUMS'), 'utf8');
check('Bêta : empreinte du fichier = SHA256SUMS', sums.startsWith(sha), sha.slice(0, 16));
check('Bêta : valeurs extraites de ce fichier (snapshot.json)', SOURCE.sha256 === sha, SOURCE.file);
check('Bêta : styles extraits de ce fichier (beta.css)', readFileSync(join(root, 'src/capos/beta.css'), 'utf8').includes(sha.slice(0, 12)));

// --- Le groupe -----------------------------------------------------------------------------------------------------
console.log(`\n${GROUP.name} · ${GROUP.entityCount} entities · ${GROUP.countryCount} countries · ${GROUP.facilityCount} facilities · ${GROUP.providerCount} providers · ${GROUP.outstanding}`);
const sumEur = S.facilities.reduce((s, f) => s + f.eur, 0);
check('Encours = somme des six financements (en euros)', sumEur === S.kpis.outstanding.value, `${(sumEur / 100).toLocaleString('en-US')} €`);
check('Encours affiché', GROUP.outstanding === compact(sumEur) && GROUP.outstanding === '€18.6m', GROUP.outstanding);
for (const [name, list, key] of [['pays', GROUP.byCountry, 'country'], ['prêteur', GROUP.byProvider, 'provider'], ['instrument', GROUP.byInstrument, 'instrument'], ['devise', GROUP.byCurrency, 'currency']]) {
  check(`Par ${name} : parts = 100 %`, near(list.reduce((a, s) => a + s.fraction, 0), 1), list.map((s) => s.share).join(' + '));
  check(`Par ${name} : pourcentages affichés = 100.0 %`, Math.abs(list.reduce((a, s) => a + Number(s.share.replace('%', '')), 0) - 100) < 0.051);
  check(`Par ${name} : montants = encours`, S.groups[key].reduce((a, g) => a + g.outstanding, 0) === sumEur);
}
const fr = GROUP.byCountry.find((c) => c.country === 'FR');
check('France : trois sociétés, €14m', fr.amount === '€14m' && fr.entities.length === 3, fr.entities.map((e) => `${e.short} ${e.amount}`).join(' · '));
check('Sociétés : 3 en France, 2 à l’étranger', GROUP.entitiesHome === 3 && GROUP.entitiesAbroad === 2);
check('Devises : EUR et GBP (taux de démonstration 1.1550)', GROUP.currencies.join() === 'EUR,GBP' && GROUP.fxNote.includes('1.1550'));
check('Société ouverte : Lumenvale Industrie SAS, SFA, €10,000,000', SUBSIDIARY.name === 'Lumenvale Industrie SAS' && SUBSIDIARY.amount === '€10,000,000' && SUBSIDIARY.maturity === '31 Dec 2029', `${SUBSIDIARY.facility} · ${SUBSIDIARY.lender}`);

// --- Le covenant -----------------------------------------------------------------------------------------------------
const c = S.covenant;
check('Leverage = dette nette / EBITDA contractuel (9.4m / 3.0m)', near(c.numerator / c.denominator, Number(c.value), 1e-9) && COVENANT.value === '3.13x', `${c.fmt.numerator} / ${c.fmt.denominator} = ${c.fmt.value4}`);
check('Seuil ≤ 3.50x, marge 10.5 %, statut Watch', COVENANT.threshold === '≤ 3.50x' && near(c.headroomPct, (3.5 - c.numerator / c.denominator) / 3.5) && COVENANT.headroomPct === '10.5%' && COVENANT.status === 'WATCH');
check('Dette nette absorbable = 3.50 × EBITDA − dette nette', Math.round(3.5 * c.denominator - c.numerator) === c.deltaNumerator && COVENANT.absorb[0].value === '€1,100,000');
check('Baisse d’EBITDA absorbable = EBITDA − dette nette / 3.50', Math.abs((c.denominator - c.numerator / 3.5) - c.deltaDenominator) <= 1 && COVENANT.absorb[1].value === '€314,286');
check('Marche de seuil : ≤ 3.25x à partir du 1 Jul 2027 (clause 19.2, p. 47)', COVENANT.nextThreshold === '≤ 3.25x' && COVENANT.nextFrom === '1 Jul 2027' && COVENANT.sourceNote === 'Clause 19.2, page 47');
const p47 = S.pages.find((p) => p.document_id === 'doc-01' && p.page === 47).blocks.find((b) => b.id === COVENANT.clause.id);
check('La clause surlignée dit bien 3.50x puis 3.25x', /3\.50x/.test(p47.text) && /3\.25x from 1 July 2027/.test(p47.text), p47.text.slice(0, 60));

// --- Extraction et registre -----------------------------------------------------------------------------------------
console.log(`\nExtraction: ${EXTRACTION.fields.map((f) => `${f.label} = ${f.value} (p. ${f.page}, ${f.status.label})`).join(' · ')}`);
check('Extraction : montant, taux, maturité, seuil (pages 9, 21, 18, 47)', EXTRACTION.fields.map((f) => f.page).join() === '9,21,18,47'
  && EXTRACTION.fields[0].value === 'EUR 10,000,000' && EXTRACTION.fields[1].value === '3M Euribor + 2.50%' && EXTRACTION.fields[3].value === '≤ 3.50x until 30 Jun 2027');
check('Extraction : deux valeurs corrigées par une personne', EXTRACTION.fields.filter((f) => f.status.label === 'Corrected by reviewer').length === 2);
check('Registre : six financements, montants de la bêta', REGISTRY.length === 6 && REGISTRY.every((r, i) => r.amount === S.facilities[i].fmt.compact), REGISTRY.map((r) => `${r.country} ${r.amount}`).join(' · '));

// --- Échéancier --------------------------------------------------------------------------------------------------------
console.log(`\nTimeline: ${TIMELINE.events.map((e) => `${e.date} ${e.kind} — ${e.title} (${e.sub})`).join(' | ')}`);
const inSchedule = (date, kind) => S.schedule.some((r) => r.date === date && r.kind === kind);
check('Échéancier : test, échéance, maturité RCF, marche de seuil (onglet Repayment schedule)', ['test', 'installment', 'maturity-rcf', 'step'].every((id) => {
  const e = TIMELINE.events.find((x) => x.id === id);
  return inSchedule(e.date, { test: 'Covenant test', installment: 'Instalment', 'maturity-rcf': 'Maturity', step: 'Threshold step' }[id]);
}));
const step = TIMELINE.events.find((e) => e.id === 'step');
check('Marche de seuil : marge 10.5 % → 3.6 % à EBITDA inchangé', step.sub.startsWith('Headroom 10.5% → 3.6%') && pct1((3.25 - c.numerator / c.denominator) / 3.25) === '3.6%', step.sub);
check('Maturité du SFA (registre) : 31 Dec 2029, €10,000,000', TIMELINE.events.some((e) => e.id === 'maturity-sfa' && e.date === '2029-12-31' && e.sub.startsWith('€10,000,000')));

// --- Scénario Project Falcon --------------------------------------------------------------------------------------------------
const acq = S.scenarios.find((s) => s.id === 'sc-acq');
console.log(`\nScenario: ${SCENARIO.name} · ${SCENARIO.inputs.map((i) => `${i.label} ${i.value}`).join(' · ')} · leverage ${SCENARIO.leverage.before} → ${SCENARIO.leverage.after}`);
check('Sources = emplois : prix 7.5m = emprunt 6.5m + apport 1.0m', Number(acq.inputs.deal) === Number(acq.inputs.new_borrowing) + Number(acq.inputs.cash_contribution) && acq.sources === acq.uses);
check('Aujourd’hui : dette nette / EBITDA = 2.46x (vue d’ensemble)', SCENARIO.leverage.before === S.kpis.netLeverage.fmt && near(acq.start.netDebt / acq.start.ebitda, acq.start.leverage));
check('Horizon : dette nette / EBITDA = 22.9m / 7.46m = 3.07x', near(acq.end.netDebt / acq.end.ebitda, acq.end.leverage) && SCENARIO.leverage.after === '3.07x');
check('Horizon : EBITDA + EBITDA acquis (6.26m + 1.2m)', acq.end.ebitda - acq.start.ebitda === Number(acq.inputs.incremental_ebitda) * 100);
check('Horizon : liquidité = trésorerie + non tiré', acq.end.liquidity === acq.end.cash + acq.end.undrawn && SCENARIO.liquidity.after === '€558k' && SCENARIO.debt.after === '€23.5m');
const lev = acq.covenants.find((x) => x.id === 'cov-lev');
check('Covenant SFA projeté : 3.13x contre ≤ 3.25x, marge 3.6 %, Critical headroom', lev.fmt.value === '3.13x' && lev.fmt.threshold === '≤ 3.25x' && lev.fmt.headroom === '3.6%' && SCENARIO.covenant.statusAfter === 'CRITICAL');
check('Covenant SFA : la marge critique vient de la marche de seuil (même valeur dans tous les scénarios)', S.scenarios.every((s) => s.covenants.find((x) => x.id === 'cov-lev').fmt.headroom === '3.6%'));
check('Profil de maturités à l’horizon : nouvel emprunt de 6.5m en 2032', SCENARIO.profileAfter.some((y) => y.year === 2032 && y.amount === '€6.5m'));

// --- Demande de financement ---------------------------------------------------------------------------------------------------------
const done = REQUEST.checklist.filter((x) => x.status === 'AVAILABLE' || x.status === 'LINKED').length;
check('Demande : €6,500,000 = nouvel emprunt du scénario', REQUEST.amount === '€6,500,000' && Number(acq.inputs.new_borrowing) === 6500000);
check('Liste de préparation : 8 pièces, 7 prêtes, 1 à relire (88 %)', REQUEST.checklist.length === 8 && done === 7 && REQUEST.prep.done === 7 && REQUEST.prep.review === 1 && REQUEST.prep.pct === Math.round((7 / 8) * 100));
check('Étapes de la bêta (6), « Ready for review » montrée en fin de scène', REQUEST.stages.length === 6 && REQUEST.stages[REQUEST.readyStage] === 'Ready for review');

// --- Structure du capital et financements en préparation -------------------------------------------------------------------------------
const funded = S.kpis.equity.value + S.kpis.outstanding.value;
check('Total financé = fonds propres + dette (€38.4m)', CAPITAL.funded === compact(funded) && CAPITAL.funded === '€38.4m', `${S.kpis.equity.fmt} + ${S.kpis.outstanding.fmt}`);
check('Barre : dette par instrument = encours ; non tiré à part', CAPITAL.segments.filter((s) => s.key !== 'equity').reduce((a, s) => a + s.value, 0) === sumEur && CAPITAL.undrawn.amount === '€1.5m');
check('Dette nette / fonds propres = 0.78x', near(S.kpis.netDebt.value / S.kpis.equity.value, S.kpis.netDebtToEquity.value) && CAPITAL.kpis[4].value === '0.78x');
const pipe = S.requests.reduce((a, r) => a + r.amountEur, 0);
check('Financements en préparation : €12.6m (dont £1m au taux de démonstration)', pipe === S.pipelineTotal.value && CAPITAL.pipeline.total === compact(pipe), compact(pipe));
check('Scénarios : quatre, ratios de la bêta', CAPITAL.scenarios.map((s) => s.leverage).join(' ') === '2.46x 3.07x 2.46x 2.70x');

// --- Vision --------------------------------------------------------------------------------------------------------------------
check('Financeurs : trois familles, sans nom', PROVIDERS.map((x) => x.label).join('|') === 'Banks|Private Debt|Capital Markets');
check('Entreprise (S9) : valeurs de la bêta', COMPANY.rows.map((r) => r.value).join(' ') === `${S.kpis.outstanding.fmt} ${S.kpis.equity.fmt} ${S.kpis.netLeverage.fmt} ${c.fmt.value}` && COMPANY.need === '€6.5m');

console.log(failures ? `\n${failures} contrôle(s) en échec.` : '\nTous les chiffres du film Capital OS viennent de la bêta et sont cohérents entre eux.');
process.exit(failures ? 1 : 0);
