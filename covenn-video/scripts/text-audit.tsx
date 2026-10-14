// Point d'entrée de l'audit des textes (scripts/audit-text.mjs) : rend chaque calque du film à une image donnée,
// sans navigateur, et renvoie le texte du balisage. Les éléments transparents sont inclus (contrôle par excès).
import { renderToStaticMarkup } from 'react-dom/server';
import { Captions } from '../src/hexa/Captions';
import { Mention } from '../src/hexa/Mention';
import { Access } from '../src/hexa/scenes/Access';
import { CapitalStructure } from '../src/hexa/scenes/CapitalStructure';
import { Chaos } from '../src/hexa/scenes/Chaos';
import { Cockpit, NavPill } from '../src/hexa/scenes/Cockpit';
import { Covenant, S4 } from '../src/hexa/scenes/Covenant';
import { Dossier } from '../src/hexa/scenes/Dossier';
import { INGEST, Ingest } from '../src/hexa/scenes/Ingest';
import { Signature } from '../src/hexa/scenes/Signature';
import { Simulation } from '../src/hexa/scenes/Simulation';
import { Timeline, heroTarget } from '../src/hexa/scenes/Timeline';
import { DURATION, warp } from '../src/hexa/timing';

const HERO = heroTarget();
export { DURATION };

export function textsAt(f: number): string[] {
  const w = warp(f);
  const html = renderToStaticMarkup(
    <>
      <Chaos f={f} />
      <CapitalStructure f={f} />
      <Cockpit f={w} hideTotal={w < INGEST.land} hideCovenantValue={w >= S4.morph[0]} />
      <Ingest f={w} />
      <Covenant f={w} timelineTarget={HERO} />
      <Timeline f={w} />
      <Dossier f={w} />
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
    .replace(/<\/?(div|p|h1|h2|h3|li|ul|text|svg|nav|header)\b[^>]*>/g, '\n')
    .replace(/<\/span>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((s) => s.replace(/[\s ]+/g, ' ').trim())
    .filter(Boolean);
}
