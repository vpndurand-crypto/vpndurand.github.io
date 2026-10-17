/**
 * S1 — « Debt is fragmented. Financing is disconnected. » (0:00–0:03)
 * Quatre sources isolées, lisibles, tirées de la bêta : l'échéancier des remboursements (tableur), le contrat SFA
 * (page 1), le calcul du covenant de levier au 30 Sep 2026, le relevé du prêteur Beispielbank AG. D'autres documents,
 * flous, en arrière-plan. Une 3D retenue : chaque fragment est légèrement tourné vers le centre.
 * Puis un signal violet les relie un à un ; ils se redressent, se rangent, et se fondent dans l'encours de la vue groupe.
 */
import type { CSSProperties, ReactNode } from 'react';
import { E, life, mix, p } from '../../film/anim';
import { Icon } from '../../capos/kit';
import { AppWindow, PdfWindow, SpreadsheetWindow, balanceFile, spreadsheetHeight, tbLines } from '../../capos/docs';
import { FRAGMENTS } from '../data';
import { ALIGN, COMPRESS, FRAGMENT_IN, SIGNAL } from '../timing';
import { KPI, TIGHT_K } from '../Window';

const CENTER = { x: 960, y: 560 };
/** Grille où les fragments se rangent avant de se fondre dans la tuile de l'encours (même proportion qu'elle). */
const CELL = { w: 540, h: 300, gap: 20 };
const GRID_W = CELL.w * 2 + CELL.gap;
const SQUEEZE = (KPI.w * TIGHT_K) / GRID_W;

interface Frag { id: string; cx: number; cy: number; w: number; h: number; ry: number; rx: number; rz: number; enter: number; cell: [number, number]; render: () => ReactNode }

const FRAGS: Frag[] = [
  { id: 'schedule', cx: 520, cy: 232, w: 680, h: 300, ry: 12, rx: -6, rz: -1.4, enter: FRAGMENT_IN[0], cell: [0, 0], render: () => <ScheduleWindow /> },
  { id: 'agreement', cx: 1410, cy: 238, w: 520, h: 330, ry: -12, rx: -6, rz: 1.4, enter: FRAGMENT_IN[1], cell: [1, 0],
    render: () => <PdfWindow docId={FRAGMENTS.agreement.docId} n={1} width={520} height={330} fontSize={14.5} /> },
  { id: 'covenant', cx: 1410, cy: 850, w: 600, h: 290, ry: -12, rx: 6, rz: -1, enter: FRAGMENT_IN[2], cell: [1, 1], render: () => <CovenantWindow /> },
  { id: 'statement', cx: 530, cy: 850, w: 580, h: 250, ry: 12, rx: 6, rz: 1, enter: FRAGMENT_IN[3], cell: [0, 1],
    render: () => <AppWindow docId={FRAGMENTS.statement.docId} width={580} height={250} fontSize={15} /> },
];
/** Ordre du signal : il fait le tour des quatre sources. */
const SIGNAL_ORDER = ['schedule', 'agreement', 'covenant', 'statement'];

/** Arrière-plan : d'autres sources du groupe, floues (balance en livres sterling, relevés, échéancier d'un prêteur). */
const BACK: { id: string; cx: number; cy: number; w: number; h: number; rz: number; blur: number; enter: number; render: () => ReactNode }[] = [
  { id: 'tb-uk', cx: 975, cy: 118, w: 470, h: spreadsheetHeight(7), rz: 1.6, blur: 5, enter: 3,
    render: () => <SpreadsheetWindow fileName={balanceFile('tb-uk-2026-09-30')} lines={tbLines('tb-uk-2026-09-30', 0, 6)} width={470} currency="GBP" country="GB" /> },
  { id: 'rcf', cx: 975, cy: 1000, w: 420, h: 220, rz: -1.8, blur: 5, enter: 6, render: () => <AppWindow docId="doc-07" width={420} height={220} fontSize={12} /> },
  { id: 'amort', cx: 92, cy: 560, w: 380, h: 240, rz: 2.4, blur: 7, enter: 9, render: () => <AppWindow docId="doc-02" width={380} height={240} fontSize={12} /> },
  { id: 'kmb', cx: 1835, cy: 560, w: 380, h: 220, rz: -2.2, blur: 7, enter: 11, render: () => <AppWindow docId="doc-13" width={380} height={220} fontSize={12} /> },
];

const cellCenter = ([c, r]: [number, number]) => ({ x: CENTER.x + (c === 0 ? -1 : 1) * (CELL.w + CELL.gap) / 2, y: CENTER.y + (r === 0 ? -1 : 1) * (CELL.h + CELL.gap) / 2 });

export function Fragments({ f }: { f: number }) {
  if (f > COMPRESS[1] + 2) return null;
  const push = mix(1, 1.035, p(f, 0, ALIGN[0], E.soft));
  const align = p(f, ALIGN[0], ALIGN[1], E.inOut);
  const squeeze = p(f, COMPRESS[0], COMPRESS[1], E.in);
  const fade = 1 - p(f, COMPRESS[0] + 6, COMPRESS[1], E.in);
  const drift = f / 30;
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: 1800, perspectiveOrigin: `${CENTER.x}px ${CENTER.y}px` }}>
      {BACK.map((b) => {
        const e = p(f, b.enter, b.enter + 10, E.out);
        const o = e * 0.5 * (1 - p(f, ALIGN[0], ALIGN[0] + 10, E.in));
        if (o <= 0.001) return null;
        const x = CENTER.x + push * (b.cx - CENTER.x) - drift * 8;
        const y = CENTER.y + push * (b.cy - CENTER.y) - drift * 3;
        return (
          <div key={b.id} style={{
            position: 'absolute', left: x - b.w / 2, top: y - b.h / 2, width: b.w, height: b.h, opacity: o,
            transform: `rotate(${b.rz}deg) scale(${0.9 * push})`, filter: `blur(${b.blur + align * 4}px)`,
          }}>
            {b.render()}
          </div>
        );
      })}

      <Signal f={f} />

      {FRAGS.map((fr) => {
        const e = p(f, fr.enter, fr.enter + 11, E.out);
        if (e <= 0) return null;
        // Position éparse (avec poussée de caméra et dérive), puis rangement dans la grille, puis compression vers l'encours.
        const sx = CENTER.x + push * (fr.cx - CENTER.x) - drift * 6 + (1 - e) * 70 * Math.sign(fr.cx - CENTER.x);
        const sy = CENTER.y + push * (fr.cy - CENTER.y) - drift * 2 + (1 - e) * 30 * Math.sign(fr.cy - CENTER.y);
        const cell = cellCenter(fr.cell);
        const fit = Math.min(CELL.w / fr.w, CELL.h / fr.h);
        let x = mix(sx, cell.x, align);
        let y = mix(sy, cell.y, align);
        let scale = mix((0.9 + 0.1 * e) * push, fit, align);
        x = mix(x, CENTER.x + (x - CENTER.x) * SQUEEZE, squeeze);
        y = mix(y, CENTER.y + (y - CENTER.y) * SQUEEZE, squeeze);
        scale *= mix(1, SQUEEZE, squeeze);
        const k = 1 - align;
        const hit = SIGNAL[SIGNAL_ORDER.indexOf(fr.id)] ?? 0;
        const lit = p(f, hit, hit + 4, E.out);
        const sway = Math.sin(drift * 1.3 + fr.cx * 0.01) * 1.2;
        const style: CSSProperties = {
          position: 'absolute', left: x - fr.w / 2, top: y - fr.h / 2, width: fr.w, height: fr.h, opacity: e * fade,
          transform: `scale(${scale}) rotateY(${(fr.ry + sway) * k}deg) rotateX(${fr.rx * k}deg) rotateZ(${(fr.rz + (1 - e) * 3) * k}deg)`,
          filter: e < 0.999 ? `blur(${(1 - e) * 6}px)` : undefined, borderRadius: 10,
          boxShadow: lit > 0.01 ? `0 0 0 ${3 * lit}px rgba(74, 51, 179, ${0.85 * lit}), 0 0 ${40 * lit}px rgba(74, 51, 179, ${0.35 * lit})` : undefined,
        };
        return <div key={fr.id} style={style}>{fr.render()}</div>;
      })}

      <CompressFlash f={f} />
    </div>
  );
}

/** Le signal violet : un trait qui fait le tour des quatre sources et s'allume sur chacune. */
function Signal({ f }: { f: number }) {
  const start = SIGNAL[0] - 4;
  const end = SIGNAL[3];
  if (f < start || f > ALIGN[0] + 10) return null;
  const pts = SIGNAL_ORDER.map((id) => {
    const fr = FRAGS.find((x) => x.id === id);
    return fr ? { x: fr.cx + (fr.cx < CENTER.x ? 1 : -1) * fr.w * 0.32, y: fr.cy + (fr.cy < CENTER.y ? 1 : -1) * fr.h * 0.32 } : CENTER;
  });
  const d = pts.map((q, i) => `${i === 0 ? 'M' : 'L'} ${q.x} ${q.y}`).join(' ') + ' Z';
  const t = p(f, start, end + 4, E.inOut);
  const o = 1 - p(f, ALIGN[0], ALIGN[0] + 8, E.in);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: o }}>
      <path d={d} pathLength={1} fill="none" stroke="rgba(143, 128, 220, 0.35)" strokeWidth={10} strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - t} />
      <path d={d} pathLength={1} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - t} />
      {pts.map((q, i) => {
        const lit = p(f, SIGNAL[i] ?? 0, (SIGNAL[i] ?? 0) + 5, E.out);
        return lit > 0 ? <circle key={i} cx={q.x} cy={q.y} r={6 + 4 * lit} fill="var(--brand)" opacity={lit} /> : null;
      })}
    </svg>
  );
}

/** Éclair violet au moment où les sources se fondent dans l'encours. */
function CompressFlash({ f }: { f: number }) {
  const o = life(f, COMPRESS[1] - 6, COMPRESS[1] - 1, COMPRESS[1] + 1, COMPRESS[1] + 2);
  if (o <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: CENTER.x - (KPI.w * TIGHT_K) / 2, top: CENTER.y - (KPI.h * TIGHT_K) / 2, width: KPI.w * TIGHT_K, height: KPI.h * TIGHT_K,
      borderRadius: 20, opacity: o, boxShadow: '0 0 0 4px rgba(74, 51, 179, 0.8), 0 0 80px rgba(74, 51, 179, 0.45)',
    }} />
  );
}

// ---------------------------------------------------------------------------
// Fenêtres des fragments
// ---------------------------------------------------------------------------
const CHROME_H = 36;
function Chrome({ title, icon }: { title: string; icon: 'data' | 'covenants' }) {
  return (
    <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F0F0F5', borderBottom: '1px solid var(--line)' }}>
      <span style={{ display: 'inline-flex', gap: 6 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#D9D8E3' }} />)}</span>
      <span style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
        <Icon name={icon} size={15} />{title}
      </span>
    </div>
  );
}
const shell: CSSProperties = { width: '100%', height: '100%', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: '0 18px 48px rgba(28,25,54,.12), 0 2px 6px rgba(28,25,54,.05)' };
const cell: CSSProperties = { padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid var(--line-2)', height: '100%', display: 'flex', alignItems: 'center' };

/** Échéancier des remboursements (onglet « Repayment schedule » de la bêta), présenté comme un tableur. */
function ScheduleWindow() {
  const cols = '34px 112px 86px minmax(0, 1fr) 150px 96px';
  const rows = FRAGMENTS.schedule;
  return (
    <div style={shell}>
      <Chrome title="Repayment schedule — all facilities" icon="data" />
      <div style={{ display: 'grid', gridTemplateColumns: cols, height: 24, background: 'var(--paper)', borderBottom: '1px solid var(--line)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>
        {['', 'A', 'B', 'C', 'D', 'E'].map((c, i) => <span key={i} style={{ ...cell, justifyContent: 'center' }}>{c}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, height: 30, fontSize: 13, fontWeight: 650, color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' }}>
        <span style={{ ...cell, justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 11.5, fontWeight: 500 }}>1</span>
        <span style={cell}>Date</span><span style={cell}>Type</span><span style={cell}>Facility</span><span style={cell}>Lender</span><span style={{ ...cell, justifyContent: 'flex-end' }}>Principal</span>
      </div>
      {rows.map((r, i) => (
        <div key={`${r.date}-${r.facility}`} style={{ display: 'grid', gridTemplateColumns: cols, height: 33, fontSize: 13.5, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--line-2)', color: 'var(--ink)' }}>
          <span style={{ ...cell, justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 11.5 }}>{i + 2}</span>
          <span style={cell}>{r.date}</span><span style={cell}>{r.kind}</span><span style={cell}>{r.facility}</span><span style={cell}>{r.lender}</span>
          <span style={{ ...cell, justifyContent: 'flex-end', fontWeight: 600 }}>{r.amount}</span>
        </div>
      ))}
    </div>
  );
}

/** Calcul du covenant de levier (valeurs du moteur de la bêta), présenté comme une feuille de calcul. */
function CovenantWindow() {
  const C = FRAGMENTS.covenant;
  const line = (label: string, value: string, strong = false, n = 0) => (
    <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 170px', height: 38, fontSize: 15, borderBottom: '1px solid var(--line-2)', fontVariantNumeric: 'tabular-nums', background: strong ? '#f7f5ff' : undefined }}>
      <span style={{ ...cell, justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 11.5 }}>{n}</span>
      <span style={{ ...cell, color: strong ? 'var(--ink)' : 'var(--ink-2)', fontWeight: strong ? 700 : 450 }}>{label}</span>
      <span style={{ ...cell, justifyContent: 'flex-end', fontWeight: strong ? 750 : 600, fontSize: strong ? 17 : 15, color: strong ? 'var(--brand-ink)' : 'var(--ink)' }}>{value}</span>
    </div>
  );
  return (
    <div style={shell}>
      <Chrome title={`Covenant calculation — ${C.title}`} icon="covenants" />
      <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 170px', height: 24, background: 'var(--paper)', borderBottom: '1px solid var(--line)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>
        {['', 'A', 'B'].map((c, i) => <span key={i} style={{ ...cell, justifyContent: 'center' }}>{c}</span>)}
      </div>
      {line('Test date', C.test, false, 1)}
      {C.lines.map((l, i) => <div key={l.label}>{line(l.label, l.value, false, i + 2)}</div>)}
      {line('Leverage', C.value, true, 4)}
      {line(`Threshold · ${C.source}`, C.threshold, false, 5)}
    </div>
  );
}
