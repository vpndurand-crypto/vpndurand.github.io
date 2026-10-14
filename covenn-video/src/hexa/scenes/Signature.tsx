import { E, life, mix, p } from '../../film/anim';
import { Mark } from '../kit';
import { HUB } from './Access';

/**
 * S10 — La révélation finale (0:27–0:30) : l'aurore rose-violet du pitch deck s'ouvre depuis Covenn, au centre du réseau ;
 * la marque se pose sur l'impact final de la musique (27,0 s), puis « Covenn », la phrase de positionnement du deck
 * et, un peu plus discrète, « Starting with debt. ». Rien d'autre : ni bouton, ni adresse, ni appel à l'action.
 */
const END_MARK = { x: 236, y: 430, size: 156 };
export const SIGN = { aurora: [792, 814] as const, land: 810 } as const;

export function Signature({ f }: { f: number }) {
  if (f < SIGN.aurora[0]) return null;
  const C = HUB;
  const a = p(f, SIGN.aurora[0], SIGN.aurora[1], E.inOut);
  const radius = mix(40, 2300, a);
  const m = p(f, SIGN.aurora[0] + 2, SIGN.land, E.inOut);
  const markX = mix(C.x, END_MARK.x, m);
  const markY = mix(C.y, END_MARK.y, m);
  const markSize = mix(128, END_MARK.size, m);
  const landBump = Math.sin(Math.PI * p(f, SIGN.land, SIGN.land + 10, E.linear)) * 0.05;
  const word = p(f, SIGN.land - 4, SIGN.land + 10, E.out);
  const line1 = life(f, SIGN.land + 8, SIGN.land + 22);
  const line2 = life(f, SIGN.land + 22, SIGN.land + 36);
  const settle = p(f, SIGN.land, 899, E.out);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      {/* L'aurore, révélée en cercle depuis Covenn */}
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--aurora)', clipPath: `circle(${radius}px at ${C.x}px ${C.y}px)`,
        transform: `scale(${1.05 - 0.05 * settle})`,
      }} />

      {/* La marque */}
      <div style={{ position: 'absolute', left: markX - markSize / 2, top: markY - markSize / 2, transform: `scale(${1 + landBump})` }}>
        <Mark size={markSize} glow={0.35 * (1 - m)} style={{ background: `rgba(255, 255, 255, ${mix(1, 0.55, m)})`, border: `3px solid ${m > 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'var(--indigo-200)'}` }} />
      </div>

      <span style={{
        position: 'absolute', left: END_MARK.x + END_MARK.size / 2 + 46, top: END_MARK.y - 124, fontSize: 248, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff',
        textShadow: '0 12px 50px rgba(74, 51, 179, 0.16)', opacity: word, transform: `translateX(${(1 - word) * -32}px)`, filter: word < 0.999 ? `blur(${(1 - word) * 8}px)` : undefined,
      }}>
        Covenn
      </span>
      <div style={{
        position: 'absolute', left: 166, top: 594, fontSize: 66, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', opacity: line1,
        transform: `translateY(${(1 - line1) * 22}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.18)', whiteSpace: 'nowrap',
      }}>
        The operating system for corporate capital.
      </div>
      <div style={{
        position: 'absolute', left: 168, top: 690, fontSize: 46, fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255, 255, 255, 0.86)', opacity: line2,
        transform: `translateY(${(1 - line2) * 18}px)`, textShadow: '0 6px 26px rgba(74, 51, 179, 0.14)', whiteSpace: 'nowrap',
      }}>
        Starting with debt.
      </div>
    </div>
  );
}
