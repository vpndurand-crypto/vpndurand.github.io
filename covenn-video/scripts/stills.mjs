// Images de contrôle : un seul bundle, puis une image par numéro demandé.
// Usage : node scripts/stills.mjs out/qa 0 45 90 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [outDir = 'out/qa', ...frames] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
mkdirSync(resolve(root, outDir), { recursive: true });
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), onProgress: () => undefined });
const composition = await selectComposition({ serveUrl, id: 'CovennHexa', browserExecutable });
for (const frame of frames.map(Number)) {
  const output = resolve(root, outDir, `f${String(frame).padStart(3, '0')}.png`);
  await renderStill({ composition, serveUrl, frame, output, browserExecutable, imageFormat: 'png' });
  console.log(output);
}
