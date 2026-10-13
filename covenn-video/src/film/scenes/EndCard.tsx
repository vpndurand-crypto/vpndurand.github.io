import { E, life, p } from '../anim';
import { END_MARK } from './Vision';

/** Signature : l'aurore du pitch deck, le logo de la bêta, la phrase clé et l'adresse. */
export function EndCard({ f }: { f: number }) {
  if (f < 796) return null;
  const aurora = p(f, 798, 826, E.inOut);
  const mark = f >= 822 ? 1 : 0; // relais de la marque arrivée depuis la séquence « vision »
  const word = life(f, 820, 842);
  const line = life(f, 834, 852);
  const site = life(f, 848, 864);
  const mention = life(f, 852, 868);
  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: aurora, background: 'var(--aurora)', transform: `scale(${1.06 - 0.06 * p(f, 798, 899, E.out)})` }} />
      <span style={{
        position: 'absolute', left: END_MARK.x - END_MARK.size / 2, top: END_MARK.y - END_MARK.size / 2, width: END_MARK.size, height: END_MARK.size, borderRadius: 44,
        display: 'grid', placeItems: 'center', color: 'var(--indigo-700)', opacity: mark,
        background: 'rgba(255, 255, 255, 0.55)', border: '3px solid rgba(255, 255, 255, 0.85)', boxShadow: '0 20px 60px rgba(74, 51, 179, 0.18)',
      }}>
        <svg viewBox="0 0 32 32" width={92} height={92} aria-hidden="true">
          <path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
        </svg>
      </span>
      <span style={{
        position: 'absolute', left: END_MARK.x + END_MARK.size / 2 + 44, top: END_MARK.y - 118, fontSize: 236, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff',
        textShadow: '0 12px 50px rgba(74, 51, 179, 0.16)', opacity: word, transform: `translateX(${(1 - word) * -28}px)`, filter: word < 0.999 ? `blur(${(1 - word) * 6}px)` : undefined,
      }}>
        Covenn
      </span>
      <div style={{ position: 'absolute', left: 156, top: 604, fontSize: 52, fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', opacity: line, transform: `translateY(${(1 - line) * 20}px)`, textShadow: '0 6px 30px rgba(74, 51, 179, 0.18)', whiteSpace: 'nowrap' }}>
        L’intelligence au cœur de votre stratégie financière.
      </div>
      <div style={{ position: 'absolute', left: 158, top: 692, fontSize: 30, fontWeight: 600, letterSpacing: '0.01em', color: 'rgba(255, 255, 255, 0.92)', opacity: site, transform: `translateY(${(1 - site) * 14}px)` }}>
        covenn.io
      </div>
      <div style={{ position: 'absolute', left: 156, bottom: 48, fontSize: 18, fontWeight: 500, color: 'rgba(255, 255, 255, 0.86)', opacity: mention }}>
        Données fictives — environnement de démonstration
      </div>
    </div>
  );
}
