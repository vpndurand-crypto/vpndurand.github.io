import type { CSSProperties } from 'react';
import { E, mix, p, track, zoomTrack, type Key } from '../../film/anim';
import { COVENANT, TIMELINE } from '../data';
import { date } from '../format';
import { Badge, Icon, type IconName } from '../kit';

/**
 * S5 — « Anticipate. Don’t react. » (démonstration de la bêta : onglet « Repayment schedule » et registre ; images V4)
 * Le ratio devient le point « aujourd'hui » d'une chronologie ; une tête de lecture balaie l'avenir et révèle le prochain
 * test de covenant, une échéance, la maturité de la ligne renouvelable, la marche de seuil de 3.50x à 3.25x (mise en avant,
 * comme dans les « Priority decisions » de la bêta) et la maturité du contrat SFA.
 */
export const AXIS_Y = 600;
const TODAY_X = 300;
const END_X = 1780;
const t0 = Date.parse(TIMELINE.today);
const t1 = Date.parse('2030-03-31');
const xOf = (iso: string) => TODAY_X + ((Date.parse(iso) - t0) / (t1 - t0)) * (END_X - TODAY_X);

/** Où le chiffre « 3.13x » se pose (repère de la chronologie, avant caméra). */
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
export const PAN = { start: 472, end: 488 } as const;
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
  test: { id: 'test', side: 'up', x: 236, w: 352, y: 324, icon: 'covenants' },
  installment: { id: 'installment', side: 'down', x: 244, w: 306, y: 690, icon: 'debt' },
  'maturity-rcf': { id: 'maturity-rcf', side: 'up', x: 600, w: 380, y: 268, icon: 'financing' },
  step: { id: 'step', side: 'down', x: 566, w: 448, y: 684, icon: 'alert' },
  'maturity-sfa': { id: 'maturity-sfa', side: 'up', x: 1460, w: 340, y: 324, icon: 'debt' },
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
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${panOffset(f)}px)`, filter: blur > 0.2 ? 'url(#hblur-tl)' : undefined, opacity: 1 - p(f, PAN.end - 6, PAN.end, E.in) }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="hblur-tl" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${cam.fx - cam.k * cam.cx}px, ${cam.fy - cam.k * cam.cy}px) scale(${cam.k})` }}>
        {/* En-tête du module, discret */}
        <div style={{ position: 'absolute', left: TODAY_X - 150, top: 248, display: 'flex', alignItems: 'center', gap: 12, opacity: appear }}>
          <span style={{ color: 'var(--brand)', display: 'grid' }}><Icon name="debt" size={22} /></span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Repayment schedule</span>
          <span className="faint" style={{ fontSize: 16 }}>· maturities, instalments, covenant tests</span>
        </div>

        {/* Axe du temps */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line x1={TODAY_X} y1={AXIS_Y} x2={mix(TODAY_X, END_X + 40, axis)} y2={AXIS_Y} stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />
          <line x1={TODAY_X} y1={AXIS_Y} x2={Math.min(px, END_X + 40)} y2={AXIS_Y} stroke="var(--c2)" strokeWidth={3} strokeLinecap="round" opacity={p(f, PLAY.start, PLAY.start + 4)} />
          {YEARS.map((y) => {
            const x = xOf(`${y}-01-01`);
            const o = p(f, 392 + (x - TODAY_X) / 60, 404 + (x - TODAY_X) / 60);
            return (
              <g key={y} opacity={o}>
                <line x1={x} y1={AXIS_Y - 7} x2={x} y2={AXIS_Y + 7} stroke="var(--ink-3)" strokeWidth={2} />
                <text x={x} y={AXIS_Y + 34} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--ink-3)" style={{ fontVariantNumeric: 'tabular-nums' }}>{y}</text>
              </g>
            );
          })}
          {/* Points d'aujourd'hui et des événements */}
          <circle cx={TODAY_X} cy={AXIS_Y} r={9} fill="var(--brand)" stroke="#fff" strokeWidth={3} opacity={appear} />
          {TIMELINE.events.map((e) => {
            const x = xOf(e.date);
            const card = CARDS[e.id];
            if (!card) return null;
            const on = p(f, hitFrame(x), hitFrame(x) + 8, E.out);
            const isCrit = e.tone === 'crit';
            const y2 = card.side === 'up' ? card.y + CARD_H : card.y;
            return (
              <g key={e.id} opacity={on}>
                <line x1={x} y1={AXIS_Y} x2={x} y2={mix(AXIS_Y, y2, on)} stroke={isCrit ? 'var(--crit)' : 'var(--brand-line)'} strokeWidth={2} strokeDasharray={isCrit ? undefined : '4 5'} />
                <circle cx={x} cy={AXIS_Y} r={isCrit ? 10 : 8} fill={isCrit ? 'var(--crit)' : '#fff'} stroke={isCrit ? '#fff' : 'var(--brand)'} strokeWidth={3} />
                {isCrit && <circle cx={x} cy={AXIS_Y} r={10 + 22 * watch} fill="none" stroke="var(--crit)" strokeWidth={2} opacity={0.6 * (1 - watch * 0.6)} />}
              </g>
            );
          })}
          {/* Tête de lecture */}
          {f >= PLAY.start && f <= PLAY.end + 8 && (
            <g opacity={1 - p(f, PLAY.end, PLAY.end + 8)}>
              <line x1={px} y1={AXIS_Y - 70} x2={px} y2={AXIS_Y + 70} stroke="var(--brand)" strokeWidth={2} />
              <circle cx={px} cy={AXIS_Y} r={6} fill="var(--brand)" />
            </g>
          )}
        </svg>

        {/* « Aujourd'hui » */}
        <div style={{ position: 'absolute', left: TODAY_X, top: AXIS_Y - 64, transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: 'var(--brand-ink)', opacity: appear, whiteSpace: 'nowrap' }}>
          Today
        </div>
        <div style={{ position: 'absolute', left: HERO_SLOT.x, top: AXIS_Y + 34, transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', opacity: p(f, 396, 404), whiteSpace: 'nowrap' }}>
          {COVENANT.label}
        </div>
        {f >= HANDOFF && (
          <div style={{ position: 'absolute', left: HERO_SLOT.x, top: HERO_SLOT.y, transform: 'translate(-50%, -50%)', fontSize: HERO_SLOT.size, lineHeight: 1, fontWeight: 650, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
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
          const isCrit = e.tone === 'crit';
          const hl = isCrit ? watch : 0;
          const style: CSSProperties = {
            position: 'absolute', left: card.x, top: card.y, width: card.w, height: CARD_H, background: 'var(--surface)', borderRadius: 14, padding: '16px 18px',
            border: isCrit ? '1.5px solid var(--crit)' : '1px solid var(--line)',
            boxShadow: isCrit ? `0 18px 48px rgba(28,25,54,.10), 0 0 0 ${8 * hl}px rgba(194, 70, 45, ${0.14 * hl})` : '0 12px 32px rgba(28,25,54,.08)',
            opacity: on, transform: `translateY(${(1 - on) * (card.side === 'up' ? 18 : -18)}px) scale(${isCrit ? mix(1, 1.04, hl) : 1})`, transformOrigin: '20% 0',
          };
          return (
            <div key={e.id} style={style}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: isCrit ? 'var(--crit-soft)' : 'var(--brand-soft)', color: isCrit ? 'var(--crit)' : 'var(--brand)' }}>
                  <Icon name={card.icon} size={17} />
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{date(e.date)}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {isCrit ? <Badge tone="b-crit" dot scale={1.1}>{TIMELINE.stepTag}</Badge> : <span className="tag" style={{ fontSize: 13, padding: '2px 9px' }}>{e.kind}</span>}
                </span>
              </div>
              <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
              <div style={{ marginTop: 4, fontSize: 15, color: isCrit ? 'var(--crit)' : 'var(--ink-3)', fontWeight: isCrit ? 600 : 400, whiteSpace: 'nowrap' }}>
                {e.sub}
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
