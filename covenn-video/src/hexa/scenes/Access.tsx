import type { CSSProperties, ReactNode } from 'react';
import { Briefcase, Landmark, LineChart } from 'lucide-react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, mix, p } from '../../film/anim';
import { CAPITAL, COVENANT, DOSSIER, GROUP, PROVIDERS } from '../data';
import { Mark } from '../kit';
import { COMPANY } from './CapitalStructure';

/**
 * S9 — « From managing capital to accessing it. » (vision, 0:23.5–0:27)
 * La fenêtre de S8 devient l'entreprise : ses données structurées et son besoin de financement. Covenn au centre ;
 * de l'autre côté, trois familles de financeurs (sans nom, sans logo, sans offre). Les connexions se construisent
 * des données vers les financeurs : Covenn rend l'entreprise prête à accéder au capital, il ne prête pas.
 */
export const HUB = { x: 960, y: 560 } as const;
export const S9 = { born: 704, out: [786, 806] as const } as const;

const CARD = { w: 470, h: 388 };
const CARD_RECT = { x: COMPANY.x - CARD.w / 2, y: COMPANY.y - CARD.h / 2 };
const MARK_SIZE = 128;
const PROV = { x: 1320, w: 450, h: 118, ys: [322, 560, 798] as const };
const ICONS: Record<string, ReactNode> = {
  banks: <Landmark size={26} strokeWidth={1.75} />,
  private: <Briefcase size={26} strokeWidth={1.75} />,
  markets: <LineChart size={26} strokeWidth={1.75} />,
};

/** Lignes de données du nœud « entreprise » : d'où partent les connexions vers Covenn. */
const ROWS = [
  { key: 'debt', label: 'Debt', value: CAPITAL.categories[0]?.amount ?? '' },
  { key: 'equity', label: 'Equity', value: CAPITAL.categories[1]?.amount ?? '' },
  { key: 'other', label: 'Other instruments', value: CAPITAL.categories[2]?.amount ?? '' },
  { key: 'lev', label: COVENANT.label, value: COVENANT.value },
];
const ROW_Y0 = CARD_RECT.y + 92;
const ROW_H = 40;
const NEED_Y = ROW_Y0 + ROWS.length * ROW_H + 14;
/** Points de départ (bord droit de la carte) : trois lignes de données et le besoin de financement. */
const SOURCES = [ROW_Y0 + ROW_H * 0.5, ROW_Y0 + ROW_H * 2.5, NEED_Y + 26];

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
const IN_PATHS = SOURCES.map((y) => curve(CARD_RECT.x + CARD.w, y, HUB.x - MARK_SIZE / 2 - 6, HUB.y));
const OUT_PATHS = PROV.ys.map((y) => curve(HUB.x + MARK_SIZE / 2 + 6, HUB.y, PROV.x, y));

export function Access({ f }: { f: number }) {
  if (f < S9.born || f > S9.out[1] + 2) return null;
  const out = p(f, S9.out[0], S9.out[1], E.in);
  const cardIn = p(f, 704, 716, E.out);
  const hub = p(f, 710, 722, E.out);
  // Léger recul de la caméra : le réseau se découvre.
  const zoom = mix(1.05, 1, p(f, 706, 780, E.soft));
  const glow = 0.5 + 0.5 * Math.sin((f - 706) / 7);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, transformOrigin: `${HUB.x}px ${HUB.y}px`, transform: `scale(${zoom})` }}>
      {/* Connexions : des données vers Covenn, puis de Covenn vers les financeurs */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - out }}>
        {IN_PATHS.map((d, i) => {
          const t = p(f, 718 + i * 4, 734 + i * 4, E.inOut);
          if (t <= 0) return null;
          const need = i === SOURCES.length - 1;
          return <path key={`in-${i}`} d={d} pathLength={1} fill="none" stroke={need ? 'var(--indigo-500)' : 'var(--indigo-300)'} strokeWidth={need ? 3 : 2.2} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - t} />;
        })}
        {OUT_PATHS.map((d, i) => {
          const t = p(f, 738 + i * 8, 756 + i * 8, E.inOut);
          if (t <= 0) return null;
          return <path key={`out-${i}`} d={d} pathLength={1} fill="none" stroke="var(--aurora-mauve)" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - t} />;
        })}
      </svg>

      {/* Impulsions : le dossier structuré circule le long des connexions (aucun montant ne « circule ») */}
      {[...IN_PATHS.map((d, i) => ({ d, i, start: 740 + i * 3, period: 22, color: 'var(--indigo-600)' })),
        ...OUT_PATHS.map((d, i) => ({ d, i: i + 3, start: 760 + i * 4, period: 24, color: 'var(--aurora-mauve)' }))].map((pulse) => {
        if (f < pulse.start || f > S9.out[0]) return null;
        const cycle = ((f - pulse.start) % pulse.period) / pulse.period;
        return (
          <div key={`pulse-${pulse.i}`} style={{
            position: 'absolute', left: 0, top: 0, width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: '50%', background: pulse.color,
            boxShadow: '0 0 0 5px rgba(175, 163, 230, 0.25)', offsetPath: `path('${pulse.d}')`, offsetDistance: `${(cycle * 100).toFixed(2)}%`, offsetRotate: '0deg',
            opacity: Math.sin(Math.PI * cycle) * (1 - out),
          } as CSSProperties} />
        );
      })}

      {/* L'entreprise : données structurées et besoin de financement */}
      {cardIn > 0.001 && (
        <div style={{
          position: 'absolute', left: CARD_RECT.x, top: CARD_RECT.y, width: CARD.w, height: CARD.h, background: 'var(--surface)', borderRadius: 18,
          border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(28,26,43,.12)', opacity: cardIn * (1 - out), transform: `scale(${mix(0.94, 1, cardIn)})`, padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name="building" size={22} /></span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 23, fontWeight: 750 }}>{GROUP.name}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-500)' }}>Structured financial data</span>
            </span>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.key} style={{ position: 'absolute', left: 24, right: 24, top: 92 + i * ROW_H, height: ROW_H, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 16 }}>
              <span style={{ flex: 1, color: 'var(--ink-500)' }}>{r.label}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
            </div>
          ))}
          <div style={{
            position: 'absolute', left: 14, right: 14, top: NEED_Y - CARD_RECT.y, height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 12,
            background: 'var(--indigo-50)', border: '1px solid var(--indigo-200)',
          }}>
            <span style={{ flex: 1, fontSize: 17, fontWeight: 650, color: 'var(--indigo-800)' }}>Financing requirement</span>
            <span style={{ fontSize: 24, fontWeight: 750, color: 'var(--indigo-800)', fontVariantNumeric: 'tabular-nums' }}>{DOSSIER.need}</span>
          </div>
          <div style={{ position: 'absolute', left: 24, bottom: 20, display: 'inline-flex', alignItems: 'center', gap: 7, height: 30, padding: '0 12px', borderRadius: 999, background: 'var(--ok-bg)', color: 'var(--ok)', fontSize: 14, fontWeight: 700 }}>
            <Icon name="check" size={14} />{DOSSIER.title} · ready for review
          </div>
        </div>
      )}

      {/* Les financeurs : trois familles, sans nom ni logo */}
      {PROVIDERS.map((pv, i) => {
        const o = p(f, 744 + i * 8, 756 + i * 8, E.out);
        if (o <= 0.001) return null;
        const y = PROV.ys[i] ?? HUB.y;
        return (
          <div key={pv.key} style={{ position: 'absolute', left: PROV.x, top: y - PROV.h / 2, width: PROV.w, height: PROV.h, opacity: o * (1 - out), transform: `translateX(${(1 - o) * 30}px)` }}>
            {/* D'autres financeurs de la même famille, en retrait */}
            {[0, 1].map((k) => (
              <div key={k} style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--line)', transform: `translate(${(k + 1) * 14}px, ${(k + 1) * -10}px)`, opacity: 0.55 - k * 0.2 }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'var(--surface)', border: '1.5px solid var(--aurora-mauve)', boxShadow: '0 18px 44px rgba(74,51,179,.12)', display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px' }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 15, background: 'linear-gradient(135deg, rgba(245,185,194,.35), rgba(203,187,223,.45))', color: 'var(--indigo-700)' }}>{ICONS[pv.key]}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 27, fontWeight: 750, letterSpacing: '-0.015em' }}>{pv.label}</span>
                <span style={{ fontSize: 16, color: 'var(--ink-500)' }}>{pv.detail}</span>
              </span>
            </div>
          </div>
        );
      })}

      {/* Covenn, au centre */}
      {hub > 0.001 && (
        <div style={{ position: 'absolute', left: HUB.x, top: HUB.y, transform: `translate(-50%, -50%) scale(${mix(0.55, 1, hub)})`, opacity: hub }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: MARK_SIZE * 1.9, height: MARK_SIZE * 1.9, marginLeft: -MARK_SIZE * 0.95, marginTop: -MARK_SIZE * 0.95, borderRadius: '50%', border: '1.5px solid var(--indigo-200)', opacity: 0.55 * (1 - out) }} />
          <Mark size={MARK_SIZE} glow={0.45 + 0.4 * glow * (1 - out)} />
          <div style={{ position: 'absolute', left: '50%', top: MARK_SIZE + 26, transform: 'translateX(-50%)', fontSize: 24, fontWeight: 750, color: 'var(--indigo-700)', letterSpacing: '-0.02em', opacity: 1 - out }}>Covenn</div>
        </div>
      )}
    </div>
  );
}
