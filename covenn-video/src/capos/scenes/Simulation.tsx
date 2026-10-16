import type { CSSProperties } from 'react';
import { E, life, mix, p, track, type Key } from '../../film/anim';
import { COVENANT, SCENARIO } from '../data';
import { compact, pct, roll } from '../format';
import { Icon, SHADOW, StatusBadge, Tag, Typed } from '../kit';
import { PAN, panBlur, panOffset } from './Timeline';

/** Carte « Linked scenario » de la demande de financement (S7) : la simulation s'y replie. */
export const SCENARIO_SLOT = { x: 1164, y: 380, w: 476, h: 238 };

/**
 * S6 — « Simulate tomorrow. Decide today. » (page Forecast & scenarios de la bêta ; images V4) — le moment fort.
 * 1. Aujourd'hui : dette nette / EBITDA du groupe 2.46x ; covenant de levier du contrat SFA à 3.13x, seuil ≤ 3.50x (Watch).
 * 2. La décision : le scénario Project Falcon est saisi (prix, EBITDA acquis, nouvel emprunt), la projection se recalcule à
 *    l'horizon du 30 Sep 2027.
 * 3. À l'horizon : 3.07x pour le groupe ; pour le covenant, la marche de seuil s'applique (≤ 3.25x) et la marge tombe à 3.6 % :
 *    « Critical headroom » (projection, pas un test de covenant). Puis l'encours, la liquidité, l'échéancier, et l'appel à
 *    créer la demande de financement à partir du scénario.
 */
export const S6 = { panel: { x: 140, y: 196, w: 1640, h: 812 }, cross: 540, toDossier: [588, 604] as const };
const P = S6.panel;
const L = P.x + 44; // colonne des hypothèses
const R = P.x + 580; // résultats
const GAUGE_W = 1010;
const GAUGE_MAX = COVENANT.thresholdNumber * 1.25; // même échelle que la jauge de S4
const DECIDE = 504; // le scénario est saisi
const ROLL = 516; // début du recalcul visible
const C = SCENARIO.covenant;

/** Dette nette / EBITDA du groupe, d'aujourd'hui à l'horizon. */
const LEV: Key[] = [[ROLL, SCENARIO.leverage.from], [544, SCENARIO.leverage.to, E.inOut]];
/** Seuil du covenant à la date projetée : il atteint la marche de 3.25x à l'image du franchissement (15,5 s, temps fort). */
const THR: Key[] = [[ROLL, C.thresholdFrom], [S6.cross, C.thresholdTo, E.inOut]];
export const thresholdAt = (f: number) => track(f, THR);

/** Gros plan sur la jauge pendant le franchissement (profondeur de champ sur le reste). */
const FOCUS = { x: R + 520, y: P.y + 300 };
const ZK: Key[] = [[512, 1], [532, 1.3, E.inOut], [548, 1.3], [566, 1, E.inOut]];
const ZX: Key[] = [[512, FOCUS.x], [532, 1060, E.inOut], [548, 1060], [566, FOCUS.x, E.inOut]];
const ZY: Key[] = [[512, FOCUS.y], [532, 560, E.inOut], [548, 560], [566, FOCUS.y, E.inOut]];

const card: CSSProperties = { position: 'absolute', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 };
const lbl: CSSProperties = { fontSize: 17, fontWeight: 550, color: 'var(--ink-2)', whiteSpace: 'nowrap' };

/** Couleur de la jauge : « watch » qui vire au « critical » au franchissement. */
function gaugeColor(t: number): string {
  const a = [154, 100, 0]; // --watch
  const b = [194, 70, 45]; // --crit
  const c = a.map((v, i) => Math.round(mix(v, b[i] ?? v, t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function Simulation({ f }: { f: number }) {
  if (f < PAN.start || f > S6.toDossier[1] + 2) return null;
  const offset = 1920 + panOffset(f);
  const blur = panBlur(f);
  const select = p(f, DECIDE, DECIDE + 7, E.inOut);
  const typing = SCENARIO.inputs.map((_, i) => p(f, DECIDE + 2 + i * 3, DECIDE + 8 + i * 3, E.linear));
  const sweep = p(f, 510, 524, E.inOut);
  const lev = track(f, LEV);
  const thr = thresholdAt(f);
  const headroom = (thr - C.valueNumber) / thr;
  const crossed = f > S6.cross;
  const toCrit = p(f, S6.cross - 2, S6.cross + 4, E.inOut);
  const risk = p(f, S6.cross + 2, S6.cross + 10, E.out);
  const ring = p(f, S6.cross, S6.cross + 14, E.out);
  const rollStats = p(f, 548, 562, E.inOut);
  const bar = p(f, 552, 570, E.out);
  const need = p(f, 562, 572, E.out);
  const cta = p(f, 568, 576, E.out);
  const ctaGlow = life(f, 574, 579, 582, 590);
  // Zoom sur le franchissement ; le reste du module passe légèrement au second plan.
  const zk = track(f, ZK);
  const zx = track(f, ZX);
  const zy = track(f, ZY);
  const depth = (zk - 1) / 0.3;
  const shake = f >= S6.cross && f < S6.cross + 10 ? Math.sin((f - S6.cross) * 2.6) * 4 * Math.exp(-(f - S6.cross) / 3.5) : 0;
  // Repli dans la demande de financement : tout le module rétrécit jusqu'à la carte « Linked scenario », puis s'efface.
  const fold = p(f, S6.toDossier[0], S6.toDossier[1], E.inOut);
  const out = p(f, S6.toDossier[1] - 7, S6.toDossier[1], E.in);
  const k = mix(1, SCENARIO_SLOT.w / P.w, fold);
  const cx = P.x + P.w / 2;
  const cy = P.y + P.h / 2;
  const tx = (SCENARIO_SLOT.x + SCENARIO_SLOT.w / 2 - cx) * fold;
  const ty = (SCENARIO_SLOT.y + SCENARIO_SLOT.h / 2 - cy) * fold;
  const gx = (v: number) => Math.max(0, Math.min(1, v / GAUGE_MAX));
  const years = [2027, 2028, 2029, 2030, 2031, 2032];
  const maxYear = Math.max(...SCENARIO.profileBefore.map((y) => y.value), ...SCENARIO.profileAfter.map((y) => y.value));
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
          {/* En-tête : le scénario, sa période, la bascule aujourd'hui / horizon */}
          <div style={{ position: 'absolute', inset: 0, ...context }}>
            <div style={{ position: 'absolute', left: L, top: P.y + 26, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon name="scenarios" size={24} /></span>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{SCENARIO.name}</span>
              <Tag proj scale={1.35}>Illustrative forecast</Tag>
              <span className="faint" style={{ fontSize: 16, whiteSpace: 'nowrap' }}>{SCENARIO.perimeter}</span>
            </div>
            <Segmented x={P.x + P.w - 44} y={P.y + 28} select={select} />
            <div style={{ position: 'absolute', left: P.x + 1, right: 1920 - P.x - P.w + 1, top: P.y + 100, height: 1, background: 'var(--line-2)' }} />

            {/* Hypothèses du scénario (bêta) */}
            <div style={{ position: 'absolute', left: L, top: P.y + 128, ...lbl }}>Assumptions · {SCENARIO.type}</div>
            {SCENARIO.inputs.map((input, i) => {
              const t = typing[i] ?? 0;
              return (
                <div key={input.label} style={{ position: 'absolute', left: L, top: P.y + 164 + i * 104 }}>
                  <div style={{ fontSize: 16, fontWeight: 550, color: 'var(--ink-2)' }}>{input.label}</div>
                  <div style={{
                    marginTop: 8, width: 440, height: 58, borderRadius: 10, display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 650,
                    fontVariantNumeric: 'tabular-nums', background: 'var(--surface)', color: t > 0 ? 'var(--ink)' : 'var(--ink-3)',
                    border: t > 0 && t < 1 ? '1.5px solid var(--brand)' : '1px solid var(--line)', boxShadow: t > 0 && t < 1 ? '0 0 0 3px var(--brand-line)' : undefined,
                  }}>
                    <em style={{ fontStyle: 'normal', color: 'var(--ink-3)', padding: '0 14px 0 18px', fontSize: 22, fontWeight: 500 }}>€</em>
                    {t > 0 ? <Typed text={input.value} t={t} /> : '—'}
                  </div>
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: L, top: P.y + 486, fontSize: 16, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
              Acting entity <b style={{ color: 'var(--ink)', fontWeight: 650 }}>{SCENARIO.entity}</b>
            </div>
            <div className="faint" style={{ position: 'absolute', left: L, top: P.y + 514, fontSize: 15, whiteSpace: 'nowrap' }}>Cash contribution €{SCENARIO.cash} · from the acting entity</div>

            {/* Le nouvel emprunt à mettre en place, et l'appel à préparer la demande de financement */}
            {need > 0.001 && (
              <div style={{ position: 'absolute', left: L, top: P.y + 572, opacity: need, transform: `translateY(${(1 - need) * 12}px)` }}>
                <div style={{ fontSize: 16, fontWeight: 550, color: 'var(--ink-2)' }}>New borrowing to arrange</div>
                <div style={{ marginTop: 4, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{SCENARIO.newBorrowing}</div>
              </div>
            )}
            {cta > 0.001 && (
              <div className="btn primary" style={{
                position: 'absolute', left: L, top: P.y + 690, gap: 12, height: 60, padding: '0 24px', borderRadius: 12, fontSize: 20, fontWeight: 650,
                opacity: cta, transform: `scale(${mix(0.92, 1, cta) * (1 + 0.04 * ctaGlow)})`, transformOrigin: '0 50%',
                boxShadow: `0 12px 28px rgba(74,51,179,.28), 0 0 0 ${10 * ctaGlow}px rgba(217,210,245,${0.8 * ctaGlow})`,
              }}>
                <Icon name="financing" size={22} />Create financing request from scenario
              </div>
            )}
          </div>

          {/* Le résultat : aujourd'hui, puis à l'horizon */}
          <div style={{ position: 'absolute', left: R, top: P.y + 128, ...lbl }}>Net debt / EBITDA · {projected ? `at ${SCENARIO.horizon}` : 'today'}</div>
          <div style={{ position: 'absolute', left: R - 4, top: P.y + 154, display: 'flex', alignItems: 'baseline', gap: 26 }}>
            <span style={{ fontSize: 124, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {f < ROLL ? SCENARIO.leverage.before : f >= 544 ? SCENARIO.leverage.after : `${roll(lev, lev, 1, 2)}x`}
            </span>
            <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', opacity: p(f, ROLL, ROLL + 8) }}>from {SCENARIO.leverage.before}</span>
          </div>

          {/* Le covenant du contrat SFA à la même date : Watch aujourd'hui ; marge critique à l'horizon (projection) */}
          <div style={{ position: 'absolute', left: R + 560, top: P.y + 150, display: 'flex', flexDirection: 'column', gap: 10, width: 450 }}>
            <span style={{ fontSize: 15, fontWeight: 550, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>SFA {COVENANT.label.toLowerCase()} · {COVENANT.context.split(' · ')[0]}</span>
            <span style={{ position: 'relative', height: 58 }}>
              <span style={{ position: 'absolute', left: 0, top: 6, opacity: 1 - risk }}><StatusBadge status={C.statusBefore} scale={1.9} /></span>
              {risk > 0.001 && (
                <span style={{
                  position: 'absolute', left: 0, top: 0, display: 'inline-flex', alignItems: 'center', gap: 12, height: 56, padding: '0 22px', borderRadius: 999,
                  background: 'var(--crit-soft)', color: 'var(--crit)', fontSize: 25, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(194,70,45,.18)',
                  opacity: risk, transform: `scale(${mix(0.8, 1, risk)})`, transformOrigin: '0 50%',
                }}>
                  <Icon name="alert" size={24} />Critical headroom
                </span>
              )}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: crossed ? 'var(--crit)' : 'var(--ink-3)', whiteSpace: 'nowrap' }}>
              {crossed ? `Projected — not a covenant test · ${C.value} vs ${C.thresholdAfter}` : `${COVENANT.value} vs ${COVENANT.threshold} · headroom ${COVENANT.headroomPct}`}
            </span>
          </div>

          {/* Balayage de recalcul */}
          {sweep > 0 && sweep < 1 && (
            <div style={{ position: 'absolute', left: R - 20, top: P.y + 120, width: GAUGE_W + 40, height: 280, overflow: 'hidden', borderRadius: 14, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '28%', background: 'linear-gradient(90deg, rgba(239,236,251,0) 0%, rgba(239,236,251,0.9) 50%, rgba(239,236,251,0) 100%)' }} />
            </div>
          )}

          {/* La jauge du covenant projeté : la valeur, le seuil qui passe à 3.25x, la marge */}
          <div style={{ position: 'absolute', left: R, top: P.y + 286, fontSize: 15, fontWeight: 550, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            Projected SFA covenant · {COVENANT.label} {C.value} · threshold {projected ? 'at horizon' : 'today'}
          </div>
          <div style={{ position: 'absolute', left: R, top: P.y + 320, width: GAUGE_W }}>
            <div style={{ position: 'relative', height: 18, borderRadius: 999, background: 'var(--line-2)' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: `${gx(thr) * 100}%`, right: 0, borderRadius: '0 999px 999px 0', opacity: 0.35 + 0.5 * toCrit,
                background: 'repeating-linear-gradient(135deg, var(--crit) 0 3px, transparent 3px 7px)',
              }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${gx(C.valueNumber) * 100}%`, borderRadius: 999, background: gaugeColor(toCrit) }} />
              <div style={{ position: 'absolute', top: -12, bottom: -12, left: `${gx(thr) * 100}%`, width: 4, marginLeft: -2, borderRadius: 2, background: crossed ? 'var(--crit)' : 'var(--ink)' }} />
              {ring > 0 && ring < 1 && (
                <div style={{
                  position: 'absolute', left: `${gx(thr) * 100}%`, top: 9, width: 20 + 140 * ring, height: 20 + 140 * ring, marginLeft: -(10 + 70 * ring), marginTop: -(10 + 70 * ring),
                  borderRadius: '50%', border: `${mix(4, 1, ring)}px solid var(--crit)`, opacity: 1 - ring,
                }} />
              )}
            </div>
            <div style={{ position: 'relative', height: 30, marginTop: 12, fontSize: 17, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <span style={{ position: 'absolute', left: 0 }}>0</span>
              <span style={{ position: 'absolute', left: `${gx(C.valueNumber) * 100}%`, transform: 'translateX(-100%)', paddingRight: 12, fontWeight: 650, color: crossed ? 'var(--crit)' : 'var(--watch)' }}>
                headroom {pct(headroom)}
              </span>
              <span style={{ position: 'absolute', left: `calc(${gx(thr) * 100}% + 14px)`, fontWeight: 750, color: crossed ? 'var(--crit)' : 'var(--ink)' }}>
                ≤ {roll(thr, thr, 1, 2)}x{crossed ? ' · step-down applies' : ''}
              </span>
            </div>
          </div>

          {/* Impact : encours, liquidité, échéancier */}
          <div style={{ position: 'absolute', inset: 0, ...context }}>
            <Stat x={R} y={P.y + 412} run={p(f, 548, 556)} label="Outstanding debt" before={SCENARIO.debt.before}
              after={compact(mix(SCENARIO.debt.from, SCENARIO.debt.to, rollStats))} final={rollStats >= 1 ? SCENARIO.debt.after : null} />
            <Stat x={R + 520} y={P.y + 412} run={p(f, 551, 559)} label="Available liquidity" before={SCENARIO.liquidity.before}
              after={compact(mix(SCENARIO.liquidity.from, SCENARIO.liquidity.to, rollStats))} final={rollStats >= 1 ? SCENARIO.liquidity.after : null} />

            <div style={{ position: 'absolute', left: R, top: P.y + 566, display: 'flex', alignItems: 'center', gap: 18, ...lbl }}>
              Maturity profile
              <span className="legend" style={{ fontSize: 15 }}>
                <span><i style={{ background: 'var(--c7)' }} />Today</span>
                <span style={{ opacity: bar }}><i style={{ background: 'var(--brand)' }} />At horizon</span>
              </span>
            </div>
            <div style={{ position: 'absolute', left: R, top: P.y + 600, width: GAUGE_W, height: 180, display: 'flex', alignItems: 'flex-end', gap: 22 }}>
              {years.map((year) => {
                const before = SCENARIO.profileBefore.find((y) => y.year === year);
                const after = SCENARIO.profileAfter.find((y) => y.year === year);
                const isNew = !before && Boolean(after);
                const hb = ((before?.value ?? 0) / maxYear) * 124;
                const ha = ((after?.value ?? 0) / maxYear) * 124 * bar;
                return (
                  <div key={year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 650, fontVariantNumeric: 'tabular-nums', color: isNew ? 'var(--brand-ink)' : 'var(--ink-2)', opacity: after ? bar : 0, whiteSpace: 'nowrap' }}>
                      {after?.amount ?? ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 4, width: '100%', height: 124 }}>
                      <span style={{ flex: 1, height: Math.max(before ? 3 : 0, hb), borderRadius: '6px 6px 2px 2px', background: 'var(--c7)', opacity: 0.75 }} />
                      <span style={{ flex: 1, height: Math.max(after && bar > 0 ? 3 : 0, ha), borderRadius: '6px 6px 2px 2px', background: 'var(--brand)', boxShadow: isNew ? `0 0 0 ${3 * bar}px rgba(217,210,245,.9)` : undefined }} />
                    </span>
                    <span style={{ fontSize: 15, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{year}</span>
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

/** Bascule « Today » / « At 30 Sep 2027 » (puces .chip de la bêta). */
function Segmented({ x, y, select }: { x: number; y: number; select: number }) {
  const items = ['Today', `At ${SCENARIO.horizon}`];
  const on = (i: number) => (i === 0 ? 1 - select : select);
  return (
    <div className="chips" style={{ position: 'absolute', right: 1920 - x, top: y, gap: 8, flexWrap: 'nowrap' }}>
      {items.map((it, i) => {
        const o = on(i);
        return (
          <span key={it} className="chip" style={{
            fontSize: 17, padding: '9px 18px', fontWeight: o > 0.5 ? 650 : 500, whiteSpace: 'nowrap',
            background: `rgba(239, 236, 251, ${o})`, borderColor: o > 0.5 ? 'var(--brand-line)' : 'var(--line)', color: o > 0.5 ? 'var(--brand-ink)' : 'var(--ink-2)',
          }}>
            {it}
          </span>
        );
      })}
    </div>
  );
}

function Stat({ x, y, run, label, before, after, final }: { x: number; y: number; run: number; label: string; before: string; after: string; final: string | null }) {
  return (
    <div style={{ ...card, left: x, top: y, width: 490, height: 118, padding: '16px 22px' }}>
      <div style={{ ...lbl, fontSize: 16 }}>{label}</div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: mix(40, 26, run), fontWeight: mix(700, 600, run), color: run > 0.5 ? 'var(--ink-3)' : 'var(--ink)' }}>{before}</span>
        <span style={{ fontSize: 24, color: 'var(--ink-3)', opacity: run }}>→</span>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', opacity: run }}>{final ?? after}</span>
      </div>
    </div>
  );
}
