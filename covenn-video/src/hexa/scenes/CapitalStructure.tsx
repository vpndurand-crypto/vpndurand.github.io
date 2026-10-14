import type { CSSProperties, ReactNode } from 'react';
import { ChartPie, Compass, Layers, Scale } from 'lucide-react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, mix, p, track, zoomTrack, type Key } from '../../film/anim';
import { CAPITAL, COVENANT, DOSSIER, GROUP, SIMULATION } from '../data';
import { ProjectionBadge, SHADOW, Sidebar, StatusBadge, Topbar, type NavEntry } from '../kit';
import { warp } from '../timing';
import { S7, breatheAt } from './Dossier';

/**
 * S8 — « Debt is just the starting point. » → « Capital structure is our ambition. » (vision, 0:20.5–0:23.5)
 * La caméra recule depuis le dossier de financement : il n'est qu'une carte, « Debt », d'un cockpit plus large où
 * apparaissent les fonds propres et les autres instruments, puis les modules Capital Structure, Scenarios, Financing Strategy.
 * Même logiciel (barre latérale, barre supérieure, cartes, jetons de la bêta) : le périmètre s'élargit, le produit reste le même.
 * Puis la fenêtre se replie à gauche : elle devient l'entreprise du réseau de financement (S9).
 */
export const CAP_UI = { w: 1600, h: 880, sidebar: 248 } as const;
const CARDS = { y: 178, w: 410, h: 231, xs: [280, 714, 1148] as const };
const ROW2 = { x: 280, y: 429, w: 1278, h: 180 };
const ROW3 = { y: 629, h: 222, w: 627, xs: [280, 931] as const };
const DEBT = { x: (CARDS.xs[0] + CARDS.w / 2), y: CARDS.y + CARDS.h / 2 };
const PKG = { x: S7.panel.x + S7.panel.w / 2, y: S7.panel.y + S7.panel.h / 2 };
/** Zoom de départ : la carte « Debt » remplit exactement le cadre du dossier de S7. */
const K0 = S7.panel.w / CARDS.w;

export const S8 = { pull: [604, 640] as const, toCompany: [692, 716] as const };
/** Où la fenêtre se pose dans le réseau (S9) : le nœud « entreprise ». */
export const COMPANY = { x: 380, y: 560, k: 0.3 } as const;

const K: Key[] = [[604, K0], [640, 0.98, E.inOut], [664, 0.99], [692, 1.08, E.inOut], [716, COMPANY.k, E.inOut]];
const CX: Key[] = [[604, DEBT.x], [640, 800, E.inOut], [664, 800], [692, 919, E.inOut], [716, 800, E.inOut]];
const CY: Key[] = [[604, DEBT.y], [640, 440, E.inOut], [664, 440], [692, 560, E.inOut], [716, 440, E.inOut]];
const FX: Key[] = [[604, PKG.x], [640, 960, E.inOut], [664, 960], [692, 960, E.inOut], [716, COMPANY.x, E.inOut]];
const FY: Key[] = [[604, PKG.y], [640, 640, E.inOut], [664, 640], [692, 670, E.inOut], [716, COMPANY.y, E.inOut]];

export function capCam(f: number) {
  return { k: zoomTrack(f, K), cx: track(f, CX), cy: track(f, CY), fx: track(f, FX), fy: track(f, FY) };
}
const toFrame = (cam: ReturnType<typeof capCam>, x: number, y: number) => ({ x: cam.fx + cam.k * (x - cam.cx), y: cam.fy + cam.k * (y - cam.cy) });

/** Le dossier (S7) suit la carte « Debt » pendant le recul, puis s'efface dans la carte. */
export function packageTransform(f: number): { transform?: string; opacity: number } {
  if (f < S8.pull[0]) return { opacity: 1 };
  const cam = capCam(f);
  const at = toFrame(cam, DEBT.x, DEBT.y);
  const s = cam.k / (K0 * breatheAt(warp(f)));
  return {
    transform: `translate(${(at.x - PKG.x).toFixed(2)}px, ${(at.y - PKG.y).toFixed(2)}px) scale(${s.toFixed(5)})`,
    opacity: 1 - p(f, 620, 632, E.inOut),
  };
}

const NAV_BASE: NavEntry[] = [
  { label: 'Group overview', icon: 'overview' },
  { label: 'Facilities', icon: 'financings' },
  { label: 'Covenants', icon: 'covenants' },
  { label: 'Maturities', icon: 'schedule' },
  { label: 'Financing packages', icon: 'save' },
];
const NAV_NEW: (NavEntry & { vision: boolean })[] = [
  { label: 'Capital Structure', icon: <Layers size={18} strokeWidth={1.75} />, active: true, vision: true },
  { label: 'Equity', icon: <ChartPie size={18} strokeWidth={1.75} />, vision: true },
  { label: 'Scenarios', icon: 'calculator', vision: false },
  { label: 'Financing Strategy', icon: <Compass size={18} strokeWidth={1.75} />, vision: true },
];

const TINTS = { debt: 'var(--indigo-600)', equity: 'var(--indigo-300)', other: 'var(--aurora-mauve)' } as const;
const lbl: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' };
const card: CSSProperties = { position: 'absolute', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' };

export function CapitalStructure({ f }: { f: number }) {
  if (f < S8.pull[0] || f > 720) return null;
  const cam = capCam(f);
  const win = { x: cam.fx - cam.k * cam.cx, y: cam.fy - cam.k * cam.cy };
  const bg = p(f, 606, 622, E.inOut);
  const shell = p(f, 626, 640, E.out);
  const head = p(f, 630, 642, E.out);
  const rise = (a: number, b: number) => p(f, a, b, E.out);
  const leave = p(f, 706, 716, E.in);
  // Les nouveaux modules glissent dans la barre latérale : même application, périmètre élargi.
  const nav: NavEntry[] = [
    ...NAV_BASE,
    ...NAV_NEW.map(({ vision, ...item }, i) => {
      const o = p(f, 644 + i * 5, 654 + i * 5, E.out);
      const entry: NavEntry = { ...item, style: { opacity: o, transform: `translateX(${(1 - o) * -24}px)` } };
      if (vision) entry.badge = 'Vision';
      if (i === 0) entry.section = 'CAPITAL';
      return entry;
    }),
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - leave }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: CAP_UI.w, height: CAP_UI.h, transformOrigin: '0 0',
        transform: `translate(${win.x}px, ${win.y}px) scale(${cam.k})`, borderRadius: 16,
      }}>
        {/* Fond de la fenêtre, qui apparaît pendant le recul (même teinte que le fond du film) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'var(--canvas)', opacity: bg, boxShadow: `${SHADOW}, 0 0 0 1px rgba(28, 26, 43, ${0.06 * bg})` }} />
        <div style={{ opacity: shell }}>
          <Sidebar items={nav} height={CAP_UI.h} />
          <Topbar org={GROUP.name} perimeter={`Scope: ${GROUP.entityCount} entities · ${GROUP.countryCount} countries`} asOf={GROUP.asOf} width={CAP_UI.w - CAP_UI.sidebar} />
        </div>

        {/* En-tête : le même logiciel, un périmètre plus large */}
        <div style={{ position: 'absolute', left: 280, top: 92, opacity: head }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}>Capital Structure</h1>
            <ProjectionBadge text="Our vision" />
          </div>
          <p style={{ marginTop: 2, color: 'var(--ink-500)', fontSize: 14 }}>{GROUP.name} · debt, equity and other capital instruments · illustrative data</p>
        </div>

        {/* Les trois familles du capital */}
        {CAPITAL.categories.map((c, i) => {
          const x = CARDS.xs[i] ?? 0;
          const o = c.key === 'debt' ? 1 : rise(612 + (i - 1) * 6, 626 + (i - 1) * 6);
          const content = c.key === 'debt' ? p(f, 622, 636, E.inOut) : o;
          if (o <= 0.001) return null;
          return (
            <div key={c.key} style={{ ...card, left: x, top: CARDS.y, width: CARDS.w, height: CARDS.h, opacity: c.key === 'debt' ? content : o, transform: `translateY(${(1 - o) * 16}px)`, padding: '20px 22px', border: c.key === 'debt' ? '1.5px solid var(--indigo-300)' : card.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: TINTS[c.key as keyof typeof TINTS] }} />
                <span style={{ fontSize: 19, fontWeight: 700 }}>{c.label}</span>
                <span style={{ marginLeft: 'auto', ...lbl }}>{c.share} of capital</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 42, lineHeight: 1, fontWeight: 750, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.amount}</div>
              <div style={{ marginTop: 10, fontSize: 15, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{c.detail}</div>
              <div style={{ position: 'absolute', left: 22, right: 22, bottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, whiteSpace: 'nowrap' }}>
                {c.key === 'debt' ? (
                  <>
                    <span style={{ fontWeight: 650 }}>{COVENANT.label} {COVENANT.value}</span>
                    <StatusBadge status={COVENANT.status} size="sm" short />
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px', borderRadius: 999, background: 'var(--ok-bg)', color: 'var(--ok)', fontSize: 13, fontWeight: 700 }}>
                      <Icon name="check" size={13} />{DOSSIER.title}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--ink-500)' }}>{c.key === 'equity' ? 'Ownership · dilution scenarios' : 'Terms · maturities · conversion'}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Module « Capital Structure » : la répartition du capital */}
        <Module x={ROW2.x} y={ROW2.y} w={ROW2.w} h={ROW2.h} o={rise(638, 650)} icon={<Layers size={20} strokeWidth={1.75} />} title="Capital Structure" right={<span style={lbl}>Total capital <b style={{ color: 'var(--ink-900)', fontSize: 16 }}>{CAPITAL.total}</b></span>}>
          <div style={{ display: 'flex', height: 34, borderRadius: 10, overflow: 'hidden', background: 'var(--line)', marginTop: 6 }}>
            {CAPITAL.categories.map((c, i) => {
              const g = p(f, 642 + i * 6, 656 + i * 6, E.out);
              return <span key={c.key} style={{ width: `${c.fraction * 100 * g}%`, background: TINTS[c.key as keyof typeof TINTS], borderRight: i < 2 ? '2px solid #fff' : undefined }} />;
            })}
          </div>
          <div style={{ display: 'flex', gap: 34, marginTop: 16 }}>
            {CAPITAL.categories.map((c, i) => (
              <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, opacity: p(f, 646 + i * 6, 656 + i * 6) }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: TINTS[c.key as keyof typeof TINTS] }} />
                <span style={{ fontWeight: 650 }}>{c.label}</span>
                <span style={{ color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{c.amount} · {c.share}</span>
              </span>
            ))}
          </div>
        </Module>

        {/* Module « Scenarios » : la même acquisition, trois financements possibles */}
        <Module x={ROW3.xs[0]} y={ROW3.y} w={ROW3.w} h={ROW3.h} o={rise(648, 660)} icon={<Icon name="calculator" size={20} />} title="Scenarios" right={<span style={lbl}>Acquisition · {SIMULATION.inputs[0]?.value}</span>}>
          {CAPITAL.fundingScenarios.map((s, i) => {
            const o = p(f, 652 + i * 5, 662 + i * 5, E.out);
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44, borderBottom: i < 2 ? '1px solid var(--line)' : undefined, opacity: o, transform: `translateX(${(1 - o) * 14}px)` }}>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Net leverage</span>
                <span style={{ width: 70, textAlign: 'right', fontSize: 17, fontWeight: 750, fontVariantNumeric: 'tabular-nums', color: s.breach ? 'var(--risk)' : 'var(--ink-900)' }}>{s.leverage}</span>
                <span style={{ width: 92 }}><StatusBadge status={s.breach ? 'BREACH' : 'COMPLIANT'} size="sm" short /></span>
              </div>
            );
          })}
        </Module>

        {/* Module « Financing Strategy » : le besoin, et les options à étudier */}
        <Module x={ROW3.xs[1]} y={ROW3.y} w={ROW3.w} h={ROW3.h} o={rise(654, 666)} icon={<Compass size={20} strokeWidth={1.75} />} title="Financing Strategy" right={<span style={lbl}>Our vision</span>}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 15, color: 'var(--ink-500)' }}>Financing requirement</span>
            <span style={{ fontSize: 30, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>{DOSSIER.need}</span>
          </div>
          <div style={{ marginTop: 14, ...lbl }}>Options to compare</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {['Bank debt', 'Private debt', 'Equity', 'Capital markets'].map((o, i) => {
              const v = p(f, 658 + i * 4, 666 + i * 4, E.out);
              return (
                <span key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--indigo-50)', border: '1px solid var(--indigo-100)', color: 'var(--indigo-700)', fontSize: 14, fontWeight: 650, opacity: v, transform: `scale(${mix(0.85, 1, v)})` }}>
                  <Scale size={13} strokeWidth={2} />{o}
                </span>
              );
            })}
          </div>
        </Module>
      </div>
    </div>
  );
}

function Module({ x, y, w, h, o, icon, title, right, children }: { x: number; y: number; w: number; h: number; o: number; icon: ReactNode; title: string; right?: ReactNode; children: ReactNode }) {
  if (o <= 0.001) return null;
  return (
    <div style={{ ...card, left: x, top: y, width: w, height: h, padding: '18px 22px', opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}>{icon}</span>
        <span style={{ fontSize: 19, fontWeight: 700 }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}>{right}</span>
      </div>
      {children}
    </div>
  );
}
