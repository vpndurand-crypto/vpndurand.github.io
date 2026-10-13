import type { ReactNode } from 'react';
import { seedBalances } from '../../../beta/src/data/balances';
import { documents } from '../../../beta/src/data/documents';
import { contractPages } from '../../../beta/src/data/contractPages';
import { importJobs } from '../../../beta/src/data/importJobs';
import type { ContractPage as ContractPageData, TrialBalance } from '../../../beta/src/data/types';
import { E, mix, p } from '../../film/anim';
import { AppWindow, PdfWindow, SpreadsheetWindow, spreadsheetHeight } from '../../film/parts/Windows';
import { SCENES } from '../timing';

/**
 * S1 — « Votre finance est partout. »
 * Les vrais fichiers fictifs de la bêta (balances, contrats, relevés) et trois contrats de filiales étrangères (projection)
 * s'accumulent de plus en plus vite, puis convergent d'un coup vers un point central : Covenn.
 */
export const CENTER = { x: 960, y: 540 };

function balance(id: string): TrialBalance {
  const b = seedBalances.find((x) => x.id === id);
  if (!b) throw new Error(`Balance absente : ${id}`);
  return b;
}
const fileOf = (balanceId: string) => {
  const job = importJobs.find((j) => j.balance_id === balanceId);
  if (!job) throw new Error(`Import absent : ${balanceId}`);
  return job.file_name;
};
const docOf = (id: string) => {
  const d = documents.find((x) => x.id === id);
  if (!d) throw new Error(`Document absent : ${id}`);
  return d;
};
const pageOf = (id: string, page: number): ContractPageData => {
  const pg = contractPages.find((x) => x.document_id === id && x.page === page);
  if (!pg) throw new Error(`Page absente : ${id} p. ${page}`);
  return pg;
};
const rows = (id: string, from: number, to: number) => balance(id).lines.filter((l) => l.row >= from && l.row <= to);

/** Contrat d'une filiale étrangère (projection) : titre dans la langue du pays, texte figuré par des lignes neutres. */
function ForeignDoc({ fileName, title, party, width, height }: { fileName: string; title: string; party: string; width: number; height: number }) {
  const lines = [0.96, 0.9, 0.98, 0.72, 0, 0.94, 0.88, 0.97, 0.6, 0, 0.92, 0.85, 0.7];
  return (
    <div style={{ width, height, background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line-strong)', boxShadow: '0 18px 48px rgba(28,26,43,.12), 0 2px 6px rgba(28,26,43,.05)' }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-700)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-500)', border: '1px solid var(--line-strong)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>
        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
      </div>
      <div style={{ padding: '22px 22px', fontFamily: "Georgia, 'Times New Roman', serif", color: '#22212B' }}>
        <div style={{ fontSize: 17, textAlign: 'center', letterSpacing: '0.01em' }}>{title}</div>
        <div style={{ fontSize: 12.5, textAlign: 'center', color: 'var(--ink-500)', marginTop: 6, marginBottom: 18 }}>{party}</div>
        {lines.map((w, i) => (w === 0
          ? <div key={i} style={{ height: 12 }} />
          : <div key={i} style={{ height: 7, width: `${w * 100}%`, background: '#E9E7F1', borderRadius: 4, marginBottom: 9 }} />))}
      </div>
    </div>
  );
}

interface Frag { id: string; cx: number; cy: number; w: number; h: number; rot: number; depth: number; enter: number; render: () => ReactNode }

const FRAGS: Frag[] = [
  { id: 'E1', cx: 640, cy: 300, w: 600, h: spreadsheetHeight(9), rot: -1.4, depth: 1.0, enter: -12,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-di-2026-09-30')} lines={rows('tb-di-2026-09-30', 16, 24)} width={600} /> },
  { id: 'P1', cx: 1330, cy: 420, w: 380, h: 520, rot: 2.2, depth: 1.04, enter: -8,
    render: () => <PdfWindow fileName={docOf('doc-01').file_name} page={pageOf('doc-01', 47)} pageCount={docOf('doc-01').page_count} width={380} height={520} /> },
  { id: 'E3', cx: 300, cy: 650, w: 480, h: spreadsheetHeight(9), rot: 1.2, depth: 0.84, enter: -4,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-di-2025-09-30')} lines={rows('tb-di-2025-09-30', 24, 32)} width={480} /> },
  { id: 'F1', cx: 1720, cy: 250, w: 320, h: 410, rot: -2.4, depth: 0.9, enter: 9,
    render: () => <ForeignDoc fileName="Prestamo_DemoIberia_2025.pdf" title="Contrato de préstamo" party="Démo Iberia S.L." width={320} height={410} /> },
  { id: 'A1', cx: 990, cy: 770, w: 470, h: 236, rot: -1.6, depth: 1.06, enter: 13,
    render: () => <AppWindow title={docOf('doc-02').title} page={pageOf('doc-02', 1)} pageCount={docOf('doc-02').page_count} width={470} height={236} /> },
  { id: 'E4', cx: 1250, cy: 120, w: 480, h: spreadsheetHeight(9), rot: 1.6, depth: 0.8, enter: 16,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-dl-2026-09-30')} lines={rows('tb-dl-2026-09-30', 1, 9)} width={480} /> },
  { id: 'F2', cx: 250, cy: 240, w: 320, h: 410, rot: 2.6, depth: 0.86, enter: 19,
    render: () => <ForeignDoc fileName="Darlehensvertrag_DemoDeutschland_2024.pdf" title="Darlehensvertrag" party="Démo Deutschland GmbH" width={320} height={410} /> },
  { id: 'P2', cx: 1730, cy: 770, w: 320, h: 420, rot: 3.0, depth: 0.92, enter: 22,
    render: () => <PdfWindow fileName={docOf('doc-04').file_name} page={pageOf('doc-04', 1)} pageCount={docOf('doc-04').page_count} width={320} height={420} /> },
  { id: 'E5', cx: 640, cy: 900, w: 470, h: spreadsheetHeight(9), rot: -2.0, depth: 0.82, enter: 25,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-ds-2026-09-30')} lines={rows('tb-ds-2026-09-30', 1, 9)} width={470} /> },
  { id: 'F3', cx: 1450, cy: 910, w: 320, h: 400, rot: -2.8, depth: 0.95, enter: 27,
    render: () => <ForeignDoc fileName="CreditAgreement_DemoUSA_2025.pdf" title="Credit Agreement" party="Démo USA Inc." width={320} height={400} /> },
  { id: 'A2', cx: 1760, cy: 520, w: 400, h: 220, rot: 1.4, depth: 0.88, enter: 29,
    render: () => <AppWindow title={docOf('doc-07').title} page={pageOf('doc-07', 1)} pageCount={docOf('doc-07').page_count} width={400} height={220} /> },
  { id: 'P3', cx: 860, cy: 130, w: 300, h: 380, rot: -2.2, depth: 0.78, enter: 31,
    render: () => <PdfWindow fileName={docOf('doc-06').file_name} page={pageOf('doc-06', 1)} pageCount={docOf('doc-06').page_count} width={300} height={380} /> },
  { id: 'A3', cx: 300, cy: 920, w: 440, h: 236, rot: 0.8, depth: 0.9, enter: 33,
    render: () => <AppWindow title={docOf('doc-03').title} page={pageOf('doc-03', 1)} pageCount={docOf('doc-03').page_count} width={440} height={236} /> },
  { id: 'E2', cx: 1100, cy: 470, w: 520, h: spreadsheetHeight(9), rot: -0.8, depth: 0.74, enter: 35,
    render: () => <SpreadsheetWindow fileName={fileOf('tb-di-2025-12-31')} lines={rows('tb-di-2025-12-31', 24, 32)} width={520} /> },
  { id: 'P4', cx: 560, cy: 560, w: 300, h: 380, rot: 1.8, depth: 0.8, enter: 37,
    render: () => <PdfWindow fileName={docOf('doc-05').file_name} page={pageOf('doc-05', 1)} pageCount={docOf('doc-05').page_count} width={300} height={380} /> },
  { id: 'P5', cx: 1560, cy: 640, w: 300, h: 380, rot: -1.2, depth: 0.76, enter: 39,
    render: () => <PdfWindow fileName={docOf('doc-01').file_name} page={pageOf('doc-01', 21)} pageCount={docOf('doc-01').page_count} width={300} height={380} /> },
];

/** Début de la convergence (images) ; les plans lointains partent un peu plus tard. */
export const CONVERGE = { start: 64, end: 88 };

export function Chaos({ f }: { f: number }) {
  if (f > SCENES.chaos[1] + 2) return null;
  // Poussée de caméra : la complexité se resserre autour du spectateur.
  const g = mix(1, 1.075, p(f, 0, CONVERGE.start, E.soft));
  const focus = p(f, 8, 22, E.out) * (1 - p(f, CONVERGE.start - 4, CONVERGE.start + 6, E.in));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {FRAGS.map((fr) => {
        const e = p(f, fr.enter, fr.enter + 10, E.out);
        if (e <= 0) return null;
        const drift = f / 30;
        // Position dans l'image, poussée de caméra comprise.
        let x = CENTER.x + g * (fr.cx - CENTER.x) - drift * 10 * fr.depth + (1 - e) * 40 * fr.depth;
        let y = CENTER.y + g * (fr.cy - CENTER.y) - drift * 5 * fr.depth + (1 - e) * 26 * fr.depth;
        const delay = (1.05 - fr.depth) * 10;
        const q = p(f, CONVERGE.start + delay, CONVERGE.end, E.in);
        x = mix(x, CENTER.x, q);
        y = mix(y, CENTER.y, q);
        const scale = (0.9 + 0.1 * e) * g * mix(1, 0.06, q);
        const rot = mix(fr.rot + (1 - e) * 3, 0, q);
        const opacity = e * (1 - p(f, CONVERGE.start + delay + 6, CONVERGE.end, E.in)) * (0.6 + 0.4 * Math.min(fr.depth, 1));
        const blur = Math.max(0, (0.98 - fr.depth) * 10) + focus * 1.6 + q * 5;
        return (
          <div key={fr.id} style={{
            position: 'absolute', left: x - fr.w / 2, top: y - fr.h / 2, width: fr.w, height: fr.h, opacity,
            transform: `rotate(${rot}deg) scale(${scale})`, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
            zIndex: Math.round(fr.depth * 100) + fr.enter,
          }}>
            {fr.render()}
          </div>
        );
      })}
      <CentralPoint f={f} />
    </div>
  );
}

/** Le point où tout converge : il deviendra la marque Covenn (S2). */
function CentralPoint({ f }: { f: number }) {
  const o = p(f, CONVERGE.end - 12, CONVERGE.end - 2, E.out);
  if (o <= 0) return null;
  const r = mix(4, 14, p(f, CONVERGE.end - 10, CONVERGE.end + 2, E.out));
  return (
    <div style={{
      position: 'absolute', left: CENTER.x - r, top: CENTER.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o, zIndex: 400,
      background: 'var(--indigo-600)', boxShadow: `0 0 0 ${r * 0.9}px rgba(106, 87, 200, 0.16), 0 0 ${r * 4}px rgba(74, 51, 179, 0.55)`,
    }} />
  );
}
