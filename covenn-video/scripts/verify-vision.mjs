// Vérifie la cohérence des chiffres du film « vision » (src/hexa/data.ts) : totaux, parts, ratios projetés.
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

const { GROUP, SUBSIDIARY, COVENANT, EXTRACTION, REGISTRY, TIMELINE, SIMULATION, DOSSIER, GROUP_FINANCINGS } = data;
const norm = (s) => String(s).replace(/[  ]/g, ' ').replace(/−/g, '-');
const num = (s) => Number(norm(s).replace(/[^\d,.-]/g, '').replace(',', '.'));
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${label.padEnd(58)} ${detail}`);
};

console.log(`Groupe : ${GROUP.name} · ${GROUP.entityCount} sociétés · ${GROUP.countryCount} pays · ${GROUP.lenderCount} prêteurs · ${GROUP.financingCount} financements`);
console.log(`Encours total : ${norm(GROUP.total)} (${norm(GROUP.totalExact)})`);
for (const [name, list] of [['pays', GROUP.byCountry], ['prêteur', GROUP.byLender], ['type', GROUP.byCategory]]) {
  console.log(`  Par ${name} : ${list.map((s) => `${s.label} ${norm(s.amount)} (${norm(s.share)})`).join(' · ')}`);
}

// Totaux exacts (en euros) : chaque répartition retombe sur l'encours total.
const exactTotal = GROUP_FINANCINGS.reduce((acc, f) => acc + Number(f.amount.toString()), 0);
check('Encours total = somme des financements', Math.abs(exactTotal - 20_000_000) < 0.01, `${exactTotal.toLocaleString('fr-FR')} €`);
for (const [name, list] of [['pays', GROUP.byCountry], ['prêteur', GROUP.byLender], ['type', GROUP.byCategory]]) {
  const fractions = list.reduce((acc, s) => acc + s.fraction, 0);
  check(`Répartition par ${name} : parts = 100 %`, Math.abs(fractions - 1) < 1e-6, fractions.toFixed(6));
  const shown = list.reduce((acc, s) => acc + num(s.share), 0);
  check(`Répartition par ${name} : pourcentages affichés = 100,0 %`, Math.abs(shown - 100) < 0.051, shown.toFixed(1));
  const shownAmounts = list.reduce((acc, s) => acc + num(s.amount), 0);
  check(`Répartition par ${name} : montants affichés ≈ total`, Math.abs(shownAmounts - num(GROUP.total)) < 0.051 * list.length, `${shownAmounts.toFixed(1)} M€`);
}
const fr = GROUP.byCountry.find((c) => c.country === 'FR');
check('France = trois sociétés de la bêta (14,0 M€, encours de la bêta)', norm(fr.amount) === '14,0 M€' && fr.entities.length === 3, `${norm(fr.amount)} · ${fr.entities.map((e) => `${e.short} ${norm(e.amount)}`).join(' · ')}`);

// Covenant : valeurs du moteur de la bêta.
check('Leverage (bêta)', norm(COVENANT.value) === '3,13x', norm(COVENANT.value));
check('Seuil (bêta)', norm(COVENANT.threshold) === '≤ 3,50x', norm(COVENANT.threshold));
check('Marge (bêta)', norm(COVENANT.headroom) === '0,37x' && norm(COVENANT.headroomPct) === '10,5 %', `${norm(COVENANT.headroom)} · ${norm(COVENANT.headroomPct)}`);
check('Clause source', COVENANT.clause.article === '19.2' && COVENANT.clause.page === 47, `art. ${COVENANT.clause.article}, p. ${COVENANT.clause.page}`);
check('Filiale ouverte', SUBSIDIARY.name === 'Démo Industrie SAS' && norm(SUBSIDIARY.amount) === '10,0 M€', `${SUBSIDIARY.name} · ${SUBSIDIARY.financing} · ${SUBSIDIARY.lender} · ${norm(SUBSIDIARY.amount)}`);

// Extraction (aperçu de la bêta).
console.log(`Extraction : ${EXTRACTION.fields.map((f) => `${f.label} = ${norm(f.value)} (p. ${f.page})`).join(' · ')}`);
console.log(`Registre : ${REGISTRY.map((r) => `${r.country} ${r.entity} ${norm(r.amount)} ${r.lender}`).join(' | ')}`);

// Échéancier.
console.log(`Échéancier : ${TIMELINE.events.map((e) => `${e.date} ${e.kind} — ${e.title} (${norm(e.sub)})`).join(' | ')}`);
check('Marche de seuil au 01/07/2027 = 3,25x', TIMELINE.events.some((e) => e.date === '2027-07-01') && norm(TIMELINE.stepThreshold) === '3,25x', norm(TIMELINE.stepThreshold));

// Simulation : (dette nette + dette d'acquisition) / (EBITDA + EBITDA de la cible).
const lev = (9_400_000 + 4_000_000) / (3_000_000 + 800_000);
check('Leverage projeté = 13,4 / 3,8', norm(SIMULATION.leverageAfter) === `${lev.toFixed(2).replace('.', ',')}x`, `${norm(SIMULATION.leverageAfter)} (${lev.toFixed(4)})`);
check('Dette nette projetée / EBITDA projeté', norm(SIMULATION.netDebtAfter) === '13,4 M€' && norm(SIMULATION.ebitdaAfter) === '3,8 M€', `${norm(SIMULATION.netDebtAfter)} / ${norm(SIMULATION.ebitdaAfter)}`);
check('Marge projetée négative (dépassement identifié comme projection)', SIMULATION.breach && norm(SIMULATION.headroomAfter) === '-0,03x', norm(SIMULATION.headroomAfter));
check('Encours du groupe après acquisition = 20,0 + 4,0', norm(SIMULATION.groupAfter) === '24,0 M€', `${norm(SIMULATION.groupBefore)} → ${norm(SIMULATION.groupAfter)}`);
const prof = (list) => list.reduce((acc, y) => acc + y.value, 0);
check('Profil de maturités = encours (avant / après)', Math.abs(prof(SIMULATION.profileBefore) - 20) < 1e-6 && Math.abs(prof(SIMULATION.profileAfter) - 24) < 1e-6,
  `${SIMULATION.profileAfter.map((y) => `${y.year} ${norm(y.amount)}`).join(' · ')}`);

// Dossier.
console.log(`Dossier : ${DOSSIER.blocks.map((b) => `${b.title} (${norm(b.detail)})`).join(' | ')}`);
check('Besoin de financement = dette d’acquisition simulée', norm(DOSSIER.need) === '4,0 M€', norm(DOSSIER.need));
check('Scénario étudié = leverage projeté', DOSSIER.blocks.some((b) => b.key === 'scenario' && norm(b.detail).includes(norm(SIMULATION.leverageAfter))), norm(SIMULATION.leverageAfter));

console.log(failures ? `\n${failures} contrôle(s) en échec.` : '\nTous les chiffres du film « vision » sont cohérents entre eux et avec la bêta.');
process.exit(failures ? 1 : 0);
