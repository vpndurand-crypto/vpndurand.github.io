import type { ReactNode } from 'react';
import { E, mix, p } from '../../film/anim';
import { AppWindow, PdfWindow, SpreadsheetWindow, balanceFile, spreadsheetHeight, tbLines } from '../docs';
import { BURSTS, SCENES } from '../timing';

/**
 * S1 — « Debt is fragmented. Financing is disconnected. » (0:00–0:02.5)
 * Les documents de la bêta arrivent par rafales : balances des sociétés françaises, liasses des filiales allemande et
 * britannique (dont une en livres sterling), contrats de six prêteurs, relevés, rapport de gestion, offre Project Falcon.
 * Des étiquettes de prêteurs, de sociétés, de pays et de devises s'y ajoutent. Puis tout converge vers un point : Covenn.
 */
export const CENTER = { x: 960, y: 540 };

interface Frag { id: string; cx: number; cy: number; w: number; h: number; rot: number; depth: number; enter: number; render: () => ReactNode }

const [B1, B2, B3, B4] = BURSTS;
const at = (burst: readonly number[] | undefined, i: number) => burst?.[i] ?? 0;

const FRAGS: Frag[] = [
  // Rafale 1 : quelques sources dispersées
  { id: 'E1', cx: 610, cy: 290, w: 600, h: spreadsheetHeight(9), rot: -1.4, depth: 1.0, enter: at(B1, 0),
    render: () => <SpreadsheetWindow fileName={balanceFile('tb-di-2026-09-30')} lines={tbLines('tb-di-2026-09-30', 4, 12)} width={600} /> },
  { id: 'P1', cx: 1340, cy: 400, w: 380, h: 520, rot: 2.2, depth: 1.04, enter: at(B1, 1),
    render: () => <PdfWindow docId="doc-01" n={47} width={380} height={520} fontSize={11} /> },
  { id: 'A1', cx: 980, cy: 790, w: 470, h: 236, rot: -1.6, depth: 1.06, enter: at(B1, 2),
    render: () => <AppWindow docId="doc-07" width={470} height={236} /> },
  // Rafale 2 : d'autres pays, d'autres prêteurs
  { id: 'F1', cx: 1720, cy: 250, w: 320, h: 410, rot: -2.4, depth: 0.9, enter: at(B2, 0),
    render: () => <PdfWindow docId="doc-10" n={1} width={320} height={410} fontSize={10.5} country="DE" /> },
  { id: 'E3', cx: 290, cy: 660, w: 480, h: spreadsheetHeight(9), rot: 1.2, depth: 0.84, enter: at(B2, 1),
    render: () => <SpreadsheetWindow fileName={balanceFile('tb-dl-2026-09-30')} lines={tbLines('tb-dl-2026-09-30', 0, 8)} width={480} /> },
  { id: 'P2', cx: 1730, cy: 780, w: 320, h: 420, rot: 3.0, depth: 0.92, enter: at(B2, 2),
    render: () => <PdfWindow docId="doc-04" n={1} width={320} height={420} fontSize={10.5} /> },
  // Rafale 3 : l'accumulation s'accélère
  { id: 'F2', cx: 250, cy: 230, w: 320, h: 410, rot: 2.6, depth: 0.86, enter: at(B3, 0),
    render: () => <PdfWindow docId="doc-11" n={1} width={320} height={410} fontSize={10.5} country="GB" /> },
  { id: 'E4', cx: 1250, cy: 110, w: 480, h: spreadsheetHeight(9), rot: 1.6, depth: 0.8, enter: at(B3, 1),
    render: () => <SpreadsheetWindow fileName={balanceFile('tb-de-2026-09-30')} lines={tbLines('tb-de-2026-09-30', 0, 8)} width={480} country="DE" /> },
  { id: 'F3', cx: 1450, cy: 920, w: 320, h: 400, rot: -2.8, depth: 0.95, enter: at(B3, 2),
    render: () => <PdfWindow docId="doc-14" n={1} width={320} height={400} fontSize={10.5} country="DE" /> },
  { id: 'A2', cx: 1760, cy: 520, w: 400, h: 220, rot: 1.4, depth: 0.88, enter: at(B3, 3),
    render: () => <AppWindow docId="doc-13" width={400} height={220} fontSize={11} /> },
  // Rafale 4 : tout le groupe
  { id: 'P3', cx: 860, cy: 120, w: 300, h: 380, rot: -2.2, depth: 0.78, enter: at(B4, 0),
    render: () => <PdfWindow docId="doc-06" n={1} width={300} height={380} fontSize={10} /> },
  { id: 'E5', cx: 640, cy: 910, w: 470, h: spreadsheetHeight(9), rot: -2.0, depth: 0.82, enter: at(B4, 1),
    render: () => <SpreadsheetWindow fileName={balanceFile('tb-uk-2026-09-30')} lines={tbLines('tb-uk-2026-09-30', 0, 8)} width={470} currency="GBP" country="GB" /> },
  { id: 'A3', cx: 300, cy: 920, w: 440, h: 236, rot: 0.8, depth: 0.9, enter: at(B4, 2),
    render: () => <AppWindow docId="doc-08" n={2} width={440} height={236} fontSize={11} /> },
  { id: 'P4', cx: 560, cy: 560, w: 300, h: 380, rot: 1.8, depth: 0.8, enter: at(B4, 3),
    render: () => <PdfWindow docId="doc-05" n={1} width={300} height={380} fontSize={10} /> },
  { id: 'P5', cx: 1560, cy: 640, w: 300, h: 380, rot: -1.2, depth: 0.76, enter: at(B4, 4),
    render: () => <PdfWindow docId="doc-01" n={21} width={300} height={380} fontSize={10} /> },
];

/** Étiquettes : plusieurs prêteurs, plusieurs sociétés, plusieurs pays et deux devises (peu de texte, beaucoup de sources). */
const TAGS: { text: string; kind: 'bank' | 'entity' | 'country'; x: number; y: number; enter: number }[] = [
  { text: 'Banque Exemple', kind: 'bank', x: 470, y: 170, enter: 27 },
  { text: 'FR', kind: 'country', x: 1090, y: 260, enter: 29 },
  { text: 'Beispielbank AG', kind: 'bank', x: 1530, y: 410, enter: 31 },
  { text: 'Lumenvale Deutschland GmbH', kind: 'entity', x: 380, y: 430, enter: 33 },
  { text: 'DE', kind: 'country', x: 1580, y: 175, enter: 35 },
  { text: 'Kingsmere Bank plc', kind: 'bank', x: 820, y: 960, enter: 36 },
  { text: 'Lumenvale UK Ltd', kind: 'entity', x: 1290, y: 820, enter: 38 },
  { text: 'GB', kind: 'country', x: 180, y: 820, enter: 39 },
  { text: 'Banque Méridienne', kind: 'bank', x: 1760, y: 650, enter: 40 },
  { text: 'GBP', kind: 'country', x: 700, y: 700, enter: 41 },
  { text: 'Finance Bail Exemple', kind: 'bank', x: 1060, y: 120, enter: 42 },
  { text: 'Lumenvale Industrie SAS', kind: 'entity', x: 1180, y: 600, enter: 44 },
];

/** Convergence (images) ; les plans lointains partent un peu plus tard. */
export const CONVERGE = { start: 50, end: 72 };

export function Chaos({ f }: { f: number }) {
  if (f > SCENES.problem[1] + 3) return null;
  // Poussée de caméra : la complexité se resserre autour du spectateur.
  const g = mix(1, 1.08, p(f, 0, CONVERGE.start, E.soft));
  const focus = p(f, 4, 16, E.out) * (1 - p(f, CONVERGE.start - 4, CONVERGE.start + 6, E.in));
  const drift = f / 30;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {FRAGS.map((fr) => {
        const e = p(f, fr.enter, fr.enter + 8, E.out);
        if (e <= 0) return null;
        // Position dans l'image, poussée de caméra comprise ; chaque rafale arrive avec un petit élan.
        let x = CENTER.x + g * (fr.cx - CENTER.x) - drift * 12 * fr.depth + (1 - e) * 60 * Math.sign(fr.cx - CENTER.x) * fr.depth;
        let y = CENTER.y + g * (fr.cy - CENTER.y) - drift * 6 * fr.depth + (1 - e) * 34 * Math.sign(fr.cy - CENTER.y) * fr.depth;
        const delay = (1.05 - fr.depth) * 8;
        const q = p(f, CONVERGE.start + delay, CONVERGE.end, E.in);
        x = mix(x, CENTER.x, q);
        y = mix(y, CENTER.y, q);
        const scale = (0.86 + 0.14 * e) * g * mix(1, 0.06, q);
        const rot = mix(fr.rot + (1 - e) * 4, 0, q);
        const opacity = e * (1 - p(f, CONVERGE.start + delay + 5, CONVERGE.end, E.in)) * (0.6 + 0.4 * Math.min(fr.depth, 1));
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
      {TAGS.map((t) => {
        const e = p(f, t.enter, t.enter + 6, E.out);
        if (e <= 0) return null;
        let x = CENTER.x + g * (t.x - CENTER.x) - drift * 8;
        let y = CENTER.y + g * (t.y - CENTER.y) - drift * 4;
        const q = p(f, CONVERGE.start + 2, CONVERGE.end - 2, E.in);
        x = mix(x, CENTER.x, q);
        y = mix(y, CENTER.y, q);
        const isCountry = t.kind === 'country';
        return (
          <div key={t.text} style={{
            position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(0.7, 1, e) * mix(1, 0.2, q)})`, opacity: e * (1 - p(f, CONVERGE.start + 6, CONVERGE.end - 2, E.in)),
            zIndex: 300, display: 'inline-flex', alignItems: 'center', gap: 8, height: isCountry ? 34 : 38, padding: isCountry ? '0 10px' : '0 14px 0 10px', borderRadius: isCountry ? 8 : 999,
            background: 'var(--surface)', border: `1px solid ${t.kind === 'bank' ? 'var(--brand-line)' : 'var(--line)'}`, boxShadow: '0 10px 26px rgba(28,25,54,.10)',
            fontSize: isCountry ? 16 : 17, fontWeight: isCountry ? 800 : 650, letterSpacing: isCountry ? '0.05em' : undefined,
            color: isCountry ? 'var(--brand-ink)' : 'var(--ink-2)', whiteSpace: 'nowrap',
          }}>
            {!isCountry && <span style={{ width: 9, height: 9, borderRadius: t.kind === 'bank' ? 3 : '50%', background: t.kind === 'bank' ? 'var(--brand)' : 'var(--c2)' }} />}
            {t.text}
          </div>
        );
      })}
      <CentralPoint f={f} />
    </div>
  );
}

/** Le point où tout converge : il deviendra la marque Covenn (S2). */
function CentralPoint({ f }: { f: number }) {
  const o = p(f, CONVERGE.end - 12, CONVERGE.end - 2, E.out) * (1 - p(f, SCENES.problem[1], SCENES.problem[1] + 3));
  if (o <= 0) return null;
  const r = mix(4, 14, p(f, CONVERGE.end - 10, CONVERGE.end + 2, E.out));
  return (
    <div style={{
      position: 'absolute', left: CENTER.x - r, top: CENTER.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o, zIndex: 400,
      background: 'var(--brand)', boxShadow: `0 0 0 ${r * 0.9}px rgba(143, 128, 220, 0.18), 0 0 ${r * 4}px rgba(74, 51, 179, 0.55)`,
    }} />
  );
}
