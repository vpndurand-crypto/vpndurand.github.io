// Vérifie la cohérence des chiffres du film V5 (src/hexa/data.ts, formats anglais) : totaux, parts, ratios projetés,
// structure du capital et scénarios de financement.
// Usage : node scripts/verify-vision.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'covenn-vision-'));
const out = join(dir, 'data.mjs');
await build({ entryPoints: [join(root, 'src/hexa/data.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const data = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

const { GROUP, SUBSIDIARY, COVENANT, EXTRACTION, REGISTRY, TIMELINE, SIMULATION, DOSSIER, GROUP_FINANCINGS, CAPITAL, PROVIDERS } = data;
/** Montant affiché, en millions d'euros (« €20.0M », « €500k », « €142,000 »). */
const millions = (s) => {
  const t = String(s).replace(/−/g, '-');
  const n = Number(t.replace(/[^\d.-]/g, ''));
  return /M$/.test(t) ? n : /k$/.test(t) ? n / 1000 : n / 1_000_000;
};
const pct = (s) => Number(String(s).replace('%', ''));
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${label.padEnd(60)} ${detail}`);
};

console.log(`Group: ${GROUP.name} · ${GROUP.entityCount} entities · ${GROUP.countryCount} countries · ${GROUP.lenderCount} lenders · ${GROUP.financingCount} facilities`);
console.log(`Total group debt: ${GROUP.total} (${GROUP.totalExact})`);
for (const [name, list] of [['country', GROUP.byCountry], ['lender', GROUP.byLender], ['type', GROUP.byCategory]]) {
  console.log(`  By ${name}: ${list.map((s) => `${s.label} ${s.amount} (${s.share})`).join(' · ')}`);
}

// Totaux exacts (en euros) : chaque répartition retombe sur l'encours total.
const exactTotal = GROUP_FINANCINGS.reduce((acc, f) => acc + Number(f.amount.toString()), 0);
check('Encours total = somme des financements', Math.abs(exactTotal - 20_000_000) < 0.01, `${exactTotal.toLocaleString('en-US')} €`);
check('Encours total affiché', GROUP.total === '€20.0M', GROUP.total);
for (const [name, list] of [['pays', GROUP.byCountry], ['prêteur', GROUP.byLender], ['type', GROUP.byCategory]]) {
  const fractions = list.reduce((acc, s) => acc + s.fraction, 0);
  check(`Répartition par ${name} : parts = 100 %`, Math.abs(fractions - 1) < 1e-6, fractions.toFixed(6));
  const shown = list.reduce((acc, s) => acc + pct(s.share), 0);
  check(`Répartition par ${name} : pourcentages affichés = 100.0%`, Math.abs(shown - 100) < 0.051, shown.toFixed(1));
  const shownAmounts = list.reduce((acc, s) => acc + millions(s.amount), 0);
  check(`Répartition par ${name} : montants affichés ≈ total`, Math.abs(shownAmounts - 20) < 0.051 * list.length, `${shownAmounts.toFixed(2)} M€`);
}
const fr = GROUP.byCountry.find((c) => c.country === 'FR');
check('France = trois sociétés de la bêta (€14.0M)', fr.amount === '€14.0M' && fr.entities.length === 3, `${fr.amount} · ${fr.entities.map((e) => `${e.short} ${e.amount}`).join(' · ')}`);

// Covenant : valeurs du moteur de la bêta, formatées à l'anglaise.
check('Net leverage (bêta)', COVENANT.value === '3.13x', COVENANT.value);
check('Covenant limit (bêta)', COVENANT.threshold === '≤ 3.50x', COVENANT.threshold);
check('Headroom (bêta)', COVENANT.headroom === '0.37x' && COVENANT.headroomPct === '10.5%', `${COVENANT.headroom} · ${COVENANT.headroomPct}`);
check('Ratio = dette nette / EBITDA (bêta)', Math.abs(millions(COVENANT.numerator) / millions(COVENANT.denominator) - 3.1333) < 0.01, `${COVENANT.numerator} / ${COVENANT.denominator}`);
check('Clause source', COVENANT.clause.article === '19.2' && COVENANT.clause.page === 47, COVENANT.sourceChip);
check('Filiale ouverte', SUBSIDIARY.name === 'Demo Industries SAS' && SUBSIDIARY.amount === '€10.0M', `${SUBSIDIARY.name} · ${SUBSIDIARY.financing} · ${SUBSIDIARY.lender} · ${SUBSIDIARY.amount}`);

// Extraction (aperçu de la bêta).
console.log(`Extraction: ${EXTRACTION.fields.map((f) => `${f.label} = ${f.value} (p. ${f.page})`).join(' · ')}`);
const field = (k) => EXTRACTION.fields.find((f) => f.key === k);
check('Extraction : montant, taux, échéance, covenant', field('amount').value === '€10,000,000' && field('rate').value === '3M EURIBOR + 2.50%' && field('maturity').value === 'Dec 31, 2029' && field('covenant').value === 'Net leverage ≤ 3.50x',
  EXTRACTION.fields.map((f) => `p. ${f.page}`).join(' · '));
console.log(`Registry: ${REGISTRY.map((r) => `${r.country} ${r.entity} ${r.amount} ${r.lender}`).join(' | ')}`);

// Échéancier.
console.log(`Timeline: ${TIMELINE.events.map((e) => `${e.date} ${e.kind} — ${e.title} (${e.sub})`).join(' | ')}`);
check('Marche de seuil au 01/07/2027 = 3.25x', TIMELINE.events.some((e) => e.date === '2027-07-01') && TIMELINE.stepThreshold === '3.25x', TIMELINE.stepThreshold);
check('Échéancier : maturity, refinancing, covenant review, repayment', ['Debt maturity', 'Refinancing', 'Covenant review', 'Repayment'].every((k) => TIMELINE.events.some((e) => e.kind === k)));

// Simulation : (dette nette + dette d'acquisition) / (EBITDA + EBITDA de la cible).
const lev = (9.4 + 4) / (3 + 0.8);
check('Leverage projeté = 13.4 / 3.8', SIMULATION.leverageAfter === `${lev.toFixed(2)}x`, `${SIMULATION.leverageAfter} (${lev.toFixed(4)})`);
check('Dette nette projetée / EBITDA projeté', SIMULATION.netDebtAfter === '€13.4M' && SIMULATION.ebitdaAfter === '€3.8M', `${SIMULATION.netDebtAfter} / ${SIMULATION.ebitdaAfter}`);
check('Marge projetée négative (dépassement présenté comme projection)', SIMULATION.breach && SIMULATION.headroomAfter === '−0.03x', SIMULATION.headroomAfter);
check('Encours du groupe après acquisition = 20.0 + 4.0', SIMULATION.groupAfter === '€24.0M', `${SIMULATION.groupBefore} → ${SIMULATION.groupAfter}`);
const prof = (list) => list.reduce((acc, y) => acc + y.value, 0);
check('Profil de maturités = encours (avant / après)', Math.abs(prof(SIMULATION.profileBefore) - 20) < 1e-6 && Math.abs(prof(SIMULATION.profileAfter) - 24) < 1e-6,
  `${SIMULATION.profileAfter.map((y) => `${y.year} ${y.amount}`).join(' · ')}`);

// Dossier.
console.log(`Package: ${DOSSIER.blocks.map((b) => `${b.title} (${b.detail})`).join(' | ')}`);
check('Financing requirements = dette d’acquisition simulée', DOSSIER.need === '€4.0M', DOSSIER.need);
check('Financial scenarios = leverage projeté', DOSSIER.blocks.some((b) => b.key === 'scenario' && b.detail.includes(SIMULATION.leverageAfter)), SIMULATION.leverageAfter);

// Structure du capital (vision) et scénarios de financement.
console.log(`Capital: ${CAPITAL.categories.map((c) => `${c.label} ${c.amount} (${c.share})`).join(' · ')} · total ${CAPITAL.total}`);
const capSum = CAPITAL.categories.reduce((acc, c) => acc + millions(c.amount), 0);
check('Capital : Debt = encours du groupe ; total = somme', CAPITAL.categories[0].amount === GROUP.total && Math.abs(capSum - millions(CAPITAL.total)) < 1e-9, `${capSum.toFixed(1)} = ${CAPITAL.total}`);
check('Capital : parts affichées = 100.0%', Math.abs(CAPITAL.categories.reduce((a, c) => a + pct(c.share), 0) - 100) < 0.051, CAPITAL.categories.map((c) => c.share).join(' + '));
const expected = { debt: (9.4 + 4) / 3.8, mixed: (9.4 + 2) / 3.8, equity: 9.4 / 3.8 };
check('Scénarios de financement recalculés (même acquisition)', CAPITAL.fundingScenarios.every((s) => s.leverage === `${expected[s.key].toFixed(2)}x` && s.breach === expected[s.key] > 3.5),
  CAPITAL.fundingScenarios.map((s) => `${s.label} ${s.leverage}${s.breach ? ' (breach)' : ''}`).join(' · '));
check('Financeurs : trois familles, sans nom', PROVIDERS.map((x) => x.label).join('|') === 'Banks|Private Debt|Capital Markets', PROVIDERS.map((x) => x.label).join(' · '));

console.log(failures ? `\n${failures} contrôle(s) en échec.` : '\nTous les chiffres du film V5 sont cohérents entre eux et avec la bêta.');
process.exit(failures ? 1 : 0);
