import type { CSSProperties } from 'react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, mix, p } from '../../film/anim';
import { DOSSIER, SUBSIDIARY } from '../data';
import { ProjectionBadge, SHADOW } from '../kit';
import { S6 } from './Simulation';
import { NET, ring1ForBlock } from './networkLayout';

/**
 * S7 — « Votre prochain financement commence ici. » (projection)
 * Le scénario devient une pièce d'un dossier de financement structuré ; les autres blocs s'emboîtent un à un.
 * Aucun « financement accordé », aucune offre bancaire : le dossier est prêt à être partagé, rien de plus.
 */
export const S7 = { panel: { x: 240, y: 196, w: 1440, h: 812 }, out: [692, 712] as const };
const D = S7.panel;
const BW = 432;
const BH = 250;
const GX = [D.x + 40, D.x + 40 + BW + 24, D.x + 40 + 2 * (BW + 24)];
const GY = [D.y + 176, D.y + 176 + BH + 24];

/** Position finale de chaque bloc (ordre du dossier) et ordre d'arrivée. */
export const BLOCKS = DOSSIER.blocks.map((b, i) => ({ ...b, x: GX[i % 3] ?? 0, y: GY[Math.floor(i / 3)] ?? 0, w: BW, h: BH }));
/** Le scénario (bloc 5) arrive le premier, en sortant de la simulation ; les autres suivent toutes les dix images. */
const ORDER = ['scenario', 'data', 'debt', 'schedule', 'covenants', 'proofs'];
export const landFrame = (key: string) => (key === 'scenario' ? S6.toDossier[1] : 616 + (ORDER.indexOf(key) - 1) * 10);
/** D'où vient chaque bloc (hors champ ou depuis un module précédent). */
const FROM: Record<string, { dx: number; dy: number; rot: number }> = {
  data: { dx: -900, dy: -120, rot: -6 }, debt: { dx: -200, dy: -760, rot: 4 }, schedule: { dx: 900, dy: -200, rot: 6 },
  covenants: { dx: -880, dy: 300, rot: -5 }, scenario: { dx: 0, dy: 0, rot: 0 }, proofs: { dx: 860, dy: 360, rot: 5 },
};

export function Dossier({ f }: { f: number }) {
  if (f < S6.toDossier[0] || f > S7.out[1] + 4) return null;
  const panelIn = p(f, 592, 606, E.out);
  // Sortie : le cadre du dossier se replie sur le centre du réseau, où la marque Covenn apparaît.
  const fold = p(f, S7.out[0], S7.out[0] + 16, E.inOut);
  const C = NET.center;
  const frame = {
    x: mix(D.x, C.x - 52, fold), y: mix(D.y, C.y - 52, fold), w: mix(D.w, 104, fold), h: mix(D.h, 104, fold), r: mix(20, 31, fold),
  };
  const headO = 1 - p(f, S7.out[0], S7.out[0] + 8, E.in);
  const landed = BLOCKS.filter((b) => f >= landFrame(b.key) + 2).length;
  const done = p(f, 662, 674, E.out);
  const sweep = p(f, 664, 690, E.inOut);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      {/* Cadre du dossier */}
      <div style={{
        position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h, background: 'var(--surface)', borderRadius: frame.r, border: '1px solid var(--line)',
        boxShadow: SHADOW, opacity: panelIn * (1 - p(f, S7.out[0] + 12, S7.out[0] + 18, E.in)), transform: `scale(${mix(0.97, 1, panelIn)})`, overflow: 'hidden',
      }}>
        {sweep > 0 && sweep < 1 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '24%', background: 'linear-gradient(90deg, rgba(243,241,252,0) 0%, rgba(230,226,248,0.75) 50%, rgba(243,241,252,0) 100%)' }} />
        )}
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: panelIn * headO }}>
        <div style={{ position: 'absolute', left: D.x + 40, top: D.y + 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name="save" size={23} /></span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{DOSSIER.title}</span>
          <ProjectionBadge scale={1.25} />
        </div>
        <div style={{ position: 'absolute', left: D.x + 98, top: D.y + 82, fontSize: 18, color: 'var(--ink-500)' }}>{DOSSIER.project} · {SUBSIDIARY.name}</div>

        {/* Progression */}
        <div style={{ position: 'absolute', left: D.x + D.w - 40, top: D.y + 34, transform: 'translateX(-100%)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{landed} / {BLOCKS.length} sections</span>
          <span style={{ width: 220, height: 10, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${(landed / BLOCKS.length) * 100}%`, background: done > 0 ? 'var(--ok)' : 'var(--indigo-500)', borderRadius: 999 }} />
          </span>
        </div>
        {done > 0.001 && (
          <div style={{ position: 'absolute', left: D.x + D.w - 40, top: D.y + 92, transform: `translateX(-100%) scale(${mix(0.9, 1, done)})`, transformOrigin: '100% 50%', opacity: done, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 999, background: 'var(--ok-bg)', color: 'var(--ok)', fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap' }}>
              <Icon name="check" size={17} />Dossier structuré
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 10, background: 'var(--indigo-600)', color: '#fff', fontSize: 17, fontWeight: 650, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(74,51,179,.25)' }}>
              Partager le dossier
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
  // Le scénario apparaît dans sa case pendant que la simulation s'y replie ; les autres blocs arrivent du hors-champ.
  const start = isScenario ? land - 8 : land - 14;
  if (f < start) return null;
  const t = p(f, start, land, E.out);
  const from = FROM[b.key] ?? { dx: 0, dy: 0, rot: 0 };
  const bump = Math.sin(Math.PI * p(f, land, land + 8, E.linear)) * 0.03;
  const check = p(f, land + 2, land + 10, E.out);
  // Sortie : chaque bloc rejoint son nœud dans le réseau (S8) et prend la forme d'une pastille.
  const node = ring1ForBlock(b.key, f);
  const fly = node ? p(f, S7.out[0] + 2, S7.out[1], E.inOut) : 0;
  const home = isScenario ? { x: b.x, y: b.y } : { x: b.x + from.dx * (1 - t), y: b.y + from.dy * (1 - t) };
  const pill = { w: 210, h: 52 };
  const rect = {
    x: mix(home.x, (node?.x ?? 0) - pill.w / 2, fly), y: mix(home.y, (node?.y ?? 0) - pill.h / 2, fly),
    w: mix(b.w, pill.w, fly), h: mix(b.h, pill.h, fly),
  };
  const style: CSSProperties = {
    position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: mix(16, 26, fly), background: 'var(--surface)',
    border: check > 0.5 ? '1.5px solid var(--indigo-300)' : '1px solid var(--line)', boxShadow: '0 16px 40px rgba(28,26,43,.10)',
    transform: `rotate(${from.rot * (1 - t)}deg) scale(${(isScenario ? mix(0.94, 1, t) : 1) + bump})`,
    opacity: Math.min(1, t * (isScenario ? 1 : 3)) * (1 - p(f, S7.out[1] - 6, S7.out[1] + 2, E.in)), padding: '24px 26px', overflow: 'hidden',
  };
  const content = 1 - p(fly, 0, 0.45, E.in);
  return (
    <div style={style}>
      <div style={{ opacity: content }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 13, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name={b.icon} size={24} /></span>
        <div style={{ marginTop: 18, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{b.title}</div>
        <div style={{ marginTop: 8, fontSize: 18, color: 'var(--ink-500)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{b.detail}</div>
        <div style={{ position: 'absolute', left: 26, bottom: 22, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 650, color: 'var(--ok)', opacity: check }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--ok-bg)' }}><Icon name="check" size={15} /></span>
          Intégré au dossier
        </div>
      </div>
    </div>
  );
}
