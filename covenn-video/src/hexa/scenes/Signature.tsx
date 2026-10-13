import { E, life, mix, p } from '../../film/anim';
import { Mark } from '../kit';
import { NET } from './networkLayout';

/**
 * S9 — La signature, épurée : l'aurore rose-violet du pitch deck s'ouvre depuis le centre du réseau, la marque se pose
 * sur l'impact final de la musique (27,0 s), puis « Covenn » et « Le copilote IA du haut de bilan. ». covenn.io, très discret.
 */
const END_MARK = { x: 236, y: 452, size: 156 };
export const SIGN = { aurora: [794, 814] as const, land: 810 } as const;

export function Signature({ f }: { f: number }) {
  if (f < SIGN.aurora[0]) return null;
  const C = NET.center;
  const a = p(f, SIGN.aurora[0], SIGN.aurora[1], E.inOut);
  const radius = mix(40, 2300, a);
  const m = p(f, SIGN.aurora[0] + 2, SIGN.land, E.inOut);
  const markX = mix(C.x, END_MARK.x, m);
  const markY = mix(C.y, END_MARK.y, m);
  const markSize = mix(116, END_MARK.size, m);
  const landBump = Math.sin(Math.PI * p(f, SIGN.land, SIGN.land + 10, E.linear)) * 0.05;
  const word = p(f, SIGN.land - 4, SIGN.land + 10, E.out);
  const sig = life(f, SIGN.land + 10, SIGN.land + 24);
  const site = life(f, 846, 862);
  const settle = p(f, SIGN.land, 899, E.out);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      {/* L'aurore, révélée en cercle depuis le centre du réseau */}
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
        position: 'absolute', left: 166, top: 616, fontSize: 64, fontWeight: 650, letterSpacing: '-0.025em', color: '#fff', opacity: sig,
        transform: `translateY(${(1 - sig) * 22}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.18)', whiteSpace: 'nowrap',
      }}>
        Le copilote IA du haut de bilan.
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 52, textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255, 255, 255, 0.78)', opacity: site }}>
        covenn.io
      </div>
    </div>
  );
}
