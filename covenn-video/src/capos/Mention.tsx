import { E, life } from '../film/anim';
import { MENTIONS } from './timing';

/**
 * Mention discrète mais lisible, en bas à gauche : les écrans sont ceux de la démonstration interactive de la bêta, sur des
 * données fictives (sa propre étiquette) ; le calcul du covenant est signalé comme calcul réel de son moteur ; l'accès au
 * capital (S9) est notre vision, une capacité future.
 */
export function Mention({ f }: { f: number }) {
  const shown = life(f, MENTIONS.product[0], MENTIONS.product[0] + 12, MENTIONS.vision[1] - 10, MENTIONS.vision[1]);
  if (shown <= 0.001) return null;
  const beta = life(f, MENTIONS.beta[0], MENTIONS.beta[0] + 8, MENTIONS.beta[1] - 8, MENTIONS.beta[1], E.inOut, E.inOut);
  const vision = life(f, MENTIONS.vision[0], MENTIONS.vision[0] + 10, Infinity, Infinity, E.inOut);
  const product = Math.max(0, 1 - beta - vision);
  const dot = vision > 0.5 ? 'vision' : beta > 0.5 ? 'beta' : 'product';
  return (
    <div style={{
      position: 'absolute', left: 120, bottom: 40, display: 'inline-flex', alignItems: 'center', gap: 10, height: 36, padding: '0 16px 0 12px',
      borderRadius: 999, background: 'rgba(255, 255, 255, 0.85)', border: '1px solid var(--line)', fontSize: 17, fontWeight: 600,
      color: 'var(--ink-2)', opacity: shown, letterSpacing: '0.005em', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(28,25,54,.05)',
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: '50%', background: dot === 'vision' ? 'var(--c2)' : 'var(--brand)',
        boxShadow: dot === 'vision' ? '0 0 0 3px rgba(143, 128, 220, 0.22)' : '0 0 0 3px var(--brand-line)',
      }} />
      <span style={{ display: 'grid' }}>
        <span style={{ gridArea: '1 / 1', opacity: product }}>Interactive demo · Fictional data</span>
        <span style={{ gridArea: '1 / 1', opacity: beta }}>Covenn demo — real calculation on fictional data</span>
        <span style={{ gridArea: '1 / 1', opacity: vision }}>Our vision · Future capability</span>
      </span>
    </div>
  );
}
