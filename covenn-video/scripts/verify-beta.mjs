// Prouve que la copie de la bêta (beta/src) est identique aux sources livrées : aucune modification destructive.
// Usage : node scripts/verify-beta.mjs [chemin/vers/covenn-beta-sources.zip]
//   - avec l'archive : compare chaque fichier de covenn-beta/src à la copie, octet par octet ;
//   - sans argument : compare la copie au manifeste beta/MANIFEST.sha256 enregistré lors de la copie.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const betaSrc = join(root, 'beta/src');
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const local = new Map(walk(betaSrc).map((p) => [relative(betaSrc, p).split('\\').join('/'), sha(readFileSync(p))]));

let reference;
const zip = process.argv[2];
if (zip) {
  const names = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter((n) => n.startsWith('covenn-beta/src/') && !n.endsWith('/'));
  reference = new Map(names.map((n) => [n.slice('covenn-beta/src/'.length), sha(execFileSync('unzip', ['-p', zip, n], { maxBuffer: 64 * 1024 * 1024 }))]));
} else {
  const manifest = join(root, 'beta/MANIFEST.sha256');
  if (!existsSync(manifest)) throw new Error('beta/MANIFEST.sha256 absent : passer le chemin de l’archive en argument');
  reference = new Map(readFileSync(manifest, 'utf8').trim().split('\n').map((line) => {
    const [hash, ...rest] = line.split('  ');
    return [rest.join('  '), hash];
  }));
}

const problems = [];
for (const [name, hash] of reference) {
  if (!local.has(name)) problems.push(`manquant : ${name}`);
  else if (local.get(name) !== hash) problems.push(`modifié : ${name}`);
}
for (const name of local.keys()) if (!reference.has(name)) problems.push(`ajouté : ${name}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Bêta intacte : ${reference.size} fichiers identiques${zip ? ' à l’archive livrée' : ' au manifeste'}.`);
