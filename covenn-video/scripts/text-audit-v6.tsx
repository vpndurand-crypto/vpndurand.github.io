// Point d'entrée de l'audit des textes du film V6 (scripts/audit-text.mjs --film v6, scripts/verify-v6.mjs) : rend chaque
// calque du film à une image donnée, sans navigateur, et renvoie le texte du balisage. Les éléments transparents sont
// inclus (contrôle par excès).
import { renderToStaticMarkup } from 'react-dom/server';
import { Captions } from '../src/v6/Captions';
import { Mention } from '../src/v6/Mention';
import { EndCard } from '../src/v6/scenes/EndCard';
import { FalconCard } from '../src/v6/scenes/FalconCard';
import { Fragments } from '../src/v6/scenes/Fragments';
import { Network, NetworkBackdrop } from '../src/v6/scenes/Network';
import { ComparePage, OverviewPage, RequestPage, ScenarioPage } from '../src/v6/scenes/Pages';
import { DURATION } from '../src/v6/timing';
import { AppWindow } from '../src/v6/Window';

export { DURATION };

export function textsAt(f: number): string[] {
  const html = renderToStaticMarkup(
    <>
      <Fragments f={f} />
      <AppWindow f={f}>
        <OverviewPage f={f} />
        <ScenarioPage f={f} />
        <RequestPage f={f} />
        <ComparePage f={f} />
      </AppWindow>
      <NetworkBackdrop f={f} />
      <FalconCard f={f} />
      <Network f={f} />
      <EndCard f={f} from={{ x: 960, y: 540 }} />
      <Captions f={f} />
      <Mention f={f} />
    </>,
  );
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<\/?(div|p|h1|h2|h3|li|ul|text|svg|nav|header|aside|a|tr|td|th|table|thead|tbody|b)\b[^>]*>/g, '\n')
    .replace(/<\/span>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((s) => s.replace(/[\s ]+/g, ' ').trim())
    .filter(Boolean);
}
