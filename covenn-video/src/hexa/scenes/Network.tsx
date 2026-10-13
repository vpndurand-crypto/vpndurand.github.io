import type { ReactNode } from 'react';
import { Handshake } from 'lucide-react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, clamp, life, mix, p } from '../../film/anim';
import { Mark } from '../kit';
import { S7 } from './Dossier';
import { NET, NODES, ORBITS, netMotion, orbitPos } from './networkLayout';

/**
 * S8 — « De la donnée à la décision. » → « De la décision au financement. » (vision)
 * Les blocs du dossier deviennent des nœuds ; trois orbites s'allument l'une après l'autre autour de Covenn :
 * piloter la dette, piloter le haut de bilan, faciliter le financement. Pas de globe, pas d'interface fictive.
 */
const C = NET.center;
const COUNTRIES = [{ code: 'FR', angle: -172 }, { code: 'ES', angle: -158 }, { code: 'DE', angle: -122 }, { code: 'US', angle: -106 }];
const BANKS = [-38, 14, 30];

export function Network({ f }: { f: number }) {
  if (f < S7.out[0] - 2 || f > NET.collapse[1] + 2) return null;
  const { collapse } = netMotion(f);
  const fade = 1 - collapse;
  const draw = ORBITS.map((o) => p(f, o.draw[0], o.draw[1], E.inOut));
  const hub = p(f, 700, 710, E.out);
  const nodes = NODES.map((n) => ({ ...n, ...orbitPos(f, n.orbit, n.angle) }));
  const nearestInner = (n: (typeof nodes)[number]) => {
    const inner = nodes.filter((m) => m.orbit === n.orbit - 1);
    return inner.reduce((b, q) => (Math.hypot(q.x - n.x, q.y - n.y) < Math.hypot(b.x - n.x, b.y - n.y) ? q : b), inner[0] ?? { x: C.x, y: C.y });
  };
  const ellipse = (i: number) => {
    const o = ORBITS[i];
    if (!o) return null;
    const { zoom } = netMotion(f);
    const s = zoom * (1 - collapse);
    const len = Math.PI * (3 * (o.rx + o.ry) - Math.sqrt((3 * o.rx + o.ry) * (o.rx + 3 * o.ry))) * s;
    const t = draw[i] ?? 0;
    return (
      <ellipse key={o.key} cx={C.x} cy={C.y} rx={o.rx * s} ry={o.ry * s} fill="none" stroke={i === 2 ? 'var(--aurora-mauve)' : 'var(--indigo-300)'} strokeWidth={i === 0 ? 2.2 : 1.6}
        strokeDasharray={`${len * t} ${Math.max(0.001, len * (1 - t))}`} strokeDashoffset={len * 0.25} opacity={0.75 * fade} />
    );
  };
  // Les flux remontent des orbites extérieures vers Covenn (la donnée devient décision, puis financement).
  const flows = nodes.filter((n) => n.orbit > 0);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: life(f, 694, 712, 806, 814), background: 'radial-gradient(1300px 820px at 50% 60%, rgba(230,226,248,0.75) 0%, rgba(243,241,252,0.55) 46%, rgba(247,246,251,0) 100%)' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {ORBITS.map((_, i) => ellipse(i))}
        {/* Liens : centre → dette ; dette → haut de bilan ; haut de bilan → financement */}
        {nodes.map((n) => {
          const from = n.orbit === 0 ? C : nearestInner(n);
          const t = n.block ? Math.max(draw[n.orbit] ?? 0, p(f, NET.born[0] + 4, NET.born[1] + 6)) : draw[n.orbit] ?? 0;
          if (t <= 0) return null;
          return <line key={`l-${n.key}`} x1={from.x} y1={from.y} x2={mix(from.x, n.x, t)} y2={mix(from.y, n.y, t)} stroke="var(--indigo-300)" strokeWidth={n.orbit === 0 ? 2.4 : 1.8} strokeLinecap="round" opacity={0.9 * fade} />;
        })}
        {flows.map((n, i) => {
          const from = nearestInner(n);
          const cycle = ((f - 744 - i * 3) % 26) / 26;
          if (f < 744 || f > 788 || cycle < 0) return null;
          const x1 = mix(n.x, from.x, cycle);
          const y1 = mix(n.y, from.y, cycle);
          return <circle key={`fl-${n.key}`} cx={x1} cy={y1} r={4.5} fill="var(--indigo-600)" opacity={Math.sin(Math.PI * cycle) * 0.85 * fade} />;
        })}
        {/* Au-delà des frontières : pays et prêteurs, discrets, sur l'orbite du financement */}
        {BANKS.map((a, i) => {
          const pt = orbitPos(f, 2, a);
          const o = p(f, 750 + i * 3, 762 + i * 3) * fade;
          return <circle key={`b-${a}`} cx={pt.x} cy={pt.y} r={7} fill="var(--aurora-sky)" stroke="#fff" strokeWidth={3} opacity={o} />;
        })}
      </svg>

      {COUNTRIES.map((c, i) => {
        const pt = orbitPos(f, 2, c.angle);
        const o = p(f, 746 + i * 2, 758 + i * 2) * fade;
        if (o <= 0.001) return null;
        return (
          <div key={c.code} style={{
            position: 'absolute', left: pt.x, top: pt.y, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, o)})`, opacity: o,
            background: '#fff', border: '1px solid var(--indigo-200)', borderRadius: 8, padding: '3px 8px', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--indigo-700)',
          }}>
            {c.code}
          </div>
        );
      })}

      {/* Les nœuds nommés */}
      {nodes.map((n) => {
        const born = n.block ? p(f, NET.born[0], NET.born[1], E.out) : p(f, (ORBITS[n.orbit]?.draw[0] ?? 0) + 6, (ORBITS[n.orbit]?.draw[0] ?? 0) + 16, E.out);
        return (
          <NodePill key={n.key} x={n.x} y={n.y} o={born * fade} s={mix(0.82, 1, born)}
            icon={n.icon === 'handshake' ? <Handshake size={20} strokeWidth={1.75} /> : <Icon name={n.icon} size={20} />} label={n.label} tone={n.orbit} />
        );
      })}

      {/* Les trois ambitions du deck, dans l'ordre */}
      <Ambitions f={f} fade={fade} />

      {/* Covenn, au centre */}
      {hub > 0.001 && f < NET.collapse[1] + 1 && (
        <div style={{ position: 'absolute', left: C.x, top: C.y, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, hub) * mix(1, 1.12, collapse)})` }}>
          <Mark size={104} glow={0.55 + 0.45 * clamp(Math.sin(f / 8) * 0.5 + 0.5)} />
        </div>
      )}
    </div>
  );
}

function NodePill({ x, y, o, s, icon, label, tone }: { x: number; y: number; o: number; s: number; icon: ReactNode; label: string; tone: number }) {
  if (o <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, opacity: o, display: 'inline-flex', alignItems: 'center', gap: 10,
      height: 52, padding: '0 20px 0 12px', borderRadius: 999, background: '#fff', whiteSpace: 'nowrap',
      border: `1.5px solid ${tone === 2 ? 'var(--aurora-mauve)' : 'var(--indigo-200)'}`, boxShadow: '0 14px 34px rgba(74,51,179,.14)', fontSize: 20, fontWeight: 650, color: 'var(--ink-900)',
    }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 999, background: tone === 2 ? 'rgba(245,185,194,.35)' : 'var(--indigo-50)', color: 'var(--indigo-600)' }}>{icon}</span>
      {label}
    </div>
  );
}

/** Légende : 1 → 2 → 3, chaque ambition s'allume avec son orbite. */
function Ambitions({ f, fade }: { f: number; fade: number }) {
  const o = life(f, 704, 716, 786, 798);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 952, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, opacity: o * fade, lineHeight: 1.2 }}>
      {ORBITS.map((orb, i) => {
        const on = p(f, orb.draw[0], orb.draw[0] + 10, E.out);
        return (
          <span key={orb.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
            {i > 0 && <span style={{ fontSize: 24, color: 'var(--ink-400)', opacity: on }}>→</span>}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, height: 44, padding: '0 18px 0 8px', borderRadius: 999, opacity: mix(0.25, 1, on),
              background: on > 0.5 ? '#fff' : 'transparent', border: `1px solid ${on > 0.5 ? 'var(--indigo-200)' : 'transparent'}`, boxShadow: on > 0.5 ? '0 8px 22px rgba(74,51,179,.10)' : undefined,
            }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 999, background: i === 2 ? 'var(--aurora-mauve)' : 'var(--indigo-600)', color: '#fff', fontSize: 15, fontWeight: 800 }}>{i + 1}</span>
              <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>{orb.label}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
