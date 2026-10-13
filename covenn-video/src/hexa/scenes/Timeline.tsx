import type { CSSProperties } from 'react';
import { Icon, type IconName } from '../../../beta/src/ui/Icon';
import { formatDate } from '../../../beta/src/domain/format';
import { E, mix, p, track, zoomTrack, type Key } from '../../film/anim';
import { COVENANT, TIMELINE } from '../data';
import { ProjectionBadge } from '../kit';

/**
 * S5 — « Anticipez, ne subissez plus. » (projection ; événements de l'échéancier d'aperçu de la bêta)
 * Le ratio devient le point « aujourd'hui » d'une chronologie ; une tête de lecture balaie l'avenir et révèle
 * test de covenant, échéance, refinancement à prévoir, marche de seuil (mise en avant) et maturité.
 */
export const AXIS_Y = 600;
const TODAY_X = 300;
const END_X = 1780;
const t0 = Date.parse(TIMELINE.today);
const t1 = Date.parse('2030-03-31');
const xOf = (iso: string) => TODAY_X + ((Date.parse(iso) - t0) / (t1 - t0)) * (END_X - TODAY_X);

/** Où le chiffre « 3,13x » se pose (repère de la chronologie, avant caméra). */
export const HERO_SLOT = { x: 222, y: AXIS_Y + 2, size: 46 };

export interface TlCam { k: number; cx: number; cy: number; fx: number; fy: number }
const K: Key[] = [[392, 1.3], [404, 1.3], [438, 1, E.inOut], [452, 1], [474, 1.2, E.inOut]];
const CX: Key[] = [[392, 520], [404, 560], [438, 960, E.inOut], [452, 960], [474, 820, E.inOut]];
const CY: Key[] = [[392, 600], [404, 600], [438, 566, E.inOut], [452, 566], [474, 660, E.inOut]];
const FX: Key[] = [[392, 800], [404, 820], [438, 960, E.inOut], [452, 960], [474, 900, E.inOut]];
const FY: Key[] = [[392, 640], [404, 640], [438, 590, E.inOut], [452, 590], [474, 640, E.inOut]];
export function tlCam(f: number): TlCam {
  return { k: zoomTrack(f, K), cx: track(f, CX), cy: track(f, CY), fx: track(f, FX), fy: track(f, FY) };
}
export function tlToFrame(cam: TlCam, x: number, y: number) {
  return { x: cam.fx + cam.k * (x - cam.cx), y: cam.fy + cam.k * (y - cam.cy) };
}

/** Passage horizontal vers la simulation (S6) : l'image glisse vers la droite, « vers demain ». */
export const PAN = { start: 472, end: 494 } as const;
export function panOffset(f: number): number {
  return -1920 * p(f, PAN.start, PAN.end, E.inOut);
}
/** Flou de bougé horizontal proportionnel à la vitesse du passage. */
export function panBlur(f: number): number {
  const v = Math.abs(panOffset(f + 0.5) - panOffset(f - 0.5));
  return Math.min(22, v * 0.16);
}

const PLAY = { start: 400, end: 444 };
const playX = (f: number) => mix(TODAY_X, END_X, p(f, PLAY.start, PLAY.end, E.inOut));

interface Card { id: string; side: 'up' | 'down'; x: number; w: number; y: number; icon: IconName }
const CARDS: Record<string, Card> = {
  test: { id: 'test', side: 'up', x: 250, w: 280, y: 324, icon: 'covenants' },
  installment: { id: 'installment', side: 'down', x: 250, w: 280, y: 690, icon: 'calendar' },
  'maturity-rcf': { id: 'maturity-rcf', side: 'up', x: 566, w: 360, y: 268, icon: 'financings' },
  step: { id: 'step', side: 'down', x: 566, w: 430, y: 684, icon: 'warning' },
  'maturity-sfa': { id: 'maturity-sfa', side: 'up', x: 1490, w: 300, y: 324, icon: 'calendar' },
};
const CARD_H = 124;

const YEARS = ['2027', '2028', '2029', '2030'];

export function Timeline({ f }: { f: number }) {
  if (f < 390 || f > PAN.end + 2) return null;
  const cam = tlCam(f);
  const appear = p(f, 390, 404, E.out);
  const axis = p(f, 392, 412, E.inOut);
  const px = playX(f);
  const watch = p(f, 446, 458, E.out);
  const blur = panBlur(f);

  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${panOffset(f)}px)`, filter: blur > 0.2 ? 'url(#hblur-tl)' : undefined }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="hblur-tl" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${cam.fx - cam.k * cam.cx}px, ${cam.fy - cam.k * cam.cy}px) scale(${cam.k})` }}>
        {/* En-tête du module, discret */}
        <div style={{ position: 'absolute', left: TODAY_X - 150, top: 248, display: 'flex', alignItems: 'center', gap: 12, opacity: appear }}>
          <span style={{ color: 'var(--indigo-600)', display: 'grid' }}><Icon name="schedule" size={22} /></span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Échéances du groupe</span>
          <ProjectionBadge scale={1.2} />
        </div>

        {/* Axe du temps */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line x1={TODAY_X} y1={AXIS_Y} x2={mix(TODAY_X, END_X + 40, axis)} y2={AXIS_Y} stroke="var(--line-strong)" strokeWidth={3} strokeLinecap="round" />
          <line x1={TODAY_X} y1={AXIS_Y} x2={Math.min(px, END_X + 40)} y2={AXIS_Y} stroke="var(--indigo-300)" strokeWidth={3} strokeLinecap="round" opacity={p(f, PLAY.start, PLAY.start + 4)} />
          {YEARS.map((y) => {
            const x = xOf(`${y}-01-01`);
            const o = p(f, 392 + (x - TODAY_X) / 60, 404 + (x - TODAY_X) / 60);
            return (
              <g key={y} opacity={o}>
                <line x1={x} y1={AXIS_Y - 7} x2={x} y2={AXIS_Y + 7} stroke="var(--ink-400)" strokeWidth={2} />
                <text x={x} y={AXIS_Y + 34} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--ink-500)" style={{ fontVariantNumeric: 'tabular-nums' }}>{y}</text>
              </g>
            );
          })}
          {/* Points d'aujourd'hui et des événements */}
          <circle cx={TODAY_X} cy={AXIS_Y} r={9} fill="var(--indigo-600)" stroke="#fff" strokeWidth={3} opacity={appear} />
          {TIMELINE.events.map((e) => {
            const x = xOf(e.date);
            const card = CARDS[e.id];
            if (!card) return null;
            const on = p(f, hitFrame(x), hitFrame(x) + 8, E.out);
            const isWatch = e.tone === 'watch';
            const y2 = card.side === 'up' ? card.y + CARD_H : card.y;
            return (
              <g key={e.id} opacity={on}>
                <line x1={x} y1={AXIS_Y} x2={x} y2={mix(AXIS_Y, y2, on)} stroke={isWatch ? 'var(--watch-accent)' : 'var(--indigo-200)'} strokeWidth={2} strokeDasharray={isWatch ? undefined : '4 5'} />
                <circle cx={x} cy={AXIS_Y} r={isWatch ? 10 : 8} fill={isWatch ? 'var(--watch-accent)' : '#fff'} stroke={isWatch ? '#fff' : 'var(--indigo-500)'} strokeWidth={3} />
                {isWatch && <circle cx={x} cy={AXIS_Y} r={10 + 22 * watch} fill="none" stroke="var(--watch-accent)" strokeWidth={2} opacity={0.6 * (1 - watch * 0.6)} />}
              </g>
            );
          })}
          {/* Tête de lecture */}
          {f >= PLAY.start && f <= PLAY.end + 8 && (
            <g opacity={1 - p(f, PLAY.end, PLAY.end + 8)}>
              <line x1={px} y1={AXIS_Y - 70} x2={px} y2={AXIS_Y + 70} stroke="var(--indigo-500)" strokeWidth={2} />
              <circle cx={px} cy={AXIS_Y} r={6} fill="var(--indigo-600)" />
            </g>
          )}
        </svg>

        {/* « Aujourd'hui » */}
        <div style={{ position: 'absolute', left: TODAY_X, top: AXIS_Y - 64, transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: 'var(--indigo-700)', opacity: appear, whiteSpace: 'nowrap' }}>
          Aujourd’hui
        </div>
        <div style={{ position: 'absolute', left: HERO_SLOT.x, top: AXIS_Y + 34, transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', opacity: p(f, 396, 404), whiteSpace: 'nowrap' }}>
          Leverage
        </div>
        {f >= HANDOFF && (
          <div style={{ position: 'absolute', left: HERO_SLOT.x, top: HERO_SLOT.y, transform: 'translate(-50%, -50%)', fontSize: HERO_SLOT.size, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {COVENANT.value}
          </div>
        )}

        {/* Cartes d'événements */}
        {TIMELINE.events.map((e) => {
          const card = CARDS[e.id];
          if (!card) return null;
          const x = xOf(e.date);
          const on = p(f, hitFrame(x) + 2, hitFrame(x) + 12, E.out);
          if (on <= 0.001) return null;
          const isWatch = e.tone === 'watch';
          const hl = isWatch ? watch : 0;
          const style: CSSProperties = {
            position: 'absolute', left: card.x, top: card.y, width: card.w, height: CARD_H, background: 'var(--surface)', borderRadius: 14, padding: '16px 18px',
            border: isWatch ? '1.5px solid var(--watch-accent)' : '1px solid var(--line)',
            boxShadow: isWatch ? `0 18px 48px rgba(28,26,43,.10), 0 0 0 ${8 * hl}px rgba(240, 140, 26, ${0.16 * hl})` : '0 12px 32px rgba(28,26,43,.08)',
            opacity: on, transform: `translateY(${(1 - on) * (card.side === 'up' ? 18 : -18)}px) scale(${isWatch ? mix(1, 1.04, hl) : 1})`, transformOrigin: '20% 0',
          };
          return (
            <div key={e.id} style={style}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: isWatch ? 'var(--watch-bg)' : 'var(--indigo-50)', color: isWatch ? 'var(--watch-accent)' : 'var(--indigo-600)' }}>
                  <Icon name={card.icon} size={17} />
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{formatDate(e.date)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isWatch ? 'var(--watch)' : 'var(--indigo-700)', background: isWatch ? 'var(--watch-bg)' : 'var(--indigo-50)', borderRadius: 999, padding: '3px 10px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  {isWatch ? 'Vigilance' : e.kind}
                </span>
              </div>
              <div style={{ marginTop: 12, fontSize: 19, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
              <div style={{ marginTop: 4, fontSize: 15, color: isWatch ? 'var(--watch)' : 'var(--ink-500)', fontWeight: isWatch ? 600 : 400, whiteSpace: 'nowrap' }}>
                {isWatch ? `${e.kind} · ${e.sub.toLowerCase()}` : e.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Image où la tête de lecture atteint l'abscisse x. */
function hitFrame(x: number): number {
  const target = (x - TODAY_X) / (END_X - TODAY_X);
  // Inversion numérique de la courbe de la tête de lecture.
  for (let f = PLAY.start; f <= PLAY.end; f += 0.25) {
    if (p(f, PLAY.start, PLAY.end, E.inOut) >= target) return f;
  }
  return PLAY.end;
}

/** Image où le chiffre héros de S4 cède sa place à celui de la chronologie. */
export const HANDOFF = 398;

/** Cible du chiffre héros (dans l'image) au moment du passage de relais. */
export function heroTarget(): { x: number; y: number; size: number } {
  const cam = tlCam(HANDOFF);
  const pt = tlToFrame(cam, HERO_SLOT.x, HERO_SLOT.y);
  return { x: pt.x, y: pt.y, size: HERO_SLOT.size * cam.k };
}

