// Audit des textes du film V5 : chaque texte rendu (toutes les 2 images), avec sa première et sa dernière image,
// puis les signes d'une langue ou d'un format français (accents, « », M€, k€, virgule décimale, mots français courants).
// Usage : node scripts/audit-text.mjs [--all]
//         node scripts/audit-text.mjs --film v6 [--all]      → film HEXA V6 « The Capital OS » (mêmes noms propres que Capital OS).
//         node scripts/audit-text.mjs --film capos [--all]   → film Capital OS. Les noms propres de la bêta (prêteurs, sociétés,
//         fichiers, « crédit-bail » cité dans le titre anglais d'un document) sont retirés avant le contrôle : ce sont des noms,
//         pas du texte français ; la liste est ALLOWED ci-dessous.
import { build } from 'esbuild';
import { mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Le paquet est écrit dans le projet pour que react, remotion, etc. se résolvent depuis node_modules.
const cache = join(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const out = join(cache, 'covenn-text-audit.cjs');
const film = process.argv.includes('--film') ? process.argv[process.argv.indexOf('--film') + 1] : 'hexa';
const ENTRIES = { hexa: 'scripts/text-audit.tsx', capos: 'scripts/text-audit-capos.tsx', v6: 'scripts/text-audit-v6.tsx' };
if (!ENTRIES[film]) throw new Error(`Film inconnu : ${film}`);
/** Les films V6 et Capital OS reprennent les noms propres de la bêta « Capital operating system ». */
const capos = film === 'capos' || film === 'v6';
await build({
  entryPoints: [join(root, ENTRIES[film])], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error',
  jsx: 'automatic', loader: { '.module.css': 'local-css', '.css': 'empty', '.woff2': 'empty', '.png': 'empty', '.svg': 'empty' },
  external: ['react', 'react-dom', 'remotion', 'lucide-react', 'big.js'],
});
const { textsAt, DURATION } = createRequire(import.meta.url)(out);
rmSync(out, { force: true });

const seen = new Map();
for (let f = 0; f < DURATION; f += 2) {
  for (const t of textsAt(f)) {
    const s = seen.get(t);
    if (s) s.last = f; else seen.set(t, { first: f, last: f });
  }
}
const FRENCH = /[àâçéèêëîïôöùûüœæÀÂÇÉÈÊËÎÏÔÖÙÛÜŒ«»]|M€|k€|\d,\d{1,2}(?!\d)|\b(le|la|les|des|du|une|un|et|ou|pour|avec|sans|sur|dans|au|aux|par|est|sont|données|société|sociétés|pays|prêteur|prêteurs|encours|échéance|seuil|marge|dossier|financement|financements|groupe|projet|besoin|aujourd|vigilance|respecté|contrat|balance|relevé|banque)\b/i;
/** Noms propres de la bêta Capital OS (prêteurs et sociétés fictifs, noms de fichiers), retirés avant le contrôle. */
const ALLOWED = capos ? [
  /Banque Exemple|Banque Aurore|Banque Méridienne|Finance Bail Exemple|Beispielbank AG/g,
  /Lumenvale (Industrie|Logistique) SAS|Lumenvale (Industrie|Logistique|Services)/g,
  /\b[\w-]+(_[\w.-]+)+\.(pdf|xlsx)\b/g, // noms de fichiers de la bêta (Darlehen_…, SFA_…_BanqueExemple_…)
  /\(crédit-bail\)/g, /\(URSSAF\)/g,
  /\b(trial-)?balance\b/g, // « balance » est aussi un mot anglais : « balance due », « balance sheet », « trial-balance »
] : [];
const clean = (t) => ALLOWED.reduce((acc, re) => acc.replace(re, ' '), t);
let flagged = 0;
const rows = [...seen.entries()].sort((a, b) => a[1].first - b[1].first);
for (const [t, { first, last }] of rows) {
  const bad = FRENCH.test(clean(t));
  if (bad) flagged += 1;
  if (bad || process.argv.includes('--all')) console.log(`${bad ? 'FR? ' : '    '}${String(first).padStart(3)}–${String(last).padEnd(3)} ${t}`);
}
console.log(`\n${seen.size} textes distincts ; ${flagged} à vérifier.`);
process.exit(flagged ? 1 : 0);
