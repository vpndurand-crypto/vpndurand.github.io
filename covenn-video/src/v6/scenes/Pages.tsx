/**
 * Les pages de la bêta montrées dans la fenêtre de l'application (coordonnées de l'interface, 1600 × 900) :
 *   S2 — « Capital overview » : en-tête, rangée d'indicateurs, cartes « Distribution by country and entity » et
 *        « Exposure by capital provider » (cartes de la même page, rapprochées pour tenir en un écran) ;
 *   S3 — le scénario « Project Falcon acquisition » (Forecast & scenarios) : hypothèses, « Today versus scenario »,
 *        « Projected SFA covenants » ;
 *   S4 — la demande « Acquisition financing — Project Falcon » (Financing workspace), onglet Preparation ;
 *   S6 — la même demande, onglet « Terms comparison » : les trois propositions indicatives de la démonstration.
 * Textes, valeurs et statuts : ceux de la bêta (src/v6/data.ts). Seules les tailles de texte sont agrandies pour l'écran.
 */
import type { CSSProperties, ReactNode } from 'react';
import { E, clamp, life, mix, p, quad } from '../../film/anim';
import { Badge, Icon, StatusBadge, Tag, Typed, type IconName } from '../../capos/kit';
import { pct } from '../../capos/format';
import { COMPARISON, OVERVIEW, REQUEST_PAGE, SCENARIO_PAGE, SELECTED_TOAST } from '../data';
import { COMPARE_ROWS, COUNTRY_HI, DOCKS, NAV, OFFERS_LAND, PREPARED, PROVIDER_SWEEP, REVIEW, S3, SELECT } from '../timing';
import { COL, KPI, UI, type Rect } from '../Window';

// ---------------------------------------------------------------------------
// Éléments communs
// ---------------------------------------------------------------------------
const abs: CSSProperties = { position: 'absolute' };
const nowrap: CSSProperties = { whiteSpace: 'nowrap' };

/** Entrée et sortie d'une page lors d'un changement d'écran (la coque reste en place). */
function pageMotion(f: number, enter: readonly [number, number] | null, leave: readonly [number, number] | null) {
  const i = enter ? p(f, enter[0], enter[1], E.out) : 1;
  const o = leave ? p(f, leave[0], leave[1], E.in) : 0;
  return { opacity: Math.min(i, 1 - o), dy: (1 - i) * 14 - o * 12 };
}

interface Action { label: string; icon: IconName; primary?: boolean; glow?: number; press?: number }

function Button({ a, style }: { a: Action; style?: CSSProperties }) {
  const glow = a.glow ?? 0;
  const press = a.press ?? 0;
  return (
    <span className={`btn${a.primary ? ' primary' : ''}`} style={{
      height: 40, padding: '0 16px', fontSize: 14.5, gap: 8, borderRadius: 9, justifyContent: 'center',
      transform: `scale(${(1 + 0.04 * glow) * (1 - 0.05 * press)})`,
      background: !a.primary && glow > 0 ? `rgba(239,236,251,${glow})` : undefined,
      borderColor: !a.primary && glow > 0.3 ? 'var(--brand-line)' : undefined,
      boxShadow: glow > 0 ? `0 0 0 ${7 * glow}px rgba(217,210,245,${0.85 * glow})${a.primary ? `, 0 10px 24px rgba(74,51,179,${0.3 * glow})` : ''}` : undefined,
      ...style,
    }}>
      <Icon name={a.icon} size={17} />{a.label}
    </span>
  );
}

function PageHeader({ crumbs, title, sub, actions }: { crumbs?: readonly string[]; title: string; sub: string; actions: Action[] }) {
  const top = crumbs ? 94 : 84;
  return (
    <>
      {crumbs && (
        <div className="crumbs" style={{ ...abs, left: COL.x, top: 72, fontSize: 13.5, margin: 0 }}>
          {crumbs.map((c, i) => (
            <span key={c} style={{ display: 'inline-flex', gap: 6 }}>
              {i > 0 && <span>/</span>}
              <span style={{ color: i === 0 ? 'var(--ink-2)' : 'var(--ink-3)' }}>{c}</span>
            </span>
          ))}
        </div>
      )}
      <h1 style={{ ...abs, ...nowrap, left: COL.x, top, fontSize: 31, lineHeight: '40px' }}>{title}</h1>
      <p className="muted" style={{ ...abs, ...nowrap, left: COL.x, top: top + 42, fontSize: 15 }}>{sub}</p>
      <div style={{ ...abs, right: UI.w - COL.r, top: top + 22, display: 'flex', gap: 10 }}>
        {actions.map((a) => <Button key={a.label} a={a} />)}
      </div>
    </>
  );
}

function Tabs({ y, items }: { y: number; items: { label: string; count: string | null; on: boolean }[] }) {
  return (
    <nav className="tabs" style={{ ...abs, left: COL.x, width: COL.w, top: y, margin: 0, fontSize: 15, overflow: 'visible' }}>
      {items.map((t) => (
        <a key={t.label} className={t.on ? 'on' : ''} style={{ padding: '9px 14px' }}>
          {t.label}{t.count !== null && <span className="count" style={{ fontSize: 12.5 }}>{t.count}</span>}
        </a>
      ))}
    </nav>
  );
}

function CardBox({ r, title, sub, right, children, o = 1, style }: { r: Rect; title?: string; sub?: string; right?: ReactNode; children?: ReactNode; o?: number; style?: CSSProperties }) {
  if (o <= 0.001) return null;
  return (
    <div className="card" style={{ ...abs, left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', opacity: o, transform: `translateY(${(1 - o) * 14}px)`, ...style }}>
      {title && (
        <div style={{ ...abs, left: 22, right: 22, top: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, lineHeight: '26px', ...nowrap }}>{title}</h2>
            {sub && <p className="muted" style={{ fontSize: 13.5, marginTop: 3, ...nowrap }}>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S2 — Capital overview
// ---------------------------------------------------------------------------
const CARDS_Y = KPI.y + KPI.h + 16;
const DIST: Rect = { x: COL.x, y: CARDS_Y, w: 636, h: 490 };
const EXPO: Rect = { x: COL.x + 652, y: CARDS_Y, w: 636, h: 490 };
const ROW = { first: 84, h: 42, sepGap: 50, prov: 46 } as const;
const countryY = (i: number) => ROW.first + i * ROW.h;
const entityY = (i: number) => ROW.first + OVERVIEW.distribution.countries.length * ROW.h + ROW.sepGap - 8 + i * ROW.h;
/** Valeur « €18.6m » de la première tuile : les montants des pays s'y additionnent. */
const TOTAL_AT = { x: KPI.xs[0] + 16 + 62, y: KPI.y + 38 + 23 };

function KpiTile({ x, label, value, desc, o, color, glow = 0 }: { x: number; label: string; value: string; desc: string; o: number; color?: string; glow?: number }) {
  if (o <= 0.001) return null;
  return (
    <div className="kpi" style={{
      ...abs, left: x, top: KPI.y, width: KPI.w, height: KPI.h, display: 'block', padding: 0, opacity: o, transform: `translateY(${(1 - o) * 12}px)`,
      borderColor: glow > 0.02 ? `rgba(74, 51, 179, ${0.3 + 0.7 * glow})` : undefined,
      boxShadow: glow > 0 ? `0 0 0 ${6 * glow}px rgba(217, 210, 245, ${0.85 * glow})` : undefined,
    }}>
      <span className="k" style={{ ...abs, ...nowrap, left: 16, top: 15, fontSize: 13.5, lineHeight: '18px' }}>{label}</span>
      <span className="v" style={{ ...abs, ...nowrap, left: 16, top: 37, fontSize: 36, lineHeight: '46px', color }}>{value}</span>
      <span className="d" style={{ ...abs, left: 16, right: 14, top: 89, fontSize: 12, lineHeight: '16px' }}>{desc}</span>
      <span className="src" style={{ ...abs, left: 16, bottom: 11, fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="source" size={12} />Trace to source</span>
    </div>
  );
}

function BarLine({ y, label, amount, share, fraction, color, grow, hi = 0, o = 1, weight = 0 }: {
  y: number; label: string; amount: string; share: string | null; fraction: number; color: string; grow: number; hi?: number; o?: number; weight?: number;
}) {
  return (
    <div style={{
      ...abs, left: 14, right: 14, top: y, height: 38, display: 'grid', gridTemplateColumns: '204px 1fr 118px', alignItems: 'center', gap: 14, padding: '0 8px',
      borderRadius: 8, opacity: o, background: hi > 0.01 ? `rgba(239, 236, 251, ${0.95 * hi})` : undefined, boxShadow: hi > 0.01 ? `inset ${3 * hi}px 0 0 var(--brand)` : undefined,
    }}>
      <span style={{ ...nowrap, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', color: hi > 0.5 || weight > 0.5 ? 'var(--ink)' : 'var(--ink-2)', fontWeight: hi > 0.5 ? 600 : 450 }}>{label}</span>
      <span className="bar-track" style={{ display: 'block', height: 10, borderRadius: 5 }}>
        <span className="bar-fill" style={{ display: 'block', height: '100%', borderRadius: 5, width: `${Math.max(1.5, fraction * 100) * clamp(grow)}%`, background: color, filter: hi > 0.01 ? `saturate(${1 + 0.4 * hi}) brightness(${1 - 0.08 * hi})` : undefined }} />
      </span>
      <span style={{ ...nowrap, textAlign: 'right', fontSize: 15, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
        {amount}{share && <span className="faint" style={{ fontWeight: 400, fontSize: 13 }}> {share}</span>}
      </span>
    </div>
  );
}

export function OverviewPage({ f }: { f: number }) {
  if (f < 84 || f > NAV.swap[0] + 8) return null;
  const m = pageMotion(f, null, [NAV.swap[0] - 2, NAV.swap[0] + 6]);
  const D = OVERVIEW.distribution;
  const X = OVERVIEW.exposure;
  // Plan serré (90–104) : seule la tuile de l'encours ; le reste se découvre pendant le recul.
  const head = p(f, 108, 122, E.out);
  const kpiO = (i: number) => (i === 0 ? 1 : p(f, 106 + i * 4, 118 + i * 4, E.out));
  const cardO = (i: number) => p(f, 114 + i * 6, 128 + i * 6, E.out);
  const grow = (i: number) => p(f, 120 + i * 2, 146 + i * 2, E.out);
  // Les pays (et leurs sociétés) s'allument ; leurs montants rejoignent l'encours.
  const hiCountry = (i: number) => life(f, COUNTRY_HI[i] ?? 0, (COUNTRY_HI[i] ?? 0) + 5, 180, 190, E.out, E.inOut);
  const hiEntity = (name: string) => {
    const i = D.countries.findIndex((c) => c.entities.includes(name));
    return i < 0 ? 0 : 0.6 * life(f, (COUNTRY_HI[i] ?? 0) + 2, (COUNTRY_HI[i] ?? 0) + 7, 180, 190, E.out, E.inOut);
  };
  // Les prêteurs : un balayage de haut en bas ; l'encours s'allume à la fin.
  const sweep = p(f, PROVIDER_SWEEP[0], PROVIDER_SWEEP[1], E.inOut);
  const sweepO = life(f, PROVIDER_SWEEP[0] - 2, PROVIDER_SWEEP[0] + 2, PROVIDER_SWEEP[1], PROVIDER_SWEEP[1] + 8);
  const hiProvider = (i: number) => sweepO * clamp(1 - Math.abs(sweep * (X.providers.length - 0.2) - i - 0.4) / 1.1);
  const totalGlow = Math.max(
    ...COUNTRY_HI.map((t) => life(f, t + 9, t + 11, t + 14, t + 24)),
    life(f, PROVIDER_SWEEP[1], PROVIDER_SWEEP[1] + 3, PROVIDER_SWEEP[1] + 8, PROVIDER_SWEEP[1] + 18),
  );
  const explore = life(f, NAV.press - 6, NAV.press - 2, NAV.swap[0] + 4, NAV.swap[0] + 10);
  const press = life(f, NAV.press, NAV.press + 2, NAV.press + 4, NAV.press + 7);
  const [kTotal, ...kOthers] = OVERVIEW.kpis;

  return (
    <div style={{ ...abs, inset: 0, opacity: m.opacity, transform: `translateY(${m.dy}px)` }}>
      <div style={{ opacity: head }}>
        <PageHeader title={OVERVIEW.title} sub={OVERVIEW.sub} actions={[
          { label: OVERVIEW.actions[0] ?? '', icon: 'scenarios', glow: explore, press },
          { label: OVERVIEW.actions[1] ?? '', icon: 'plus', primary: true },
        ]} />
      </div>

      {kTotal && <KpiTile x={KPI.xs[0]} label={kTotal.label} value={kTotal.value} desc={kTotal.desc} o={kpiO(0)} glow={totalGlow} />}
      {kOthers.map((k, i) => (
        <KpiTile key={k.label} x={KPI.xs[i + 1] ?? 0} label={k.label} value={k.value} desc={k.desc} o={kpiO(i + 1)}
          {...(k.label === 'Covenant headroom' ? { color: OVERVIEW.headroomColor } : {})} />
      ))}

      <CardBox r={DIST} title={D.title} sub={D.sub} o={cardO(0)}>
        {D.countries.map((c, i) => (
          <BarLine key={c.label} y={countryY(i)} label={c.label} amount={c.amount} share={c.share} fraction={c.fraction} color="var(--c6)" grow={grow(i)} hi={hiCountry(i)} weight={1} />
        ))}
        <div className="sep" style={{ ...abs, left: 22, right: 22, top: entityY(0) - 14, margin: 0 }} />
        {D.entities.map((e, i) => (
          <BarLine key={e.label} y={entityY(i)} label={e.label} amount={e.amount} share={e.share} fraction={e.fraction} color="var(--c7)" grow={grow(i + 3)} hi={hiEntity(e.label)} />
        ))}
      </CardBox>

      <CardBox r={EXPO} title={X.title} sub={X.sub} o={cardO(1)}>
        {X.providers.map((v, i) => (
          <BarLine key={v.label} y={ROW.first + i * ROW.prov} label={v.label} amount={v.amount} share={v.share} fraction={v.fraction} color={i === 0 ? 'var(--c1)' : 'var(--c2)'} grow={grow(i + 1)} hi={hiProvider(i)} weight={1} />
        ))}
      </CardBox>

      {/* Les montants des pays rejoignent l'encours : €14m + €3.2m + €1.39m = €18.6m */}
      {D.countries.map((c, i) => {
        const t0 = COUNTRY_HI[i] ?? 0;
        const t = p(f, t0 + 1, t0 + 11, E.inOut);
        if (f < t0 + 1 || f > t0 + 13) return null;
        const from = { x: DIST.x + DIST.w - 80, y: DIST.y + countryY(i) + 19 };
        const x = quad(from.x, mix(from.x, TOTAL_AT.x, 0.55), TOTAL_AT.x, t);
        const y = quad(from.y, Math.min(from.y, TOTAL_AT.y) - 40, TOTAL_AT.y, t);
        return (
          <span key={c.label} style={{
            ...abs, ...nowrap, left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(1, 0.78, t)})`, opacity: life(f, t0 + 1, t0 + 3, t0 + 10, t0 + 12),
            padding: '4px 11px', borderRadius: 999, background: 'var(--brand)', color: '#fff', fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            boxShadow: '0 8px 20px rgba(74, 51, 179, 0.3)',
          }}>
            {c.amount}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S3 — Forecast & scenarios › Project Falcon acquisition
// ---------------------------------------------------------------------------
const ASSUME: Rect = { x: COL.x, y: 178, w: 420, h: 690 };
const RIGHT_X = COL.x + 444;
const RIGHT_W = COL.r - RIGHT_X;
const VERSUS: Rect = { x: RIGHT_X, y: 232, w: RIGHT_W, h: 300 };
const PROJ: Rect = { x: RIGHT_X, y: 548, w: RIGHT_W, h: 320 };
/** Bouton « Create financing request from scenario » : la demande en sort (S3 → S4). */
export const CTA_RECT: Rect = { x: COL.r - 336, y: 180, w: 336, h: 40 };

function Field({ y, label, value, prefix, suffix, select = false, hint, focus = 0, glow = 0, w = ASSUME.w - 44, x = 22 }: {
  y: number; label: string; value: ReactNode; prefix?: string; suffix?: string; select?: boolean; hint?: string; focus?: number; glow?: number; w?: number; x?: number;
}) {
  return (
    <div style={{ ...abs, left: x, top: y, width: w }}>
      <div style={{ ...nowrap, fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 550 }}>{label}</div>
      <div style={{
        marginTop: 6, height: 42, display: 'flex', alignItems: 'center', borderRadius: 8, background: 'var(--surface)', fontSize: 16, fontVariantNumeric: 'tabular-nums',
        border: `1px solid ${focus > 0.5 || glow > 0.5 ? 'var(--brand)' : 'var(--line)'}`,
        boxShadow: focus > 0.01 || glow > 0.01 ? `0 0 0 ${Math.max(2 * focus, 6 * glow)}px rgba(217, 210, 245, ${Math.max(focus, glow)})` : undefined,
      }}>
        {prefix && <em style={{ fontStyle: 'normal', color: 'var(--ink-3)', padding: '0 4px 0 12px', fontSize: 14 }}>{prefix}</em>}
        <span style={{ flex: 1, padding: '0 10px', ...nowrap, fontWeight: glow > 0.5 ? 650 : 450, color: glow > 0.5 ? 'var(--brand-ink)' : 'var(--ink)' }}>{value}</span>
        {suffix && <em style={{ fontStyle: 'normal', color: 'var(--ink-3)', padding: '0 12px', fontSize: 14 }}>{suffix}</em>}
        {select && <Icon name="down" size={15} style={{ marginRight: 12, color: 'var(--ink-2)' }} />}
      </div>
      {hint && <div style={{ ...nowrap, marginTop: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
  );
}

/** Colonnes du tableau « Projected SFA covenants » (covenant, actuel, projeté, seuil, statut, marge). */
const COV_COLS = '182px 140px 80px 130px 160px 60px';
/** Jauge du covenant projeté : ratio, seuil (marche de 3.50x à 3.25x), marge entre les deux. */
const GAUGE = { x: 22, w: RIGHT_W - 44, min: 2.5, max: 3.75 } as const;
const gx = (v: number) => GAUGE.x + ((v - GAUGE.min) / (GAUGE.max - GAUGE.min)) * GAUGE.w;
function rgbMix(a: readonly number[], b: readonly number[], t: number) {
  return `rgb(${a.map((v, i) => Math.round(mix(v, b[i] ?? v, t))).join(', ')})`;
}

export function ScenarioPage({ f }: { f: number }) {
  if (f < NAV.swap[0] + 6 || f > 316) return null;
  const m = pageMotion(f, [NAV.swap[0] + 6, NAV.swap[1]], [304, 314]);
  const P = SCENARIO_PAGE;
  const C = P.covenant;
  const typed = [...P.fields.typed, P.fields.borrowing];
  const slot = (S3.typing[1] - S3.typing[0]) / typed.length;
  const typeT = (i: number) => p(f, S3.typing[0] + i * slot, S3.typing[0] + (i + 1) * slot, E.linear);
  const focus = (i: number) => life(f, S3.typing[0] + i * slot - 1, S3.typing[0] + i * slot + 1, S3.typing[0] + (i + 1) * slot - 0.5, S3.typing[0] + (i + 1) * slot + 0.5);
  // Recalcul : la colonne « At 30 Sep 2027 » se remplit ; le ratio du groupe défile ; le seuil du covenant passe à 3.25x.
  const sweep = p(f, S3.roll[0], S3.roll[1], E.inOut);
  const cellIn = (r: number) => p(f, S3.roll[0] + 2 + r * 3, S3.roll[0] + 7 + r * 3, E.out);
  const changeIn = (r: number) => p(f, S3.roll[1] - 4 + r * 2, S3.roll[1] + 2 + r * 2, E.out);
  const levT = p(f, S3.roll[0], S3.roll[1], E.inOut);
  const lev = mix(P.leverage.from, P.leverage.to, levT);
  const thrT = p(f, S3.roll[0] + 4, S3.critical, E.inOut);
  const thr = mix(C.thresholdFrom, C.thresholdTo, thrT);
  const headroom = (thr - C.value) / thr;
  const critical = f >= S3.critical;
  const crit = p(f, S3.critical - 1, S3.critical + 5, E.out);
  const ring = p(f, S3.critical, S3.critical + 16, E.out);
  const heroBand = p(f, S3.roll[0], S3.roll[0] + 8, E.out);
  // Le besoin de financement : le nouvel emprunt s'allume, puis le bouton qui crée la demande.
  const need = life(f, S3.need, S3.need + 5, S3.lift[0] + 6, S3.lift[1]);
  const ctaGlow = life(f, S3.need + 6, S3.need + 11, S3.press + 4, S3.press + 14);
  const ctaPress = life(f, S3.press - 1, S3.press + 1, S3.press + 3, S3.press + 6);
  const watch = [154, 100, 0];
  const red = [194, 70, 45];

  return (
    <div style={{ ...abs, inset: 0, opacity: m.opacity, transform: `translateY(${m.dy}px)` }}>
      <PageHeader crumbs={P.crumbs} title={P.title} sub={P.sub} actions={[]} />

      {/* Hypothèses (formulaire de la bêta) */}
      <CardBox r={ASSUME} title="Assumptions" right={<Tag scale={1.15}>{P.typeTag}</Tag>}>
        <Field y={62} label={P.fields.entity.label} value={P.fields.entity.value} select />
        <Field y={140} label={P.fields.horizon.label} value={P.fields.horizon.value} select hint={P.fields.horizon.hint} />
        <div className="sep" style={{ ...abs, left: 22, right: 22, top: 236, margin: 0 }} />
        {typed.map((t, i) => {
          const y = i < 3 ? 252 + i * 76 : 502;
          const tt = typeT(i);
          return (
            <Field key={t.label} y={y} label={t.label} prefix="€" focus={focus(i)} glow={i === 3 ? need : 0}
              value={tt > 0 ? <Typed text={t.value} t={tt} /> : <span style={{ color: 'var(--ink-3)' }}> </span>} />
          );
        })}
        <div className="sep" style={{ ...abs, left: 22, right: 22, top: 486, margin: 0 }} />
        <Field y={580} w={178} label={P.fields.rate.label} value={P.fields.rate.value} suffix={P.fields.rate.suffix} />
        <Field y={580} x={220} w={178} label={P.fields.rateType.label} value={P.fields.rateType.value} select />
      </CardBox>

      {/* Barre de résultats : prévision d'illustration, périmètre, création de la demande */}
      <div style={{ ...abs, left: RIGHT_X, top: 188, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Tag proj scale={1.2}>{P.forecastTag}</Tag>
        <span className="muted" style={{ ...nowrap, fontSize: 14 }}>{P.perimeter}</span>
      </div>
      <div style={{ ...abs, left: CTA_RECT.x, top: CTA_RECT.y }}>
        <Button a={{ label: P.cta, icon: 'financing', primary: true, glow: ctaGlow, press: ctaPress }} style={{ width: CTA_RECT.w }} />
      </div>

      {/* Aujourd'hui contre le scénario */}
      <CardBox r={VERSUS} title="Today versus scenario">
        {sweep > 0 && sweep < 1 && (
          <div style={{ ...abs, top: 56, bottom: 0, left: `${mix(-30, 110, sweep)}%`, width: '26%', background: 'linear-gradient(90deg, rgba(239,236,251,0) 0%, rgba(239,236,251,0.95) 50%, rgba(239,236,251,0) 100%)' }} />
        )}
        <div style={{ ...abs, left: 22, right: 22, top: 62, height: 30, display: 'grid', gridTemplateColumns: '1fr 170px 200px 130px', alignItems: 'center', fontSize: 13, fontWeight: 550, color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>
          {P.head.map((h, i) => <span key={h} style={{ textAlign: i === 0 ? 'left' : 'right', ...nowrap }}>{h}</span>)}
        </div>
        {P.metrics.map((r, i) => {
          const hero = i === P.metrics.length - 1;
          const top = 92 + i * 52;
          const shownH = cellIn(i);
          return (
            <div key={r.label} style={{
              ...abs, left: 14, right: 14, top, height: hero ? 104 : 52, display: 'grid', gridTemplateColumns: '1fr 170px 200px 130px', alignItems: 'center', padding: '0 8px',
              borderBottom: hero ? undefined : '1px solid var(--line-2)', borderRadius: hero ? 10 : 0,
              background: hero ? `rgba(239, 236, 251, ${0.9 * heroBand})` : undefined,
            }}>
              <span style={{ ...nowrap, fontSize: hero ? 19 : 16.5, fontWeight: hero ? 650 : 450 }}>{r.label}</span>
              <span style={{ ...nowrap, textAlign: 'right', fontSize: hero ? 28 : 16.5, fontVariantNumeric: 'tabular-nums', color: hero ? 'var(--ink-2)' : 'var(--ink)' }}>{r.today}</span>
              <span style={{ ...nowrap, textAlign: 'right', fontSize: hero ? 46 : 16.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: hero ? '-0.02em' : undefined, color: hero ? 'var(--brand-ink)' : 'var(--ink)' }}>
                {hero
                  ? (f < S3.roll[0] ? <span className="faint" style={{ fontWeight: 400 }}>—</span> : levT >= 1 ? r.horizon : `${lev.toFixed(2)}x`)
                  : (shownH > 0.02 ? <span style={{ opacity: shownH }}>{r.horizon}</span> : <span className="faint" style={{ fontWeight: 400 }}>—</span>)}
              </span>
              <span style={{ ...nowrap, textAlign: 'right', fontSize: hero ? 21 : 16, fontWeight: hero ? 700 : 500, fontVariantNumeric: 'tabular-nums', color: hero ? 'var(--brand-ink)' : 'var(--ink-2)', opacity: changeIn(i) }}>{r.change}</span>
            </div>
          );
        })}
      </CardBox>

      {/* Covenant du contrat SFA projeté à l'horizon : la marche de seuil s'applique, la marge devient critique */}
      <CardBox r={PROJ} title={C.title}>
        <div style={{ ...abs, left: 22, right: 22, top: 58, height: 28, display: 'grid', gridTemplateColumns: COV_COLS, alignItems: 'center', fontSize: 12.5, fontWeight: 550, color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', columnGap: 8 }}>
          {C.head.map((h, i) => <span key={h} style={{ ...nowrap, textAlign: i === 0 || i === 4 ? 'left' : 'right' }}>{h}</span>)}
        </div>
        <div style={{ ...abs, left: 22, right: 22, top: 94, display: 'grid', gridTemplateColumns: COV_COLS, alignItems: 'start', columnGap: 8, fontVariantNumeric: 'tabular-nums' }}>
          <span>
            <b style={{ display: 'block', fontSize: 16.5 }}>{C.name}</b>
            <span className="faint" style={{ display: 'block', fontSize: 12.5, lineHeight: '16px', marginTop: 2 }}>{C.note}</span>
          </span>
          <span style={{ textAlign: 'right', fontSize: 16.5 }}>{C.current}<span className="faint" style={{ display: 'block', fontSize: 12.5 }}>{C.currentVs}</span></span>
          <span style={{ textAlign: 'right', fontSize: 16.5, fontWeight: 700 }}>{f >= S3.roll[0] + 2 ? <span style={{ opacity: cellIn(0) }}>{C.projected}</span> : <span className="faint" style={{ fontWeight: 400 }}>—</span>}</span>
          <span style={{ textAlign: 'right', fontSize: 16.5 }}>
            {f >= S3.roll[0] + 6 ? (
              <span style={{ opacity: cellIn(1) }}>{thrT >= 1 ? C.threshold : `≤ ${thr.toFixed(2)}x`}<span className="faint" style={{ display: 'block', fontSize: 12.5 }}>{C.thresholdNote}</span></span>
            ) : <span className="faint">—</span>}
          </span>
          <span style={{ position: 'relative', height: 30 }}>
            <span style={{ ...abs, left: 0, top: 0, opacity: 1 - crit }}><StatusBadge status={C.statusFrom} scale={1.1} /></span>
            {crit > 0.001 && (
              <span style={{ ...abs, left: 0, top: 0, opacity: crit, transform: `scale(${mix(0.7, 1, crit)})`, transformOrigin: '0 50%' }}>
                <Badge tone="b-crit" dot scale={1.1}>{C.status}</Badge>
              </span>
            )}
          </span>
          <span style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, color: critical ? 'var(--crit)' : 'var(--watch)' }}>{thrT <= 0 ? C.headroomFrom : thrT >= 1 ? C.headroom : pct(headroom)}</span>
        </div>

        {/* Jauge : 3.13x face au seuil ; la marge se réduit avec la marche de seuil */}
        <div style={{ ...abs, left: 0, right: 0, top: 186, height: 92 }}>
          <div style={{ ...abs, left: GAUGE.x, width: GAUGE.w, top: 34, height: 12, borderRadius: 6, background: 'var(--line-2)' }} />
          <div style={{ ...abs, left: GAUGE.x, width: gx(C.value) - GAUGE.x, top: 34, height: 12, borderRadius: '6px 0 0 6px', background: 'var(--c7)', opacity: 0.55 }} />
          <div style={{ ...abs, left: gx(C.value), width: Math.max(0, gx(thr) - gx(C.value)), top: 34, height: 12, background: rgbMix(watch, red, crit), opacity: 0.9 }} />
          <div style={{ ...abs, left: gx(thr) - 2, top: 22, width: 4, height: 36, borderRadius: 2, background: critical ? 'var(--crit)' : 'var(--ink)' }} />
          {ring > 0 && ring < 1 && (
            <div style={{ ...abs, left: gx(thr), top: 40, width: 18 + 110 * ring, height: 18 + 110 * ring, marginLeft: -(9 + 55 * ring), marginTop: -(9 + 55 * ring), borderRadius: '50%', border: `${mix(3.5, 1, ring)}px solid var(--crit)`, opacity: 1 - ring }} />
          )}
          <span style={{ ...abs, ...nowrap, left: (gx(C.value) + gx(thr)) / 2, top: 0, transform: 'translateX(-50%)', fontSize: 13.5, fontWeight: 650, color: critical ? 'var(--crit)' : 'var(--watch)' }}>
            headroom {thrT <= 0 ? C.headroomFrom : thrT >= 1 ? C.headroom : pct(headroom)}
          </span>
          <span style={{ ...abs, ...nowrap, left: gx(C.value), top: 62, transform: 'translateX(-100%)', paddingRight: 8, fontSize: 14, fontWeight: 650 }}>{C.name} {C.projected}</span>
          <span style={{ ...abs, ...nowrap, left: gx(thr) + 8, top: 62, fontSize: 14, fontWeight: 700, color: critical ? 'var(--crit)' : 'var(--ink)' }}>
            {thrT >= 1 ? C.threshold : `≤ ${thr.toFixed(2)}x`}
          </span>
        </div>
        <div style={{ ...abs, left: 22, top: 282 }}><Tag proj scale={1.12}>{C.tag}</Tag></div>
      </CardBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S4 — Financing workspace › Acquisition financing — Project Falcon (onglet Preparation)
// ---------------------------------------------------------------------------
const REQ_TABS_Y = 170;
/** Emplacement de la demande (carte du premier plan, FalconCard) dans la page. */
export const SLOT: Rect = { x: COL.x, y: 232, w: 820, h: 636 };
const SIDE_X = COL.x + 844;
const SIDE_W = COL.r - SIDE_X;
const LINKED: Rect = { x: SIDE_X, y: 232, w: SIDE_W, h: 238 };
const BRIEF: Rect = { x: SIDE_X, y: 486, w: SIDE_W, h: 212 };
const TODO: Rect = { x: SIDE_X, y: 714, w: SIDE_W, h: 154 };

/** Nombre de pièces posées (disponibles ou reliées) à l'image f. */
export const docked = (f: number) => DOCKS.filter((d) => f >= d).length;

export function RequestPage({ f }: { f: number }) {
  if (f < 316 || f > 480) return null;
  const m = pageMotion(f, [316, 330], null);
  const R = REQUEST_PAGE;
  const n = docked(f);
  const linkedO = p(f, 330, 344, E.out);
  const briefO = p(f, 336, 350, E.out);
  const todoO = p(f, REVIEW - 4, REVIEW + 6, E.out);
  const ready = life(f, PREPARED - 2, PREPARED + 4, 426, 440);
  return (
    <div style={{ ...abs, inset: 0, opacity: m.opacity, transform: `translateY(${m.dy}px)` }}>
      <PageHeader crumbs={R.crumbs} title={R.title} sub={R.sub} actions={[
        { label: R.actions[0] ?? '', icon: 'send' },
        { label: R.actions[1] ?? '', icon: 'file', primary: true, glow: ready },
      ]} />
      <Tabs y={REQ_TABS_Y} items={R.tabs.map((t) => ({ label: t.label, on: t.label === 'Preparation', count: t.label === 'Preparation' ? `${n}/${R.total}` : null }))} />

      <CardBox r={LINKED} title={R.linked.title} o={linkedO}>
        <div style={{ ...abs, left: 22, top: 58, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...nowrap, fontSize: 16, fontWeight: 650, color: 'var(--brand)' }}>{R.linked.name}</span>
          <Tag proj scale={1.1}>Illustrative</Tag>
        </div>
        <div style={{ ...abs, left: 22, right: 22, top: 98, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          {R.linked.cells.map((c) => (
            <div key={c.label}>
              <div className="faint" style={{ ...nowrap, fontSize: 13 }}>{c.label}</div>
              <div style={{ fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'crit' in c && c.crit ? 'var(--crit)' : 'var(--ink)' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </CardBox>

      <CardBox r={BRIEF} title={R.brief.title} o={briefO}>
        <p className="muted" style={{ ...abs, left: 22, right: 22, top: 56, fontSize: 13.5, lineHeight: '19px' }}>
          A structured English brief built from the shared data: group overview, purpose, amount and tenor, current debt, covenant situation, forecast assumptions, use of proceeds, supporting documents and missing items.
        </p>
        <div style={{ ...abs, left: 22, top: 152 }}><Button a={{ label: R.brief.button, icon: 'file', primary: true, glow: ready }} /></div>
      </CardBox>

      <CardBox r={TODO} title="Still to do" o={todoO}>
        <div style={{ ...abs, left: 22, top: 62, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge tone={R.review.tone} scale={1.15}>{R.review.statusLabel}</Badge>
          <span style={{ ...nowrap, fontSize: 15 }}>{R.review.label}</span>
        </div>
      </CardBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S6 — Financing workspace › Acquisition financing — Project Falcon (onglet Terms comparison)
// ---------------------------------------------------------------------------
const TABLE = { x: COL.x, y: 252, w: COL.w, label: 250, head: 56, section: 24 } as const;
const COLW = (TABLE.w - TABLE.label) / 3;
const ROW_H: Record<string, number> = {
  Instrument: 34, Amount: 50, Tenor: 50, Rate: 34, 'All-in rate under assumptions': 36, Amortisation: 54, 'Pro forma covenant check': 42, 'Estimated cash cost over the tenor': 38,
};
const BUTTONS_H = 50;
interface Line { kind: 'section' | 'row'; label: string; y: number; h: number; cells?: string[][] }
const LINES: Line[] = (() => {
  const out: Line[] = [];
  let y = TABLE.head;
  for (const s of COMPARISON.sections) {
    out.push({ kind: 'section', label: s.title, y, h: TABLE.section });
    y += TABLE.section;
    for (const r of s.rows) {
      const h = ROW_H[r.label] ?? 38;
      out.push({ kind: 'row', label: r.label, y, h, cells: r.cells });
      y += h;
    }
  }
  return out;
})();
const TABLE_H = (LINES.at(-1)?.y ?? 0) + (LINES.at(-1)?.h ?? 0) + BUTTONS_H;
/** Cellules d'en-tête des trois propositions (les cartes venues du réseau s'y posent). */
export const HEADER_CELLS: Rect[] = [0, 1, 2].map((i) => ({ x: TABLE.x + TABLE.label + i * COLW, y: TABLE.y, w: COLW, h: TABLE.head }));
const HIGHLIGHTS = ['Amount', 'All-in rate under assumptions', 'Pro forma covenant check'];
/** Badge « Selected for negotiation » de la proposition retenue (l'aurore de la carte de fin s'ouvre là). */
export const SELECTED_AT = {
  x: TABLE.x + TABLE.label + Math.max(0, COMPARISON.proposals.findIndex((x) => x.id === COMPARISON.selected)) * COLW + 16 + 96,
  y: TABLE.y + TABLE_H - BUTTONS_H / 2,
};

export function ComparePage({ f }: { f: number }) {
  if (f < 672 || f > 802) return null;
  const R = REQUEST_PAGE;
  const rowIn = (i: number) => p(f, 694 + i * 1.4, 704 + i * 1.4, E.out);
  // Bandeau de comparaison : il passe d'une dimension à l'autre (montant, taux, covenant), sans classer les propositions.
  const lines = HIGHLIGHTS.map((l) => need(LINES.find((x) => x.label === l)));
  const hop = (k: number) => p(f, COMPARE_ROWS[k] ?? 0, (COMPARE_ROWS[k] ?? 0) + 7, E.inOut);
  const bandO = life(f, COMPARE_ROWS[0] - 5, COMPARE_ROWS[0] + 2, SELECT - 4, SELECT + 4);
  const l0 = lines[0];
  let bandY = l0?.y ?? 0;
  let bandH = l0?.h ?? 0;
  for (let k = 1; k < lines.length; k += 1) {
    const t = hop(k);
    const l = lines[k];
    if (l && t > 0) { bandY = mix(bandY, l.y, t); bandH = mix(bandH, l.h, t); }
  }
  const selected = COMPARISON.proposals.findIndex((x) => x.id === COMPARISON.selected);
  const chosen = f >= SELECT;
  const press = life(f, SELECT - 4, SELECT - 2, SELECT, SELECT + 2);
  const badge = p(f, SELECT, SELECT + 6, E.out);
  const toast = life(f, SELECT + 2, SELECT + 10, Infinity, Infinity);
  const noteO = p(f, 702, 714, E.out);
  return (
    <div style={{ ...abs, inset: 0 }}>
      <PageHeader crumbs={R.crumbs} title={R.title} sub={R.sub} actions={[
        { label: R.actions[0] ?? '', icon: 'send' },
        { label: R.actions[1] ?? '', icon: 'file', primary: true },
      ]} />
      <Tabs y={REQ_TABS_Y} items={COMPARISON.tabs} />

      <div style={{ ...abs, left: COL.x, right: UI.w - COL.r, top: 222, height: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
        <span className="muted" style={nowrap}>{COMPARISON.assumptions}</span>
        <span style={{ flex: 1 }} />
        <span className="faint" style={nowrap}>Rate sensitivity</span>
        {COMPARISON.sensitivity.map((s, i) => <span key={s} className={`chip${i === 0 ? ' on' : ''}`} style={{ fontSize: 12.5, padding: '2px 10px' }}>{s}</span>)}
      </div>

      <div className="card" style={{ ...abs, left: TABLE.x, top: TABLE.y, width: TABLE.w, height: TABLE_H, overflow: 'hidden' }}>
        {/* Bandeau de comparaison */}
        {bandO > 0.001 && (
          <div style={{ ...abs, left: 0, right: 0, top: bandY, height: bandH, opacity: bandO, background: 'rgba(239, 236, 251, 0.95)', boxShadow: 'inset 4px 0 0 var(--brand)' }} />
        )}
        {/* En-tête : les trois propositions */}
        {COMPARISON.proposals.map((x, i) => (
          <div key={x.id} style={{ ...abs, left: TABLE.label + i * COLW + 16, top: 12, opacity: p(f, (OFFERS_LAND[i] ?? 0) + 2, (OFFERS_LAND[i] ?? 0) + 8, E.out) }}>
            <div style={{ ...nowrap, fontSize: 17, fontWeight: 650, color: 'var(--brand)' }}>{x.provider}</div>
            <div className="faint" style={{ ...nowrap, fontSize: 13 }}>{x.meta}</div>
          </div>
        ))}
        {LINES.map((l, i) => (l.kind === 'section' ? (
          <div key={l.label} style={{ ...abs, left: 0, right: 0, top: l.y, height: l.h, background: 'var(--paper)', borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 12.5, fontWeight: 650, color: 'var(--ink-2)', opacity: rowIn(i) }}>{l.label}</div>
        ) : (
          <div key={l.label} style={{ ...abs, left: 0, right: 0, top: l.y, height: l.h, display: 'grid', gridTemplateColumns: `${TABLE.label}px repeat(3, 1fr)`, alignItems: 'center', borderBottom: '1px solid var(--line-2)', opacity: rowIn(i) }}>
            <span style={{ ...nowrap, padding: '0 14px', fontSize: 13.5, color: 'var(--ink-3)' }}>{l.label}</span>
            {(l.cells ?? []).map((c, j) => <TermCell key={j} label={l.label} cell={c} status={COMPARISON.proposals[j]?.headroomStatus ?? 'WATCH'} />)}
          </div>
        )))}
        {/* Choix pour négociation : un choix de travail, sans engagement */}
        <div style={{ ...abs, left: 0, right: 0, top: TABLE_H - BUTTONS_H, height: BUTTONS_H, display: 'grid', gridTemplateColumns: `${TABLE.label}px repeat(3, 1fr)`, alignItems: 'center', opacity: rowIn(LINES.length) }}>
          <span />
          {COMPARISON.proposals.map((x, j) => (
            <span key={x.id} style={{ padding: '0 16px', position: 'relative', height: 32 }}>
              {j === selected && chosen ? (
                <span style={{ ...abs, left: 16, top: 2, opacity: badge, transform: `scale(${mix(0.8, 1, badge)})`, transformOrigin: '0 50%' }}>
                  <Badge tone="b-ok" dot scale={1.2}>{SELECTED_TOAST.badge}</Badge>
                </span>
              ) : (
                <span className={`btn sm${chosen ? '' : ' primary'}`} style={{ fontSize: 13, padding: '5px 12px', transform: j === selected ? `scale(${1 - 0.06 * press})` : undefined, boxShadow: j === selected && press > 0 ? `0 0 0 ${6 * press}px rgba(217,210,245,${0.9 * press})` : undefined }}>{COMPARISON.select}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="note" style={{ ...abs, left: COL.x, width: COL.w, top: TABLE.y + TABLE_H + 12, fontSize: 12.5, lineHeight: '17px', padding: '8px 12px', opacity: noteO }}>{COMPARISON.note}</div>

      {/* Message de la bêta après le choix (toast) */}
      {toast > 0.001 && (
        <div className="toast" style={{ ...abs, position: 'absolute', left: UI.w / 2, bottom: 24, transform: `translate(-50%, ${(1 - toast) * 20}px)`, opacity: toast, animation: 'none', maxWidth: 620, fontSize: 14.5 }}>
          <span style={{ color: '#b8f0d9', display: 'flex' }}><Icon name="check" size={18} /></span>
          <div><b style={nowrap}>{SELECTED_TOAST.text}</b><p style={{ fontSize: 13, ...nowrap }}>{SELECTED_TOAST.detail}</p></div>
        </div>
      )}
    </div>
  );
}

function need<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Ligne de comparaison absente');
  return v;
}

/** Cellule de la comparaison : valeur, puis sous-ligne (manque par rapport à la demande, durée demandée, profil). */
function TermCell({ label, cell, status }: { label: string; cell: string[]; status: string }) {
  const [main = '', sub] = cell;
  const bold = label === 'Amount' || label === 'All-in rate under assumptions' || label === 'Estimated cash cost over the tenor';
  if (label === 'Pro forma covenant check') {
    const [ratioText = '', headroom = ''] = cell;
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', fontSize: 15, ...nowrap }}>
        {ratioText}<Badge tone={status === 'COMPLIANT' ? 'b-ok' : status === 'CRITICAL' ? 'b-crit' : 'b-watch'} dot scale={1.05}>{headroom}</Badge>
      </span>
    );
  }
  const short = sub?.includes('short of the request') ?? false;
  return (
    <span style={{ padding: '0 16px', lineHeight: 1.3 }}>
      <span style={{ display: 'block', fontSize: label === 'Amortisation' ? 14 : 15.5, fontWeight: bold ? 700 : 450, fontVariantNumeric: 'tabular-nums', whiteSpace: label === 'Amortisation' ? 'normal' : 'nowrap' }}>{main}</span>
      {sub && label !== 'Amortisation' && <span style={{ display: 'block', fontSize: 12.5, color: short ? 'var(--crit)' : 'var(--ink-3)', ...nowrap }}>{sub}</span>}
    </span>
  );
}
