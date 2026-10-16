// Point d'entrée de l'audit des textes du film Capital OS (scripts/audit-text.mjs --film capos) : rend chaque calque du film
// à une image donnée, sans navigateur, et renvoie le texte du balisage. Les éléments transparents sont inclus (contrôle par excès).
import { renderToStaticMarkup } from 'react-dom/server';
import { Captions } from '../src/capos/Captions';
import { Mention } from '../src/capos/Mention';
import { Access } from '../src/capos/scenes/Access';
import { CapitalOverview } from '../src/capos/scenes/CapitalOverview';
import { Chaos } from '../src/capos/scenes/Chaos';
import { Cockpit, NavPill } from '../src/capos/scenes/Cockpit';
import { Covenant, S4 } from '../src/capos/scenes/Covenant';
import { INGEST, Ingest } from '../src/capos/scenes/Ingest';
import { Request } from '../src/capos/scenes/Request';
import { Signature } from '../src/capos/scenes/Signature';
import { Simulation } from '../src/capos/scenes/Simulation';
import { Timeline, heroTarget } from '../src/capos/scenes/Timeline';
import { DURATION, warp } from '../src/capos/timing';

const HERO = heroTarget();
export { DURATION };

export function textsAt(f: number): string[] {
  const w = warp(f);
  const html = renderToStaticMarkup(
    <>
      <Chaos f={f} />
      <CapitalOverview f={f} />
      <Cockpit f={w} hideTotal={w < INGEST.land} hideCovenantValue={w >= S4.morph[0]} />
      <Ingest f={w} />
      <Covenant f={w} timelineTarget={HERO} />
      <Timeline f={w} />
      <Request f={w} />
      <Simulation f={w} />
      <Access f={f} />
      <Signature f={f} />
      <Captions f={f} />
      <NavPill f={w} />
      <Mention f={f} />
    </>,
  );
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<\/?(div|p|h1|h2|h3|li|ul|text|svg|nav|header|aside|a|tr|td|th|table|thead|tbody)\b[^>]*>/g, '\n')
    .replace(/<\/span>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((s) => s.replace(/[\s ]+/g, ' ').trim())
    .filter(Boolean);
}
