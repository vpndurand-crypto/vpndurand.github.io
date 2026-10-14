import type { CSSProperties } from 'react';
import { Banknote } from 'lucide-react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, mix, p } from '../../film/anim';
import { DOSSIER, SUBSIDIARY } from '../data';
import { ProjectionBadge, SHADOW } from '../kit';
import { PACKAGE_LOCKS, warp } from '../timing';
import { S6 } from './Simulation';

/**
 * S7 — « Prepare your next financing. » (projection ; images V4, voir timing.warp)
 * Simulation → risque identifié → financement à préparer : le scénario étudié devient une section du dossier de financement,
 * les autres sections se remplissent en cascade à partir des données déjà dans Covenn. Le dossier est complet et prêt à être
 * examiné : aucun financement accordé, aucune offre, aucune promesse sur le covenant.
 * La sortie (recul de la caméra vers la structure du capital) est faite par S8 (CapitalStructure.packageTransform).
 */
export const S7 = { panel: { x: 240, y: 196, w: 1440, h: 812 } };
const D = S7.panel;
const BW = 432;
const BH = 250;
const GX = [D.x + 40, D.x + 40 + BW + 24, D.x + 40 + 2 * (BW + 24)];
const GY = [D.y + 176, D.y + 176 + BH + 24];

/** Position finale de chaque section (ordre du dossier). */
export const BLOCKS = DOSSIER.blocks.map((b, i) => ({ ...b, x: GX[i % 3] ?? 0, y: GY[Math.floor(i / 3)] ?? 0, w: BW, h: BH }));
/** Le scénario étudié arrive le premier, en sortant de la simulation ; les autres suivent en croches (timing.PACKAGE_LOCKS). */
const ORDER = ['scenario', 'debt', 'data', 'schedule', 'covenants', 'need'];
export const landFrame = (key: string) => (key === 'scenario' ? S6.toDossier[1] : warp(PACKAGE_LOCKS[ORDER.indexOf(key)] ?? 0));
/** D'où vient chaque section (hors champ). */
const FROM: Record<string, { dx: number; dy: number; rot: number }> = {
  debt: { dx: -900, dy: -160, rot: -6 }, data: { dx: -120, dy: -760, rot: 4 }, schedule: { dx: 900, dy: -200, rot: 6 },
  covenants: { dx: -880, dy: 300, rot: -5 }, scenario: { dx: 0, dy: 0, rot: 0 }, need: { dx: 860, dy: 360, rot: 5 },
};
export const DOSSIER_DONE = landFrame('need') + 4;
/** Lente poussée de caméra pendant que les sections se posent, jusqu'au recul de S8 (images V4). */
export const breatheAt = (f: number) => mix(1, 1.025, p(f, landFrame('covenants'), 712, E.soft));

export function Dossier({ f }: { f: number }) {
  if (f < S6.toDossier[0] || f > 760) return null;
  const panelIn = p(f, S6.toDossier[0] + 2, S6.toDossier[1], E.out);
  const breathe = breatheAt(f);
  const landed = BLOCKS.filter((b) => f >= landFrame(b.key) + 2).length;
  const done = p(f, DOSSIER_DONE, DOSSIER_DONE + 12, E.out);
  const sweep = p(f, DOSSIER_DONE + 2, DOSSIER_DONE + 28, E.inOut);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, transformOrigin: '960px 600px', transform: `scale(${breathe})` }}>
      {/* Cadre du dossier */}
      <div style={{
        position: 'absolute', left: D.x, top: D.y, width: D.w, height: D.h, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--line)',
        boxShadow: SHADOW, opacity: panelIn, transform: `scale(${mix(0.97, 1, panelIn)})`, overflow: 'hidden',
      }}>
        {sweep > 0 && sweep < 1 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '24%', background: 'linear-gradient(90deg, rgba(243,241,252,0) 0%, rgba(230,226,248,0.75) 50%, rgba(243,241,252,0) 100%)' }} />
        )}
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: panelIn }}>
        <div style={{ position: 'absolute', left: D.x + 40, top: D.y + 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name="save" size={23} /></span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{DOSSIER.title}</span>
          <ProjectionBadge scale={1.25} />
        </div>
        <div style={{ position: 'absolute', left: D.x + 98, top: D.y + 82, display: 'flex', alignItems: 'center', gap: 14, fontSize: 18, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
          {DOSSIER.project} · {SUBSIDIARY.name} · financing requirement {DOSSIER.need}
          {/* Les sections se remplissent à partir des données déjà présentes dans Covenn */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px', borderRadius: 999, background: 'var(--indigo-50)', color: 'var(--indigo-700)', fontSize: 14, fontWeight: 700 }}>
            <Icon name="preview" size={14} />Auto-filled from Covenn data
          </span>
        </div>

        {/* Progression */}
        <div style={{ position: 'absolute', left: D.x + D.w - 40, top: D.y + 34, transform: 'translateX(-100%)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{landed} / {BLOCKS.length} sections ready</span>
          <span style={{ width: 200, height: 10, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${(landed / BLOCKS.length) * 100}%`, background: done > 0 ? 'var(--ok)' : 'var(--indigo-500)', borderRadius: 999 }} />
          </span>
        </div>
        {done > 0.001 && (
          <div style={{ position: 'absolute', left: D.x + D.w - 40, top: D.y + 92, transform: `translateX(-100%) scale(${mix(0.9, 1, done)})`, transformOrigin: '100% 50%', opacity: done, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 999, background: 'var(--ok-bg)', color: 'var(--ok)', fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap' }}>
              <Icon name="check" size={17} />Package complete
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 10, background: 'var(--indigo-600)', color: '#fff', fontSize: 17, fontWeight: 650, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(74,51,179,.25)' }}>
              Share for review
            </span>
          </div>
        )}

        {/* Emplacements vides (pointillés) */}
        {BLOCKS.map((b) => (
          <div key={`slot-${b.key}`} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 16, border: '1.5px dashed var(--line-strong)', opacity: f < landFrame(b.key) ? 1 : 0 }} />
        ))}
      </div>

      {BLOCKS.map((b) => <Block key={b.key} f={f} b={b} />)}
    </div>
  );
}

function Block({ f, b }: { f: number; b: (typeof BLOCKS)[number] }) {
  const land = landFrame(b.key);
  const isScenario = b.key === 'scenario';
  // Le scénario apparaît dans sa case pendant que la simulation s'y replie ; les autres sections arrivent du hors-champ.
  const start = isScenario ? land - 8 : land - 12;
  if (f < start) return null;
  const t = p(f, start, land, E.out);
  const from = FROM[b.key] ?? { dx: 0, dy: 0, rot: 0 };
  const bump = Math.sin(Math.PI * p(f, land, land + 8, E.linear)) * 0.03;
  const check = p(f, land + 2, land + 9, E.out);
  const home = isScenario ? { x: b.x, y: b.y } : { x: b.x + from.dx * (1 - t), y: b.y + from.dy * (1 - t) };
  const style: CSSProperties = {
    position: 'absolute', left: home.x, top: home.y, width: b.w, height: b.h, borderRadius: 16, background: 'var(--surface)',
    border: check > 0.5 ? '1.5px solid var(--indigo-300)' : '1px solid var(--line)', boxShadow: '0 16px 40px rgba(28,26,43,.10)',
    transform: `perspective(1400px) rotateY(${(1 - t) * (from.dx > 0 ? -16 : from.dx < 0 ? 16 : 0)}deg) rotateX(${(1 - t) * (from.dy < -400 ? -12 : 0)}deg) rotate(${from.rot * (1 - t)}deg) scale(${(isScenario ? mix(0.94, 1, t) : 1) + bump})`,
    opacity: Math.min(1, t * (isScenario ? 1 : 3)), padding: '24px 26px', overflow: 'hidden',
  };
  return (
    <div style={style}>
      <span style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 13, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}>
        {b.key === 'need' ? <Banknote size={24} strokeWidth={1.75} /> : <Icon name={b.icon} size={24} />}
      </span>
      <div style={{ marginTop: 18, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{b.title}</div>
      <div style={{ marginTop: 8, fontSize: 18, color: 'var(--ink-500)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{b.detail}</div>
      <div style={{ position: 'absolute', left: 26, bottom: 22, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 650, color: 'var(--ok)', opacity: check, transform: `translateY(${(1 - check) * 6}px)` }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--ok-bg)' }}><Icon name="check" size={15} /></span>
        Ready
      </div>
    </div>
  );
}
