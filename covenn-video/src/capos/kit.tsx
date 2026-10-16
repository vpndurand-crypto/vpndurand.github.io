/**
 * Kit d'écrans du film Capital OS : la coque et les composants de la bêta « Capital operating system », redessinés en React
 * avec ses propres classes CSS (beta.css, extrait de la bêta et limité à .capos), ses icônes (snapshot.icons) et ses libellés.
 * Seules les tailles de texte sont agrandies pour la lecture à l'écran (le film est vu en 1920 × 1080, souvent en réduction).
 */
import type { CSSProperties, ReactNode } from 'react';
import S from './snapshot.json';
import { clamp } from '../film/anim';
import type { StatusCode } from './data';

export type IconName = keyof typeof S.icons;

/** Ombre des panneaux flottants (teinte de l'encre de la bêta). */
export const SHADOW = '0 30px 80px rgba(28, 25, 54, 0.13), 0 2px 8px rgba(28, 25, 54, 0.05)';

/** Icône de la bêta (tracés 24 × 24, trait 1,9). */
export function Icon({ name, size = 18, stroke = 1.9, style }: { name: IconName; size?: number; stroke?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flex: 'none', ...style }} dangerouslySetInnerHTML={{ __html: S.icons[name] }} />
  );
}

/** Pictogramme de la marque (même tracé que la bêta). */
function Arc({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
    </svg>
  );
}

/** Marque Covenn : le carré violet de la bêta (brand-mark), à n'importe quelle taille. */
export function Mark({ size, glow = 0, style }: { size: number; glow?: number; style?: CSSProperties }) {
  return (
    <span style={{
      display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: size * 0.267, background: 'var(--brand)',
      boxShadow: `0 ${size * 0.16}px ${size * 0.5}px rgba(74, 51, 179, ${0.22 + 0.16 * glow}), 0 0 0 ${size * 0.12 * glow}px rgba(217, 210, 245, ${0.6 * glow})`,
      ...style,
    }}>
      <Arc size={size * 0.6} color="#fff" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Badges, étiquettes, liens de source
// ---------------------------------------------------------------------------
const STATUS_BADGE: Record<StatusCode, [string, string]> = {
  COMPLIANT: ['b-ok', 'Compliant'], WATCH: ['b-watch', 'Watch'], CRITICAL: ['b-crit', 'Critical headroom'], BREACH: ['b-breach', 'Breach'], NOT_COMPUTABLE: ['b-neutral', 'Data missing'],
};

/** Badge de la bêta (.badge .b-*), avec ou sans point, agrandi d'un facteur `scale`. */
export function Badge({ tone, children, dot = false, scale = 1, style }: { tone: string; children: ReactNode; dot?: boolean; scale?: number; style?: CSSProperties }) {
  return (
    <span className={`badge ${tone}`} style={{ fontSize: 12 * scale, padding: `${2 * scale}px ${9 * scale}px`, gap: 5 * scale, ...style }}>
      {dot && <i style={{ width: 6 * scale, height: 6 * scale }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, scale = 1, style }: { status: StatusCode; scale?: number; style?: CSSProperties }) {
  const [tone, label] = STATUS_BADGE[status];
  return <Badge tone={tone} dot scale={scale} {...(style ? { style } : {})}>{label}</Badge>;
}

/** Étiquette (.tag) ; `proj` : étiquette pointillée des projections (« Illustrative forecast »). */
export function Tag({ children, proj = false, scale = 1, style }: { children: ReactNode; proj?: boolean; scale?: number; style?: CSSProperties }) {
  return <span className={`tag${proj ? ' proj' : ''}`} style={{ fontSize: 11.5 * scale, padding: `${1 * scale}px ${7 * scale}px`, borderRadius: 6 * scale, ...style }}>{children}</span>;
}

/** Lien vers la source (« Trace to source », « Clause 19.2, page 47 ») : couleur de marque, pictogramme de lien. */
export function SourceLink({ label, size = 13, style }: { label: string; size?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, color: 'var(--brand)', fontSize: size, fontWeight: 550, whiteSpace: 'nowrap', ...style }}>
      <Icon name="source" size={size * 1.05} />{label}
    </span>
  );
}

/** Code pays, dans une étiquette de la bêta. */
export function CountryCode({ code, scale = 1 }: { code: string; scale?: number }) {
  return (
    <span className="tag" style={{ minWidth: 30 * scale, height: 22 * scale, justifyContent: 'center', padding: `0 ${6 * scale}px`, fontSize: 11.5 * scale, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--brand-ink)', borderColor: 'var(--brand-line)', background: 'var(--brand-soft)' }}>
      {code}
    </span>
  );
}

/** Barre de répartition (.bar-track / .bar-fill de la bêta), remplissage animable. */
export function Bar({ fraction, grow = 1, height = 10, color = 'var(--c1)' }: { fraction: number; grow?: number; height?: number; color?: string }) {
  return (
    <span className="bar-track" style={{ display: 'block', height, borderRadius: height / 2 }}>
      <span className="bar-fill" style={{ display: 'block', width: `${Math.max(1.5, fraction * 100) * clamp(grow)}%`, background: color, borderRadius: height / 2 }} />
    </span>
  );
}

/**
 * Texte saisi caractère par caractère, avec curseur de champ. Un montant (« 7,500,000 ») est saisi chiffre par chiffre et
 * remis en forme à chaque frappe, comme dans un champ numérique : 7 · 75 · 750 · 7,500 · 75,000 · 750,000 · 7,500,000.
 */
export function Typed({ text, t, caret = true }: { text: string; t: number; caret?: boolean }) {
  const numeric = /^[\d,]+$/.test(text);
  const digits = text.replace(/,/g, '');
  const shown = numeric
    ? digits.slice(0, Math.round(clamp(t) * digits.length)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : text.slice(0, Math.round(clamp(t) * text.length));
  return (
    <span style={{ whiteSpace: 'pre' }}>
      {shown}
      {caret && t > 0 && t < 1 && <span style={{ display: 'inline-block', width: 2, height: '0.95em', marginLeft: 2, verticalAlign: '-0.1em', background: 'var(--brand)' }} />}
    </span>
  );
}

/** Pastille de fichier (PDF, XLSX) qui entre dans Covenn. */
export function FilePill({ name, kind, scale = 1 }: { name: string; kind: 'PDF' | 'XLSX'; scale?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10 * scale, height: 44 * scale, padding: `0 ${16 * scale}px 0 ${8 * scale}px`, borderRadius: 12 * scale,
      background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 10px 26px rgba(28,25,54,.08)', whiteSpace: 'nowrap',
      fontSize: 16 * scale, fontWeight: 600, color: 'var(--ink-2)',
    }}>
      <span style={{
        display: 'grid', placeItems: 'center', height: 28 * scale, padding: `0 ${7 * scale}px`, borderRadius: 7 * scale, fontSize: 11 * scale, fontWeight: 800, letterSpacing: '0.04em',
        background: kind === 'PDF' ? 'var(--crit-soft)' : 'var(--ok-soft)', color: kind === 'PDF' ? 'var(--crit)' : 'var(--ok)',
      }}>
        {kind}
      </span>
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Coque de l'application : barre latérale et barre supérieure de la bêta
// ---------------------------------------------------------------------------
export type Section = 'overview' | 'capital' | 'debt' | 'covenants' | 'scenarios' | 'financing' | 'providers' | 'data' | 'activity' | 'settings';
const NAV: { label: string; items: { key: Section; label: string; icon: IconName }[] }[] = [
  { label: 'Workspace', items: [
    { key: 'overview', label: 'Overview', icon: 'overview' }, { key: 'capital', label: 'Capital structure', icon: 'capital' },
    { key: 'debt', label: 'Debt & facilities', icon: 'debt' }, { key: 'covenants', label: 'Covenants', icon: 'covenants' },
    { key: 'scenarios', label: 'Forecast & scenarios', icon: 'scenarios' },
  ] },
  { label: 'Financing', items: [{ key: 'financing', label: 'Financing workspace', icon: 'financing' }, { key: 'providers', label: 'Capital providers', icon: 'providers' }] },
  { label: 'Foundations', items: [
    { key: 'data', label: 'Documents & data', icon: 'data' }, { key: 'activity', label: 'Activity', icon: 'activity' }, { key: 'settings', label: 'Settings', icon: 'settings' },
  ] },
];
export const SIDE_W = 240;
export const TOP_H = 58;

export function Sidebar({ active, height }: { active: Section; height: number }) {
  return (
    <aside className="side" style={{ position: 'absolute', left: 0, top: 0, width: SIDE_W, height, overflow: 'hidden' }}>
      <div className="brand">
        <span className="brand-mark"><Arc size={18} color="#fff" /></span>
        <div><div className="brand-name">Covenn</div><div className="brand-sub">Capital operating system</div></div>
      </div>
      <nav className="nav">
        {NAV.map((g) => (
          <div key={g.label} className="nav-group">
            <div className="nav-label">{g.label}</div>
            {g.items.map((it) => (
              <a key={it.key} className={it.key === active ? 'on' : ''}><Icon name={it.icon} size={17} />{it.label}</a>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <a className="small muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="vision" size={15} />Product vision</a>
        <span className="demo-tag"><i />Interactive demo · Fictional data</span>
      </div>
    </aside>
  );
}

export function Topbar({ width, scope }: { width: number; scope: string }) {
  return (
    <header className="top" style={{ position: 'absolute', left: SIDE_W, top: 0, width, height: TOP_H, backdropFilter: 'none', background: 'var(--paper)', flexWrap: 'nowrap' }}>
      <div className="scope">
        <span className="scope-btn"><Icon name="capital" size={15} /><span><span className="faint">Scope</span> <b>{scope}</b></span><Icon name="down" size={14} /></span>
      </div>
      <span className="pill">Reporting currency <b>EUR</b></span>
      <span className="pill">As of <b>{S.fmtAsOf}</b></span>
      <span className="pill"><span className="dot" style={{ background: 'var(--ok)' }} />Trial balances 5/5 · lender balances 6/6</span>
      <span className="top-spacer" />
      <span className="demo-tag"><i />Interactive demo · Fictional data</span>
    </header>
  );
}
