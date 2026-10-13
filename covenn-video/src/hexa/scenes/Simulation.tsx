import type { CSSProperties } from 'react';
import { StatusBadge } from '../../../beta/src/ui/StatusBadge';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, life, mix, p, track, type Key } from '../../film/anim';
import { COVENANT, SIMULATION, SUBSIDIARY } from '../data';
import { ProjectionBadge, SHADOW, Typed, rollNumber } from '../kit';
import { PAN, panBlur, panOffset } from './Timeline';

/** Case du bloc « Scénario étudié » dans le dossier (S7) : la simulation s'y replie. */
export const SCENARIO_SLOT = { x: 736, y: 646, w: 432, h: 250 };

/**
 * S6 — « Et si vous pouviez voir demain ? » (projection) — le moment fort.
 * 1. Avant : leverage 3,13x, seuil contractuel ≤ 3,50x, covenant respecté.
 * 2. La décision : le scénario « Nouvelle acquisition » est activé, les hypothèses se renseignent, la projection se recalcule.
 * 3. Après : la caméra se rapproche, le leverage projeté franchit le seuil (3,53x), « Risque de dépassement ».
 * Puis l'impact sur l'encours et l'échéancier, et l'appel à préparer le financement.
 */
export const S6 = { panel: { x: 140, y: 196, w: 1640, h: 812 }, cross: 540, toDossier: [588, 604] as const };
const P = S6.panel;
const L = P.x + 44; // colonne des hypothèses
const R = P.x + 580; // résultats
const GAUGE_W = 1010;
const GAUGE_MAX = SIMULATION.thresholdValue * 1.25; // même échelle que la jauge de la bêta
const DECIDE = 504; // le scénario est activé
const ROLL = 516; // début du recalcul visible

/** Leverage affiché : il atteint exactement le seuil à l'image du franchissement (18,0 s, sur le temps fort de la musique). */
const LEV: Key[] = [[ROLL, Number(COVENANT.gauge.value)], [S6.cross, SIMULATION.thresholdValue, E.inOut], [548, SIMULATION.leverageAfterValue, E.out]];
export const leverageAt = (f: number) => track(f, LEV);

/** Gros plan sur le leverage et la jauge pendant le franchissement (profondeur de champ sur le reste). */
const FOCUS = { x: R + 520, y: P.y + 300 };
const ZK: Key[] = [[512, 1], [532, 1.3, E.inOut], [548, 1.3], [566, 1, E.inOut]];
const ZX: Key[] = [[512, FOCUS.x], [532, 1060, E.inOut], [548, 1060], [566, FOCUS.x, E.inOut]];
const ZY: Key[] = [[512, FOCUS.y], [532, 560, E.inOut], [548, 560], [566, FOCUS.y, E.inOut]];

const card: CSSProperties = { position: 'absolute', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 };
const lbl: CSSProperties = { fontSize: 17, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' };

/** Couleur de la jauge : orange (vigilance) qui vire au rouge au franchissement. */
function gaugeColor(t: number): string {
  const a = [240, 140, 26]; // --watch-accent
  const b = [180, 42, 32]; // --risk
  const c = a.map((v, i) => Math.round(mix(v, b[i] ?? v, t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function Simulation({ f }: { f: number }) {
  if (f < PAN.start || f > S6.toDossier[1] + 2) return null;
  const offset = 1920 + panOffset(f);
  const blur = panBlur(f);
  const select = p(f, DECIDE, DECIDE + 7, E.inOut);
  const type1 = p(f, DECIDE + 2, DECIDE + 9, E.linear);
  const type2 = p(f, DECIDE + 6, DECIDE + 13, E.linear);
  const sweep = p(f, 510, 524, E.inOut);
  const lev = leverageAt(f);
  const crossed = f > S6.cross;
  const toRed = p(f, S6.cross - 2, S6.cross + 4, E.inOut);
  const risk = p(f, S6.cross + 2, S6.cross + 10, E.out);
  const ring = p(f, S6.cross, S6.cross + 14, E.out);
  const roll = p(f, 548, 562, E.inOut);
  const bar = p(f, 552, 570, E.out);
  const need = p(f, 562, 572, E.out);
  const cta = p(f, 568, 576, E.out);
  const ctaGlow = life(f, 574, 579, 582, 590);
  // Zoom sur le franchissement ; le reste du module passe légèrement au second plan.
  const zk = track(f, ZK);
  const zx = track(f, ZX);
  const zy = track(f, ZY);
  const depth = (zk - 1) / 0.3;
  const shake = f >= S6.cross && f < S6.cross + 10 ? Math.sin((f - S6.cross) * 2.6) * 5 * Math.exp(-(f - S6.cross) / 3.5) : 0;
  // Repli dans le dossier : tout le module rétrécit jusqu'à la case du scénario, puis s'efface au profit du bloc.
  const fold = p(f, S6.toDossier[0], S6.toDossier[1], E.inOut);
  const out = p(f, S6.toDossier[1] - 7, S6.toDossier[1], E.in);
  const k = mix(1, SCENARIO_SLOT.w / P.w, fold);
  const cx = P.x + P.w / 2;
  const cy = P.y + P.h / 2;
  const tx = (SCENARIO_SLOT.x + SCENARIO_SLOT.w / 2 - cx) * fold;
  const ty = (SCENARIO_SLOT.y + SCENARIO_SLOT.h / 2 - cy) * fold;
  const pct = (v: number) => Math.max(0, Math.min(1, v / GAUGE_MAX));
  const maxYear = Math.max(...SIMULATION.profileAfter.map((y) => y.value));
  const context: CSSProperties = { filter: depth > 0.02 ? `blur(${(depth * 2.4).toFixed(2)}px)` : undefined, opacity: 1 - depth * 0.35 };
  const projected = f >= ROLL;

  return (
    <div style={{
      position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`,
      transform: `translateX(${offset}px) translate(${tx}px, ${ty}px) scale(${k})`, filter: blur > 0.2 ? 'url(#hblur-sim)' : undefined,
    }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="hblur-sim" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 600px', transform: `perspective(2000px) rotateY(${-9 * (1 - p(f, PAN.start, PAN.end + 8, E.out))}deg)` }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${zx - zk * FOCUS.x + shake}px, ${zy - zk * FOCUS.y}px) scale(${zk})` }}>
        <div style={{ ...card, left: P.x, top: P.y, width: P.w, height: P.h, borderRadius: 20, boxShadow: SHADOW, opacity: 1 - out }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
          {/* En-tête : module et scénario */}
          <div style={{ position: 'absolute', inset: 0, ...context }}>
            <div style={{ position: 'absolute', left: L, top: P.y + 30, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}><Icon name="calculator" size={24} /></span>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>Simulation</span>
              <ProjectionBadge scale={1.25} />
            </div>
            <Segmented x={P.x + P.w - 44} y={P.y + 30} select={select} />
            <div style={{ position: 'absolute', left: P.x + 1, right: 1920 - P.x - P.w + 1, top: P.y + 100, height: 1, background: 'var(--line)' }} />

            {/* Hypothèses du scénario */}
            <div style={{ position: 'absolute', left: L, top: P.y + 132, ...lbl }}>Hypothèses du scénario</div>
            {SIMULATION.inputs.map((input, i) => {
              const t = i === 0 ? type1 : type2;
              return (
                <div key={input.label} style={{ position: 'absolute', left: L, top: P.y + 172 + i * 124 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)' }}>{input.label}</div>
                  <div style={{
                    marginTop: 10, width: 440, height: 66, borderRadius: 12, display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 32, fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums', background: t > 0 ? 'var(--surface)' : 'var(--canvas)', color: t > 0 ? 'var(--ink-900)' : 'var(--ink-400)',
                    border: t > 0 && t < 1 ? '1.5px solid var(--indigo-600)' : '1px solid var(--line-strong)', boxShadow: t > 0 && t < 1 ? 'var(--focus-ring)' : undefined,
                  }}>
                    {t > 0 ? <Typed text={input.value} t={t} /> : '—'}
                  </div>
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: L, top: P.y + 432 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)' }}>Périmètre du covenant</div>
              <div style={{ marginTop: 10, fontSize: 21, fontWeight: 650 }}>{SUBSIDIARY.name} · SFA</div>
              <div style={{ marginTop: 4, fontSize: 16, color: 'var(--ink-500)' }}>{COVENANT.label} · seuil {COVENANT.threshold}</div>
            </div>

            {/* Le besoin identifié, et l'appel à préparer le financement */}
            {need > 0.001 && (
              <div style={{ position: 'absolute', left: L, top: P.y + 560, opacity: need, transform: `translateY(${(1 - need) * 12}px)` }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)' }}>Besoin de financement</div>
                <div style={{ marginTop: 6, fontSize: 34, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>{SIMULATION.inputs[0]?.value}</div>
              </div>
            )}
            {cta > 0.001 && (
              <div style={{
                position: 'absolute', left: L, top: P.y + 676, display: 'inline-flex', alignItems: 'center', gap: 12, height: 60, padding: '0 26px', borderRadius: 14,
                background: 'var(--indigo-600)', color: '#fff', fontSize: 21, fontWeight: 700, opacity: cta, transform: `scale(${mix(0.92, 1, cta) * (1 + 0.04 * ctaGlow)})`, transformOrigin: '0 50%',
                boxShadow: `0 12px 28px rgba(74,51,179,.28), 0 0 0 ${10 * ctaGlow}px rgba(175,163,230,${0.45 * ctaGlow})`, whiteSpace: 'nowrap',
              }}>
                Préparer le financement <span style={{ fontSize: 24 }}>→</span>
              </div>
            )}
          </div>

          {/* Le résultat : avant, puis projeté */}
          <div style={{ position: 'absolute', left: R, top: P.y + 132, ...lbl }}>{projected ? 'Leverage projeté' : 'Leverage actuel'}</div>
          <div style={{ position: 'absolute', left: R - 4, top: P.y + 156, display: 'flex', alignItems: 'baseline', gap: 26 }}>
            <span style={{ fontSize: 124, lineHeight: 1, fontWeight: 750, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color: crossed ? 'var(--risk)' : 'var(--ink-900)' }}>
              {f < ROLL ? COVENANT.value : f >= 548 ? SIMULATION.leverageAfter : `${rollNumber(lev, lev, 1, 2)}x`}
            </span>
            <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', opacity: p(f, ROLL, ROLL + 8) }}>avant {SIMULATION.leverageBefore}</span>
          </div>
          {/* Statut : respecté avant la décision ; risque de dépassement après (projection) */}
          <div style={{ position: 'absolute', left: R + 640, top: P.y + 182, opacity: 1 - p(f, ROLL - 4, ROLL + 2), transform: 'scale(1.45)', transformOrigin: '0 50%' }}>
            <StatusBadge status={COVENANT.status} />
          </div>
          {risk > 0.001 && (
            <div style={{
              position: 'absolute', left: R + 600, top: P.y + 168, display: 'flex', flexDirection: 'column', gap: 6, opacity: risk,
              transform: `scale(${mix(0.8, 1, risk)})`, transformOrigin: '0 50%',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, height: 56, padding: '0 22px', borderRadius: 999, background: 'var(--risk-bg)', color: 'var(--risk)', fontSize: 26, fontWeight: 750, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(180,42,32,.18)' }}>
                <Icon name="warning" size={24} />
                Risque de dépassement
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--risk)', paddingLeft: 8, whiteSpace: 'nowrap' }}>Projection · {SIMULATION.leverageAfter} pour un seuil de {COVENANT.thresholdShort}</span>
            </div>
          )}
          {/* Balayage de recalcul */}
          {sweep > 0 && sweep < 1 && (
            <div style={{ position: 'absolute', left: R - 20, top: P.y + 120, width: GAUGE_W + 40, height: 280, overflow: 'hidden', borderRadius: 14, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '28%', background: 'linear-gradient(90deg, rgba(230,226,248,0) 0%, rgba(230,226,248,0.85) 50%, rgba(230,226,248,0) 100%)' }} />
            </div>
          )}

          {/* La jauge : le seuil contractuel et la zone de dépassement */}
          <div style={{ position: 'absolute', left: R, top: P.y + 318, width: GAUGE_W }}>
            <div style={{ position: 'relative', height: 18, borderRadius: 999, background: 'var(--line)' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: `${pct(SIMULATION.thresholdValue) * 100}%`, right: 0, borderRadius: '0 999px 999px 0', opacity: 0.18 + 0.5 * toRed,
                background: 'repeating-linear-gradient(135deg, var(--risk) 0 3px, transparent 3px 7px)',
              }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct(lev) * 100}%`, borderRadius: 999, background: gaugeColor(toRed) }} />
              <div style={{ position: 'absolute', top: -8, bottom: -8, left: `${pct(Number(COVENANT.gauge.value)) * 100}%`, width: 2, marginLeft: -1, background: 'var(--ink-400)', opacity: p(f, ROLL, ROLL + 8) }} />
              <div style={{ position: 'absolute', top: -12, bottom: -12, left: `${pct(SIMULATION.thresholdValue) * 100}%`, width: 4, marginLeft: -2, borderRadius: 2, background: crossed ? 'var(--risk)' : 'var(--ink-900)' }} />
              {ring > 0 && ring < 1 && (
                <div style={{
                  position: 'absolute', left: `${pct(SIMULATION.thresholdValue) * 100}%`, top: 9, width: 20 + 140 * ring, height: 20 + 140 * ring, marginLeft: -(10 + 70 * ring), marginTop: -(10 + 70 * ring),
                  borderRadius: '50%', border: `${mix(4, 1, ring)}px solid var(--risk)`, opacity: 1 - ring,
                }} />
              )}
            </div>
            <div style={{ position: 'relative', height: 30, marginTop: 12, fontSize: 17, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ position: 'absolute', left: 0 }}>0</span>
              <span style={{ position: 'absolute', left: `${pct(Number(COVENANT.gauge.value)) * 100}%`, transform: 'translateX(-100%)', paddingRight: 10, opacity: p(f, ROLL, ROLL + 8), whiteSpace: 'nowrap' }}>avant</span>
              <span style={{ position: 'absolute', left: `calc(${pct(SIMULATION.thresholdValue) * 100}% + 14px)`, fontWeight: 750, color: crossed ? 'var(--risk)' : 'var(--ink-900)', whiteSpace: 'nowrap' }}>Seuil contractuel {COVENANT.threshold}</span>
            </div>
          </div>

          {/* Impact : encours, marge, échéancier */}
          <div style={{ position: 'absolute', inset: 0, ...context }}>
            <Stat x={R} y={P.y + 412} run={p(f, 548, 556)} label="Encours du groupe" before={SIMULATION.groupBefore} after={`${rollNumber(20, 24, roll, 1)} M€`} final={roll >= 1 ? SIMULATION.groupAfter : null} risk={false} />
            <Stat x={R + 520} y={P.y + 412} run={p(f, 551, 559)} label="Marge sous le seuil" before={SIMULATION.headroomBefore} after={`${rollNumber(0.37, -0.03, roll, 2)}x`} final={roll >= 1 ? SIMULATION.headroomAfter : null} risk={roll > 0.9} />

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
      </div>
      </div>
    </div>
  );
}

function Segmented({ x, y, select }: { x: number; y: number; select: number }) {
  const items = ['Situation actuelle', SIMULATION.scenario];
  const w = [204, 252];
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
