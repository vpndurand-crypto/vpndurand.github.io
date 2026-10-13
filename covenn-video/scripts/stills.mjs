// Images de contrôle : un seul bundle et un seul navigateur, puis une image par numéro demandé.
// Usage : node scripts/stills.mjs out/qa 0 45 90 ...   (composition : COMP=CovennHexa pour la v2 ; par défaut la version « vision »)
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [outDir = 'out/qa', ...frames] = process.argv.slice(2);
const id = process.env.COMP ?? 'CovennHexaVision';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
mkdirSync(resolve(root, outDir), { recursive: true });
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), onProgress: () => undefined });
const puppeteerInstance = await openBrowser('chrome', { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance });
for (const frame of frames.map(Number)) {
  const output = resolve(root, outDir, `f${String(frame).padStart(3, '0')}.png`);
  await renderStill({ composition, serveUrl, frame, output, puppeteerInstance, imageFormat: 'png' });
  console.log(output);
}
await puppeteerInstance.close({ silent: true });
