import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { continueRender, delayRender } from 'remotion';
import contractCss from '../../../beta/src/features/documents/ContractPage.module.css';
import { seedBalances } from '../../../beta/src/data/balances';
import { documents } from '../../../beta/src/data/documents';
import { contractPages } from '../../../beta/src/data/contractPages';
import { importJobs } from '../../../beta/src/data/importJobs';
import type { ContractPage as ContractPageData, TrialBalance } from '../../../beta/src/data/types';
import { V } from '../../bridge/demo';
import type { UiRects } from '../../bridge/AppFrame';
import { E, life, mix, p, quad, track } from '../anim';
import { AppWindow, PdfWindow, SpreadsheetWindow, spreadsheetHeight } from '../parts/Windows';
import { LANDING, appCamera, center, toFrame } from './appCamera';

// ---------------------------------------------------------------------------
// Sources réelles du jeu de démonstration
// ---------------------------------------------------------------------------
function balance(id: string): TrialBalance {
  const b = seedBalances.find((x) => x.id === id);
  if (!b) throw new Error(`Balance absente : ${id}`);
  return b;
}
function fileOf(balanceId: string): string {
  const job = importJobs.find((j) => j.balance_id === balanceId);
  if (!job) throw new Error(`Import absent : ${balanceId}`);
  return job.file_name;
}
function docOf(id: string) {
  const d = documents.find((x) => x.id === id);
  if (!d) throw new Error(`Document absent : ${id}`);
  return d;
}
function pageOf(id: string, page: number): ContractPageData {
  const pg = contractPages.find((x) => x.document_id === id && x.page === page);
  if (!pg) throw new Error(`Page absente : ${id} p. ${page}`);
  return pg;
}
const rows = (id: string, from: number, to: number) => balance(id).lines.filter((l) => l.row >= from && l.row <= to);

/** Lignes de trésorerie de la balance au 30/09/2026 : lignes 20 à 23 (celles que cite la provenance de la bêta). */
export const CASH_ROWS = [20, 21, 22, 23] as const;
export const BALANCE_MAIN = 'tb-di-2026-09-30';

interface Frag {
  id: string; cx: number; cy: number; w: number; h: number; rot: number; depth: number; enter: number;
  render: (highlight: number) => ReactNode;
  /** Sélecteur de l'élément d'où partent les chiffres (fragments clés). */
  anchor?: string; highlightAt?: number;
}

const XLSX_ROWS = 9;
const E1_ROWS = rows(BALANCE_MAIN, 16, 24);

const FRAGS: Frag[] = [
  // Vague 1 — cinq fichiers Excel (balances importées dans la bêta)
  { id: 'E4', cx: 1220, cy: 150, w: 500, h: spreadsheetHeight(XLSX_ROWS), rot: 1.6, depth: 0.78, enter: 14,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-dl-2026-09-30')} lines={rows('tb-dl-2026-09-30', 1, 9)} width={500} /> },
  { id: 'E5', cx: 1720, cy: 410, w: 480, h: spreadsheetHeight(XLSX_ROWS), rot: -1.8, depth: 0.74, enter: 18,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-ds-2026-09-30')} lines={rows('tb-ds-2026-09-30', 1, 9)} width={480} /> },
  { id: 'E2', cx: 1640, cy: 900, w: 520, h: spreadsheetHeight(XLSX_ROWS), rot: -2.2, depth: 0.82, enter: 6,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-di-2025-12-31')} lines={rows('tb-di-2025-12-31', 24, 32)} width={520} /> },
  { id: 'E3', cx: 330, cy: 175, w: 500, h: spreadsheetHeight(XLSX_ROWS), rot: 1.2, depth: 0.8, enter: 10,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-di-2025-09-30')} lines={rows('tb-di-2025-09-30', 24, 32)} width={500} /> },
  { id: 'E1', cx: 700, cy: 330, w: 620, h: spreadsheetHeight(XLSX_ROWS), rot: -1.4, depth: 1, enter: 2, anchor: 'cash', highlightAt: 68,
    render: (hl) => <SpreadsheetWindow fileName={fileOf(BALANCE_MAIN)} lines={E1_ROWS} width={620} highlightRows={CASH_ROWS} highlight={hl} /> },
  // Vague 2 — trois contrats PDF
  { id: 'P2', cx: 1810, cy: 640, w: 330, h: 440, rot: 3.2, depth: 0.86, enter: 35,
    render: () => <PdfWindow fileName={docOf('doc-04').file_name} page={pageOf('doc-04', 1)} pageCount={docOf('doc-04').page_count} width={330} height={440} /> },
  { id: 'P3', cx: 1110, cy: 840, w: 330, h: 420, rot: -2.6, depth: 0.88, enter: 40,
    render: () => <PdfWindow fileName={docOf('doc-06').file_name} page={pageOf('doc-06', 1)} pageCount={docOf('doc-06').page_count} width={330} height={420} /> },
  { id: 'P1', cx: 1330, cy: 470, w: 400, h: 560, rot: 2.2, depth: 1.04, enter: 30, anchor: 'threshold', highlightAt: 72,
    render: (hl) => <PdfWindow fileName={docOf('doc-01').file_name} page={pageOf('doc-01', 47)} pageCount={docOf('doc-01').page_count} width={400} height={560} highlightId="art-19-2" highlight={hl} /> },
  // Vague 3 — plusieurs logiciels (portails et visionneuses qui affichent les justificatifs)
  { id: 'A2', cx: 1750, cy: 150, w: 440, h: 230, rot: 1.4, depth: 0.9, enter: 61,
    render: () => <AppWindow title={docOf('doc-07').title} page={pageOf('doc-07', 1)} pageCount={docOf('doc-07').page_count} width={440} height={230} /> },
  { id: 'A1', cx: 960, cy: 610, w: 480, h: 236, rot: -1.6, depth: 1.08, enter: 56, anchor: 'debt', highlightAt: 70,
    render: (hl) => <AppWindow title={docOf('doc-02').title} page={pageOf('doc-02', 1)} pageCount={docOf('doc-02').page_count} width={480} height={236} highlightId="crd-2026-09-30" highlight={hl} /> },
  { id: 'A3', cx: 1560, cy: 700, w: 470, h: 250, rot: -0.8, depth: 1.02, enter: 66, anchor: 'ebitda', highlightAt: 74,
    render: (hl) => <AppWindow title={docOf('doc-03').title} page={pageOf('doc-03', 1)} pageCount={docOf('doc-03').page_count} width={470} height={250} highlightId="ncr-detail" highlight={hl} /> },
];

/** Point de convergence : le centre de la fenêtre Covenn qui apparaît en S2. */
const TARGET = { x: 960, y: 640 };
const GLOBAL_ORIGIN = { x: 1040, y: 500 };

interface FragState { dx: number; dy: number; rot: number; scale: number; opacity: number; blur: number; g: number }

function fragState(fr: Frag, f: number): FragState {
  const e = p(f, fr.enter, fr.enter + 16, E.out);
  const drift = f / 30;
  let dx = (1 - e) * 46 * fr.depth - drift * 9 * fr.depth;
  let dy = (1 - e) * 34 * fr.depth - drift * 4 * fr.depth;
  const exitStart = 126 + (fr.depth - 0.7) * 12;
  const q = p(f, exitStart, exitStart + 20, E.in);
  const breath = p(f, 110, 128, E.inOut);
  dx += (TARGET.x - (fr.cx + dx)) * 0.62 * q;
  dy += (TARGET.y - (fr.cy + dy)) * 0.62 * q;
  const g = track(f, [[0, 1], [126, 1.045, E.linear]]);
  return {
    dx, dy, g,
    rot: fr.rot + (1 - e) * 2.4,
    scale: (0.94 + 0.06 * e) * (1 - 0.55 * q),
    opacity: e * (1 - q) * (0.62 + 0.38 * Math.min(fr.depth, 1)),
    blur: Math.max(0, (0.95 - fr.depth) * 9) + breath * 1.6 + q * 6,
  };
}

/** Position dans l'image d'un point local d'un fragment (même calcul que la transformation CSS appliquée). */
function fragPoint(fr: Frag, st: FragState, lx: number, ly: number) {
  const vx = (lx - fr.w / 2) * st.scale;
  const vy = (ly - fr.h / 2) * st.scale;
  const a = (st.rot * Math.PI) / 180;
  const px = fr.cx + st.dx + vx * Math.cos(a) - vy * Math.sin(a);
  const py = fr.cy + st.dy + vx * Math.sin(a) + vy * Math.cos(a);
  return { x: GLOBAL_ORIGIN.x + st.g * (px - GLOBAL_ORIGIN.x), y: GLOBAL_ORIGIN.y + st.g * (py - GLOBAL_ORIGIN.y) };
}

// ---------------------------------------------------------------------------
// Chiffres en vol (S1 → S2)
// ---------------------------------------------------------------------------
type Anchor = 'debt' | 'cash' | 'ebitda' | 'threshold';
interface LocalPoints { debt: Pt; threshold: Pt; ebitda: Pt; cashRows: Pt[] }
interface Pt { x: number; y: number }

const FLIGHTS: Record<Anchor, { birth: number; start: number; land: number; text: string; lift: number }> = {
  threshold: { birth: 126, start: 134, land: LANDING.threshold, text: V.covenant.threshold, lift: -170 },
  debt: { birth: 126, start: 136, land: LANDING.debt, text: V.tree.debt.exact, lift: -210 },
  cash: { birth: 126, start: 140, land: LANDING.cash, text: V.tree.cash.exact, lift: -150 },
  ebitda: { birth: 128, start: 140, land: LANDING.ebitda, text: V.tree.adjustment.exact, lift: -190 },
};

function Chip({ x, y, text, scale, opacity, tone = 'indigo' }: { x: number; y: number; text: string; scale: number; opacity: number; tone?: 'indigo' | 'quiet' }) {
  if (opacity <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity,
      background: '#fff', border: `1px solid ${tone === 'indigo' ? 'var(--indigo-200)' : 'var(--line-strong)'}`, borderRadius: 10,
      padding: '7px 14px', fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      color: tone === 'indigo' ? 'var(--indigo-700)' : 'var(--ink-700)', boxShadow: '0 10px 30px rgba(74,51,179,.16), 0 2px 6px rgba(28,26,43,.06)',
    }}>
      {text}
    </div>
  );
}

const UI_FONT = { debt: 14, cash: 14, ebitda: 14, threshold: 14 } as const;

export function Sources({ frame, uiRects }: { frame: number; uiRects: UiRects }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [points, setPoints] = useState<LocalPoints | null>(null);
  const [handle] = useState(() => delayRender('Mesure des sources'));
  useLayoutEffect(() => {
    const local = (fragId: string, el: Element | null): Pt => {
      const root = refs.current[fragId];
      if (!root || !(el instanceof HTMLElement)) throw new Error(`Ancre absente dans ${fragId}`);
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
    };
    const body = (id: string, n: number) => refs.current[id]?.querySelector(`.${contractCss.body} > :nth-child(${n})`) ?? null;
    const e1 = refs.current.E1;
    const cashRows = CASH_ROWS.map((row) => {
      const cell = e1?.querySelector(`[data-row="${row}"]`) ?? null;
      return local('E1', cell);
    });
    setPoints({ threshold: local('P1', body('P1', 3)), debt: local('A1', body('A1', 2)), ebitda: local('A3', body('A3', 2)), cashRows });
  }, []);
  useLayoutEffect(() => {
    if (points) continueRender(handle);
  }, [points, handle]);

  const visible = frame < 164;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, visibility: visible ? 'visible' : 'hidden' }}>
        {FRAGS.map((fr) => {
          const st = fragState(fr, frame);
          const hl = fr.highlightAt ? p(frame, fr.highlightAt, fr.highlightAt + 12, E.out) : 0;
          return (
            <div key={fr.id} ref={(el) => { refs.current[fr.id] = el; }} data-frag={fr.id} style={{
              position: 'absolute', left: GLOBAL_ORIGIN.x + st.g * (fr.cx - GLOBAL_ORIGIN.x) - fr.w / 2, top: GLOBAL_ORIGIN.y + st.g * (fr.cy - GLOBAL_ORIGIN.y) - fr.h / 2,
              width: fr.w, height: fr.h, opacity: st.opacity,
              transform: `translate(${st.dx * st.g}px, ${st.dy * st.g}px) rotate(${st.rot}deg) scale(${st.scale * st.g})`,
              filter: st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px)` : undefined,
              zIndex: Math.round(fr.depth * 100) + fr.enter,
            }}>
              {fr.render(hl)}
            </div>
          );
        })}
      </div>
      {points && <Flights frame={frame} points={points} uiRects={uiRects} />}
    </>
  );
}

function Flights({ frame, points, uiRects }: { frame: number; points: LocalPoints; uiRects: UiRects }) {
  const frag = (id: string) => {
    const fr = FRAGS.find((x) => x.id === id);
    if (!fr) throw new Error(id);
    return fr;
  };
  const origin = (anchor: Anchor): Pt => {
    const birth = FLIGHTS[anchor].birth;
    if (anchor === 'cash') {
      const fr = frag('E1');
      const st = fragState(fr, birth);
      const pts = points.cashRows.map((pt) => fragPoint(fr, st, pt.x, pt.y));
      return { x: pts.reduce((s, q) => s + q.x, 0) / pts.length, y: pts.reduce((s, q) => s + q.y, 0) / pts.length };
    }
    const id = anchor === 'threshold' ? 'P1' : anchor === 'debt' ? 'A1' : 'A3';
    const fr = frag(id);
    const local = points[anchor];
    return fragPoint(fr, fragState(fr, birth), local.x, local.y);
  };
  const chips: ReactNode[] = [];

  // Les quatre soldes de trésorerie (lignes 20 à 23) se rejoignent en un seul montant.
  const cashFrag = frag('E1');
  const cashBirth = fragState(cashFrag, FLIGHTS.cash.birth);
  const cashCenter = origin('cash');
  points.cashRows.forEach((pt, i) => {
    const start = fragPoint(cashFrag, cashBirth, pt.x, pt.y);
    const t = p(frame, 128, 138, E.inOut);
    const o = life(frame, 124, 128, 134, 139);
    chips.push(<Chip key={`row-${i}`} x={mix(start.x, cashCenter.x, t)} y={mix(start.y, cashCenter.y, t)} text={V.tree.accounts[i]?.amount ?? ''} scale={0.62} opacity={o} tone="quiet" />);
  });

  (Object.keys(FLIGHTS) as Anchor[]).forEach((anchor) => {
    const fl = FLIGHTS[anchor];
    const o0 = origin(anchor);
    const cam = appCamera(frame, uiRects);
    const target = toFrame(cam, center(uiRects[anchor]).x, center(uiRects[anchor]).y);
    const t = p(frame, fl.start, fl.land, E.inOut);
    const control = { x: mix(o0.x, target.x, 0.5) + (anchor === 'debt' ? -80 : 60), y: Math.min(o0.y, target.y) + fl.lift };
    const x = quad(o0.x, control.x, target.x, t);
    const y = quad(o0.y, control.y, target.y, t);
    const lift = p(frame, fl.birth, fl.birth + 8, E.out);
    const landingScale = (UI_FONT[anchor] * cam.k) / 24;
    const scale = mix(mix(0.8, 1.06, lift), landingScale, p(frame, fl.start, fl.land, E.in));
    const bornAt = anchor === 'cash' ? 133 : fl.birth;
    const o = life(frame, bornAt, bornAt + 6, fl.land - 4, fl.land + 3);
    chips.push(<Chip key={anchor} x={x} y={y} text={fl.text} scale={scale} opacity={o} />);
  });
  return <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>{chips}</div>;
}
