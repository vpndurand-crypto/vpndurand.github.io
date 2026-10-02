import { E, life, p } from '../anim';

/** Signature : l'aurore du pitch deck, le logo de la bêta, une seule phrase. */
export function EndCard({ f }: { f: number }) {
  if (f < 780) return null;
  const aurora = p(f, 784, 814, E.inOut);
  const logo = life(f, 806, 828);
  const line = life(f, 826, 846);
  const mention = life(f, 842, 860);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: aurora, lineHeight: 1.2 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--aurora)', transform: `scale(${1.06 - 0.06 * p(f, 784, 899, E.out)})` }} />
      <div style={{
        position: 'absolute', left: 150, top: 352, display: 'flex', alignItems: 'center', gap: 44,
        opacity: logo, transform: `translateY(${(1 - logo) * 26}px)`, filter: logo < 0.999 ? `blur(${(1 - logo) * 6}px)` : undefined,
      }}>
        <span style={{
          width: 150, height: 150, borderRadius: 44, display: 'grid', placeItems: 'center', color: 'var(--indigo-700)',
          background: 'rgba(255, 255, 255, 0.55)', border: '3px solid rgba(255, 255, 255, 0.85)', boxShadow: '0 20px 60px rgba(74, 51, 179, 0.18)',
        }}>
          <svg viewBox="0 0 32 32" width={92} height={92} aria-hidden="true">
            <path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ fontSize: 236, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', textShadow: '0 12px 50px rgba(74, 51, 179, 0.16)' }}>Covenn</span>
      </div>
      <div style={{ position: 'absolute', left: 156, top: 600, fontSize: 58, fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', opacity: line, transform: `translateY(${(1 - line) * 20}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.18)' }}>
        La source de vérité de votre dette.
      </div>
      <div style={{ position: 'absolute', left: 156, bottom: 48, fontSize: 18, fontWeight: 500, color: 'rgba(255, 255, 255, 0.86)', opacity: mention }}>
        Données fictives — environnement de démonstration
      </div>
    </div>
  );
}
