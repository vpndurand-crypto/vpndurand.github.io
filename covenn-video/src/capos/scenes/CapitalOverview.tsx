import type { CSSProperties, ReactNode } from 'react';
import { E, p, track, zoomTrack, type Key } from '../../film/anim';
import { CAPITAL, GROUP } from '../data';
import { Badge, SHADOW, Sidebar, Tag, Topbar } from '../kit';
import { warp } from '../timing';
import { S7, breatheAt } from './Request';

/**
 * S8 — « Debt is just the starting point. » → « Capital structure is our ambition. » (0:20.5–0:23.5)
 * La caméra recule depuis la demande de financement : elle n'est qu'une ligne du « Financing pipeline » de la page
 * Capital overview de la bêta, à côté des scénarios et, au-dessus, de la structure du capital du groupe — fonds propres,
 * dette par instrument, engagements non tirés. Même logiciel, même coque : le périmètre s'élargit de la dette au capital.
 * Puis la fenêtre se replie à gauche : elle devient l'entreprise du réseau de financement (S9).
 */
export const CAP_UI = { w: 1600, h: 880, sidebar: 240 } as const;
const CAPCARD = { x: 280, y: 178, w: 1278, h: 214 };
const FORECAST = { x: 280, y: 412, w: 698, h: 316 };
const PIPE = { x: 998, y: 412, w: 560, h: 316 };
const KPIS = { x: 280, y: 748, h: 112, gap: 12 };
const PIPE_C = { x: PIPE.x + PIPE.w / 2, y: PIPE.y + PIPE.h / 2 };
const PKG = { x: S7.panel.x + S7.panel.w / 2, y: S7.panel.y + S7.panel.h / 2 };
/** Zoom de départ : la carte « Financing pipeline » remplit exactement le cadre de la demande de S7. */
const K0 = S7.panel.w / PIPE.w;

export const S8 = { pull: [604, 640] as const, toCompany: [692, 716] as const };
/** Où la fenêtre se pose dans le réseau (S9) : le nœud « entreprise ». */
export const COMPANY = { x: 380, y: 560, k: 0.3 } as const;

const K: Key[] = [[604, K0], [640, 0.98, E.inOut], [664, 0.99], [692, 1.08, E.inOut], [716, COMPANY.k, E.inOut]];
const CX: Key[] = [[604, PIPE_C.x], [640, 800, E.inOut], [664, 800], [692, 919, E.inOut], [716, 800, E.inOut]];
const CY: Key[] = [[604, PIPE_C.y], [640, 440, E.inOut], [664, 440], [692, 560, E.inOut], [716, 440, E.inOut]];
const FX: Key[] = [[604, PKG.x], [640, 960, E.inOut], [664, 960], [692, 960, E.inOut], [716, COMPANY.x, E.inOut]];
const FY: Key[] = [[604, PKG.y], [640, 640, E.inOut], [664, 640], [692, 670, E.inOut], [716, COMPANY.y, E.inOut]];

export function capCam(f: number) {
  return { k: zoomTrack(f, K), cx: track(f, CX), cy: track(f, CY), fx: track(f, FX), fy: track(f, FY) };
}
const toFrame = (cam: ReturnType<typeof capCam>, x: number, y: number) => ({ x: cam.fx + cam.k * (x - cam.cx), y: cam.fy + cam.k * (y - cam.cy) });

/** La demande (S7) suit la carte « Financing pipeline » pendant le recul, puis s'efface dans la carte. */
export function packageTransform(f: number): { transform?: string; opacity: number } {
  if (f < S8.pull[0]) return { opacity: 1 };
  const cam = capCam(f);
  const at = toFrame(cam, PIPE_C.x, PIPE_C.y);
  const s = cam.k / (K0 * breatheAt(warp(f)));
  return {
    transform: `translate(${(at.x - PKG.x).toFixed(2)}px, ${(at.y - PKG.y).toFixed(2)}px) scale(${s.toFixed(5)})`,
    opacity: 1 - p(f, 620, 632, E.inOut),
  };
}

const card: CSSProperties = { position: 'absolute', overflow: 'hidden' };
const STAGE_TONE = (i: number) => (i >= 5 ? 'b-ok' : i >= 3 ? 'b-brand' : 'b-neutral');

export function CapitalOverview({ f }: { f: number }) {
  if (f < S8.pull[0] || f > 720) return null;
  const cam = capCam(f);
  const win = { x: cam.fx - cam.k * cam.cx, y: cam.fy - cam.k * cam.cy };
  const bg = p(f, 606, 622, E.inOut);
  const shell = p(f, 626, 640, E.out);
  const head = p(f, 630, 642, E.out);
  const rise = (a: number, b: number) => p(f, a, b, E.out);
  const leave = p(f, 706, 716, E.in);
  const pipeContent = p(f, 622, 636, E.inOut);
  // La barre de financement : d'abord la dette (instrument par instrument), puis les fonds propres, puis les engagements non tirés.
  const segGrow = (key: string, i: number) => (key === 'equity' ? p(f, 650, 664, E.inOut) : p(f, 626 + (i - 1) * 4, 640 + (i - 1) * 4, E.out));
  const undrawn = p(f, 660, 670, E.out);
  const total = CAPITAL.segments.reduce((s, x) => s + x.value, 0) + CAPITAL.undrawn.value;
  const kpiW = (CAPCARD.w - KPIS.gap * (CAPITAL.kpis.length - 1)) / CAPITAL.kpis.length;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - leave }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: CAP_UI.w, height: CAP_UI.h, transformOrigin: '0 0',
        transform: `translate(${win.x}px, ${win.y}px) scale(${cam.k})`, borderRadius: 16, lineHeight: 1.5,
      }}>
        {/* Fond de la fenêtre, qui apparaît pendant le recul (même teinte que le fond du film) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'var(--paper)', opacity: bg, boxShadow: `${SHADOW}, 0 0 0 1px rgba(28, 25, 54, ${0.06 * bg})` }} />
        <div style={{ opacity: shell }}>
          <Sidebar active="overview" height={CAP_UI.h} />
          <Topbar scope={GROUP.scope} width={CAP_UI.w - CAP_UI.sidebar} />
        </div>

        {/* En-tête : la page d'accueil de la bêta */}
        <div style={{ position: 'absolute', left: 280, top: 92, opacity: head }}>
          <h1 style={{ fontSize: 32, lineHeight: '40px' }}>Capital overview</h1>
          <p className="muted" style={{ marginTop: 2, fontSize: 14.5 }}>How {GROUP.name} is funded at {GROUP.asOf}, what needs a decision, and the financing in preparation.</p>
        </div>

        {/* Structure du capital : fonds propres, dette par instrument, engagements non tirés */}
        <div className="card" style={{ ...card, left: CAPCARD.x, top: CAPCARD.y, width: CAPCARD.w, height: CAPCARD.h, padding: '18px 22px', opacity: rise(612, 626), transform: `translateY(${(1 - rise(612, 626)) * 16}px)` }}>
          <h2 style={{ fontSize: 21 }}>Capital structure</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{CAPITAL.sub}</p>
          <div className="stackbar" style={{ marginTop: 14, height: 52, borderRadius: 10 }}>
            {CAPITAL.segments.map((s, i) => {
              const g = segGrow(s.key, i);
              return (
                <div key={s.key} style={{ width: `${(s.value / total) * 100 * g}%`, flex: 'none', background: s.color, padding: g > 0.2 ? '0 12px' : 0, fontSize: 14.5 }}>
                  {s.value / total > 0.2 ? `${s.label} ${s.amount}` : ''}
                </div>
              );
            })}
            <div className="undrawn" style={{ width: `${(CAPITAL.undrawn.value / total) * 100 * undrawn}%`, flex: 'none', padding: 0 }} />
          </div>
          <div className="legend" style={{ marginTop: 12, fontSize: 13.5 }}>
            {CAPITAL.segments.map((s, i) => (
              <span key={s.key} style={{ opacity: s.key === 'equity' ? p(f, 656, 664) : p(f, 634 + i * 3, 642 + i * 3) }}><i style={{ background: s.color }} />{s.label} {s.amount}</span>
            ))}
            <span style={{ opacity: undrawn }}><i style={{ background: 'repeating-linear-gradient(135deg,#efecfb 0 3px,#e2dcf7 3px 6px)', border: '1px dashed var(--brand-line)' }} />{CAPITAL.undrawn.label} {CAPITAL.undrawn.amount} — available, not debt</span>
          </div>
          <p className="faint" style={{ fontSize: 12.5, marginTop: 10, opacity: p(f, 664, 674) }}>
            Funded total {CAPITAL.funded} = book equity + outstanding debt. Undrawn commitments are shown separately and are not counted as debt.
          </p>
        </div>

        {/* Scénarios : la même projection pour tous les scénarios de la bêta */}
        <Module x={FORECAST.x} y={FORECAST.y} w={FORECAST.w} h={FORECAST.h} o={rise(640, 652)} title="Forecast & scenarios"
          sub={`Illustrative forecast at ${CAPITAL.horizon} · group perimeter`} right={<Tag proj scale={1.1}>Illustrative forecast</Tag>}>
          <table className="t" style={{ fontSize: 15, marginTop: 6 }}>
            <thead><tr><th style={{ fontSize: 13 }}>Scenario</th><th className="num" style={{ fontSize: 13 }}>Outstanding debt</th><th className="num" style={{ fontSize: 13 }}>Liquidity</th><th className="num" style={{ fontSize: 13 }}>Net debt / EBITDA</th></tr></thead>
            <tbody>
              {CAPITAL.scenarios.map((s, i) => {
                const o = p(f, 646 + i * 4, 656 + i * 4, E.out);
                const hi = s.id === 'sc-acq';
                return (
                  <tr key={s.id} style={{ opacity: o }}>
                    <td style={{ padding: '11px 10px', fontWeight: hi ? 650 : 500, color: hi ? 'var(--brand-ink)' : undefined }}>{s.name}{s.type !== s.name && <span className="tag" style={{ marginLeft: 8, fontSize: 11.5 }}>{s.type}</span>}</td>
                    <td className="num" style={{ padding: '11px 10px' }}>{s.debt}</td>
                    <td className="num" style={{ padding: '11px 10px' }}>{s.liquidity}</td>
                    <td className="num" style={{ padding: '11px 10px', fontWeight: 650 }}>{s.leverage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Module>

        {/* Financements en préparation : la demande de S7 en est la première ligne */}
        <div className="card" style={{ ...card, left: PIPE.x, top: PIPE.y, width: PIPE.w, height: PIPE.h, padding: '18px 22px', opacity: Math.max(pipeContent, 0) }}>
          <div className="between">
            <h2 style={{ fontSize: 21 }}>Financing pipeline</h2>
            <span className="btn sm" style={{ fontSize: 13 }}>Workspace</span>
          </div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{CAPITAL.pipeline.total} under preparation · not secured and excluded from debt</p>
          <div style={{ display: 'grid', gap: 6, marginTop: 10, lineHeight: 1.3 }}>
            {CAPITAL.pipeline.requests.map((r, i) => (
              <div key={r.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10,
                border: `1px solid ${i === 0 ? 'var(--brand-line)' : 'var(--line-2)'}`, background: i === 0 ? 'rgba(239,236,251,.5)' : undefined,
              }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                  <span className="muted" style={{ display: 'block', fontSize: 12.5, whiteSpace: 'nowrap', marginTop: 2 }}>{r.entity} · {r.purpose} · <b style={{ color: 'var(--ink)' }}>{r.amount}</b></span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone={STAGE_TONE(r.stageIndex)} scale={1.05}>{r.stage}</Badge>
                  <span className="faint" style={{ fontSize: 12.5, width: 64, textAlign: 'right' }}>Prep {r.prep}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs de la page Capital structure de la bêta */}
        {CAPITAL.kpis.map((k, i) => {
          const o = p(f, 648 + i * 3, 660 + i * 3, E.out);
          return (
            <div key={k.label} className="kpi" style={{ position: 'absolute', left: KPIS.x + i * (kpiW + KPIS.gap), top: KPIS.y, width: kpiW, height: KPIS.h, opacity: o, transform: `translateY(${(1 - o) * 14}px)`, padding: '14px 16px', gap: 4 }}>
              <span className="k" style={{ fontSize: 13.5 }}>{k.label}</span>
              <span className="v" style={{ fontSize: 28 }}>{k.value}</span>
              <span className="d" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Module({ x, y, w, h, o, title, sub, right, children }: { x: number; y: number; w: number; h: number; o: number; title: string; sub: string; right?: ReactNode; children: ReactNode }) {
  if (o <= 0.001) return null;
  return (
    <div className="card" style={{ ...card, left: x, top: y, width: w, height: h, padding: '18px 22px', opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
      <div className="between">
        <h2 style={{ fontSize: 21 }}>{title}</h2>
        {right}
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{sub}</p>
      {children}
    </div>
  );
}
