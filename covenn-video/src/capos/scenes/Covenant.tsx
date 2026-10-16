import type { CSSProperties } from 'react';
import { E, life, mix, p, quad, track, type Key } from '../../film/anim';
import { COVENANT, GROUP } from '../data';
import { PdfWindow } from '../docs';
import { Badge, SHADOW, SourceLink, StatusBadge } from '../kit';
import { COVENANT_TILE, COVENANT_VALUE, cockpitCam, toFrame } from './cockpitLayout';
import { HANDOFF } from './Timeline';

/**
 * S4 — « Every covenant. Backed by its source. » (calcul réel du moteur de la bêta, sur données fictives ; images V4)
 * La tuile du covenant s'ouvre sur la page Covenants de la bêta : 3.13x, seuil ≤ 3.50x, marge de 10.5 %, ce que la marge
 * peut encore absorber, et la clause 19.2 (page 47 du contrat) qui fonde le seuil, reliée au chiffre.
 */
export const S4 = { morph: [288, 310] as const, out: [372, 392] as const };
const PANEL = { x: 150, y: 214, w: 990, h: 668 };
export const HERO = { x: PANEL.x + 56 + 210, y: PANEL.y + 300, size: 172 };
const RIGHT = PANEL.x + 600;
const PDF = { x: 1196, y: 214, w: 560, h: 668 };
/** Ancre du seuil (bord droit de « ≤ 3.50x ») et de la clause surlignée dans la page 47. */
const SEUIL_ANCHOR = { x: RIGHT + 236, y: PANEL.y + 262 };
const CLAUSE_ANCHOR = { x: PDF.x + 18, y: PDF.y + 262 };
/** Échelle de la jauge : comme dans la projection de S6, 125 % du seuil. */
const GAUGE = { x: PANEL.x + 56, y: PANEL.y + 430, w: 878, max: COVENANT.thresholdNumber * 1.25 };

/** Le nombre « 3.13x » : de la tuile de la vue d'ensemble au cœur du panneau, puis vers la chronologie (S5). */
export function heroState(f: number, timelineTarget: { x: number; y: number; size: number }) {
  if (f < S4.morph[0]) return null;
  const t = p(f, S4.morph[0], S4.morph[1], E.inOut);
  const cam = cockpitCam(Math.min(f, S4.morph[1]));
  const from = toFrame(cam, COVENANT_VALUE.x, COVENANT_VALUE.y);
  const fromSize = 40 * cam.k;
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

const lbl: CSSProperties = { fontSize: 17, fontWeight: 550, color: 'var(--ink-2)', whiteSpace: 'nowrap' };

const CAM_K: Key[] = [[308, 1], [328, 1.08, E.inOut], [352, 1.06, E.inOut], [370, 1, E.inOut]];
const CAM_X: Key[] = [[308, 960], [328, 860, E.inOut], [352, 1040, E.inOut], [370, 960, E.inOut]];
const CAM_Y: Key[] = [[308, 560], [328, 560], [352, 530, E.inOut], [370, 560, E.inOut]];

export function Covenant({ f, timelineTarget }: { f: number; timelineTarget: { x: number; y: number; size: number } }) {
  if (f < S4.morph[0] || f > S4.out[1] + 8) return null;
  const hero = heroState(f, timelineTarget);
  const m = p(f, S4.morph[0], S4.morph[1], E.inOut);
  // Le panneau naît du rectangle de la tuile (vu par la caméra de la vue d'ensemble).
  const cam = cockpitCam(Math.min(f, S4.morph[1]));
  const a = toFrame(cam, COVENANT_TILE.x, COVENANT_TILE.y);
  const tile = { x: a.x, y: a.y, w: COVENANT_TILE.w * cam.k, h: COVENANT_TILE.h * cam.k };
  const exit = p(f, S4.out[0], S4.out[1], E.in);
  const rect = { x: mix(tile.x, PANEL.x, m), y: mix(tile.y, PANEL.y, m), w: mix(tile.w, PANEL.w, m), h: mix(tile.h, PANEL.h, m) };
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
  const pct = (v: number) => Math.min(1, v / GAUGE.max) * 100;

  // Caméra : du chiffre vers le seuil, puis travelling jusqu'à la clause du contrat ; retour au cadre avant la chronologie.
  const k = track(f, CAM_K);
  const cx = track(f, CAM_X);
  const cy = track(f, CAM_Y);
  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, transformOrigin: '0 0', transform: `translate(${960 - k * cx}px, ${560 - k * cy}px) scale(${k})` }}>
      {/* Panneau du covenant */}
      <div style={{
        position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, background: 'var(--surface)', borderRadius: mix(10 * cam.k, 20, m),
        border: '1.5px solid var(--brand)', boxShadow: SHADOW, opacity: 1 - p(f, S4.out[0] + 4, S4.out[1], E.in),
        transform: `scale(${mix(1, 0.94, exit)})`, transformOrigin: '20% 50%',
      }} />
      <div style={{ position: 'absolute', inset: 0, opacity: contentO }}>
        <div className="crumbs" style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 34, fontSize: 15, whiteSpace: 'nowrap' }}>Covenants <span>/</span> {COVENANT.label}</div>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 58, display: 'flex', alignItems: 'center', gap: 22 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em' }}>{COVENANT.label}</span>
          <span style={{ transform: `scale(${mix(0.8, 1, badge)})`, transformOrigin: '0 50%', opacity: badge, display: 'inline-block' }}><StatusBadge status={COVENANT.status} scale={1.7} /></span>
        </div>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 120, fontSize: 20, fontWeight: 550, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{COVENANT.definition}</div>
        <div className="faint" style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 150, fontSize: 16, whiteSpace: 'nowrap' }}>{COVENANT.context}</div>
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 200, ...lbl }}>Current calculation · {GROUP.asOf}</div>

        {/* Seuil et marge */}
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 200, ...lbl }}>Threshold</div>
        <div style={{
          position: 'absolute', left: RIGHT - 8, top: PANEL.y + 226, padding: '0 8px', borderRadius: 10, fontSize: 54, fontWeight: 700, letterSpacing: '-0.015em',
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', background: `rgba(239, 236, 251, ${pulse})`,
          textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'var(--c2)', textDecorationThickness: 3, textUnderlineOffset: 10,
        }}>
          {COVENANT.threshold}
        </div>
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 318, ...lbl, opacity: marge }}>Headroom</div>
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 342, fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', opacity: marge, color: 'var(--watch)' }}>
          {COVENANT.headroomPct}
        </div>
        <div style={{ position: 'absolute', left: RIGHT, top: PANEL.y + 398, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: 'var(--ink-2)', whiteSpace: 'nowrap', opacity: marge }}>
          From {COVENANT.nextFrom} {COVENANT.nextThreshold}<Badge tone="b-watch" scale={1.15}>Upcoming</Badge>
        </div>

        {/* Jauge : la valeur, le seuil, la marge */}
        <div style={{ position: 'absolute', left: GAUGE.x, top: GAUGE.y + 34, width: GAUGE.w }}>
          <div style={{ position: 'relative', height: 16, borderRadius: 999, background: 'var(--line-2)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(COVENANT.thresholdNumber)}%`, right: 0, borderRadius: '0 999px 999px 0', background: 'repeating-linear-gradient(135deg, rgba(194,70,45,.35) 0 3px, transparent 3px 7px)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct(COVENANT.valueNumber) * gauge}%`, borderRadius: 999, background: 'var(--watch)' }} />
            <div style={{ position: 'absolute', top: -10, bottom: -10, left: `${pct(COVENANT.thresholdNumber)}%`, width: 4, marginLeft: -2, borderRadius: 2, background: 'var(--ink)' }} />
          </div>
          <div style={{ position: 'relative', height: 26, marginTop: 10, fontSize: 16, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <span style={{ position: 'absolute', left: 0 }}>0</span>
            <span style={{ position: 'absolute', left: `${pct(COVENANT.valueNumber)}%`, transform: 'translateX(-100%)', paddingRight: 10, fontWeight: 650, color: 'var(--watch)', opacity: gauge }}>{COVENANT.value}</span>
            <span style={{ position: 'absolute', left: `calc(${pct(COVENANT.thresholdNumber)}% + 12px)`, fontWeight: 700, color: 'var(--ink)' }}>{COVENANT.threshold}</span>
          </div>
        </div>

        {/* Ce que la marge peut encore absorber (calcul du moteur de la bêta) */}
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 540, display: 'flex', gap: 64, opacity: marge }}>
          {COVENANT.absorb.map((x) => (
            <div key={x.label}>
              <div style={{ fontSize: 15, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{x.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{x.value}</div>
            </div>
          ))}
        </div>

        {/* Source */}
        <div style={{ position: 'absolute', left: PANEL.x + 56, top: PANEL.y + 622, opacity: p(f, 340, 350) }}>
          <SourceLink label={`${COVENANT.sourceNote} · ${COVENANT.contractFile}`} size={17} />
        </div>
      </div>

      {/* La clause du contrat, à côté */}
      {pdfIn > 0.001 && pdfOut < 1 && (
        <div style={{
          position: 'absolute', left: PDF.x, top: PDF.y, opacity: pdfIn * (1 - pdfOut),
          transform: `translateX(${(1 - pdfIn) * 140 + pdfOut * 220}px) rotate(${(1 - pdfIn) * 2}deg)`,
        }}>
          <PdfWindow docId="doc-01" n={COVENANT.clause.page} width={PDF.w} height={PDF.h} highlightId={COVENANT.clause.id} highlight={hl} fontSize={15} />
        </div>
      )}

      {/* Lien donnée ↔ source, et la preuve qui remonte de la clause jusqu'au seuil */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - exit }}>
        {link > 0 && (
          <path d={`M ${SEUIL_ANCHOR.x} ${SEUIL_ANCHOR.y} C ${SEUIL_ANCHOR.x + 120} ${SEUIL_ANCHOR.y}, ${CLAUSE_ANCHOR.x - 120} ${CLAUSE_ANCHOR.y}, ${CLAUSE_ANCHOR.x} ${CLAUSE_ANCHOR.y}`}
            pathLength={1} fill="none" stroke="var(--c2)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - link} />
        )}
      </svg>
      {dot > 0 && dot < 1 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%',
          background: 'var(--brand)', boxShadow: '0 0 0 7px rgba(143, 128, 220, 0.2), 0 0 24px rgba(74, 51, 179, 0.6)',
          offsetPath: `path('M ${CLAUSE_ANCHOR.x} ${CLAUSE_ANCHOR.y} C ${CLAUSE_ANCHOR.x - 120} ${CLAUSE_ANCHOR.y}, ${SEUIL_ANCHOR.x + 120} ${SEUIL_ANCHOR.y}, ${SEUIL_ANCHOR.x} ${SEUIL_ANCHOR.y}')`,
          offsetDistance: `${(dot * 100).toFixed(2)}%`, offsetRotate: '0deg', opacity: Math.min(1, dot * 6, (1 - dot) * 6),
        } as CSSProperties} />
      )}

      {/* Le chiffre héros (la chronologie le reprend à l'image du relais) */}
      {hero && f < HANDOFF && (
        <div style={{
          position: 'absolute', left: hero.x, top: hero.y, transform: `translate(-50%, -50%) scale(${hero.size / HERO.size})`, fontSize: HERO.size, lineHeight: 1,
          fontWeight: 650, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--ink)',
        }}>
          {COVENANT.value}
        </div>
      )}
    </div>
  );
}
