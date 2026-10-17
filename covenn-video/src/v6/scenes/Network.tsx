/**
 * S5 — « From managing capital to accessing it. » (0:15–0:23) — la vision : « Open capital infrastructure », capacité
 * future de la bêta (« Connections with banks, digital lenders and private debt funds », « Standardised data exchange
 * for credit processes »). Illustration conceptuelle : aucune connexion réelle, aucun partenaire, aucune offre.
 *   A (15–17 s) : la demande Project Falcon devient l'entreprise ; ses données entrent dans Covenn, standardisées.
 *   B (17–20,5 s) : trois voies s'ouvrent — Banks, Private Debt, Capital Markets — et le profil de financement y circule.
 *   C (20,5–23 s) : chaque voie s'affine en une structure d'illustration ; deux voies rapportent des conditions
 *       indicatives, qui rejoignent la comparaison (S6). Les marchés de capitaux restent une perspective (pointillés).
 * Ni crypto, ni jeton, ni portefeuille, ni courbe de cours : la technologie sous-jacente reste invisible.
 */
import type { CSSProperties } from 'react';
import { E, life, mix, p } from '../../film/anim';
import { Icon, Mark, Tag } from '../../capos/kit';
import { COMPARISON, PATHWAYS, PROFILE_PACKETS } from '../data';
import { CONVERGE, MATCHES, OFFERS_LAND, PACKETS, PATHWAYS as PATHWAY_AT, STRUCTURES } from '../timing';
import { rectToFrame, windowCam, type Rect } from '../Window';
import { HEADER_CELLS } from './Pages';

/** Géométrie du réseau (image). */
export const NODE: Rect = { x: 100, y: 388, w: 440, h: 384 };
export const HUB = { x: 930, y: 580, mark: 120 } as const;
const PN = { x: 1300, w: 520, h: 150, ys: [330, 580, 830] as const } as const;
/** Puces du profil dans la carte de l'entreprise (repères de la carte, 440 × 384) : les paquets partent de là. */
export const CHIP = { x: 26, y: 304, w: 189, h: 28, gapX: 10, gapY: 8 } as const;
export const chipRect = (i: number): Rect => ({ x: CHIP.x + (i % 2) * (CHIP.w + CHIP.gapX), y: CHIP.y + Math.floor(i / 2) * (CHIP.h + CHIP.gapY), w: CHIP.w, h: CHIP.h });

/** Lente poussée de caméra sur tout le réseau (l'entreprise comprise). */
const ZOOM_C = { x: 960, y: 600 };
export function netZoom(f: number): number {
  return mix(1, 1.035, p(f, 476, 690, E.soft));
}
export function netPoint(f: number, x: number, y: number): { x: number; y: number } {
  const s = netZoom(f);
  return { x: ZOOM_C.x + (x - ZOOM_C.x) * s, y: ZOOM_C.y + (y - ZOOM_C.y) * s };
}
export function netRect(f: number, r: Rect): Rect {
  const a = netPoint(f, r.x, r.y);
  const s = netZoom(f);
  return { x: a.x, y: a.y, w: r.w * s, h: r.h * s };
}

/** Sortie du réseau vers la comparaison. */
export const netOut = (f: number) => p(f, CONVERGE[0], CONVERGE[0] + 14, E.inOut);

const curve = (x1: number, y1: number, x2: number, y2: number, bend = 0.5) => {
  const dx = (x2 - x1) * bend;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};
const HUB_R = HUB.mark / 2 + 10;
const OUT_PATHS = PN.ys.map((y) => curve(HUB.x + HUB_R, HUB.y, PN.x, y, 0.55));
const IN_PATH = `M ${NODE.x + NODE.w} ${HUB.y} L ${HUB.x - HUB_R} ${HUB.y}`;

/** Fond du réseau : une infrastructure qui s'étend depuis Covenn (lueur, trame de points). Sous la carte de l'entreprise. */
export function NetworkBackdrop({ f }: { f: number }) {
  if (f < 444 || f > CONVERGE[1] + 4) return null;
  const out = netOut(f);
  const bg = p(f, 446, 486, E.out);
  const grid = mix(0, 1500, p(f, 452, 540, E.out));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: bg * (1 - out) }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1100px 760px at ${HUB.x}px ${HUB.y}px, rgba(217, 210, 245, 0.55) 0%, rgba(239, 236, 251, 0.35) 40%, rgba(245, 245, 248, 0) 75%)` }} />
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="v6-dots" width={34} height={34} patternUnits="userSpaceOnUse" patternTransform={`translate(${(f * 0.25) % 34} 0)`}>
              <circle cx={17} cy={17} r={1.4} fill="#c9c0ee" />
            </pattern>
            <radialGradient id="v6-dots-mask-g" cx={HUB.x} cy={HUB.y} r={Math.max(1, grid)} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
              <stop offset="0.75" stopColor="#fff" stopOpacity={0.35} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="v6-dots-mask"><rect width={1920} height={1080} fill="url(#v6-dots-mask-g)" /></mask>
          </defs>
          <rect width={1920} height={1080} fill="url(#v6-dots)" mask="url(#v6-dots-mask)" />
        </svg>
      </div>

    </div>
  );
}

export function Network({ f }: { f: number }) {
  if (f < 444 || f > CONVERGE[1] + 4) return null;
  const out = netOut(f);
  const s = netZoom(f);
  const hub = p(f, 464, 482, E.out);
  const hubLabel = p(f, 498, 510, E.out);
  const pulse = 0.5 + 0.5 * Math.sin((f - 450) / 6);
  const inLine = p(f, 468, 482, E.inOut);

  return (
    <div style={{ position: 'absolute', inset: 0, lineHeight: 1.2 }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${ZOOM_C.x}px ${ZOOM_C.y}px`, transform: `scale(${s})`, opacity: 1 - out }}>
        {/* Anneaux autour de Covenn */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {[150, 232, 318].map((r, i) => {
            const o = p(f, 460 + i * 6, 486 + i * 6, E.out);
            return (
              <circle key={r} cx={HUB.x} cy={HUB.y} r={r * mix(0.7, 1, o)} fill="none" stroke="#d9d2f5" strokeWidth={1.5}
                strokeDasharray={i === 1 ? '3 9' : undefined} opacity={o * (0.75 - i * 0.18)}
                transform={`rotate(${(f - 450) * (i % 2 ? -0.18 : 0.12)} ${HUB.x} ${HUB.y})`} />
            );
          })}
          {/* L'entreprise vers Covenn */}
          <path d={IN_PATH} pathLength={1} fill="none" stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - inLine} opacity={0.75} />
          {/* Covenn vers les trois voies (la troisième en pointillés : perspective) */}
          {OUT_PATHS.map((d, i) => {
            const at = PATHWAY_AT[i] ?? 0;
            const t = p(f, at - 12, at + 2, E.inOut);
            if (t <= 0) return null;
            const pw = PATHWAYS[i];
            const glow = life(f, MATCHES[i] ?? 0, (MATCHES[i] ?? 0) + 3, (MATCHES[i] ?? 0) + 6, (MATCHES[i] ?? 0) + 18);
            return (
              <g key={d}>
                {glow > 0.01 && <path d={d} fill="none" stroke={pw?.accent ?? 'var(--brand)'} strokeWidth={12} strokeLinecap="round" opacity={0.18 * glow} />}
                {pw?.future ? (
                  <>
                    {/* Perspective : un tracé en pointillés, dévoilé par un masque */}
                    <mask id={`v6-reveal-${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                      <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="1 1" strokeDashoffset={1 - t} />
                    </mask>
                    <path d={d} fill="none" stroke="#8fa6cf" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="7 9" mask={`url(#v6-reveal-${i})`} opacity={0.9} />
                  </>
                ) : (
                  <path d={d} pathLength={1} fill="none" stroke={pw?.accent ?? 'var(--brand)'} strokeWidth={3} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - t} opacity={0.85} />
                )}
              </g>
            );
          })}
        </svg>

        {/* Paquets : les données de l'entreprise entrent dans Covenn, standardisées */}
        {PROFILE_PACKETS.map((pk, i) => {
          const at = PACKETS[i] ?? 0;
          const t = p(f, at - 14, at, E.inOut);
          if (f < at - 14 || f > at + 2) return null;
          const c = chipRect(i);
          const x0 = NODE.x + c.x + c.w / 2;
          const y0 = NODE.y + c.y + c.h / 2;
          const x = mix(x0, HUB.x, t);
          const y = mix(y0, HUB.y, t) - Math.sin(Math.PI * t) * 26 * (i % 2 ? -1 : 1);
          return (
            <span key={pk.label} style={{
              position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(1, 0.55, t)})`, opacity: life(f, at - 14, at - 11, at - 2, at + 1),
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px 0 8px', borderRadius: 999, background: 'var(--surface)',
              border: '1.5px solid var(--brand-line)', boxShadow: '0 10px 24px rgba(74, 51, 179, 0.16)', fontSize: 14, fontWeight: 650, color: 'var(--brand-ink)', whiteSpace: 'nowrap',
            }}>
              <Icon name={pk.icon} size={15} />{pk.label}
            </span>
          );
        })}

        {/* Les objets de financement circulent de Covenn vers les voies (le profil, pas des fonds) */}
        {OUT_PATHS.map((d, i) => [0, 1].map((k) => {
          const start = (PATHWAY_AT[i] ?? 0) + 6 + k * 18;
          if (f < start || f > CONVERGE[0] + 4) return null;
          const period = 34;
          const cycle = ((f - start) % period) / period;
          const pw = PATHWAYS[i];
          return (
            <span key={`${i}-${k}`} style={{
              position: 'absolute', left: 0, top: 0, width: 30, height: 22, marginLeft: -15, marginTop: -11, borderRadius: 6,
              background: pw?.future ? 'rgba(255,255,255,0.9)' : 'var(--surface)', border: `1.5px ${pw?.future ? 'dashed' : 'solid'} ${pw?.accent ?? 'var(--brand)'}`,
              boxShadow: '0 6px 14px rgba(28, 25, 54, 0.12)', offsetPath: `path('${d}')`, offsetDistance: `${(cycle * 100).toFixed(2)}%`, offsetRotate: '0deg',
              opacity: Math.sin(Math.PI * cycle) * (1 - p(f, CONVERGE[0] - 6, CONVERGE[0] + 2)), display: 'grid', placeItems: 'center', color: pw?.accent ?? 'var(--brand)',
            } as CSSProperties}>
              <Icon name="file" size={12} stroke={2.2} />
            </span>
          );
        }))}

        {/* Les trois voies vers le capital (familles, sans nom ni logo) */}
        {PATHWAYS.map((pw, i) => {
          const at = PATHWAY_AT[i] ?? 0;
          const o = p(f, at - 2, at + 10, E.out);
          if (o <= 0.001) return null;
          const y = (PN.ys[i] ?? HUB.y) - PN.h / 2;
          const st = p(f, STRUCTURES[i] ?? 0, (STRUCTURES[i] ?? 0) + 8, E.out);
          const match = life(f, MATCHES[i] ?? 0, (MATCHES[i] ?? 0) + 3, (MATCHES[i] ?? 0) + 6, (MATCHES[i] ?? 0) + 18);
          return (
            <div key={pw.key} style={{
              position: 'absolute', left: PN.x, top: y, width: PN.w, height: PN.h, opacity: o, transform: `translateX(${(1 - o) * 36}px) scale(${mix(0.96, 1, o) * (1 + 0.02 * match)})`,
              borderRadius: 20, background: pw.future ? 'rgba(255, 255, 255, 0.78)' : 'var(--surface)',
              border: `${pw.future ? '1.5px dashed #b9cbe6' : `1.5px solid ${match > 0.05 ? pw.accent : 'var(--brand-line)'}`}`,
              boxShadow: `0 18px 44px rgba(28, 25, 54, ${pw.future ? 0.06 : 0.1}), 0 0 0 ${8 * match}px ${pw.soft}`,
            }}>
              <span style={{ position: 'absolute', left: 22, top: 22, display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: 14, background: pw.soft, color: pw.accent }}>
                <Icon name={pw.icon} size={27} />
              </span>
              <span style={{ position: 'absolute', left: 92, top: 18, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: pw.accent, letterSpacing: '0.06em' }}>{pw.n}</span>
                <span style={{ fontSize: 30, fontWeight: 750, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{pw.label}</span>
              </span>
              <span className="faint" style={{ position: 'absolute', left: 92, top: 60, fontSize: 15.5, whiteSpace: 'nowrap' }}>{pw.detail}</span>
              {/* Phase C : la structure d'illustration */}
              {st > 0.001 && (
                <span style={{ position: 'absolute', left: 92, top: 96, display: 'flex', alignItems: 'center', gap: 8, opacity: st, transform: `translateX(${(1 - st) * -12}px)` }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px 0 10px', borderRadius: 999, whiteSpace: 'nowrap',
                    background: pw.future ? 'transparent' : pw.soft, border: `1.5px ${pw.future ? 'dashed #b9cbe6' : `solid ${pw.soft}`}`, color: pw.accent, fontSize: 16, fontWeight: 700,
                  }}>
                    <Icon name="chev" size={15} stroke={2.4} />{pw.structure}
                  </span>
                  {pw.future && <Tag proj scale={1.1}>Illustrative</Tag>}
                </span>
              )}
            </div>
          );
        })}

        {/* Covenn, au centre : le profil de financement standardisé */}
        {hub > 0.001 && (
          <div style={{ position: 'absolute', left: HUB.x, top: HUB.y, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, hub)})`, opacity: hub }}>
            <Mark size={HUB.mark} glow={0.45 + 0.4 * pulse} />
            <div style={{ position: 'absolute', left: '50%', top: HUB.mark + 18, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--brand-ink)', letterSpacing: '-0.02em' }}>Covenn</div>
              <div className="muted" style={{ fontSize: 16, fontWeight: 550, marginTop: 4, opacity: hubLabel }}>Standardised financing profile</div>
            </div>
          </div>
        )}
      </div>

      {/* Phase C → S6 : deux voies rapportent des conditions indicatives, qui rejoignent la comparaison */}
      <Converge f={f} />
    </div>
  );
}

/** Les conditions indicatives quittent leur voie (Banks, Private Debt) et se posent sur les colonnes de la comparaison. */
function Converge({ f }: { f: number }) {
  if (f < CONVERGE[0] - 2 || f > CONVERGE[1] + 6) return null;
  const cam = windowCam(f);
  return (
    <>
      {COMPARISON.proposals.map((x, i) => {
        const land = OFFERS_LAND[i] ?? CONVERGE[1];
        const start = CONVERGE[0] + i * 3;
        const t = p(f, start, land, E.inOut);
        if (f < start || f > land + 5) return null;
        const pwIndex = PATHWAYS.findIndex((pw) => pw.key === x.pathway);
        const pw = PATHWAYS[pwIndex];
        const from = netPoint(f, PN.x + PN.w * 0.62, (PN.ys[pwIndex] ?? HUB.y));
        const cell = HEADER_CELLS[i];
        if (!cell || !pw) return null;
        const to = rectToFrame(cam, { x: cell.x + 8, y: cell.y + 6, w: cell.w - 16, h: cell.h - 12 });
        const w = mix(250, to.w, t);
        const h = mix(70, to.h, t);
        const cx = mix(from.x, to.x + to.w / 2, t);
        const cy = mix(from.y, to.y + to.h / 2, t) - Math.sin(Math.PI * t) * 60;
        const o = life(f, start, start + 4, land, land + 5);
        return (
          <div key={x.id} style={{
            position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: 14, opacity: o,
            background: 'var(--surface)', border: `1.5px solid ${pw.accent}`, boxShadow: `0 16px 40px rgba(28, 25, 54, ${0.16 * (1 - t) + 0.04})`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px', overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', color: pw.accent }}>INDICATIVE TERMS</span>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{pw.structure}</span>
          </div>
        );
      })}
    </>
  );
}

