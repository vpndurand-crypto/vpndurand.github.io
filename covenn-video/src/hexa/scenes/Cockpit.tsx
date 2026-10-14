import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, clamp, life, mix, p } from '../../film/anim';
import { COVENANT, GROUP, SUBSIDIARY } from '../data';
import { Bar, CountryCode, Donut, ProjectionBadge, SHADOW, Sidebar, StatusBadge, Topbar, type NavEntry } from '../kit';
import { LAYOUT as L, MARK_HOME, REVEAL, UI, camTransform, cockpitCam, windowRect } from './cockpitLayout';

/**
 * S3 — « One view. Across your entire group. » (projection ; images V4, voir timing.warp)
 * Vue groupe consolidée : encours total, pays, prêteurs, types de financement ; zoom groupe → pays → filiale, puis retour.
 */
export const NAV: NavEntry[] = [
  { label: 'Group overview', icon: 'overview', active: true },
  { label: 'Facilities', icon: 'financings' },
  { label: 'Covenants', icon: 'covenants' },
  { label: 'Maturities', icon: 'schedule' },
  { label: 'Scenarios', icon: 'calculator' },
  { label: 'Financing packages', icon: 'save' },
  { label: 'Documents', icon: 'documents' },
  { label: 'Financial data', icon: 'data' },
];

/** Teintes des prêteurs : la gamme indigo de la bêta, du plus foncé au plus clair. */
export const LENDER_TINTS = ['var(--indigo-600)', 'var(--indigo-400)', 'var(--aurora-mauve)', 'var(--indigo-200)'];

/** Première ligne « pays », sous l'en-tête de la carte (repère de la carte). */
export const ROWS_TOP = 86;

const card: CSSProperties = { position: 'absolute', top: L.cardsY, height: L.cardsH, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 24, overflow: 'hidden' };
const title: CSSProperties = { fontSize: 20, lineHeight: '28px', fontWeight: 650, letterSpacing: '-0.005em', color: 'var(--ink-900)' };
const label: CSSProperties = { fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.01em' };

function CardHead({ t, l, o = 1 }: { t: string; l: string; o?: number }) {
  return (
    <div style={{ marginBottom: 18, opacity: o }}>
      <div style={label}>{l}</div>
      <div style={title}>{t}</div>
    </div>
  );
}

function Kpi({ i, labelText, value, sub, o, extra, brand = false, glow = 0 }: {
  i: number; labelText: string; value: ReactNode; sub: ReactNode; o: number; extra?: ReactNode; brand?: boolean; glow?: number;
}) {
  return (
    <div style={{
      position: 'absolute', left: L.kpiX[i], top: L.kpiY, width: L.kpiW, height: L.kpiH, background: 'var(--surface)', borderRadius: 12, padding: '18px 22px',
      border: brand ? '1.5px solid var(--indigo-600)' : '1px solid var(--line)', opacity: o, transform: `translateY(${(1 - o) * 14}px)`,
      display: 'flex', flexDirection: 'column', gap: 6, boxShadow: glow > 0 ? `0 0 0 ${6 * glow}px rgba(175, 163, 230, ${0.55 * glow})` : undefined,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{labelText}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46 }}>
        <span style={{ fontSize: 40, lineHeight: '46px', fontWeight: 750, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
        {extra}
      </span>
      <span style={{ fontSize: 13, color: 'var(--ink-500)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>{sub}</span>
    </div>
  );
}

/** Ouverture progressive de la France (trois sociétés), puis repli au retour à la vue groupe. */
export function franceOpen(f: number): number {
  return Math.min(p(f, 222, 234, E.inOut), 1 - p(f, 258, 268, E.inOut));
}

export function Cockpit({ f, hideTotal, hideCovenantValue }: { f: number; hideTotal: boolean; hideCovenantValue: boolean }) {
  if (f < REVEAL.start || f > 306) return null;
  const cam = cockpitCam(f);
  // Ouverture : la fenêtre naît du carré de la marque Covenn et s'agrandit jusqu'à l'écran complet.
  const reveal = p(f, REVEAL.start, REVEAL.end, E.inOut);
  const content = p(f, REVEAL.contentFrom, REVEAL.contentTo, E.out);
  const win = windowRect(cam);
  const m = MARK_HOME.size;
  const r = {
    x: mix(MARK_HOME.x - m / 2, win.x, reveal), y: mix(MARK_HOME.y - m / 2, win.y, reveal),
    w: mix(m, win.w, reveal), h: mix(m, win.h, reveal), radius: mix(m * 0.3, 16 * cam.k, reveal),
  };
  const clip = reveal < 1 ? `inset(${r.y}px ${1920 - r.x - r.w}px ${1080 - r.y - r.h}px ${r.x}px round ${r.radius}px)` : undefined;
  const open = franceOpen(f);
  const subHi = life(f, 234, 242, 258, 266);
  const frHi = life(f, 218, 226, 258, 268);
  const pop = life(f, 238, 243, 255, 260, E.out, E.in);
  const tileGlow = life(f, 274, 284, 300, 306);

  // L'encours total est là d'emblée (plan serré) ; le reste apparaît en cascade pendant le dézoom.
  const kpiO = (i: number) => (i === 0 ? 1 : p(f, 198 + i * 4, 210 + i * 4, E.out));
  const rowIn = (i: number) => p(f, 204 + i * 3, 216 + i * 3, E.out);
  const grow = (i: number) => p(f, 206 + i * 3, 226 + i * 3, E.out);
  const donut = p(f, 208, 234, E.inOut);
  const headO = p(f, 196, 208, E.out);
  const totalPulse = life(f, 186, 190, 196, 212);

  // Lignes « pays » : la France s'ouvre et pousse les autres pays vers le bas.
  const subH = L.subRowH * open;
  const rows = GROUP.byCountry;

  return (
    <>
    {/* La forme de la fenêtre pendant l'ouverture (carte blanche avec son ombre, que le contenu remplit ensuite) */}
    {reveal < 1 && (
      <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.radius, background: '#fff', border: '1px solid var(--line)', boxShadow: SHADOW }} />
    )}
    <div style={{ position: 'absolute', inset: 0, opacity: cam.opacity, clipPath: clip }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: UI.w, height: UI.h, transformOrigin: '0 0', transform: camTransform(cam),
        background: 'var(--canvas)', borderRadius: 16, overflow: 'hidden', boxShadow: `${SHADOW}, 0 0 0 1px rgba(28, 26, 43, 0.06)`,
      }}>
        {/* Plan serré : seul l'encours total est à l'écran ; la coque de l'application se construit pendant le dézoom. */}
        <div style={{ opacity: p(f, 198, 210, E.out) }}>
          <Sidebar items={NAV} height={UI.h} />
          <Topbar org={GROUP.name} perimeter={`Scope: ${GROUP.entityCount} entities · ${GROUP.countryCount} countries`} asOf={GROUP.asOf} width={UI.w - UI.sidebar} />
        </div>

        {/* En-tête de page */}
        <div style={{ position: 'absolute', left: L.header.x, top: L.header.y, opacity: headO }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}>Group overview</h1>
            <ProjectionBadge />
          </div>
          <p style={{ marginTop: 2, color: 'var(--ink-500)', fontSize: 14 }}>{GROUP.name} · {GROUP.entityCount} entities · {GROUP.countryCount} countries · data as of {GROUP.asOf}</p>
        </div>

        {/* Indicateurs */}
        <Kpi i={0} o={kpiO(0)} glow={totalPulse} labelText="Total Group Debt" value={<span style={{ visibility: hideTotal ? 'hidden' : 'visible' }}>{GROUP.total}</span>}
          sub={<span style={{ opacity: p(f, 188, 196) }}>{GROUP.financingCount} facilities · {GROUP.lenderCount} lenders</span>} />
        <Kpi i={1} o={kpiO(1)} labelText="Entities" value={GROUP.entityCount} sub={`${GROUP.entitiesFrance} in France · ${GROUP.entitiesAbroad} abroad`} />
        <Kpi i={2} o={kpiO(2)} labelText="Countries" value={GROUP.countryCount} sub={<>{GROUP.byCountry.map((c, i) => <span key={c.key} style={{ opacity: p(f, 210 + i * 2, 216 + i * 2) }}><CountryCode code={c.country} scale={0.85} /></span>)}</>} />
        <Kpi i={3} o={kpiO(3)} brand glow={tileGlow} labelText="Net leverage · closest covenant" value={<span style={{ visibility: hideCovenantValue ? 'hidden' : 'visible' }}>{COVENANT.value}</span>}
          extra={<StatusBadge status={COVENANT.status} size="sm" short />} sub={`${SUBSIDIARY.short} · limit ${COVENANT.threshold}`} />

        {/* Par pays : groupe → pays → filiale */}
        <div style={{ ...card, left: L.pays.x, width: L.pays.w, opacity: p(f, 200, 210, E.out) }}>
          <CardHead l={`${GROUP.countryCount} countries · ${GROUP.entityCount} entities`} t="Debt by Country" />
          {rows.map((c, i) => {
            const isFr = c.country === 'FR';
            const top = ROWS_TOP + i * L.rowH + (i > 0 ? subH * 3 : 0);
            return (
              <div key={c.key} style={{ position: 'absolute', left: 16, right: 16, top, height: L.rowH + (isFr ? subH * 3 : 0), opacity: rowIn(i), transform: `translateX(${(1 - rowIn(i)) * -18}px)` }}>
                <div style={{ height: L.rowH, padding: '10px 8px', borderRadius: 10, background: isFr ? `rgba(230, 226, 248, ${0.75 * frHi})` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CountryCode code={c.country} />
                    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 15.5, fontWeight: 650, color: 'var(--ink-900)' }}>{c.label}{c.currency === 'USD' && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--src-import)', background: 'var(--src-import-bg)', borderRadius: 5, padding: '2px 6px' }}>USD</span>}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{c.sub}</span>
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.amount}</span>
                    <span style={{ width: 52, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{c.share}</span>
                  </div>
                  <div style={{ marginTop: 8, marginLeft: 42 }}><Bar fraction={c.fraction} grow={grow(i)} /></div>
                </div>
                {isFr && open > 0.001 && (
                  <div style={{ overflow: 'hidden', height: subH * 3 }}>
                    {c.entities.map((e, j) => {
                      const hi = e.id === 'ent-di' ? subHi : 0;
                      const eo = Math.min(open, p(f, 224 + j * 3, 232 + j * 3, E.out));
                      return (
                        <div key={e.id} style={{
                          height: L.subRowH, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 42, padding: '0 8px', borderRadius: 8, opacity: f > 250 ? open : eo,
                          transform: `translateX(${(1 - eo) * 14}px)`,
                          background: hi > 0 ? `rgba(230, 226, 248, ${0.95 * hi})` : undefined, boxShadow: hi > 0 ? `inset ${3 * hi}px 0 0 var(--indigo-600)` : undefined,
                        }}>
                          <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{e.lenders}</span>
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{e.amount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Par prêteur */}
        <div style={{ ...card, left: L.preteur.x, width: L.preteur.w, opacity: p(f, 203, 213, E.out) }}>
          <CardHead l={`${GROUP.lenderCount} lenders`} t="Debt by Lender" />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <div style={{ position: 'relative' }}>
              <Donut size={196} thickness={30} draw={donut} slices={GROUP.byLender.map((l, i) => ({ fraction: l.fraction, color: LENDER_TINTS[i] ?? 'var(--indigo-200)' }))} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <span>
                  <span style={{ display: 'block', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{GROUP.total}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-500)' }}>total debt</span>
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {GROUP.byLender.map((l, i) => (
              <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 6px', borderBottom: i < GROUP.byLender.length - 1 ? '1px solid var(--line)' : undefined, opacity: clamp(donut * 3 - i * 0.45), transform: `translateX(${(1 - clamp(donut * 3 - i * 0.45)) * 12}px)` }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: LENDER_TINTS[i] }} />
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.label}</span>
                <span style={{ fontSize: 14.5, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{l.amount}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{l.share}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par type */}
        <div style={{ ...card, left: L.type.x, width: L.type.w, opacity: p(f, 206, 216, E.out) }}>
          <CardHead l={`${GROUP.byCategory.length} categories`} t="Debt by Type" />
          {GROUP.byCategory.map((c, i) => (
            <div key={c.key} style={{ padding: '12px 4px 16px', borderBottom: '1px solid var(--line)', opacity: rowIn(i + 2), transform: `translateX(${(1 - rowIn(i + 2)) * 18}px)` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{c.label}</span>
                <span style={{ fontSize: 15.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.amount}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{c.share}</span>
              </div>
              <div style={{ marginTop: 10 }}><Bar fraction={c.fraction} grow={grow(i + 1)} color="var(--indigo-400)" /></div>
            </div>
          ))}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-500)' }}>
            <Icon name="info" size={14} />
            Currencies: EUR, USD · shown in EUR
          </div>
        </div>

        {/* Filiale ouverte depuis la vue groupe */}
        {pop > 0.001 && <SubsidiaryPopover o={pop} />}

        {/* Pendant l'ouverture, la fenêtre est d'abord le carré blanc de la marque */}
        {content < 1 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - content }} />}
      </div>
    </div>
    </>
  );
}

/** Fil de navigation (hors interface) : groupe → pays → filiale, puis retour à la vue consolidée. Images V4. */
export function NavPill({ f }: { f: number }) {
  const o = life(f, 202, 212, 268, 278);
  if (o <= 0.001) return null;
  const fr = GROUP.byCountry.find((c) => c.country === 'FR');
  const steps = [
    { key: 'groupe', label: 'Group', value: GROUP.total, show: 1 },
    { key: 'pays', label: fr?.label ?? 'France', value: fr?.amount ?? '', show: life(f, 222, 230, 258, 266) },
    { key: 'filiale', label: SUBSIDIARY.name, value: SUBSIDIARY.amount, show: life(f, 236, 244, 256, 264) },
  ];
  const active = f >= 240 && f < 258 ? 2 : f >= 226 && f < 260 ? 1 : 0;
  return (
    <div style={{
      position: 'absolute', right: 120, top: 78, height: 56, display: 'flex', alignItems: 'center', padding: '0 6px', borderRadius: 999,
      background: 'rgba(255, 255, 255, 0.92)', border: '1px solid var(--line)', boxShadow: '0 14px 36px rgba(28,26,43,.12)', opacity: o,
      transform: `translateY(${(1 - o) * -10}px)`, whiteSpace: 'nowrap', lineHeight: 1.2,
    }}>
      {steps.map((st, i) => (
        <span key={st.key} style={{ display: 'inline-flex', alignItems: 'center', maxWidth: i === 0 ? 400 : 420 * st.show, opacity: i === 0 ? 1 : st.show, overflow: 'hidden' }}>
          {i > 0 && <span style={{ color: 'var(--ink-400)', fontSize: 22, margin: '0 6px', fontWeight: 500 }}>›</span>}
          <span style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 10, height: 44, padding: '0 16px', borderRadius: 999, alignSelf: 'center', paddingTop: 11,
            background: active === i ? 'var(--indigo-600)' : 'transparent', color: active === i ? '#fff' : 'var(--ink-700)',
          }}>
            <span style={{ fontSize: 19, fontWeight: 700 }}>{st.label}</span>
            <span style={{ fontSize: 17, fontWeight: 600, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>{st.value}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function SubsidiaryPopover({ o }: { o: number }) {
  const P = L.popover;
  const line = (k: string, v: ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 44, borderBottom: '1px solid var(--line)', fontSize: 14.5 }}>
      <span style={{ color: 'var(--ink-500)' }}>{k}</span>
      <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
  return (
    <div style={{
      position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h, background: 'var(--surface)', borderRadius: 14, padding: '18px 22px',
      border: '1px solid var(--line-strong)', boxShadow: '0 24px 60px rgba(28,26,43,.18), 0 2px 8px rgba(28,26,43,.06)',
      opacity: Math.min(1, o * 2.2), transform: `translateX(${(1 - o) * -24}px) scale(${mix(0.9, 1, o)})`, transformOrigin: '0 30%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <CountryCode code="FR" />
        <span style={{ fontSize: 18, fontWeight: 700 }}>{SUBSIDIARY.name}</span>
      </div>
      {line(SUBSIDIARY.financing, SUBSIDIARY.lender)}
      {line('Outstanding', SUBSIDIARY.amount)}
      {line('Final maturity', SUBSIDIARY.maturity)}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 52, fontSize: 14.5 }}>
        <span style={{ color: 'var(--ink-500)' }}>Net leverage</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{SUBSIDIARY.covenant}</span>
          <StatusBadge status={SUBSIDIARY.status} size="sm" short />
        </span>
      </div>
    </div>
  );
}

