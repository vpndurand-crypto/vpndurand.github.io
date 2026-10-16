/**
 * Documents du film Capital OS : ceux de la bêta (contrats, relevés des prêteurs, balances comptables, liasses des filiales
 * étrangères, dossier Project Falcon), avec leurs noms de fichiers, leurs pages et leurs lignes. Les pages sont rendues avec
 * la classe .docpage de la bêta ; les fenêtres (tableur, lecteur PDF, portail) sont un habillage neutre du film.
 */
import type { CSSProperties, ReactNode } from 'react';
import S from './snapshot.json';
import { Icon } from './kit';

type DocId = (typeof S.documents)[number]['id'];

function need<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Document absent de la bêta : ${what}`);
  return value;
}

export const doc = (id: DocId | string) => need(S.documents.find((d) => d.id === id), `document ${id}`);
const page = (id: string, n: number) => need(S.pages.find((p) => p.document_id === id && p.page === n), `page ${n} de ${id}`);

// ---------------------------------------------------------------------------
// Balances : lignes de la bêta (plan comptable français et plan de groupe), libellés anglais de la bêta
// ---------------------------------------------------------------------------
export interface TbLine { account: string; label: string; debit: number; credit: number }
const PCG = S.tbPcg as unknown as Record<string, { lines: [string, number, number][] }>;
const GRC = S.tbGrc as unknown as Record<string, { lines: [string, number, number][] }>;
const PCG_LABELS = S.pcgLabels as Record<string, string>;
const GRC_LABELS = S.grcLabels as Record<string, string>;

/** Fichier importé pour une balance (Documents & data de la bêta). */
export const balanceFile = (id: string) => need(S.importJobs.find((j) => j.balance === id), `import ${id}`).file;

/** Lignes [from, to] (rangs à partir de 0) d'une balance de la bêta. */
export function tbLines(id: string, from: number, to: number): TbLine[] {
  const group = id in GRC;
  const tb = need(group ? GRC[id] : PCG[id], `balance ${id}`);
  return tb.lines.slice(from, to + 1).map(([account, debit, credit]) => ({
    account, debit, credit, label: need((group ? GRC_LABELS : PCG_LABELS)[account], `libellé du compte ${account}`),
  }));
}

/** Montant d'une balance (centimes) au format de la bêta : 10,000,000.00 ; vide si nul. */
function amount(cents: number): string {
  if (!cents) return '';
  const [a = '0', b = '00'] = (cents / 100).toFixed(2).split('.');
  return `${a.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${b}`;
}

// ---------------------------------------------------------------------------
// Fenêtres
// ---------------------------------------------------------------------------
const CHROME_H = 34;
const WINDOW_SHADOW = '0 18px 48px rgba(28,25,54,.12), 0 2px 6px rgba(28,25,54,.05)';

function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }} aria-hidden="true">
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#D9D8E3' }} />)}
    </span>
  );
}

function Shell({ width, height, children, radius = 10, style }: { width: number; height: number; children: ReactNode; radius?: number; style?: CSSProperties }) {
  return (
    <div style={{ width, height, background: '#fff', borderRadius: radius, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: WINDOW_SHADOW, ...style }}>
      {children}
    </div>
  );
}

/** Code pays (contrats et liasses des filiales étrangères). */
function CountryTag({ code }: { code?: string | undefined }) {
  if (!code) return null;
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--brand-ink)', background: 'var(--brand-soft)', border: '1px solid var(--brand-line)', borderRadius: 4, padding: '1px 5px' }}>{code}</span>;
}

export const spreadsheetHeight = (rows: number): number => CHROME_H + 24 + rows * 26;

/** Tableur générique : lignes de balance de la bêta (compte, libellé, débit, crédit). */
export function SpreadsheetWindow({ fileName, lines, width, currency, country }: { fileName: string; lines: readonly TbLine[]; width: number; currency?: string; country?: string }) {
  const rowH = 26;
  const height = spreadsheetHeight(lines.length);
  const cols = `40px 72px minmax(0, 1fr) 112px 112px`;
  const cell: CSSProperties = { padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid var(--line-2)', height: '100%', display: 'flex', alignItems: 'center' };
  return (
    <Shell width={width} height={height}>
      <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F0F0F5', borderBottom: '1px solid var(--line)' }}>
        <Dots />
        <span style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', minWidth: 0 }}>
          <Icon name="data" size={14} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        </span>
        {currency && currency !== 'EUR' && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ok)', background: 'var(--ok-soft)', borderRadius: 4, padding: '1px 5px' }}>{currency}</span>}
        <CountryTag code={country} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, height: 24, background: 'var(--paper)', borderBottom: '1px solid var(--line)', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
        {['', 'A', 'B', 'C', 'D'].map((c, i) => <span key={i} style={{ ...cell, justifyContent: 'center' }}>{c}</span>)}
      </div>
      {lines.map((line, i) => (
        <div key={line.account} style={{ display: 'grid', gridTemplateColumns: cols, height: rowH, fontSize: 12.5, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--line-2)', color: 'var(--ink-2)' }}>
          <span style={{ ...cell, justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 11 }}>{i + 2}</span>
          <span style={cell}>{line.account}</span>
          <span style={cell}>{line.label}</span>
          <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.debit)}</span>
          <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.credit)}</span>
        </div>
      ))}
    </Shell>
  );
}

/** Page d'un document de la bêta (.docpage) : en-tête courant, blocs, bloc surligné (.blk.hl, opacité animable). */
export function DocPage({ docId, n, highlightId = null, highlight = 0, fontSize = 14, padding = '28px 32px' }: {
  docId: string; n: number; highlightId?: string | null; highlight?: number; fontSize?: number; padding?: string;
}) {
  const pg = page(docId, n);
  const d = doc(docId);
  return (
    <div className="docpage" style={{ fontSize, padding, maxWidth: 'none', border: 0, borderRadius: 0, boxShadow: 'none', height: '100%' }}>
      <div className="rh" style={{ fontSize: fontSize * 0.82 }}><span>{pg.running_header}</span><span>Page {n} of {d.page_count}</span></div>
      {pg.blocks.map((b) => {
        const hl = b.id === highlightId ? highlight : 0;
        return (
          <div key={b.id} className={`blk${b.kind === 'title' ? ' title' : b.kind === 'h' ? ' h' : ''}`} style={{
            fontSize: b.kind === 'title' ? fontSize * 1.43 : undefined,
            background: hl > 0 ? `rgba(255, 243, 196, ${hl})` : undefined, boxShadow: hl > 0 ? `inset ${3 * hl}px 0 0 #e0b400` : undefined,
          }}>
            {b.text}
          </div>
        );
      })}
    </div>
  );
}

/** Document PDF ouvert sur une page de la bêta. */
export function PdfWindow({ docId, n, width, height, highlightId = null, highlight = 0, fontSize = 13, country }: {
  docId: string; n: number; width: number; height: number; highlightId?: string | null; highlight?: number; fontSize?: number; country?: string;
}) {
  const d = doc(docId);
  return (
    <Shell width={width} height={height} radius={6}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--paper)', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-2)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>
        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name}</span>
        <CountryTag code={country} />
        <span style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>p. {n} / {d.page_count}</span>
      </div>
      <div style={{ height: height - 30 }}>
        <DocPage docId={docId} n={n} highlightId={highlightId} highlight={highlight} fontSize={fontSize} padding={`${fontSize * 1.5}px ${fontSize * 1.7}px`} />
      </div>
    </Shell>
  );
}

/** Fenêtre d'un autre logiciel (portail bancaire, visionneuse) affichant un document de la bêta. */
export function AppWindow({ docId, n = 1, width, height, fontSize = 12 }: { docId: string; n?: number; width: number; height: number; fontSize?: number }) {
  const d = doc(docId);
  return (
    <Shell width={width} height={height}>
      <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F0F0F5', borderBottom: '1px solid var(--line)' }}>
        <Dots />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
      </div>
      <div style={{ height: height - CHROME_H }}>
        <DocPage docId={docId} n={n} fontSize={fontSize} padding={`${fontSize * 1.3}px ${fontSize * 1.6}px`} />
      </div>
    </Shell>
  );
}
