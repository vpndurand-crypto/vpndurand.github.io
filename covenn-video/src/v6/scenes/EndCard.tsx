/**
 * S7 — La marque (0:26.5–0:30). L'aurore rose-violet de la marque s'ouvre depuis la proposition retenue pour négociation ;
 * le carré Covenn se pose sur l'impact final de la musique (26,5 s), puis « Covenn », la phrase de la page de vision de la
 * bêta (« The operating system for global corporate capital ») et « Starting with debt. ». Tenue jusqu'à 30,0 s, sans fondu.
 */
import { E, life, mix, p } from '../../film/anim';
import { Mark } from '../../capos/kit';
import { VISION_TITLE } from '../data';
import { BRAND_LAND, DURATION } from '../timing';

const END_MARK = { x: 236, y: 430, size: 156 };
export const AURORA = [780, 800] as const;

export function EndCard({ f, from }: { f: number; from: { x: number; y: number } }) {
  if (f < AURORA[0]) return null;
  const a = p(f, AURORA[0], AURORA[1], E.inOut);
  const radius = mix(30, 2400, a);
  const m = p(f, AURORA[0] + 2, BRAND_LAND, E.inOut);
  const markX = mix(from.x, END_MARK.x, m);
  const markY = mix(from.y, END_MARK.y, m);
  const markSize = mix(56, END_MARK.size, m);
  const landBump = Math.sin(Math.PI * p(f, BRAND_LAND, BRAND_LAND + 10, E.linear)) * 0.06;
  const word = p(f, BRAND_LAND - 6, BRAND_LAND + 8, E.out);
  const line1 = life(f, BRAND_LAND + 6, BRAND_LAND + 18);
  const line2 = life(f, BRAND_LAND + 14, BRAND_LAND + 26);
  const settle = p(f, BRAND_LAND, DURATION - 1, E.out);
  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--aurora)', clipPath: `circle(${radius}px at ${from.x}px ${from.y}px)`, transform: `scale(${1.05 - 0.05 * settle})` }} />
      <div style={{ position: 'absolute', left: markX - markSize / 2, top: markY - markSize / 2, transform: `scale(${1 + landBump})`, opacity: p(f, AURORA[0], AURORA[0] + 4) }}>
        <Mark size={markSize} glow={0.35 * (1 - m)} style={{ outline: `${3 * m}px solid rgba(255, 255, 255, ${0.85 * m})` }} />
      </div>
      <span style={{
        position: 'absolute', left: END_MARK.x + END_MARK.size / 2 + 46, top: END_MARK.y - 124, fontSize: 248, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff',
        textShadow: '0 12px 50px rgba(74, 51, 179, 0.16)', opacity: word, transform: `translateX(${(1 - word) * -32}px)`, filter: word < 0.999 ? `blur(${(1 - word) * 8}px)` : undefined,
      }}>
        Covenn
      </span>
      <div style={{
        position: 'absolute', left: 166, top: 594, fontSize: 60, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', opacity: line1, whiteSpace: 'nowrap',
        transform: `translateY(${(1 - line1) * 22}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.2)',
      }}>
        {VISION_TITLE}.
      </div>
      <div style={{
        position: 'absolute', left: 168, top: 682, fontSize: 46, fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255, 255, 255, 0.88)', opacity: line2, whiteSpace: 'nowrap',
        transform: `translateY(${(1 - line2) * 18}px)`, textShadow: '0 6px 26px rgba(74, 51, 179, 0.16)',
      }}>
        Starting with debt.
      </div>
    </div>
  );
}
