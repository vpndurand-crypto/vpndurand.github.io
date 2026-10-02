import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : walk(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== 'test-setup.ts' ? [full] : [];
  });
}
const files = walk(SRC).map((full) => ({ path: relative(SRC, full).split(sep).join('/'), text: readFileSync(full, 'utf8') }));
const importsOf = (text: string) => [...text.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? '');
const inLayer = (path: string, ...layers: string[]) => layers.some((layer) => path.startsWith(`${layer}/`));

describe('règles d’architecture (plan technique, section 5.3)', () => {
  it('pages, features et ui ne touchent ni au moteur, ni à la comptabilité, ni à big.js', () => {
    const violations = files.filter((f) => inLayer(f.path, 'pages', 'features', 'ui'))
      .flatMap((f) => importsOf(f.text).filter((i) => i === 'big.js' || /domain\/(engine|accounting|resolver)/.test(i)).map((i) => `${f.path} → ${i}`));
    expect(violations).toEqual([]);
  });
  it('domain et data restent purs : pas de React, pas de store, pas d’horloge, pas de hasard, pas de stockage', () => {
    const violations = files.filter((f) => inLayer(f.path, 'domain', 'data')).flatMap((f) => {
      const bad = importsOf(f.text).filter((i) => i === 'react' || i.includes('/store/')).map((i) => `${f.path} → ${i}`);
      for (const token of ['Date.now', 'new Date(', 'Math.random', 'localStorage']) if (f.text.includes(token)) bad.push(`${f.path} contient ${token}`);
      return bad;
    });
    expect(violations).toEqual([]);
  });
  it('data n’appelle le moteur que depuis seed.ts ; ui ne lit que les libellés de data', () => {
    const dataViolations = files.filter((f) => inLayer(f.path, 'data') && f.path !== 'data/seed.ts')
      .flatMap((f) => importsOf(f.text).filter((i) => i.includes('domain')).map((i) => `${f.path} → ${i}`));
    const uiViolations = files.filter((f) => inLayer(f.path, 'ui'))
      .flatMap((f) => importsOf(f.text).filter((i) => i.includes('/data/') && !i.endsWith('/data/labels') && !i.endsWith('/data/types')).map((i) => `${f.path} → ${i}`));
    expect([...dataViolations, ...uiViolations]).toEqual([]);
  });
  it('aucun appel réseau à l’exécution', () => {
    const violations = files.filter((f) => /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/.test(f.text)).map((f) => f.path);
    expect(violations).toEqual([]);
  });
  it('les chemins de l’application ne sont écrits que dans app/routes.ts', () => {
    const pattern = /['"`](#\/|\/(financements|covenants|documents|donnees|echeances|journal|parametres|feuille-de-route|connexion)\b)/;
    expect(files.filter((f) => f.path !== 'app/routes.ts' && pattern.test(f.text)).map((f) => f.path)).toEqual([]);
  });
  it('aucune URL construite par l’application, aucun routeur dépendant de l’origine du document', () => {
    const pattern = /new URL\(|createHashRouter|createBrowserRouter|\bHashRouter\b|\bBrowserRouter\b/;
    expect(files.filter((f) => pattern.test(f.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))).map((f) => f.path)).toEqual([]);
  });
  it('vocabulaire : jamais « Conforme » (le statut s’écrit « Covenant respecté »)', () => {
    expect(files.filter((f) => /\bConforme\b/.test(f.text)).map((f) => f.path)).toEqual([]);
  });
});
