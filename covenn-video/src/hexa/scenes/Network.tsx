import type { ReactNode } from 'react';
import { Handshake } from 'lucide-react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, life, mix, p } from '../../film/anim';
import { Mark } from '../kit';
import { S7 } from './Dossier';
import { NET, R1, R2, R3, RING1, angle1, netMotion, netPos } from './networkLayout';

/**
 * S8 — « Bien plus qu'un outil de dette. » → « Le futur du haut de bilan. » (vision)
 * Les blocs du dossier deviennent les nœuds d'un réseau autour de Covenn : filiales, données, instruments financiers,
 * échéances, covenants, scénarios et partenaires financiers ; puis le réseau s'étend, sans globe ni carte.
 */
const C = NET.center;
const COUNTRIES = ['FR', 'ES', 'DE', 'US'];

/** Petit générateur déterministe (positions « organiques » mais identiques à chaque rendu). */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const RING2 = Array.from({ length: 21 }, (_, i) => ({ a: -Math.PI / 2 + (i * 2 * Math.PI) / 21 + (rand(i) - 0.5) * 0.18, r: 0.9 + rand(i + 40) * 0.2, i }));
const RING3 = Array.from({ length: 46 }, (_, i) => ({ a: (i * 2 * Math.PI) / 46 + (rand(i + 90) - 0.5) * 0.12, r: 0.86 + rand(i + 140) * 0.3, i }));

export function Network({ f }: { f: number }) {
  if (f < S7.out[0] - 2 || f > NET.collapse[1] + 2) return null;
  const { collapse } = netMotion(f);
  const pos = (a: number, rx: number, ry: number, k = 1) => netPos(f, a, rx, ry, k);
  const r1 = RING1.map((n, i) => ({ ...n, ...pos(angle1(i), R1.rx, R1.ry), i }));
  const nearest1 = (x: number, y: number) => r1.reduce((b, q) => (Math.hypot(q.x - x, (q.y - y) * 1.6) < Math.hypot(b.x - x, (b.y - y) * 1.6) ? q : b), r1[0] ?? { x: C.x, y: C.y, i: 0 });
  const r2 = RING2.map((n) => ({ ...n, ...pos(n.a, R2.rx, R2.ry, n.r) }));
  const nearest2 = (x: number, y: number) => r2.reduce((b, q) => (Math.hypot(q.x - x, q.y - y) < Math.hypot(b.x - x, b.y - y) ? q : b), r2[0] ?? { x: C.x, y: C.y, i: 0 });
  const r3 = RING3.map((n) => ({ ...n, ...pos(n.a, R3.rx, R3.ry, n.r) }));

  const hub = p(f, 704, 712, E.out);
  const lines1 = (i: number) => p(f, 712 + i * 2, 728 + i * 2, E.inOut);
  const pop2 = (i: number) => p(f, 728 + i * 1.2, 744 + i * 1.2, E.out);
  const pop3 = (i: number) => p(f, 746 + (i % 23) * 1.4, 770 + (i % 23) * 1.4, E.out);
  const fade = 1 - collapse;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: life(f, 696, 716, 808, 816), background: 'radial-gradient(1300px 820px at 50% 62%, rgba(230,226,248,0.75) 0%, rgba(243,241,252,0.55) 46%, rgba(247,246,251,0) 100%)' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: fade }}>
        {/* Anneau 3 : l'étendue (au-delà des frontières), très léger */}
        {r3.map((n) => {
          const to = nearest2(n.x, n.y);
          const o = pop3(n.i) * (0.35 + 0.4 * rand(n.i + 7));
          return (
            <g key={`r3-${n.i}`} opacity={o}>
              <line x1={to.x} y1={to.y} x2={mix(to.x, n.x, pop3(n.i))} y2={mix(to.y, n.y, pop3(n.i))} stroke="var(--indigo-200)" strokeWidth={1} />
              <circle cx={n.x} cy={n.y} r={3 + 2 * rand(n.i + 3)} fill={n.i % 3 === 0 ? 'var(--aurora-mauve)' : 'var(--indigo-300)'} />
            </g>
          );
        })}
        {/* Anneau 2 */}
        {r2.map((n) => {
          const to = nearest1(n.x, n.y);
          const t = pop2(n.i);
          return (
            <g key={`r2-${n.i}`} opacity={t}>
              <line x1={to.x} y1={to.y} x2={mix(to.x, n.x, t)} y2={mix(to.y, n.y, t)} stroke="var(--indigo-200)" strokeWidth={1.6} />
              <circle cx={n.x} cy={n.y} r={8} fill={n.i % 4 === 1 ? 'var(--aurora-mauve)' : n.i % 4 === 3 ? 'var(--aurora-sky)' : 'var(--indigo-400)'} stroke="#fff" strokeWidth={3} />
            </g>
          );
        })}
        {/* Anneau 1 : liens au centre */}
        {r1.map((n) => (
          <line key={`l1-${n.key}`} x1={C.x} y1={C.y} x2={mix(C.x, n.x, lines1(n.i))} y2={mix(C.y, n.y, lines1(n.i))} stroke="var(--indigo-300)" strokeWidth={2.4} strokeLinecap="round" opacity={lines1(n.i) > 0 ? 1 : 0} />
        ))}
      </svg>

      {/* Codes pays autour des filiales (anneau 2, près du nœud « Filiales ») */}
      {COUNTRIES.map((code, j) => {
        const n = r2[(r2.length - 2 + j) % r2.length];
        if (!n) return null;
        const t = pop2(n.i);
        return (
          <div key={code} style={{
            position: 'absolute', left: n.x, top: n.y, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, t)})`, opacity: t * fade,
            background: '#fff', border: '1px solid var(--indigo-200)', borderRadius: 8, padding: '3px 8px', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--indigo-700)',
          }}>
            {code}
          </div>
        );
      })}

      {/* Anneau 1 : nœuds nommés (les blocs du dossier qui se sont posés) */}
      {r1.map((n) => {
        const born = n.block ? p(f, NET.born[0], NET.born[1], E.out) : p(f, 714, 726, E.out);
        return (
          <NodePill key={n.key} x={n.x} y={n.y} o={born * fade} s={mix(0.8, 1, born)}
            icon={n.icon === 'handshake' ? <Handshake size={20} strokeWidth={1.75} /> : <Icon name={n.icon} size={20} />} label={n.label} />
        );
      })}

      {/* Covenn, au centre */}
      {hub > 0.001 && f < NET.collapse[1] + 1 && (
        <div style={{ position: 'absolute', left: C.x, top: C.y, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, hub) * mix(1, 1.12, collapse)})` }}>
          <Mark size={104} glow={0.6 + 0.4 * Math.sin(f / 9)} />
        </div>
      )}
    </div>
  );
}

function NodePill({ x, y, o, s, icon, label }: { x: number; y: number; o: number; s: number; icon: ReactNode; label: string }) {
  if (o <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, opacity: o, display: 'inline-flex', alignItems: 'center', gap: 10,
      height: 52, padding: '0 20px 0 12px', borderRadius: 999, background: '#fff', border: '1.5px solid var(--indigo-200)', whiteSpace: 'nowrap',
      boxShadow: '0 14px 34px rgba(74,51,179,.14)', fontSize: 20, fontWeight: 650, color: 'var(--ink-900)',
    }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 999, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}>{icon}</span>
      {label}
    </div>
  );
}
