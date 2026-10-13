/**
 * Kit d'écrans de projection : mêmes jetons, mêmes classes et mêmes composants que la bêta,
 * pour que les écrans de vision appartiennent visiblement au même logiciel.
 */
import type { CSSProperties, ReactNode } from 'react';
import sidebarCss from '../../beta/src/features/layout/Sidebar/Sidebar.module.css';
import topbarCss from '../../beta/src/features/layout/Topbar/Topbar.module.css';
import { Icon, type IconName } from '../../beta/src/ui/Icon';
import { users } from '../../beta/src/data/users';
import { CURRENT_USER_ID } from '../../beta/src/config/demo';
import { clamp, mix } from '../film/anim';

export const SHADOW = '0 30px 80px rgba(28, 26, 43, 0.12), 0 2px 8px rgba(28, 26, 43, 0.05)';

/** Badge « Projection » : même dessin que le badge « Aperçu » de la bêta. */
export function ProjectionBadge({ scale = 1, text = 'Projection' }: { scale?: number; text?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 20 * scale, padding: `0 ${8 * scale}px`, borderRadius: 999,
      border: `${Math.max(1, scale)}px solid var(--aurora-mauve)`, color: 'var(--indigo-700)', fontSize: 11 * scale, fontWeight: 600, letterSpacing: '0.02em',
      background: 'linear-gradient(90deg, rgba(245, 185, 194, 0.28), rgba(203, 187, 223, 0.28))', whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

/** Code pays (ISO), en pastille sobre. */
export function CountryCode({ code, scale = 1 }: { code: string; scale?: number }) {
  return (
    <span style={{
      display: 'inline-grid', placeItems: 'center', minWidth: 30 * scale, height: 22 * scale, padding: `0 ${6 * scale}px`, borderRadius: 6 * scale,
      background: 'var(--indigo-50)', border: '1px solid var(--indigo-100)', color: 'var(--indigo-700)', fontSize: 11.5 * scale, fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {code}
    </span>
  );
}

/** Barre de répartition (même dessin que DistributionBars de la bêta), remplissage animable. */
export function Bar({ fraction, grow = 1, height = 8, color = 'var(--indigo-500)', track = 'var(--line)' }: {
  fraction: number; grow?: number; height?: number; color?: string; track?: string;
}) {
  return (
    <span style={{ display: 'block', height, borderRadius: 999, background: track, overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${Math.max(2, fraction * 100) * clamp(grow)}%`, borderRadius: 999, background: color }} />
    </span>
  );
}

/** Anneau de répartition (SVG), segments tracés dans l'ordre. */
export function Donut({ size, thickness, slices, draw = 1, gap = 0.012 }: {
  size: number; thickness: number; slices: readonly { fraction: number; color: string }[]; draw?: number; gap?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let start = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
      {slices.map((s, i) => {
        const from = start;
        start += s.fraction;
        const visible = clamp((draw - from) / s.fraction) * Math.max(0, s.fraction - gap);
        if (visible <= 0) return null;
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"
            strokeDasharray={`${visible * c} ${c}`} strokeDashoffset={-from * c} />
        );
      })}
    </svg>
  );
}

/** Texte saisi caractère par caractère (saisie d'une hypothèse), avec curseur de champ. */
export function Typed({ text, t, caret = true }: { text: string; t: number; caret?: boolean }) {
  const n = Math.round(clamp(t) * text.length);
  return (
    <span style={{ whiteSpace: 'pre' }}>
      {text.slice(0, n)}
      {caret && t > 0 && t < 1 && <span style={{ display: 'inline-block', width: 2, height: '0.95em', marginLeft: 2, verticalAlign: '-0.1em', background: 'var(--indigo-600)' }} />}
    </span>
  );
}

/** Nombre qui défile d'une valeur à l'autre (affichage français, décimales fixes). */
export function rollNumber(from: number, to: number, t: number, dp: number): string {
  const v = mix(from, to, clamp(t));
  const s = Math.abs(v).toFixed(dp).replace('.', ',');
  return `${v < 0 && Number(Math.abs(v).toFixed(dp)) !== 0 ? '−' : ''}${s}`;
}

// ---------------------------------------------------------------------------
// Coque de l'application (barre latérale et barre supérieure de la bêta)
// ---------------------------------------------------------------------------
export interface NavEntry { label: string; icon: IconName | ReactNode; active?: boolean; badge?: string }

export function Sidebar({ items, height, markRef }: { items: readonly NavEntry[]; height: number; markRef?: (el: HTMLSpanElement | null) => void }) {
  const user = users.find((u) => u.id === CURRENT_USER_ID);
  return (
    <nav className={sidebarCss.sidebar} style={{ position: 'absolute', left: 0, top: 0, width: 248, height }}>
      <div className={sidebarCss.brand}>
        <span className={sidebarCss.mark} ref={markRef}>
          <svg viewBox="0 0 32 32" width="18" height="18"><path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </span>
        <span className={sidebarCss.wordmark}>Covenn</span>
      </div>
      <div className={sidebarCss.scroll} style={{ overflow: 'hidden' }}>
        <ul className={sidebarCss.list}>
          {items.map((item) => (
            <li key={item.label}>
              <span className={`${sidebarCss.item} ${item.active ? sidebarCss.active : ''}`}>
                {typeof item.icon === 'string' ? <Icon name={item.icon as IconName} size={18} /> : item.icon}
                <span className={sidebarCss.text}>{item.label}</span>
                {item.badge && <span className={sidebarCss.badge}>{item.badge}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {user && (
        <div className={sidebarCss.user}>
          <span className={sidebarCss.avatar}>{user.first_name.charAt(0)}{user.last_name.charAt(0)}</span>
          <span className={sidebarCss.userText}>
            <span className={sidebarCss.userName}>{user.first_name} {user.last_name}</span>
            <span className={sidebarCss.userRole}>{user.job_title}</span>
          </span>
        </div>
      )}
    </nav>
  );
}

export function Topbar({ org, perimeter, asOf, width }: { org: string; perimeter: string; asOf: string; width: number }) {
  const user = users.find((u) => u.id === CURRENT_USER_ID);
  return (
    <header className={topbarCss.topbar} style={{ position: 'absolute', left: 248, top: 0, width, backdropFilter: 'none' }}>
      <div className={topbarCss.org}><Icon name="building" size={16} /><span>{org}</span></div>
      <span className={topbarCss.divider} />
      <span className={topbarCss.pill} style={{ gap: 8, color: 'var(--ink-900)', fontWeight: 600 }}>
        <Icon name="building" size={14} />{perimeter}<Icon name="chevronDown" size={14} />
      </span>
      <div className={topbarCss.spacer} />
      <span className={topbarCss.pill}><Icon name="calendar" size={14} />Données au {asOf}</span>
      {user && <span className={topbarCss.avatar}>{user.first_name.charAt(0)}{user.last_name.charAt(0)}</span>}
    </header>
  );
}

/** Marque Covenn (pictogramme de la bêta) dans un carré arrondi. */
export function Mark({ size, style, glow = 0 }: { size: number; style?: CSSProperties; glow?: number }) {
  return (
    <span style={{
      display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: size * 0.3, color: 'var(--indigo-700)',
      background: '#fff', border: `${Math.max(1.5, size / 60)}px solid var(--indigo-200)`,
      boxShadow: `0 ${size * 0.16}px ${size * 0.5}px rgba(74, 51, 179, ${0.16 + 0.14 * glow}), 0 0 0 ${size * 0.12 * glow}px rgba(207, 200, 241, ${0.5 * glow})`,
      ...style,
    }}>
      <svg viewBox="0 0 32 32" width={size * 0.6} height={size * 0.6} aria-hidden="true">
        <path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Pastille de fichier (PDF, XLSX) qui entre dans Covenn. */
export function FilePill({ name, kind, scale = 1 }: { name: string; kind: 'PDF' | 'XLSX'; scale?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10 * scale, height: 44 * scale, padding: `0 ${16 * scale}px 0 ${8 * scale}px`, borderRadius: 12 * scale,
      background: '#fff', border: '1px solid var(--line-strong)', boxShadow: '0 10px 26px rgba(28,26,43,.08)', whiteSpace: 'nowrap',
      fontSize: 16 * scale, fontWeight: 600, color: 'var(--ink-700)',
    }}>
      <span style={{
        display: 'grid', placeItems: 'center', height: 28 * scale, padding: `0 ${7 * scale}px`, borderRadius: 7 * scale, fontSize: 11 * scale, fontWeight: 800, letterSpacing: '0.04em',
        background: kind === 'PDF' ? 'var(--src-contract-bg)' : 'var(--src-import-bg)', color: kind === 'PDF' ? 'var(--src-contract)' : 'var(--src-import)',
      }}>
        {kind}
      </span>
      {name}
    </span>
  );
}

