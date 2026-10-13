import { E, life } from '../film/anim';

/**
 * Mention discrète mais lisible, en bas à gauche : ce qui relève de la vision produit est signalé comme projection ;
 * le calcul du covenant, qui existe dans la bêta, est signalé comme tel.
 */
export function Mention({ f }: { f: number }) {
  const shown = life(f, 98, 110, 800, 810);
  if (shown <= 0.001) return null;
  const beta = life(f, 298, 306, 380, 388, E.inOut, E.inOut);
  const isBeta = beta > 0.5;
  return (
    <div style={{
      position: 'absolute', left: 120, bottom: 40, display: 'inline-flex', alignItems: 'center', gap: 10, height: 36, padding: '0 16px 0 12px',
      borderRadius: 999, background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--line)', fontSize: 17, fontWeight: 600,
      color: 'var(--ink-500)', opacity: shown, letterSpacing: '0.005em', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(28,26,43,.05)',
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: '50%', background: isBeta ? 'var(--indigo-600)' : 'var(--aurora-mauve)',
        boxShadow: isBeta ? '0 0 0 3px var(--indigo-100)' : '0 0 0 3px rgba(198, 146, 182, 0.22)',
      }} />
      <span style={{ display: 'grid' }}>
        <span style={{ gridArea: '1 / 1', opacity: 1 - beta }}>Projection produit — Vision Covenn · données fictives</span>
        <span style={{ gridArea: '1 / 1', opacity: beta }}>Bêta Covenn · calcul réel sur données fictives</span>
      </span>
    </div>
  );
}
