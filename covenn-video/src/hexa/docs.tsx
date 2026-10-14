/**
 * Documents du film en anglais (V5) : balances de la bêta (libellés traduits, montants d'origine), extraits de contrats
 * traduits, et les fenêtres qui les montrent. Même dessin que les fenêtres de la v2 et la page de contrat de la bêta
 * (mêmes classes CSS) ; seuls la langue et les formats changent.
 */
import type { CSSProperties, ReactNode } from 'react';
import contractCss from '../../beta/src/features/documents/ContractPage.module.css';
import { seedBalances } from '../../beta/src/data/balances';
import type { TrialBalanceLine } from '../../beta/src/data/types';
import { Icon } from '../../beta/src/ui/Icon';
import { D } from '../../beta/src/domain/decimal';
import { num } from './format';

// ---------------------------------------------------------------------------
// Balances : lignes réelles de la bêta, libellés en anglais
// ---------------------------------------------------------------------------
const ACCOUNT_EN: Record<string, string> = {
  'Personnel, rémunérations dues': 'Payroll payable',
  'Sécurité sociale': 'Social security payable',
  'TVA déductible sur biens et services': 'VAT recoverable',
  'TVA collectée': 'VAT collected',
  'Valeurs mobilières de placement': 'Marketable securities',
  'Banque Exemple': 'Bank A — current account',
  'Banque Méridienne': 'Bank C — current account',
  Caisse: 'Petty cash',
  'Achats de matières premières': 'Raw material purchases',
  'Fournitures non stockables': 'Non-stock supplies',
  'Locations immobilières': 'Property rentals',
  Honoraires: 'Professional fees',
  'Transports sur achats': 'Inbound freight',
  'Impôts directs': 'Direct taxes',
  'Salaires et appointements': 'Salaries and wages',
  'Cotisations URSSAF': 'Social contributions',
  'Redevances pour concessions et brevets': 'Licence and patent royalties',
  'Capital souscrit, appelé, versé': 'Share capital, paid-up',
  'Autres réserves': 'Other reserves',
  'Emprunt Banque Aurore': 'Bank B term loan',
  Constructions: 'Buildings',
  'Matériel industriel': 'Industrial equipment',
  'Amortissements du matériel industriel': 'Accum. depreciation — equipment',
  Fournisseurs: 'Trade payables',
  Clients: 'Trade receivables',
  'Matériel de bureau et informatique': 'Office and IT equipment',
  'Amortissements du matériel de bureau': 'Accum. depreciation — office',
  'Tirage crédit renouvelable': 'RCF drawing',
};

export const BALANCE_FILES: Record<string, string> = {
  'tb-di-2026-09-30': 'TrialBalance_DemoIndustries_2026-09-30.xlsx',
  'tb-di-2025-09-30': 'TrialBalance_DemoIndustries_2025-09-30.xlsx',
  'tb-di-2025-12-31': 'TrialBalance_DemoIndustries_2025-12-31.xlsx',
  'tb-dl-2026-09-30': 'TrialBalance_DemoLogistics_2026-09-30.xlsx',
  'tb-ds-2026-09-30': 'TrialBalance_DemoServices_2026-09-30.xlsx',
};

/** Lignes [from, to] d'une balance de la bêta, libellés traduits (une ligne sans traduction arrête le rendu). */
export function balanceRows(id: string, from: number, to: number): TrialBalanceLine[] {
  const b = seedBalances.find((x) => x.id === id);
  if (!b) throw new Error(`Balance absente : ${id}`);
  return b.lines.filter((l) => l.row >= from && l.row <= to).map((l) => {
    const label = ACCOUNT_EN[l.label];
    if (!label) throw new Error(`Libellé sans traduction : ${l.label}`);
    return { ...l, label };
  });
}

// ---------------------------------------------------------------------------
// Extraits de contrats (traduction des pages de la bêta)
// ---------------------------------------------------------------------------
export interface PageBlock { id: string; kind: 'title' | 'heading' | 'paragraph'; text: string }
export interface DocPage { key: string; page: number; pageCount: number; header: string; blocks: PageBlock[] }

const SFA = 'Senior Facility Agreement — Demo Industries SAS';
export const PAGES = {
  sfa1: { key: 'sfa1', page: 1, pageCount: 96, header: SFA, blocks: [
    { id: 'cover-title', kind: 'title', text: 'Senior Facility Agreement' },
    { id: 'cover-parties', kind: 'paragraph', text: 'between Demo Industries SAS, as Borrower, and Bank A, as Lender.' },
    { id: 'cover-amount', kind: 'paragraph', text: 'Term loan facility in a principal amount of €10,000,000.' },
    { id: 'cover-date', kind: 'paragraph', text: 'Signed in Paris on December 15, 2025.' },
  ] },
  sfa21: { key: 'sfa21', page: 21, pageCount: 96, header: SFA, blocks: [
    { id: 'art-9-title', kind: 'heading', text: 'Clause 9 — Interest' },
    { id: 'art-9-1', kind: 'paragraph', text: '9.1 The Facility bears interest at 3-month EURIBOR plus a margin of 2.50% per annum, payable quarterly in arrears.' },
  ] },
  sfa47: { key: 'sfa47', page: 47, pageCount: 96, header: SFA, blocks: [
    { id: 'art-19-title', kind: 'heading', text: 'Clause 19 — Financial covenants' },
    { id: 'art-19-1', kind: 'paragraph', text: '19.1 Test Dates. The covenants in this Clause are tested on March 31, June 30, September 30 and December 31 of each year, the first Test Date being March 31, 2026.' },
    { id: 'art-19-2', kind: 'paragraph', text: '19.2 Leverage Ratio. The ratio of Net Financial Debt to EBITDA shall not exceed 3.50x on each Test Date up to and including June 30, 2027, and 3.25x from July 1, 2027.' },
    { id: 'art-19-3', kind: 'paragraph', text: '19.3 Gearing Ratio. The ratio of Net Financial Debt to Equity shall not exceed 1.00x on each Test Date.' },
  ] },
  amortization: { key: 'amortization', page: 1, pageCount: 2, header: 'Bank A — Amortization schedule', blocks: [
    { id: 'title', kind: 'title', text: 'Amortization schedule — Facility SFA-2025-001' },
    { id: 'crd', kind: 'paragraph', text: 'Outstanding principal at September 30, 2026: €10,000,000.00. Bullet repayment on December 31, 2029.' },
  ] },
  memo: { key: 'memo', page: 1, pageCount: 3, header: 'Demo Industries SAS — Finance department', blocks: [
    { id: 'title', kind: 'title', text: 'Memo — Q3 2026 non-recurring costs' },
    { id: 'ncr', kind: 'paragraph', text: 'Reorganization of the production workshop: advisory fees and severance, totaling €150,000, booked under external and personnel expenses.' },
  ] },
  loanB: { key: 'loanB', page: 1, pageCount: 38, header: 'Bank B — Loan agreement', blocks: [
    { id: 'title', kind: 'title', text: 'Medium-term loan agreement — Demo Logistics SAS' },
    { id: 'terms', kind: 'paragraph', text: 'Loan of €3,000,000 at a fixed rate of 3.20%, repayable quarterly in principal instalments of €125,000 until December 31, 2030.' },
  ] },
  lease: { key: 'lease', page: 1, pageCount: 44, header: 'Lease Co. — Real-estate lease', blocks: [
    { id: 'title', kind: 'title', text: 'Real-estate lease agreement — logistics platform' },
    { id: 'terms', kind: 'paragraph', text: 'Financing of €1,800,000 over ten years from March 31, 2021, with rent payable under the lessor’s schedule.' },
  ] },
  rcf: { key: 'rcf', page: 1, pageCount: 27, header: 'Bank C — Revolving credit facility', blocks: [
    { id: 'title', kind: 'title', text: 'Revolving credit facility agreement — Demo Services SAS' },
    { id: 'terms', kind: 'paragraph', text: 'Credit line with a limit of €2,000,000, drawings at 1-month EURIBOR plus 1.50%, maturing June 30, 2027.' },
  ] },
  statement: { key: 'statement', page: 1, pageCount: 1, header: 'Bank C — Statement', blocks: [
    { id: 'title', kind: 'title', text: 'Account statement at September 30, 2026' },
    { id: 'drawn', kind: 'paragraph', text: 'Outstanding drawing on revolving credit facility RCF-2024-009: €500,000.00.' },
  ] },
} satisfies Record<string, DocPage>;

export const DOC_FILES = {
  sfa: 'SFA_DemoIndustries_BankA_2025-12-15.pdf',
  loanB: 'Loan_DemoLogistics_BankB_2024-12-10.pdf',
  lease: 'Lease_DemoLogistics_LeaseCo_2021-03-15.pdf',
  rcf: 'RCF_DemoServices_BankC_2024-06-20.pdf',
  amortization: 'Amortization schedule at Sep 30, 2026 — Bank A',
  memo: 'Supporting note — Q3 2026 non-recurring costs',
  statement: 'Bank statement at Sep 30, 2026 — Bank C',
} as const;

// ---------------------------------------------------------------------------
// Fenêtres
// ---------------------------------------------------------------------------
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

/** Pastille de pays dans une barre de titre (contrats des filiales étrangères). */
function CountryTag({ code }: { code?: string | undefined }) {
  if (!code) return null;
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--indigo-700)', background: 'var(--indigo-50)', border: '1px solid var(--indigo-100)', borderRadius: 4, padding: '1px 5px' }}>{code}</span>;
}

export const spreadsheetHeight = (rows: number): number => CHROME_H + 24 + rows * 26;

/** Tableur générique (sans marque) : lignes de balance, montants au format anglais. */
export function SpreadsheetWindow({ fileName, lines, width }: { fileName: string; lines: readonly TrialBalanceLine[]; width: number }) {
  const rowH = 26;
  const height = CHROME_H + 24 + lines.length * rowH;
  const amount = (v: string) => (D(v).eq(0) ? '' : num(v, 2));
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
      {lines.map((line) => (
        <div key={line.row} style={{ display: 'grid', gridTemplateColumns: cols, height: rowH, fontSize: 12.5, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--line)', color: 'var(--ink-700)' }}>
          <span style={{ ...cell, justifyContent: 'center', background: 'var(--canvas)', color: 'var(--ink-400)', fontSize: 11 }}>{line.row}</span>
          <span style={cell}>{line.account_number}</span>
          <span style={cell}>{line.label}</span>
          <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.debit)}</span>
          <span style={{ ...cell, justifyContent: 'flex-end' }}>{amount(line.credit)}</span>
        </div>
      ))}
    </Shell>
  );
}

/** Page de contrat (classes de la bêta), en anglais. */
export function ContractPage({ page, highlight = null, compact = true }: { page: DocPage; highlight?: string | null; compact?: boolean }) {
  return (
    <div className={`${contractCss.sheet} ${compact ? contractCss.compact : ''}`}>
      <div className={contractCss.header}>{page.header}</div>
      <div className={contractCss.body}>
        {page.blocks.map((block) => {
          const Tag = block.kind === 'title' ? 'h2' : block.kind === 'heading' ? 'h3' : 'p';
          return <Tag key={block.id} className={`${contractCss[block.kind]} ${block.id === highlight ? contractCss.highlight : ''}`}>{block.text}</Tag>;
        })}
      </div>
      <div className={contractCss.footer}>Illustrative document — Covenn demo · page {page.page} of {page.pageCount}</div>
    </div>
  );
}

/** Document PDF ouvert, surlignage animable (--hl). */
export function PdfWindow({ fileName, page, width, height, highlightId = null, highlight = 0, compact = true, country }: {
  fileName: string; page: DocPage; width: number; height: number; highlightId?: string | null; highlight?: number; compact?: boolean; country?: string;
}) {
  return (
    <Shell width={width} height={height} style={{ borderRadius: 6 }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-700)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-500)', border: '1px solid var(--line-strong)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>
        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        <CountryTag code={country} />
        <span style={{ color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>p. {page.page} / {page.pageCount}</span>
      </div>
      <div className="covenn-doc" style={{ ['--hl' as string]: String(highlight) } as CSSProperties}>
        <ContractPage page={page} highlight={highlight > 0 ? highlightId : null} compact={compact} />
      </div>
    </Shell>
  );
}

/** Fenêtre d'un autre logiciel (portail bancaire, visionneuse) affichant un document. */
export function AppWindow({ title, page, width, height }: { title: string; page: DocPage; width: number; height: number }) {
  return (
    <Shell width={width} height={height}>
      <div style={{ height: CHROME_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: '#F1F0F5', borderBottom: '1px solid var(--line)' }}>
        <Dots />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div className="covenn-doc" style={{ padding: '6px 10px' }}>
        <ContractPage page={page} compact />
      </div>
    </Shell>
  );
}

/** Contrat d'une filiale étrangère (projection) : titre anglais, pays en pastille, texte figuré par des lignes neutres. */
export function ForeignDoc({ fileName, title, party, country, width, height }: { fileName: string; title: string; party: string; country: string; width: number; height: number }) {
  const lines = [0.96, 0.9, 0.98, 0.72, 0, 0.94, 0.88, 0.97, 0.6, 0, 0.92, 0.85, 0.7];
  return (
    <div style={{ width, height, background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line-strong)', boxShadow: '0 18px 48px rgba(28,26,43,.12), 0 2px 6px rgba(28,26,43,.05)' }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-700)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-500)', border: '1px solid var(--line-strong)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>
        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        <CountryTag code={country} />
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
