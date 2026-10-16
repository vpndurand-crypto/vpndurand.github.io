import type { CSSProperties } from 'react';
import { E, life, mix, p } from '../../film/anim';
import { REQUEST, SCENARIO } from '../data';
import { Badge, Icon, SHADOW, Tag } from '../kit';
import { CHECK_LOCKS, PACKAGE_DONE, SCENARIO_LAND, warp } from '../timing';
import { S6, SCENARIO_SLOT } from './Simulation';

/**
 * S7 — « Prepare your next financing. » (Financing workspace de la bêta ; images V4, voir timing.warp)
 * Le scénario devient le « Linked scenario » de la demande de financement Project Falcon ; les huit pièces de la liste
 * de préparation de la bêta se remplissent en cascade à partir des données déjà dans Covenn (disponibles, ou reliées aux
 * données existantes) ; une seule reste à relire. Préparation 7/8, la demande est prête pour la revue interne et le
 * dossier peut être généré : aucun financement accordé, aucune offre, aucune promesse.
 * La sortie (recul de la caméra vers la structure du capital) est faite par S8 (CapitalOverview.packageTransform).
 */
export const S7 = { panel: { x: 240, y: 196, w: 1440, h: 812 } };
const D = S7.panel;
const LIST = { x: D.x + 40, y: D.y + 184, w: 860, h: 600 };
const ROW = { top: 74, h: 63 };
const SIDE = { x: SCENARIO_SLOT.x, w: SCENARIO_SLOT.w };
const PROGRESS = { y: SCENARIO_SLOT.y + SCENARIO_SLOT.h + 24, h: 142 };

/** Image (V4) où chaque pièce se pose ; le scénario arrive en premier, en sortant de la simulation. */
const landAt = (i: number) => warp(CHECK_LOCKS[i] ?? 0);
export const SCENARIO_LANDED = warp(SCENARIO_LAND);
export const DOSSIER_DONE = warp(PACKAGE_DONE);
/** Lente poussée de caméra pendant que les pièces se posent, jusqu'au recul de S8 (images V4). */
export const breatheAt = (f: number) => mix(1, 1.025, p(f, landAt(3), 712, E.soft));

const DONE = new Set(['AVAILABLE', 'LINKED']);

export function Request({ f }: { f: number }) {
  if (f < S6.toDossier[0] || f > 760) return null;
  const panelIn = p(f, S6.toDossier[0] + 2, S6.toDossier[1], E.out);
  const breathe = breatheAt(f);
  const landed = REQUEST.checklist.filter((c, i) => f >= landAt(i) && DONE.has(c.status)).length;
  const done = p(f, DOSSIER_DONE, DOSSIER_DONE + 12, E.out);
  const sweep = p(f, DOSSIER_DONE + 2, DOSSIER_DONE + 28, E.inOut);
  const glow = life(f, DOSSIER_DONE + 4, DOSSIER_DONE + 10, DOSSIER_DONE + 16, DOSSIER_DONE + 30);
  const stage = f >= DOSSIER_DONE ? REQUEST.readyStage : f >= landAt(0) ? 1 : 0;
  const total = REQUEST.checklist.length;

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, transformOrigin: '960px 600px', transform: `scale(${breathe})` }}>
      {/* Cadre de la page */}
      <div style={{
        position: 'absolute', left: D.x, top: D.y, width: D.w, height: D.h, background: 'var(--paper)', borderRadius: 20, border: '1px solid var(--line)',
        boxShadow: SHADOW, opacity: panelIn, transform: `scale(${mix(0.97, 1, panelIn)})`, overflow: 'hidden',
      }}>
        {sweep > 0 && sweep < 1 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '24%', background: 'linear-gradient(90deg, rgba(239,236,251,0) 0%, rgba(239,236,251,0.85) 50%, rgba(239,236,251,0) 100%)' }} />
        )}
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: panelIn }}>
        <div className="crumbs" style={{ position: 'absolute', left: D.x + 40, top: D.y + 26, fontSize: 15 }}>Financing workspace <span>/</span> {REQUEST.purpose} financing</div>
        <div style={{ position: 'absolute', left: D.x + 40, top: D.y + 48, fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{REQUEST.title}</div>
        <div className="muted" style={{ position: 'absolute', left: D.x + 40, top: D.y + 94, fontSize: 16.5, whiteSpace: 'nowrap' }}>
          {REQUEST.entity} · {REQUEST.purpose} · <b style={{ color: 'var(--ink)', fontWeight: 650 }}>{REQUEST.amount}</b> · {REQUEST.instrument}, {REQUEST.tenor} · target close {REQUEST.target}
        </div>
        <div className="btn primary" style={{
          position: 'absolute', left: D.x + D.w - 40, top: D.y + 52, transform: `translateX(-100%) scale(${1 + 0.05 * glow})`, transformOrigin: '100% 50%',
          gap: 10, height: 48, padding: '0 20px', fontSize: 18, borderRadius: 10, opacity: mix(0.55, 1, done),
          boxShadow: `0 10px 24px rgba(74,51,179,${0.12 + 0.18 * done}), 0 0 0 ${10 * glow}px rgba(217,210,245,${0.8 * glow})`,
        }}>
          <Icon name="file" size={19} />Generate financing brief
        </div>

        {/* Onglets de la demande */}
        <div className="tabs" style={{ position: 'absolute', left: D.x + 40, right: 1920 - D.x - D.w + 40, top: D.y + 128, fontSize: 16.5, marginBottom: 0 }}>
          <a>Overview</a>
          <a className="on">Preparation <span className="count" style={{ fontSize: 13 }}>{landed}/{total}</span></a>
          <a>Providers</a>
          <a>Terms comparison</a>
          <a>Activity</a>
        </div>

        {/* Liste de préparation */}
        <div className="card" style={{ position: 'absolute', left: LIST.x, top: LIST.y, width: LIST.w, height: LIST.h, padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: 21 }}>Preparation checklist</h2>
            <span className="faint" style={{ fontSize: 14.5, whiteSpace: 'nowrap' }}>filled from data already in Covenn</span>
            <span style={{ marginLeft: 'auto', fontSize: 16.5, fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{landed}/{total} · {Math.round((landed / total) * 100)}%</span>
            <span className="progress" style={{ width: 200, height: 10, borderRadius: 5 }}>
              <span style={{ display: 'block', height: '100%', width: `${(landed / total) * 100}%`, borderRadius: 5, background: 'var(--brand)' }} />
            </span>
          </div>
          {REQUEST.checklist.map((c, i) => <CheckRow key={c.key} f={f} i={i} item={c} />)}
        </div>

        {/* Étapes de la demande (bêta : Draft → … → Selected for negotiation) */}
        <div className="card" style={{ position: 'absolute', left: SIDE.x, top: PROGRESS.y, width: SIDE.w, height: PROGRESS.h, padding: '16px 20px' }}>
          <h2 style={{ fontSize: 19 }}>Progress</h2>
          <div className="stepper" style={{ marginTop: 14, gap: 6 }}>
            {REQUEST.stages.map((s, i) => (
              <div key={s} className={i < stage ? 'done' : i === stage ? 'cur' : ''} style={{ fontSize: 12.5, lineHeight: 1.25 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <LinkedScenario f={f} />
    </div>
  );
}

function CheckRow({ f, i, item }: { f: number; i: number; item: (typeof REQUEST.checklist)[number] }) {
  const land = landAt(i);
  const t = p(f, land - 3, land + 2, E.out);
  const flash = life(f, land, land + 2, land + 4, land + 12);
  const y = ROW.top + i * ROW.h;
  const style: CSSProperties = {
    position: 'absolute', left: 14, right: 14, top: y, height: ROW.h, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12,
    padding: '0 10px', borderRadius: 10, borderBottom: i < REQUEST.checklist.length - 1 ? '1px solid var(--line-2)' : undefined,
    background: flash > 0 ? `rgba(239, 236, 251, ${0.9 * flash})` : undefined,
  };
  return (
    <div style={style}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 650, whiteSpace: 'nowrap' }}>{item.label}</span>
        <span className="faint" style={{ fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.hint}</span>
      </span>
      <span style={{ position: 'relative', display: 'grid', justifyItems: 'end', minWidth: 230 }}>
        <span style={{ gridArea: '1 / 1', width: 120, height: 26, borderRadius: 999, border: '1.5px dashed var(--line)', opacity: 1 - t }} />
        <span style={{ gridArea: '1 / 1', opacity: t, transform: `scale(${mix(0.8, 1, t)})`, transformOrigin: '100% 50%' }}>
          <Badge tone={item.tone} scale={1.25}>{item.statusLabel}</Badge>
        </span>
      </span>
    </div>
  );
}

/** La carte « Linked scenario » : la simulation (S6) s'y replie, ses résultats y restent. */
function LinkedScenario({ f }: { f: number }) {
  const start = SCENARIO_LANDED - 8;
  if (f < start) return null;
  const t = p(f, start, SCENARIO_LANDED, E.out);
  const bump = Math.sin(Math.PI * p(f, SCENARIO_LANDED, SCENARIO_LANDED + 8, E.linear)) * 0.03;
  const cell = (label: string, value: string, crit = false) => (
    <div>
      <div className="faint" style={{ fontSize: 13.5, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: crit ? 'var(--crit)' : 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
  return (
    <div className="card" style={{
      position: 'absolute', left: SCENARIO_SLOT.x, top: SCENARIO_SLOT.y, width: SCENARIO_SLOT.w, height: SCENARIO_SLOT.h, padding: '18px 22px',
      border: t > 0.5 ? '1.5px solid var(--brand-line)' : undefined, boxShadow: '0 16px 40px rgba(28,25,54,.10)',
      opacity: t, transform: `scale(${mix(0.94, 1, t) + bump})`,
    }}>
      <h2 style={{ fontSize: 19 }}>Linked scenario</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 650, color: 'var(--brand)' }}>{SCENARIO.name}</span>
        <Tag proj scale={1.15}>Illustrative</Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginTop: 16 }}>
        {cell('New borrowing', SCENARIO.newBorrowing)}
        {cell(`Net debt / EBITDA at ${SCENARIO.horizon.slice(3)}`, SCENARIO.leverage.after)}
        {cell('Liquidity at horizon', SCENARIO.liquidity.after)}
        {cell('SFA leverage (projected)', SCENARIO.covenant.value, true)}
      </div>
    </div>
  );
}
