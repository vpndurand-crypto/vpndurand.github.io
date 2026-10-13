import type { CSSProperties } from 'react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, mix, p, track, type Key } from '../../film/anim';
import { COVENANT, SIMULATION, SUBSIDIARY } from '../data';
import { ProjectionBadge, SHADOW, Typed, rollNumber } from '../kit';
import { PAN, panBlur, panOffset } from './Timeline';

/** Case du bloc « Scénario de financement » dans le dossier (S7) : la simulation s'y replie. */
export const SCENARIO_SLOT = { x: 736, y: 646, w: 432, h: 250 };

/**
 * S6 — « Et si vous pouviez voir demain ? » (projection)
 * Scénario « Nouvelle acquisition » : la dette d'acquisition et l'EBITDA de la cible sont saisis, le leverage projeté
 * franchit le seuil (dépassement identifié comme une projection), l'encours et l'échéancier évoluent.
 */
export const S6 = { panel: { x: 140, y: 196, w: 1640, h: 812 }, cross: 546, toDossier: [586, 606] as const };
const P = S6.panel;
const L = P.x + 44; // colonne des hypothèses
const R = P.x + 580; // résultats
const GAUGE_W = 1010;
const GAUGE_MAX = SIMULATION.thresholdValue * 1.25; // même échelle que la jauge de la bêta

/** Leverage affiché : il atteint exactement le seuil à l'image du franchissement (impact sonore calé dessus). */
const LEV: Key[] = [[516, Number(COVENANT.gauge.value)], [S6.cross, SIMULATION.thresholdValue, E.inOut], [554, SIMULATION.leverageAfterValue, E.out]];
export const leverageAt = (f: number) => track(f, LEV);

const card: CSSProperties = { position: 'absolute', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 };
const lbl: CSSProperties = { fontSize: 17, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' };

export function Simulation({ f }: { f: number }) {
  if (f < PAN.start || f > S6.toDossier[1] + 2) return null;
  const offset = 1920 + panOffset(f);
  const blur = panBlur(f);
  const select = p(f, 494, 506, E.inOut);
  const type1 = p(f, 500, 510, E.linear);
  const type2 = p(f, 508, 518, E.linear);
  const lev = leverageAt(f);
  const crossed = f > S6.cross;
  const breach = p(f, S6.cross + 2, S6.cross + 12, E.out);
  const roll = p(f, 520, 550, E.inOut);
  const bar = p(f, 528, 556, E.out);
  // Repli dans le dossier : tout le module rétrécit jusqu'à la case du scénario, puis s'efface au profit du bloc.
  const fold = p(f, S6.toDossier[0], S6.toDossier[1], E.inOut);
  const out = p(f, S6.toDossier[1] - 8, S6.toDossier[1], E.in);
  const hold = mix(1, 1.025, p(f, 552, S6.toDossier[0], E.soft));
  const k = mix(hold, SCENARIO_SLOT.w / P.w, fold);
  const cx = P.x + P.w / 2;
  const cy = P.y + P.h / 2;
  const tx = (SCENARIO_SLOT.x + SCENARIO_SLOT.w / 2 - cx) * fold;
  const ty = (SCENARIO_SLOT.y + SCENARIO_SLOT.h / 2 - cy) * fold;
  const levColor = crossed ? 'var(--risk)' : 'var(--ink-900)';
  const pct = (v: number) => Math.max(0, Math.min(1, v / GAUGE_MAX));
  const maxYear = Math.max(...SIMULATION.profileAfter.map((y) => y.value));

  return (
    <div style={{
      position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`,
      transform: `translateX(${offset}px) translate(${tx}px, ${ty}px) scale(${k})`, filter: blur > 0.2 ? 'url(#hblur-sim)' : undefined,
    }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="hblur-sim" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ ...card, left: P.x, top: P.y, width: P.w, height: P.h, borderRadius: 20, boxShadow: SHADOW, opacity: 1 - out }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
        {/* En-tête : module et scénario */}
        <div style={{ position: 'absolute', left: L, top: P.y + 30, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name="calculator" size={24} /></span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>Simulation</span>
          <ProjectionBadge scale={1.25} />
        </div>
        <Segmented x={P.x + P.w - 44} y={P.y + 30} select={select} />
        <div style={{ position: 'absolute', left: P.x + 1, right: 1920 - P.x - P.w + 1, top: P.y + 100, height: 1, background: 'var(--line)' }} />

        {/* Hypothèses */}
        <div style={{ position: 'absolute', left: L, top: P.y + 132, ...lbl }}>Hypothèses</div>
        {SIMULATION.inputs.map((input, i) => (
          <div key={input.label} style={{ position: 'absolute', left: L, top: P.y + 172 + i * 124 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)' }}>{input.label}</div>
            <div style={{
              marginTop: 10, width: 440, height: 66, borderRadius: 12, display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 32, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', background: 'var(--surface)',
              border: (i === 0 ? type1 : type2) > 0 && (i === 0 ? type1 : type2) < 1 ? '1.5px solid var(--indigo-600)' : '1px solid var(--line-strong)',
              boxShadow: (i === 0 ? type1 : type2) > 0 && (i === 0 ? type1 : type2) < 1 ? 'var(--focus-ring)' : undefined,
            }}>
              <Typed text={input.value} t={i === 0 ? type1 : type2} />
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: L, top: P.y + 432 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)' }}>Périmètre du covenant</div>
          <div style={{ marginTop: 10, fontSize: 21, fontWeight: 650 }}>{SUBSIDIARY.name} · SFA</div>
          <div style={{ marginTop: 4, fontSize: 16, color: 'var(--ink-500)' }}>{COVENANT.label} · seuil {COVENANT.threshold}</div>
        </div>

        {/* Résultat principal : leverage projeté */}
        <div style={{ position: 'absolute', left: R, top: P.y + 132, ...lbl }}>{f < 514 ? 'Leverage actuel' : 'Leverage projeté'}</div>
        <div style={{ position: 'absolute', left: R - 4, top: P.y + 156, display: 'flex', alignItems: 'baseline', gap: 26 }}>
          <span style={{ fontSize: 124, lineHeight: 1, fontWeight: 750, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color: levColor }}>
            {f < 516 ? COVENANT.value : f >= 554 ? SIMULATION.leverageAfter : `${rollNumber(lev, lev, 1, 2)}x`}
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', opacity: p(f, 516, 524) }}>avant {SIMULATION.leverageBefore}</span>
        </div>
        {breach > 0.001 && (
          <div style={{
            position: 'absolute', left: R + 640, top: P.y + 184, display: 'inline-flex', alignItems: 'center', gap: 10, height: 48, padding: '0 18px', borderRadius: 999,
            background: 'var(--risk-bg)', color: 'var(--risk)', fontSize: 21, fontWeight: 700, opacity: breach, transform: `scale(${mix(0.85, 1, breach)})`, transformOrigin: '0 50%', whiteSpace: 'nowrap',
          }}>
            <Icon name="warning" size={20} />
            Dépassement projeté du seuil
          </div>
        )}

        {/* Jauge projetée */}
        <div style={{ position: 'absolute', left: R, top: P.y + 318, width: GAUGE_W }}>
          <div style={{ position: 'relative', height: 16, borderRadius: 999, background: 'var(--line)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct(lev) * 100}%`, borderRadius: 999, background: crossed ? 'var(--risk)' : 'var(--watch-accent)' }} />
            <div style={{ position: 'absolute', top: -8, bottom: -8, left: `${pct(Number(COVENANT.gauge.value)) * 100}%`, width: 2, marginLeft: -1, background: 'var(--ink-400)', opacity: p(f, 516, 524) }} />
            <div style={{ position: 'absolute', top: -10, bottom: -10, left: `${pct(SIMULATION.thresholdValue) * 100}%`, width: 3, marginLeft: -1.5, borderRadius: 2, background: 'var(--ink-900)' }} />
          </div>
          <div style={{ position: 'relative', height: 30, marginTop: 10, fontSize: 16, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ position: 'absolute', left: 0 }}>0</span>
            <span style={{ position: 'absolute', left: `${pct(Number(COVENANT.gauge.value)) * 100}%`, transform: 'translateX(-100%)', paddingRight: 10, opacity: p(f, 516, 524), whiteSpace: 'nowrap' }}>avant</span>
            <span style={{ position: 'absolute', left: `${pct(SIMULATION.thresholdValue) * 100}%`, transform: 'translateX(-50%)', fontWeight: 700, color: 'var(--ink-700)', whiteSpace: 'nowrap', paddingLeft: 70 }}>Seuil {SIMULATION.threshold}</span>
          </div>
        </div>

        {/* Avant / après */}
        <Stat x={R} y={P.y + 412} run={p(f, 518, 526)} label="Encours du groupe" before={SIMULATION.groupBefore} after={`${rollNumber(20, 24, roll, 1)}\u00A0M€`} final={roll >= 1 ? SIMULATION.groupAfter : null} risk={false} />
        <Stat x={R + 520} y={P.y + 412} run={p(f, 518, 526)} label="Marge sous le seuil" before={SIMULATION.headroomBefore} after={`${rollNumber(0.37, -0.03, roll, 2)}x`} final={roll >= 1 ? SIMULATION.headroomAfter : null} risk={roll > 0.9} />

        {/* Échéancier des maturités : la dette d'acquisition s'ajoute en 2033 */}
        <div style={{ position: 'absolute', left: R, top: P.y + 566, ...lbl }}>Échéancier des maturités</div>
        <div style={{ position: 'absolute', left: R, top: P.y + 600, width: GAUGE_W, height: 180, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          {[2027, 2028, 2029, 2030, 2031, 2032, 2033].map((year) => {
            const before = SIMULATION.profileBefore.find((y) => y.year === year);
            const after = SIMULATION.profileAfter.find((y) => y.year === year);
            const isNew = !before && Boolean(after);
            const v = isNew ? (after?.value ?? 0) * bar : before?.value ?? 0;
            const h = (v / maxYear) * 130;
            return (
              <div key={year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 650, fontVariantNumeric: 'tabular-nums', color: isNew ? 'var(--indigo-700)' : 'var(--ink-700)', opacity: isNew ? bar : v > 0 ? 1 : 0, whiteSpace: 'nowrap' }}>
                  {isNew ? `+${after?.amount}` : before?.amount}
                </span>
                <span style={{ width: '100%', height: Math.max(v > 0 ? 3 : 0, h), borderRadius: '8px 8px 3px 3px', background: isNew ? 'var(--indigo-600)' : 'var(--indigo-200)' }} />
                <span style={{ fontSize: 15, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{year}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Segmented({ x, y, select }: { x: number; y: number; select: number }) {
  const items = ['Refinancement', SIMULATION.scenario];
  const w = [196, 252];
  const left = mix(0, w[0] ?? 0, select);
  const width = mix(w[0] ?? 0, w[1] ?? 0, select);
  const labels = (color: string) => items.map((it, i) => (
    <span key={it} style={{ width: w[i], height: 40, display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 650, whiteSpace: 'nowrap', color, flexShrink: 0 }}>{it}</span>
  ));
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translateX(-100%)', height: 48, padding: 4, borderRadius: 14, background: 'var(--canvas)', border: '1px solid var(--line)' }}>
      <div style={{ position: 'relative', display: 'flex' }}>
        {labels('var(--ink-700)')}
        {/* Le curseur de sélection : une fenêtre sur les mêmes libellés, en blanc */}
        <div style={{ position: 'absolute', left, top: 0, width, height: 40, borderRadius: 10, background: 'var(--indigo-600)', boxShadow: '0 6px 16px rgba(74,51,179,.25)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: -left, top: 0, display: 'flex' }}>{labels('#fff')}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ x, y, run, label, before, after, final, risk }: { x: number; y: number; run: number; label: string; before: string; after: string; final: string | null; risk: boolean }) {
  return (
    <div style={{ ...card, left: x, top: y, width: 490, height: 118, padding: '16px 22px' }}>
      <div style={{ ...lbl, fontSize: 16 }}>{label}</div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: mix(40, 26, run), fontWeight: mix(750, 600, run), color: run > 0.5 ? 'var(--ink-500)' : 'var(--ink-900)' }}>{before}</span>
        <span style={{ fontSize: 24, color: 'var(--ink-400)', opacity: run }}>→</span>
        <span style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.02em', color: risk ? 'var(--risk)' : 'var(--ink-900)', opacity: run }}>{final ?? after}</span>
      </div>
    </div>
  );
}
