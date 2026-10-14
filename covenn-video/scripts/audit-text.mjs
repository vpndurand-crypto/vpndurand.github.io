// Audit des textes du film V5 : chaque texte rendu (toutes les 2 images), avec sa première et sa dernière image,
// puis les signes d'une langue ou d'un format français (accents, « », M€, k€, virgule décimale, mots français courants).
// Usage : node scripts/audit-text.mjs [--all]
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
await build({
  entryPoints: [join(root, 'scripts/text-audit.tsx')], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error',
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
let flagged = 0;
const rows = [...seen.entries()].sort((a, b) => a[1].first - b[1].first);
for (const [t, { first, last }] of rows) {
  const bad = FRENCH.test(t);
  if (bad) flagged += 1;
  if (bad || process.argv.includes('--all')) console.log(`${bad ? 'FR? ' : '    '}${String(first).padStart(3)}–${String(last).padEnd(3)} ${t}`);
}
console.log(`\n${seen.size} textes distincts ; ${flagged} à vérifier.`);
process.exit(flagged ? 1 : 0);
