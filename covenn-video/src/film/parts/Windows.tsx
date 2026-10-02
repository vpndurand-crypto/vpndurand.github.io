import type { CSSProperties, ReactNode } from 'react';
import { ContractPage } from '../../../beta/src/features/documents/ContractPage';
import contractCss from '../../../beta/src/features/documents/ContractPage.module.css';
import { Icon } from '../../../beta/src/ui/Icon';
import { formatNumber } from '../../../beta/src/domain/format';
import { D } from '../../../beta/src/domain/decimal';
import type { ContractPage as ContractPageData, TrialBalanceLine } from '../../../beta/src/data/types';

/** Styles propres au film pour les documents : la page de la bêta, sans son cadre, avec un surligneur animable (--hl). */
export const DOC_CSS = `
.covenn-doc .${contractCss.sheet} { border: none; border-radius: 0; box-shadow: none; min-height: 0; }
.covenn-doc .${contractCss.highlight} {
  background: linear-gradient(90deg, #FFF1C9 50%, rgba(255, 241, 201, 0) 50%) no-repeat;
  background-size: 200% 100%;
  background-position: calc((1 - var(--hl, 1)) * 100%) 0;
  box-shadow: inset calc(3px * var(--hl, 1)) 0 0 var(--watch-accent);
}
`;

const CHROME_H = 34;

function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }} aria-hidden="true">
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#D6D3E4' }} />)}
    </span>
  );
}

function Shell({ width, height, children, style }: { width: number; height: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      width, height, background: '#fff', borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--line-strong)', boxShadow: '0 18px 48px rgba(28,26,43,.12), 0 2px 6px rgba(28,26,43,.05)', ...style,
    }}>
      {children}
    </div>
  );
}

/** Fenêtre de tableur générique (sans marque) montrant les lignes réelles d'une balance importée. */
export function SpreadsheetWindow({ fileName, lines, width, highlightRows = [], highlight = 0 }: {
  fileName: string; lines: readonly TrialBalanceLine[]; width: number; highlightRows?: readonly number[]; highlight?: number;
}) {
  const rowH = 26;
  const height = CHROME_H + 24 + lines.length * rowH;
  const amount = (v: string) => (D(v).eq(0) ? '' : formatNumber(v, 2));
  const cols = `44px 78px minmax(0, 1fr) 104px 104px`;
  const cell: CSSProperties = { padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid var(--line)', height: '100%', display: 'flex', alignItems: 'center' };
  return (
    <Shell width={width} height={height}>
      <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F1F0F5', borderBottom: '1px solid var(--line)' }}>
        <Dots />
        <span style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', minWidth: 0 }}>
          <Icon name="data" size={14} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        </span>
        <span style={{ width: 39 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, height: 24, background: 'var(--canvas)', borderBottom: '1px solid var(--line)', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)' }}>
        {['', 'A', 'B', 'C', 'D'].map((c, i) => <span key={i} style={{ ...cell, justifyContent: 'center' }}>{c}</span>)}
      </div>
      {lines.map((line) => {
        const on = highlightRows.includes(line.row) ? highlight : 0;
        return (
          <div key={line.row} data-row={line.row} style={{
            display: 'grid', gridTemplateColumns: cols, height: rowH, fontSize: 12.5, fontVariantNumeric: 'tabular-nums',
            borderBottom: '1px solid var(--line)', color: on > 0.5 ? 'var(--indigo-800)' : 'var(--ink-700)',
            background: `rgba(230, 226, 248, ${0.9 * on})`, boxShadow: `inset ${3 * on}px 0 0 var(--indigo-500)`, fontWeight: on > 0.5 ? 600 : 400,
          }}>
            <span style={{ ...cell, justifyContent: 'center', background: 'var(--canvas)', color: 'var(--ink-400)', fontSize: 11 }}>{line.row}</span>
            <span style={cell}>{line.account_number}</span>
            <span style={cell}>{line.label}</span>
            <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.debit)}</span>
            <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.credit)}</span>
          </div>
        );
      })}
    </Shell>
  );
}

export const spreadsheetHeight = (rows: number): number => CHROME_H + 24 + rows * 26;

/** Document PDF ouvert : la page rédigée de la bêta (ContractPage), surlignage animable. */
export function PdfWindow({ fileName, page, pageCount, width, height, highlightId = null, highlight = 0, compact = true }: {
  fileName: string; page: ContractPageData; pageCount: number; width: number; height: number; highlightId?: string | null; highlight?: number; compact?: boolean;
}) {
  return (
    <Shell width={width} height={height} style={{ borderRadius: 6 }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-700)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-500)', border: '1px solid var(--line-strong)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>
        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        <span style={{ color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>p. {page.page} / {pageCount}</span>
      </div>
      <div className="covenn-doc" style={{ ['--hl' as string]: String(highlight) } as CSSProperties}>
        <ContractPage page={page} pageCount={pageCount} highlight={highlight > 0 ? highlightId : null} compact={compact} />
      </div>
    </Shell>
  );
}

/** Fenêtre d'un autre logiciel (portail, visionneuse) affichant un document réel du jeu de démonstration. */
export function AppWindow({ title, page, pageCount, width, height, highlightId = null, highlight = 0 }: {
  title: string; page: ContractPageData; pageCount: number; width: number; height: number; highlightId?: string | null; highlight?: number;
}) {
  return (
    <Shell width={width} height={height}>
      <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F1F0F5', borderBottom: '1px solid var(--line)' }}>
        <Dots />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div className="covenn-doc" style={{ ['--hl' as string]: String(highlight), padding: '6px 10px' } as CSSProperties}>
        <ContractPage page={page} pageCount={pageCount} highlight={highlight > 0 ? highlightId : null} compact />
      </div>
    </Shell>
  );
}
