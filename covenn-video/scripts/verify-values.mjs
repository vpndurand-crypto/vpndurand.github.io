// Vérifie que chaque valeur affichée par le film (src/bridge/demo.ts, calculée par le moteur de la bêta)
// est exactement la valeur validée du brief. Usage : node scripts/verify-values.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'covenn-values-'));
const out = join(dir, 'demo.mjs');
await build({ entryPoints: [join(root, 'src/bridge/demo.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const { V } = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

// Espaces insécables (U+00A0, U+202F) ramenées à une espace simple pour la comparaison.
const norm = (s) => String(s).replace(/[  ]/g, ' ');
const expected = [
  ['Encours (vue groupe)', V.group.outstanding, '14,0 M€'],
  ['Trésorerie (vue groupe)', V.group.cash, '1,3 M€'],
  ['Dette nette (vue groupe)', V.group.netDebt, '12,7 M€'],
  ['Financements', V.group.financingCount, '4'],
  ['Prêteurs', V.group.lenderCount, '4'],
  ['Sociétés', V.group.entityCount, '3'],
  ['Dette', V.tree.debt.value, '10,0 M€'],
  ['Trésorerie', V.tree.cash.value, '600 k€'],
  ['Dette nette', V.covenant.numerator, '9,4 M€'],
  ['EBITDA comptable LTM', V.tree.ltm.value, '2,85 M€'],
  ['Ajustement', V.tree.adjustment.value, '+150 k€'],
  ['EBITDA contractuel', V.covenant.denominator, '3,0 M€'],
  ['Leverage', V.covenant.value, '3,13x'],
  ['Seuil', V.covenant.threshold, '≤ 3,50x'],
  ['Headroom', V.covenant.headroom, '0,37x'],
  ['Marge', V.covenant.headroomPct, '10,5 %'],
  ['Dette supplémentaire mobilisable', V.covenant.conversion, '1,1 M€'],
  ['Dette supplémentaire mobilisable (exact)', V.covenant.conversionExact, '1 100 000,00 €'],
  ['Statut', V.covenant.statusLabel, 'Covenant respecté — vigilance'],
  ['Couleur du statut', V.covenant.tone, 'watch'],
  ['Calcul figé — horodatage', V.frozen.closedAt, '20/10/2026 à 10:30'],
  ['Calcul figé — auteur', V.frozen.by, 'Camille Laurent'],
  ['Calcul figé — empreinte', V.frozen.hash8, '069afaa8'],
  ['Calcul figé — valeur', V.frozen.value, '3,13x'],
  ['Trésorerie modifiée', V.modified.cashAfter, '500 k€'],
  ['Nouveau leverage', V.modified.value, '3,17x'],
  ['Écart', V.modified.delta, '+0,03x'],
  ['Clause', V.contract.chip, 'Contrat SFA-2025-001 · art. 19.2, p. 47'],
];
let failures = 0;
for (const [label, actual, want] of expected) {
  const ok = norm(actual) === want;
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ÉCART'} ${label.padEnd(42)} ${norm(actual)}${ok ? '' : `   (attendu : ${want})`}`);
}
if (failures) {
  console.error(`\n${failures} valeur(s) différente(s) du brief validé.`);
  process.exit(1);
}
console.log(`\n${expected.length} valeurs conformes au brief, toutes calculées par le moteur de la bêta.`);
