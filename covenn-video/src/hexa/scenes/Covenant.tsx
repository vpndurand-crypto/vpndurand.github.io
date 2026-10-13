import type { CSSProperties } from 'react';
import { StatusBadge } from '../../../beta/src/ui/StatusBadge';
import { SourceChip } from '../../../beta/src/ui/SourceChip';
import { HeadroomGauge } from '../../../beta/src/ui/charts';
import { E, life, mix, p, quad, track, type Key } from '../../film/anim';
import { PdfWindow } from '../../film/parts/Windows';
import { COVENANT } from '../data';
import { SHADOW } from '../kit';
import { COVENANT_TILE, COVENANT_VALUE, cockpitCam, toFrame } from './cockpitLayout';
import { HANDOFF } from './Timeline';

/**
 * S4 — « Chaque engagement sous contrôle. » (bêta : calcul réel sur données fictives)
 * La tuile du cockpit s'ouvre sur le covenant : 3,13x, seuil ≤ 3,50x, marge, et la clause du contrat qui fonde le seuil.
 */
export const S4 = { morph: [288, 310] as const, out: [372, 392] as const };
const PANEL = { x: 150, y: 214, w: 990, h: 668 };
export const HERO = { x: PANEL.x + 56 + 222, y: PANEL.y + 300, size: 172 };
const RIGHT = PANEL.x + 600;
const PDF = { x: 1196, y: 214, w: 560, h: 668 };
/** Ancre du seuil (bord droit de « ≤ 3,50x ») et de la clause surlignée dans la page 47. */
const SEUIL_ANCHOR = { x: RIGHT + 236, y: PANEL.y + 271 };
const CLAUSE_ANCHOR = { x: PDF.x + 18, y: PDF.y + 262 };

/** Le nombre « 3,13x » : de la tuile du cockpit au cœur du panneau, puis vers la chronologie (S5). */
export function heroState(f: number, timelineTarget: { x: number; y: number; size: number }) {
  if (f < S4.morph[0]) return null;
  const t = p(f, S4.morph[0], S4.morph[1], E.inOut);
  const cam = cockpitCam(Math.min(f, S4.morph[1]));
  const from = toFrame(cam, COVENANT_VALUE.x, COVENANT_VALUE.y);
  const fromSize = 34 * cam.k;
  let x = mix(from.x, HERO.x, t);
  let y = mix(from.y, HERO.y, t);
  let size = Math.exp(mix(Math.log(fromSize), Math.log(HERO.size), t));
  // Arrivée marquée : le chiffre dépasse légèrement sa taille puis se pose.
  size *= 1 + 0.07 * Math.sin(Math.PI * p(f, S4.morph[1] - 4, S4.morph[1] + 10, E.linear));
  const o = p(f, S4.out[0], S4.out[1] + 6, E.inOut);
  if (o > 0) {
    const c = { x: mix(HERO.x, timelineTarget.x, 0.5), y: Math.max(HERO.y, timelineTarget.y) + 60 };
    x = quad(HERO.x, c.x, timelineTarget.x, o);
    y = quad(HERO.y, c.y, timelineTarget.y, o);
    size = Math.exp(mix(Math.log(HERO.size), Math.log(timelineTarget.size), o));
  }
  return { x, y, size, t };
}

const lbl: CSSProperties = { fontSize: 17, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' };

const CAM_K: Key[] = [[308, 1], [328, 1.08, E.inOut], [352, 1.06, E.inOut], [370, 1, E.inOut]];
const CAM_X: Key[] = [[308, 960], [328, 860, E.inOut], [352, 1040, E.inOut], [370, 960, E.inOut]];
const CAM_Y: Key[] = [[308, 560], [328, 560], [352, 530, E.inOut], [370, 560, E.inOut]];

export function Covenant({ f, timelineTarget }: { f: number; timelineTarget: { x: number; y: number; size: number } }) {
  if (f < S4.morph[0] || f > S4.out[1] + 8) return null;
  const hero = heroState(f, timelineTarget);
  const m = p(f, S4.morph[0], S4.morph[1], E.inOut);
  // Le panneau naît du rectangle de la tuile (vu par la caméra du cockpit).
  const cam = cockpitCam(Math.min(f, S4.morph[1]));
  const a = toFrame(cam, COVENANT_TILE.x, COVENANT_TILE.y);
  const tile = { x: a.x, y: a.y, w: COVENANT_TILE.w * cam.k, h: COVENANT_TILE.h * cam.k };
  const exit = p(f, S4.out[0], S4.out[1], E.in);
  const rect = {
    x: mix(tile.x, PANEL.x, m), y: mix(tile.y, PANEL.y, m), w: mix(tile.w, PANEL.w, m), h: mix(tile.h, PANEL.h, m),
  };
  const contentO = p(f, 302, 316, E.out) * (1 - exit);
  const badge = p(f, 308, 318, E.out);
  const gauge = p(f, 312, 334, E.out);
  const marge = p(f, 322, 334, E.out);
  const pdfIn = p(f, 324, 342, E.out);
  const pdfOut = p(f, S4.out[0], S4.out[0] + 14, E.in);
  const hl = p(f, 336, 350, E.inOut);
  const link = p(f, 344, 356, E.inOut);
  const dot = p(f, 352, 366, E.inOut);
  const pulse = life(f, 364, 368, 372, 382);

  // Lente poussée de caméra pendant la lecture, rendue avant que le chiffre ne rejoigne la chronologie.
  // Caméra : du chiffre vers le seuil, puis travelling jusqu'à la clause du contrat ; retour au cadre avant le passage à la chronologie.
  const k = track(f, CAM_K);
  const cx = track(f, CAM_X);
  const cy = track(f, CAM_Y);
  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, transformOrigin: '0 0', transform: `translate(${960 - k * cx}px, ${560 - k * cy}px) scale(${k})` }}>
      {/* Panneau du covenant */}
      <div style={{
        position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, background: 'var(--surface)', borderRadius: mix(12 * cam.k, 20, m),
        border: '1.5px solid var(--indigo-600)', boxShadow: SHADOW, opacity: 1 - p(f, S4.out[0] + 4, S4.out[1], E.in),
        transform: `scale(${mix(1, 0.94, exit)})`, transformOrigin: '20% 50%',
      }} />
      <div style={{ position: 'absolute', inset: 0, opacity: contentO }}>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 44, ...lbl }}>Covenant le plus proche du seuil</div>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 70, display: 'flex', alignItems: 'center', gap: 22 }}>
          <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em' }}>{COVENANT.label}</span>
          <span style={{ transform: `scale(${1.45 * mix(0.8, 1, badge)})`, transformOrigin: '0 50%', opacity: badge, display: 'inline-block' }}><StatusBadge status={COVENANT.status} /></span>
        </div>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 128, fontSize: 19, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{COVENANT.context}</div>

        {/* Seuil et marge */}
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 214, ...lbl }}>Seuil contractuel</div>
        <div style={{
          position: 'absolute', left: RIGHT - 8, top: PANEL.y + 238, padding: '0 8px', borderRadius: 10, fontSize: 54, fontWeight: 700, letterSpacing: '-0.015em',
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', background: `rgba(230, 226, 248, ${0.95 * pulse})`,
          textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'var(--indigo-300)', textDecorationThickness: 3, textUnderlineOffset: 10,
        }}>
          {COVENANT.threshold}
        </div>
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 340, ...lbl, opacity: marge }}>Marge disponible</div>
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 364, fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', opacity: marge }}>
          {COVENANT.headroom}<span style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-500)' }}> · {COVENANT.headroomPct}</span>
        </div>

        {/* Jauge de la bêta : valeur, seuil, marge hachurée */}
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 478, width: 878 / 2.2, transform: 'scale(2.2)', transformOrigin: '0 0' }}>
          <HeadroomGauge value={mix(0, COVENANT.gauge.value, gauge)} threshold={COVENANT.gauge.threshold} comparison="LTE" tone={COVENANT.tone} valueText={COVENANT.value} thresholdText={COVENANT.threshold} />
        </div>

        {/* Source */}
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 594, transform: 'scale(1.5)', transformOrigin: '0 50%', opacity: p(f, 340, 350) }}>
          <SourceChip kind="contract" label={COVENANT.sourceChip} />
        </div>
      </div>

      {/* La clause du contrat, à côté */}
      {pdfIn > 0.001 && pdfOut < 1 && (
        <div style={{
          position: 'absolute', left: PDF.x, top: PDF.y, opacity: pdfIn * (1 - pdfOut),
          transform: `translateX(${(1 - pdfIn) * 140 + pdfOut * 220}px) rotate(${(1 - pdfIn) * 2}deg)`,
        }}>
          <PdfWindow fileName={COVENANT.contractFile} page={COVENANT.contractPage} pageCount={96} width={PDF.w} height={PDF.h} highlightId="art-19-2" highlight={hl} compact={false} />
        </div>
      )}

      {/* Lien donnée ↔ source, et la preuve qui remonte de la clause jusqu'au seuil */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - exit }}>
        {link > 0 && (
          <path d={`M ${SEUIL_ANCHOR.x} ${SEUIL_ANCHOR.y} C ${SEUIL_ANCHOR.x + 120} ${SEUIL_ANCHOR.y}, ${CLAUSE_ANCHOR.x - 120} ${CLAUSE_ANCHOR.y}, ${CLAUSE_ANCHOR.x} ${CLAUSE_ANCHOR.y}`}
            pathLength={1} fill="none" stroke="var(--indigo-400)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - link} />
        )}
      </svg>
      {dot > 0 && dot < 1 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%',
          background: 'var(--indigo-600)', boxShadow: '0 0 0 7px rgba(106, 87, 200, 0.18), 0 0 24px rgba(74, 51, 179, 0.6)',
          offsetPath: `path('M ${CLAUSE_ANCHOR.x} ${CLAUSE_ANCHOR.y} C ${CLAUSE_ANCHOR.x - 120} ${CLAUSE_ANCHOR.y}, ${SEUIL_ANCHOR.x + 120} ${SEUIL_ANCHOR.y}, ${SEUIL_ANCHOR.x} ${SEUIL_ANCHOR.y}')`,
          offsetDistance: `${(dot * 100).toFixed(2)}%`, offsetRotate: '0deg', opacity: Math.min(1, dot * 6, (1 - dot) * 6),
        } as CSSProperties} />
      )}

      {/* Le chiffre héros (la chronologie le reprend à l'image du relais) */}
      {hero && f < HANDOFF && (
        <div style={{
          position: 'absolute', left: hero.x, top: hero.y, transform: `translate(-50%, -50%) scale(${hero.size / HERO.size})`, fontSize: HERO.size, lineHeight: 1,
          fontWeight: 700, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--ink-900)',
        }}>
          {COVENANT.value}
        </div>
      )}
    </div>
  );
}
