/**
 * Mention discrète mais lisible, en haut à droite (alignée sur la fenêtre) : ce qui est montré est-il la démonstration
 * de la bêta (données fictives), une vision (illustration conceptuelle), ou des conditions indicatives fictives ?
 */
import { E, life } from '../film/anim';
import { MENTIONS } from './timing';

/** État « In this demo » de la page de vision de la bêta, et nature des données à l'écran. */
const LABELS = {
  overview: 'In this demo · Fictional data',
  scenario: 'In this demo · Illustrative forecast',
  request: 'In this demo · Fictional data',
  terms: 'In this demo · Fictional providers, indicative terms',
} as const;

export function Mention({ f }: { f: number }) {
  const o = (r: readonly [number, number]) => life(f, r[0], r[0] + 8, r[1] - 6, r[1], E.inOut, E.inOut);
  const items = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => ({ key, label: LABELS[key], o: o(MENTIONS[key]) }));
  return (
    <>
      {items.map((it) => (it.o <= 0.001 ? null : (
        <div key={it.key} style={{
          position: 'absolute', right: 160, top: 74, display: 'inline-flex', alignItems: 'center', gap: 10, height: 36, padding: '0 15px 0 12px', borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--line)', fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(28,25,54,.06)', opacity: it.o,
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 0 3px var(--ok-soft)' }} />
          {it.label}
        </div>
      )))}
    </>
  );
}
