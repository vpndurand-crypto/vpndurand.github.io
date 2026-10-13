import { E, life, mix, p } from '../anim';

/**
 * S6 — La vision. Séquence abstraite, sans interface : un point central Covenn,
 * relié aujourd'hui à quelques entités (la dette), demain à tout un réseau (le haut de bilan).
 * Aucun libellé de fonctionnalité : la forme seule porte l'idée d'élargissement.
 */
export const VISION = { start: 690, end: 812 } as const;

/** Centre du réseau et position du logo de la signature (même marque, raccord par le mouvement). */
const CENTER = { x: 960, y: 702 };
export const END_MARK = { x: 225, y: 427, size: 150 };

const INNER = [-90, 30, 150].map((deg, i) => ({ a: (deg * Math.PI) / 180, i }));
const OUTER = Array.from({ length: 14 }, (_, i) => ({ a: ((-90 + i * (360 / 14) + 12) * Math.PI) / 180, i }));
const OUTER_TINTS = ['var(--indigo-500)', 'var(--indigo-300)', 'var(--aurora-mauve)', 'var(--indigo-400)', 'var(--aurora-sky)', 'var(--indigo-300)', 'var(--indigo-500)'];

export function Vision({ f }: { f: number }) {
  if (f < VISION.start || f > 830) return null;
  const bg = life(f, 690, 708, 800, 820);
  const l1 = life(f, 700, 716, 792, 806);
  const l2 = life(f, 744, 760, 792, 806);
  const today = p(f, 704, 732, E.out);
  const tomorrow = (i: number) => p(f, 748 + i * 1.6, 784 + i * 1.6, E.out);
  const net = 1 - p(f, 794, 808, E.in);
  const spin = (f - 700) * 0.035 * (Math.PI / 180);

  const rx = 430;
  const ry = 250;
  const inner = INNER.map(({ a }) => ({ x: CENTER.x + Math.cos(a + spin) * 150, y: CENTER.y + Math.sin(a + spin) * 150 * 0.82 }));
  const outer = OUTER.map(({ a, i }) => {
    const t = tomorrow(i);
    const k = mix(1.5, 1, t);
    return { x: CENTER.x + Math.cos(a - spin * 0.6) * rx * k, y: CENTER.y + Math.sin(a - spin * 0.6) * ry * k, t, tint: OUTER_TINTS[i % OUTER_TINTS.length] };
  });
  const nearest = (pt: { x: number; y: number }) => inner.reduce((best, q) => (Math.hypot(q.x - pt.x, q.y - pt.y) < Math.hypot(best.x - pt.x, best.y - pt.y) ? q : best), inner[0] ?? CENTER);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.15 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: bg, background: 'radial-gradient(1100px 700px at 50% 62%, rgba(230, 226, 248, 0.7) 0%, rgba(243, 241, 252, 0.55) 45%, rgba(247, 246, 251, 0.95) 100%), var(--canvas)' }} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 176, textAlign: 'center', fontSize: 74, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)', opacity: l1, transform: `translateY(${(1 - p(f, 700, 718, E.out)) * 26}px)` }}>
        Aujourd’hui, la dette.
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 266, textAlign: 'center', fontSize: 74, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--indigo-600)', opacity: l2, transform: `translateY(${(1 - p(f, 744, 762, E.out)) * 26}px)` }}>
        Demain, tout le haut de bilan.
      </div>

      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: net }}>
        {inner.map((pt, i) => {
          const d = Math.min(1, Math.max(0, (today - i * 0.12) / 0.76));
          return <line key={`i${i}`} x1={CENTER.x} y1={CENTER.y} x2={mix(CENTER.x, pt.x, d)} y2={mix(CENTER.y, pt.y, d)} stroke="var(--indigo-300)" strokeWidth={2.5} strokeLinecap="round" opacity={d > 0 ? 1 : 0} />;
        })}
        {outer.map((pt, i) => {
          const to = nearest(pt);
          return <line key={`o${i}`} x1={to.x} y1={to.y} x2={mix(to.x, pt.x, pt.t)} y2={mix(to.y, pt.y, pt.t)} stroke="var(--indigo-200)" strokeWidth={1.5} strokeLinecap="round" opacity={pt.t * 0.9} />;
        })}
        {outer.map((pt, i) => (
          <circle key={`on${i}`} cx={pt.x} cy={pt.y} r={8} fill={pt.tint} stroke="#fff" strokeWidth={3} opacity={pt.t} />
        ))}
        {inner.map((pt, i) => {
          const d = Math.min(1, Math.max(0, (today - i * 0.12) / 0.76));
          return <circle key={`in${i}`} cx={pt.x} cy={pt.y} r={mix(4, 13, d)} fill="var(--indigo-600)" stroke="#fff" strokeWidth={4} opacity={d} />;
        })}
      </svg>

    </div>
  );
}

/** La marque Covenn du centre du réseau ; elle glisse jusqu'au logo de la signature (raccord S6 → S7). */
export function VisionMark({ f }: { f: number }) {
  if (f < VISION.start || f > 830) return null;
  // La marque centrale glisse vers l'emplacement du logo de la signature.
  const m = p(f, 796, 822, E.inOut);
  const markX = mix(CENTER.x, END_MARK.x, m);
  const markY = mix(CENTER.y, END_MARK.y, m);
  const markSize = mix(96, END_MARK.size, m);
  const markO = p(f, 702, 718, E.out) * (1 - p(f, 822, 826, E.linear));

  return (
    <>
      {markO > 0.001 && (
        <span style={{
          position: 'absolute', left: markX - markSize / 2, top: markY - markSize / 2, width: markSize, height: markSize, borderRadius: markSize * 0.29,
          display: 'grid', placeItems: 'center', color: 'var(--indigo-700)', opacity: markO,
          background: m > 0 ? `rgba(255, 255, 255, ${mix(1, 0.55, m)})` : '#fff', border: `${mix(2, 3, m)}px solid ${m > 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'var(--indigo-200)'}`,
          boxShadow: '0 20px 60px rgba(74, 51, 179, 0.18)', transform: `scale(${mix(0.86, 1, p(f, 702, 718, E.out))})`,
        }}>
          <svg viewBox="0 0 32 32" width={markSize * 0.61} height={markSize * 0.61} aria-hidden="true">
            <path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
          </svg>
        </span>
      )}
    </>
  );
}
