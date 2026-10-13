import { E, life, mix, p } from '../../film/anim';
import { Mark } from '../kit';
import { NET } from './networkLayout';

/**
 * S9 — La signature : l'aurore rose-violet du pitch deck s'ouvre depuis le centre du réseau, la marque y prend sa place,
 * puis « Covenn », la signature du deck et la phrase finale.
 */
const END_MARK = { x: 225, y: 427, size: 150 };
export const SIGN = { aurora: [800, 830] as const, mark: [804, 830] as const };

export function Signature({ f }: { f: number }) {
  if (f < SIGN.aurora[0]) return null;
  const C = NET.center;
  const a = p(f, SIGN.aurora[0], SIGN.aurora[1], E.inOut);
  const radius = mix(40, 2300, a);
  const m = p(f, SIGN.mark[0], SIGN.mark[1], E.inOut);
  const markX = mix(C.x, END_MARK.x, m);
  const markY = mix(C.y, END_MARK.y, m);
  const markSize = mix(116, END_MARK.size, m);
  const word = life(f, 822, 842);
  const sig = life(f, 834, 850);
  const phrase = life(f, 848, 864);
  const site = life(f, 856, 868);
  const mention = life(f, 860, 874);
  const settle = p(f, 830, 899, E.out);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      {/* L'aurore, révélée en cercle depuis le centre du réseau */}
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--aurora)', clipPath: `circle(${radius}px at ${C.x}px ${C.y}px)`,
        transform: `scale(${1.05 - 0.05 * settle})`,
      }} />

      {/* La marque */}
      <div style={{ position: 'absolute', left: markX - markSize / 2, top: markY - markSize / 2 }}>
        <Mark size={markSize} glow={0.35 * (1 - m)} style={{ background: `rgba(255, 255, 255, ${mix(1, 0.55, m)})`, border: `3px solid ${m > 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'var(--indigo-200)'}` }} />
      </div>

      <span style={{
        position: 'absolute', left: END_MARK.x + END_MARK.size / 2 + 44, top: END_MARK.y - 118, fontSize: 236, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff',
        textShadow: '0 12px 50px rgba(74, 51, 179, 0.16)', opacity: word, transform: `translateX(${(1 - word) * -28}px)`, filter: word < 0.999 ? `blur(${(1 - word) * 6}px)` : undefined,
      }}>
        Covenn
      </span>
      <div style={{ position: 'absolute', left: 158, top: 576, fontSize: 60, fontWeight: 650, letterSpacing: '-0.025em', color: '#fff', opacity: sig, transform: `translateY(${(1 - sig) * 20}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.18)', whiteSpace: 'nowrap' }}>
        Le copilote IA du haut de bilan.
      </div>
      <div style={{ position: 'absolute', left: 160, top: 666, fontSize: 38, fontWeight: 500, letterSpacing: '-0.01em', color: 'rgba(255, 255, 255, 0.94)', opacity: phrase, transform: `translateY(${(1 - phrase) * 16}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.16)', whiteSpace: 'nowrap' }}>
        L’intelligence au cœur de votre stratégie financière.
      </div>
      <div style={{ position: 'absolute', left: 160, top: 748, fontSize: 30, fontWeight: 650, letterSpacing: '0.01em', color: '#fff', opacity: site, transform: `translateY(${(1 - site) * 12}px)` }}>
        covenn.io
      </div>
      <div style={{ position: 'absolute', left: 160, bottom: 48, fontSize: 18, fontWeight: 500, color: 'rgba(255, 255, 255, 0.88)', opacity: mention }}>
        Projection produit — certaines fonctionnalités présentées sont en développement · données fictives
      </div>
    </div>
  );
}
