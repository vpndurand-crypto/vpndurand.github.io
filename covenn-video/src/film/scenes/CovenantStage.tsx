import type { CSSProperties, ReactNode } from 'react';
import { StatusBadge } from '../../../beta/src/ui/StatusBadge';
import { SourceChip, type SourceKind } from '../../../beta/src/ui/SourceChip';
import { HeadroomGauge } from '../../../beta/src/ui/charts';
import { Icon } from '../../../beta/src/ui/Icon';
import { Banner } from '../../../beta/src/ui/Banner';
import { Toast } from '../../../beta/src/ui/Toast';
import { Button } from '../../../beta/src/ui/Button';
import { ContractPage } from '../../../beta/src/features/documents/ContractPage';
import { seedBalances } from '../../../beta/src/data/balances';
import { V } from '../../bridge/demo';
import type { UiRects } from '../../bridge/AppFrame';
import { E, life, mix, p, track } from '../anim';
import { SpreadsheetWindow } from '../parts/Windows';
import { appCamera, center, toFrame } from './appCamera';
import { BALANCE_MAIN, CASH_ROWS } from './Sources';

const HERO = 216;
const A = { x: 960, y: 500, s: 216 };
const B = { x: 430, y: 520, s: 216 };
const C = { x: 330, y: 252, s: 116 };
const D = { x: 392, y: 470, s: 132 };
const X0 = 860; // colonne de droite de la séquence du calcul

const sheetLines = (() => {
  const b = seedBalances.find((x) => x.id === BALANCE_MAIN);
  if (!b) throw new Error('Balance au 30/09/2026 absente');
  return b.lines.filter((l) => l.row >= 18 && l.row <= 25);
})();

const ignore = (): void => undefined;

function Abs({ x, y, children, style }: { x: number; y: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', left: x, top: y, ...style }}>{children}</div>;
}

/** Le chiffre héros (3,13x) : il quitte la vue groupe, devient le centre du film, puis se fige dans la carte. */
function heroState(f: number, rects: UiRects) {
  if (f < 244) return null;
  let x: number;
  let y: number;
  let s: number;
  if (f <= 266) {
    const cam = appCamera(f, rects);
    const c = center(rects.miniValue);
    const start = toFrame(cam, c.x, c.y);
    const t = p(f, 244, 266, E.inOut);
    x = mix(start.x, A.x, t);
    y = mix(start.y, A.y, t);
    s = Math.exp(mix(Math.log(20 * cam.k), Math.log(A.s), t));
  } else {
    x = track(f, [[266, A.x], [270, A.x], [292, B.x, E.inOut], [394, B.x], [424, C.x, E.inOut], [540, C.x], [576, D.x, E.inOut]]);
    y = track(f, [[266, A.y], [270, A.y], [292, B.y, E.inOut], [394, B.y], [424, C.y, E.inOut], [540, C.y], [576, D.y, E.inOut]]);
    s = Math.exp(track(f, [[266, Math.log(A.s)], [394, Math.log(B.s)], [424, Math.log(C.s), E.inOut], [540, Math.log(C.s)], [576, Math.log(D.s), E.inOut]]));
  }
  return { x, y, s, opacity: 1 - p(f, 688, 704, E.in) };
}

function Hero({ f, rects }: { f: number; rects: UiRects }) {
  const st = heroState(f, rects);
  if (!st) return null;
  // Pulsation « valeur cliquable » au moment où l'on ouvre sa provenance (S4).
  const active = Math.max(life(f, 394, 402, 414, 428), life(f, 516, 520, 526, 540));
  return (
    <div style={{
      position: 'absolute', left: st.x, top: st.y, transform: `translate(-50%, -50%) scale(${st.s / HERO})`, transformOrigin: '50% 50%', opacity: st.opacity,
      fontSize: HERO, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
      textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: active > 0.01 ? 'var(--indigo-600)' : 'var(--indigo-300)',
      textDecorationThickness: 5, textUnderlineOffset: 24, padding: '0 14px', borderRadius: 18, background: `rgba(230, 226, 248, ${0.9 * active})`,
    }}>
      {V.covenant.value}
    </div>
  );
}

function Path({ d, draw, opacity = 1, dashed = false }: { d: string; draw: number; opacity?: number; dashed?: boolean }) {
  if (draw <= 0 || opacity <= 0) return null;
  return (
    <path d={d} pathLength={1} fill="none" stroke="var(--indigo-300)" strokeWidth={2} strokeLinecap="round"
      strokeDasharray={dashed ? undefined : '1 1'} strokeDashoffset={dashed ? undefined : 1 - draw} opacity={opacity} />
  );
}

function TreeRow({ x, y, w, sign, label, chip, value, opacity }: {
  x: number; y: number; w: number; sign: string; label: string; chip: { kind: SourceKind; label: string }; value: string; opacity: number;
}) {
  if (opacity <= 0.001) return null;
  return (
    <Abs x={x} y={y} style={{ width: w, height: 68, opacity, display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 6, borderBottom: '1px solid var(--line)' }}>
      <span style={{ textAlign: 'center', color: 'var(--ink-500)', fontWeight: 600, fontSize: 20 }}>{sign}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 19, color: 'var(--ink-900)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ transform: 'scale(1.18)', transformOrigin: 'left center' }}><SourceChip kind={chip.kind} label={chip.label} /></span>
      </span>
      <span style={{ fontSize: 26, fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
    </Abs>
  );
}

/** Point lumineux qui parcourt un lien de l'arbre (offset-path), de la source vers le chiffre. */
function ProofDot({ path, t }: { path: string; t: number }) {
  const o = t <= 0 || t >= 1 ? 0 : Math.min(1, t * 6, (1 - t) * 6);
  if (o <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: '50%', opacity: o,
      background: 'var(--indigo-600)', boxShadow: '0 0 0 6px rgba(106, 87, 200, 0.18), 0 0 22px rgba(74, 51, 179, 0.55)',
      offsetPath: `path('${path}')`, offsetDistance: `${(t * 100).toFixed(3)}%`, offsetRotate: '0deg', zIndex: 3,
    } as CSSProperties} />
  );
}

/** Ligne du calcul (S3) qui devient un nœud de l'arbre de provenance (S4). */
function MorphNode({ f, s3, s4, label, value, exact, appear, branchOpacity }: {
  f: number; s3: { x: number; y: number }; s4: { x: number; y: number }; label: string; value: string; exact: string; appear: number; branchOpacity: number;
}) {
  const e = p(f, appear, appear + 18, E.out);
  const q = p(f, 394, 424, E.inOut);
  const out = 1 - p(f, 540, 554, E.in);
  const opacity = e * out * mix(1, branchOpacity, q);
  if (opacity <= 0.001) return null;
  const x = mix(s3.x + (1 - e) * 28, s4.x + 26, q);
  const y = mix(s3.y, s4.y + 16, q);
  const labelSize = mix(22, 18, q);
  const valueSize = mix(64, 46, q);
  return (
    <>
      <Abs x={s4.x} y={s4.y} style={{ width: 470, height: 112, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line-strong)', opacity: q * opacity, boxShadow: '0 8px 24px rgba(28,26,43,.06)' }}>{null}</Abs>
      <Abs x={x} y={y} style={{ opacity }}>
        <div style={{ fontSize: labelSize, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: mix(4, 2, q) }}>
          <span style={{ fontSize: valueSize, lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-900)' }}>{value}</span>
          <span style={{ fontSize: 18, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums', opacity: 1 - q, whiteSpace: 'nowrap' }}>{exact}</span>
        </div>
      </Abs>
    </>
  );
}

export function CovenantStage({ f, rects }: { f: number; rects: UiRects }) {
  if (f < 240 || f > 712) return null;
  const c = V.covenant;
  const t = V.tree;

  // --- S3 : le calcul -----------------------------------------------------
  const s3Out = 1 - p(f, 394, 408, E.in);
  const hero = heroState(f, rects);
  const labelO = life(f, 254, 270, 392, 404);
  const formulaO = life(f, 300, 314) * s3Out;
  const formulaReveal = p(f, 304, 324, E.inOut);
  const seuilAppear = p(f, 318, 332, E.out);
  const headO = life(f, 330, 344) * s3Out;
  const gaugeO = life(f, 318, 330) * s3Out;
  const gaugeValue = mix(0, c.gauge.value, p(f, 320, 346, E.out));
  const convO = life(f, 342, 358) * s3Out;
  const convGlow = life(f, 350, 358, 366, 388);

  // --- S4 : la preuve -----------------------------------------------------
  const dimN2 = 1;
  const dimTree = 1;
  const s4Out = 1 - p(f, 540, 554, E.in);
  const n1 = 1;
  const n2 = 1;
  const contractE = p(f, 456, 478, E.out);
  const contractO = contractE * s4Out;
  const hl = p(f, 476, 492, E.inOut);
  // La preuve remonte : un point part des comptes vers le ratio, un autre de la clause vers le seuil.
  const dataDot = p(f, 494, 520, E.inOut);
  const clauseDot = p(f, 500, 526, E.inOut);
  const seuilPulse = life(f, 522, 526, 530, 540);

  // --- S5 : le calcul figé, puis la donnée qui change ---------------------
  const s5Out = 1 - p(f, 688, 704, E.in);
  const cardE = p(f, 546, 572, E.out);
  const seal = p(f, 590, 618, E.inOut);
  const press = life(f, 578, 581, 584, 590);
  const buttonO = life(f, 560, 576, 588, 598);
  const natureBefore = life(f, 558, 572, 584, 592);
  const natureReveal = p(f, 590, 606, E.inOut);
  const hashChars = Math.floor(p(f, 602, 614, E.linear) * 8 + 0.0001);
  const lockScale = p(f, 588, 598, E.out);
  const ghostE = life(f, 616, 634) * s5Out;
  const changeO = life(f, 622, 634) * s5Out;
  const morph = p(f, 634, 650, E.inOut);
  const bannerE = life(f, 646, 662) * s5Out;
  const toastE = life(f, 608, 620, 688, 702);

  // Seuil : colonne du calcul (S3) → à côté du ratio (S4) → faits de la carte figée (S5).
  const seuilX = track(f, [[394, X0], [424, 548, E.inOut], [540, 548], [576, 190, E.inOut]]);
  const seuilY = track(f, [[394, 690], [424, 206, E.inOut], [540, 206], [576, 702, E.inOut]]);
  const seuilSize = track(f, [[394, 44], [424, 48, E.inOut], [540, 48], [576, 40, E.inOut]]);
  const seuilO = seuilAppear * s5Out;

  const before = V.frozen.natureAfter.slice(0, V.frozen.natureAfter.length - 8);
  const hashTyped = V.frozen.hash8.slice(0, hashChars);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2, zIndex: 4 }}>
      {/* Liens (calcul puis arbre) */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <Path d="M 724 520 C 790 520, 790 300, 846 300" draw={p(f, 278, 298, E.inOut)} opacity={s3Out} />
        <Path d="M 724 520 C 790 520, 790 444, 846 444" draw={p(f, 286, 306, E.inOut)} opacity={s3Out} />
        <Path d="M 330 312 L 330 336 L 935 336 L 935 360" draw={p(f, 410, 430, E.inOut)} opacity={s4Out * mix(1, dimN2, 0.5) * dimTree} />
        <Path d="M 385 336 L 385 360" draw={p(f, 412, 424, E.inOut)} opacity={s4Out * dimTree} />
        <Path d="M 152 472 L 152 596 M 152 524 L 162 524 M 152 596 L 162 596" draw={p(f, 420, 436, E.inOut)} opacity={s4Out * n1} />
        <Path d="M 702 472 L 702 596 M 702 524 L 712 524 M 702 596 L 712 596" draw={p(f, 432, 448, E.inOut)} opacity={s4Out * n2} />
        <Path d="M 385 630 L 385 650" draw={p(f, 438, 448, E.inOut)} opacity={s4Out * n1} />
        <Path d="M 752 232 C 1000 232, 1010 212, 1248 212" draw={p(f, 458, 476, E.inOut)} opacity={s4Out} />
      </svg>

      {/* S3 — libellé et statut autour du chiffre héros */}
      {hero && labelO > 0.001 && (
        <>
          <Abs x={hero.x} y={hero.y - hero.s * 0.62 - 42} style={{ transform: 'translateX(-50%)', opacity: labelO, fontSize: 26, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
            {c.dateLabel}
          </Abs>
          <Abs x={hero.x} y={hero.y + hero.s * 0.62 + 6} style={{ transform: 'translateX(-50%) scale(1.6)', transformOrigin: '50% 0', opacity: labelO }}>
            <StatusBadge status={c.status} />
          </Abs>
        </>
      )}

      {/* S3 → S4 — numérateur et dénominateur */}
      <MorphNode f={f} s3={{ x: X0, y: 246 }} s4={{ x: 150, y: 360 }} label={c.numeratorLabel} value={c.numerator} exact={c.numeratorExact} appear={278} branchOpacity={n1} />
      <MorphNode f={f} s3={{ x: X0, y: 392 }} s4={{ x: 700, y: 360 }} label={c.denominatorLabel} value={c.denominator} exact={c.denominatorExact} appear={286} branchOpacity={n2} />

      {/* S3 — formule */}
      {formulaO > 0.001 && (
        <Abs x={X0} y={540} style={{ width: 900, opacity: formulaO, background: 'var(--indigo-50)', borderRadius: 14, padding: '16px 24px 18px', border: '1px solid var(--indigo-100)' }}>
          <div style={{ fontSize: 18, color: 'var(--ink-700)' }}>{`${c.label} = ${c.numeratorLabel} / ${c.denominatorLabel}`}</div>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4, clipPath: `inset(0 ${(1 - formulaReveal) * 100}% 0 0)` }}>
            {c.numerator}<span style={{ color: 'var(--ink-400)', fontWeight: 500 }}> ÷ </span>{c.denominator}<span style={{ color: 'var(--ink-400)', fontWeight: 500 }}> = </span>{c.value}
          </div>
        </Abs>
      )}

      {/* Seuil contractuel (S3 → S4 → S5) */}
      {seuilO > 0.001 && (
        <Abs x={seuilX + (1 - seuilAppear) * 24} y={seuilY} style={{ opacity: seuilO, zIndex: 2 }}>
          <div style={{ fontSize: mix(18, 16, p(f, 394, 424)), fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>Seuil contractuel</div>
          <div style={{ fontSize: seuilSize, fontWeight: 700, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums', color: f > 394 && f < 540 ? 'var(--ink-700)' : 'var(--ink-900)', whiteSpace: 'nowrap', borderRadius: 8, padding: '0 6px', margin: '0 -6px', background: `rgba(230, 226, 248, ${0.9 * seuilPulse})`,
            textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'var(--indigo-300)', textDecorationThickness: 2, textUnderlineOffset: 8 }}>
            {c.threshold}
          </div>
        </Abs>
      )}

      {/* S3 — headroom, jauge et conversion en montant */}
      {headO > 0.001 && (
        <Abs x={1240} y={690} style={{ opacity: headO }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-500)' }}>Headroom</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {c.headroom}<span style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-500)' }}> · {c.headroomPct}</span>
          </div>
        </Abs>
      )}
      {gaugeO > 0.001 && (
        <Abs x={X0} y={782} style={{ width: 900 / 1.6, transform: 'scale(1.6)', transformOrigin: '0 0', opacity: gaugeO }}>
          <HeadroomGauge value={gaugeValue} threshold={c.gauge.threshold} comparison="LTE" tone={c.tone} valueText={c.value} thresholdText={c.threshold} />
        </Abs>
      )}
      {convO > 0.001 && (
        <Abs x={X0} y={852} style={{ opacity: convO, background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '14px 22px', display: 'flex', alignItems: 'baseline', gap: 18,
          boxShadow: `0 0 0 ${8 * convGlow}px rgba(207, 200, 241, ${0.55 * convGlow})` }}>
          <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.conversion}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink-700)' }}>{c.conversionLabel}</span>
            <span style={{ fontSize: 16, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>{c.conversionExact}</span>
          </span>
        </Abs>
      )}

      {/* S4 — arbre de provenance */}
      {life(f, 410, 424) * s4Out > 0.001 && (
        <Abs x={642} y={386} style={{ fontSize: 40, fontWeight: 500, color: 'var(--ink-400)', opacity: life(f, 410, 424) * s4Out * dimTree }}>÷</Abs>
      )}
      <TreeRow x={164} y={490} w={456} sign="+" label={t.debt.label} chip={t.debt.chip} value={t.debt.value} opacity={life(f, 420, 434) * s4Out * n1} />
      <TreeRow x={164} y={562} w={456} sign="−" label={t.cash.label} chip={t.cash.chip} value={t.cash.value} opacity={life(f, 426, 440) * s4Out * n1} />
      <TreeRow x={714} y={490} w={456} sign="+" label={t.ltm.label} chip={t.ltm.chip} value={t.ltm.value} opacity={life(f, 432, 446) * s4Out * n2} />
      <TreeRow x={714} y={562} w={456} sign="+" label={t.adjustment.label} chip={t.adjustment.chip} value={t.adjustment.value.replace(/^\+/, '')} opacity={life(f, 438, 452) * s4Out * n2} />
      {life(f, 442, 458) * s4Out > 0.001 && (
        <Abs x={150} y={650 + (1 - p(f, 442, 458)) * 18} style={{ opacity: life(f, 442, 458) * s4Out * n1 }}>
          <SpreadsheetWindow fileName={t.balanceFile} lines={sheetLines} width={470} highlightRows={CASH_ROWS} highlight={p(f, 450, 464)} />
        </Abs>
      )}
      {contractO > 0.001 && (
        <>
          <Abs x={1262} y={196} style={{ opacity: life(f, 468, 480) * s4Out, transform: 'scale(1.5)', transformOrigin: '0 50%' }}>
            <SourceChip kind="contract" label={V.contract.chip} />
          </Abs>
          <div style={{ position: 'absolute', left: 1250, top: 248, perspective: 1600, opacity: contractO }}>
            <div style={{
              width: 522, transform: `translateX(${(1 - contractE) * 90}px) rotateY(${(1 - contractE) * -14}deg) scale(1.15)`, transformOrigin: '0 0',
              borderRadius: 6, border: '1px solid var(--line-strong)', boxShadow: '0 24px 60px rgba(28,26,43,.14)', overflow: 'hidden', background: '#fff',
            }}>
              <div className="covenn-doc" style={{ ['--hl' as string]: String(hl) } as CSSProperties}>
                <ContractPage page={V.contract.page47} pageCount={V.contract.pageCount} highlight={hl > 0 ? V.contract.clauseId : null} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* S5 — carte du calcul, puis enregistrement figé */}
      {cardE * s5Out > 0.001 && (
        <Abs x={150} y={330} style={{
          width: 1000, height: 470, opacity: cardE * s5Out, borderRadius: 16, background: 'var(--surface)', border: 'var(--border-brand)',
          transform: `scale(${mix(0.985, 1, cardE) * mix(1, 0.994, seal)})`, transformOrigin: '50% 50%',
          boxShadow: `0 ${mix(4, 26, seal)}px ${mix(16, 70, seal)}px rgba(28, 26, 43, ${mix(0.06, 0.16, seal)})`,
        }}>
          <div style={{ position: 'absolute', left: 40, right: 40, top: 350, height: 1, background: 'var(--line)' }} />
        </Abs>
      )}
      {cardE * s5Out > 0.001 && (
        <>
          <Abs x={190} y={364} style={{ opacity: life(f, 552, 568) * s5Out, fontSize: 20, fontWeight: 600, color: 'var(--ink-500)' }}>{c.dateLabel}</Abs>
          <Abs x={590} y={470} style={{ opacity: life(f, 558, 574) * s5Out, transform: 'translateY(-50%) scale(1.35)', transformOrigin: '0 50%' }}>
            <StatusBadge status={c.status} />
          </Abs>
          <Abs x={190} y={562} style={{ opacity: natureBefore * s5Out, fontSize: 19, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{V.frozen.natureBefore}</Abs>
          <Abs x={190} y={560} style={{ opacity: s5Out * (natureReveal > 0 ? 1 : 0), display: 'flex', alignItems: 'center', gap: 10, fontSize: 19.5, fontWeight: 600, color: 'var(--indigo-700)', whiteSpace: 'nowrap' }}>
            <span style={{ transform: `scale(${lockScale})`, display: 'inline-flex' }}><Icon name="lock" size={22} strokeWidth={2} /></span>
            <span style={{ clipPath: `inset(0 ${(1 - natureReveal) * 100}% 0 0)` }}>
              {before}<span style={{ fontVariantNumeric: 'tabular-nums' }}>{hashTyped}</span>
            </span>
          </Abs>
          {buttonO > 0.001 && (
            <Abs x={190} y={604} style={{ opacity: buttonO * s5Out, transform: `scale(${1.4 * (1 - 0.04 * press)})`, transformOrigin: '0 0' }}>
              <Button icon="save" onClick={ignore} style={{ background: press > 0.3 ? 'var(--indigo-800)' : undefined }}>{V.frozen.saveButton}</Button>
            </Abs>
          )}
          <Abs x={480} y={702} style={{ opacity: life(f, 560, 576) * s5Out }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-500)' }}>Headroom</div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {c.headroom}<span style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink-500)' }}> · {c.headroomPct}</span>
            </div>
          </Abs>
          <Abs x={790} y={736} style={{ width: 320 / 1.15, transform: 'scale(1.15)', transformOrigin: '0 0', opacity: life(f, 564, 580) * s5Out }}>
            <HeadroomGauge value={c.gauge.value} threshold={c.gauge.threshold} comparison="LTE" tone={c.tone} valueText={c.value} thresholdText={c.threshold} />
          </Abs>
        </>
      )}

      {/* S5 — la donnée change : valeur fantôme (BR-190), bandeau et notification réels */}
      {ghostE > 0.001 && (
        <Abs x={1190 + (1 - ghostE) * 40} y={360} style={{
          width: 580, height: 382, opacity: ghostE, borderRadius: 16, border: '2px dashed rgba(142, 140, 163, 0.75)', background: 'rgba(255, 255, 255, 0.62)', padding: '30px 32px',
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-500)' }}>Calcul actuel</div>
          <div style={{ position: 'relative', height: 132, marginTop: 6, fontSize: 112, lineHeight: '132px', fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-700)' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - morph, transform: `translateY(${-morph * 26}px)` }}>{V.frozen.value}</span>
            <span style={{ position: 'absolute', left: 0, top: 0, opacity: morph, transform: `translateY(${(1 - morph) * 26}px)` }}>{V.modified.value}</span>
          </div>
          <div style={{ marginTop: 10, transform: 'scale(1.2)', transformOrigin: '0 50%', display: 'inline-block' }}><StatusBadge status={V.modified.statusAfter} /></div>
          <div style={{ marginTop: 26, fontSize: 22, color: 'var(--ink-700)', opacity: changeO, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {t.cash.label}{' '}
            <span style={{ color: 'var(--ink-400)', textDecoration: 'line-through' }}>{V.modified.cashBefore}</span>
            <span style={{ color: 'var(--indigo-500)', fontWeight: 600 }}> → </span>
            <span style={{ fontWeight: 650, color: 'var(--ink-900)' }}>{V.modified.cashAfter}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 15, color: 'var(--ink-500)', opacity: changeO, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Icon name="data" size={15} /> {V.modified.fileName}
          </div>
        </Abs>
      )}
      {bannerE > 0.001 && (
        <Abs x={150} y={236 - (1 - bannerE) * 12} style={{ width: 1620 / 1.4, transform: 'scale(1.4)', transformOrigin: '0 0', opacity: bannerE }}>
          <Banner tone="modified" title={V.modified.bannerTitle} action={<Button variant="secondary" size="sm" onClick={ignore}>Voir le calcul actuel</Button>}>
            {V.modified.bannerText}
          </Banner>
        </Abs>
      )}
      {toastE > 0.001 && (
        <div style={{ position: 'absolute', right: 132, bottom: 46, width: 470, height: 140, opacity: toastE, transform: `translateY(${(1 - toastE) * 16}px) scale(1.3)`, transformOrigin: '100% 100%' }}>
          <Toast text={V.modified.toastTitle} detail={V.modified.toastDetail} onDismiss={ignore} />
        </div>
      )}

      {/* S4 — la preuve remonte jusqu'au ratio */}
      <ProofDot path="M 385 812 L 385 336 L 330 336 L 330 318" t={dataDot} />
      <ProofDot path="M 1248 212 C 1010 212, 1000 232, 760 232" t={clauseDot} />

      <Hero f={f} rects={rects} />
    </div>
  );
}
