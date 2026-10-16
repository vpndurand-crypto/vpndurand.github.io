import type { CSSProperties, ReactNode } from 'react';
import { E, clamp, life, mix, p } from '../../film/anim';
import { COVENANT, GROUP, SUBSIDIARY } from '../data';
import { Bar, CountryCode, SHADOW, Sidebar, SourceLink, StatusBadge, Topbar } from '../kit';
import { KPI_BOX as B, LAYOUT as L, MARK_HOME, REVEAL, UI, camTransform, cockpitCam, windowRect } from './cockpitLayout';

/**
 * S3 — « One view. Across your entire group. » (démonstration de la bêta ; images V4, voir timing.warp)
 * La vue d'ensemble du groupe dans la coque de la bêta : encours, sociétés, pays, covenant le plus tendu ; répartition par
 * pays et société, par prêteur, par instrument et par devise ; zoom groupe → pays → société, puis retour.
 */

/** Première ligne « pays », sous l'en-tête de la carte. */
export const ROWS_TOP = 86;
const BAR = { country: 'var(--c6)', entity: 'var(--c7)', provider: ['var(--c1)', 'var(--c2)'], instrument: { 'Senior debt': 'var(--c1)', Leasing: 'var(--c3)', 'Revolving facilities': 'var(--c2)' } as Record<string, string> };

const cardStyle: CSSProperties = { position: 'absolute', top: L.cardsY, height: L.cardsH, padding: 24, overflow: 'hidden' };
const amountStyle: CSSProperties = { fontSize: 17, fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const shareStyle: CSSProperties = { width: 54, textAlign: 'right', fontSize: 13, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' };

function CardHead({ t, sub, o = 1 }: { t: string; sub: string; o?: number }) {
  return (
    <div style={{ marginBottom: 18, opacity: o }}>
      <h2 style={{ fontSize: 21, lineHeight: '28px' }}>{t}</h2>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</p>
    </div>
  );
}

function Kpi({ i, label, value, desc, o, extra, src = false, brand = false, glow = 0 }: {
  i: number; label: string; value: ReactNode; desc: ReactNode; o: number; extra?: ReactNode; src?: boolean; brand?: boolean; glow?: number;
}) {
  return (
    <div className="kpi" style={{
      position: 'absolute', left: L.kpiX[i], top: L.kpiY, width: L.kpiW, height: L.kpiH, display: 'block', padding: 0,
      border: brand ? '1.5px solid var(--brand)' : undefined, opacity: o, transform: `translateY(${(1 - o) * 14}px)`,
      boxShadow: glow > 0 ? `0 0 0 ${6 * glow}px rgba(217, 210, 245, ${0.8 * glow})` : undefined,
    }}>
      <span className="k" style={{ position: 'absolute', left: B.padX, top: B.labelY, fontSize: 14, lineHeight: '18px', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ position: 'absolute', left: B.padX, top: B.valueY, height: B.valueH, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="v" style={{ fontSize: 40, lineHeight: `${B.valueH}px`, whiteSpace: 'nowrap' }}>{value}</span>
        {extra}
      </span>
      <span className="d" style={{ position: 'absolute', left: B.padX, top: B.descY, fontSize: 13, lineHeight: '17px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>{desc}</span>
      {src && <span style={{ position: 'absolute', left: B.padX, top: B.srcY }}><SourceLink label="Trace to source" size={13} /></span>}
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
    w: mix(m, win.w, reveal), h: mix(m, win.h, reveal), radius: mix(m * 0.267, 16 * cam.k, reveal),
  };
  const clip = reveal < 1 ? `inset(${r.y}px ${1920 - r.x - r.w}px ${1080 - r.y - r.h}px ${r.x}px round ${r.radius}px)` : undefined;
  const open = franceOpen(f);
  const subHi = life(f, 234, 242, 258, 266);
  const frHi = life(f, 218, 226, 258, 268);
  const pop = life(f, 238, 243, 255, 260, E.out, E.in);
  const tileGlow = life(f, 274, 284, 300, 306);

  // L'encours est là d'emblée (plan serré) ; le reste apparaît en cascade pendant le dézoom.
  const kpiO = (i: number) => (i === 0 ? 1 : p(f, 198 + i * 4, 210 + i * 4, E.out));
  const rowIn = (i: number) => p(f, 204 + i * 3, 216 + i * 3, E.out);
  const grow = (i: number) => p(f, 206 + i * 3, 226 + i * 3, E.out);
  const headO = p(f, 196, 208, E.out);
  const totalPulse = life(f, 186, 190, 196, 212);

  // Lignes « pays » : la France s'ouvre et pousse les autres pays vers le bas.
  const subH = L.subRowH * open;
  const fr = GROUP.byCountry.find((c) => c.country === 'FR');
  const frCount = fr?.entities.length ?? 0;
  const largest = GROUP.byProvider[0];

  return (
    <>
    {/* La forme de la fenêtre pendant l'ouverture (carte blanche avec son ombre, que le contenu remplit ensuite) */}
    {reveal < 1 && (
      <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.radius, background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: SHADOW }} />
    )}
    <div style={{ position: 'absolute', inset: 0, opacity: cam.opacity, clipPath: clip }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: UI.w, height: UI.h, transformOrigin: '0 0', transform: camTransform(cam),
        background: 'var(--paper)', borderRadius: 16, overflow: 'hidden', boxShadow: `${SHADOW}, 0 0 0 1px rgba(28, 25, 54, 0.06)`, lineHeight: 1.5,
      }}>
        {/* Plan serré : seul l'encours est à l'écran ; la coque de l'application se construit pendant le dézoom. */}
        <div style={{ opacity: p(f, 198, 210, E.out) }}>
          <Sidebar active="overview" height={UI.h} />
          <Topbar scope={GROUP.scope} width={UI.w - UI.sidebar} />
        </div>

        {/* En-tête de page */}
        <div style={{ position: 'absolute', left: L.header.x, top: L.header.y, opacity: headO }}>
          <h1 style={{ fontSize: 32, lineHeight: '40px' }}>Capital overview</h1>
          <p className="muted" style={{ marginTop: 2, fontSize: 14.5 }}>{GROUP.name} · {GROUP.entityCount} entities · {GROUP.countryCount} countries · {GROUP.facilityCount} facilities with {GROUP.providerCount} capital providers · as of {GROUP.asOf}</p>
        </div>

        {/* Indicateurs */}
        <Kpi i={0} o={kpiO(0)} glow={totalPulse} label="Outstanding debt" src value={<span style={{ visibility: hideTotal ? 'hidden' : 'visible' }}>{GROUP.outstanding}</span>}
          desc={<span style={{ opacity: p(f, 188, 196) }}>{GROUP.facilityCount} facilities · {GROUP.providerCount} capital providers</span>} />
        <Kpi i={1} o={kpiO(1)} label="Entities" value={GROUP.entityCount} desc={`${GROUP.entitiesHome} in France · ${GROUP.entitiesAbroad} abroad`} />
        <Kpi i={2} o={kpiO(2)} label="Countries" value={GROUP.countryCount}
          desc={<>{GROUP.byCountry.map((c, i) => <span key={c.key} style={{ opacity: p(f, 210 + i * 2, 216 + i * 2) }}><CountryCode code={c.country} scale={0.85} /></span>)}<span style={{ marginLeft: 4 }}>{GROUP.currencies.join(' · ')}</span></>} />
        <Kpi i={3} o={kpiO(3)} brand glow={tileGlow} label={`Tightest covenant · ${COVENANT.label}`} src
          value={<span style={{ visibility: hideCovenantValue ? 'hidden' : 'visible' }}>{COVENANT.value}</span>}
          extra={<StatusBadge status={COVENANT.status} scale={1.15} />} desc={`${SUBSIDIARY.short} · headroom ${COVENANT.headroomPct}`} />

        {/* Par pays et par société : groupe → pays → société */}
        <div className="card" style={{ ...cardStyle, left: L.pays.x, width: L.pays.w, opacity: p(f, 200, 210, E.out) }}>
          <CardHead t="Distribution by country and entity" sub={`Outstanding debt · ${GROUP.countryCount} countries · ${GROUP.entityCount} entities`} />
          {GROUP.byCountry.map((c, i) => {
            const isFr = c.country === 'FR';
            const top = ROWS_TOP + i * L.rowH + (i > 0 ? subH * frCount : 0);
            return (
              <div key={c.key} style={{ position: 'absolute', left: 16, right: 16, top, height: L.rowH + (isFr ? subH * frCount : 0), opacity: rowIn(i), transform: `translateX(${(1 - rowIn(i)) * -18}px)` }}>
                <div style={{ height: L.rowH, padding: '10px 8px', borderRadius: 10, background: isFr ? `rgba(239, 236, 251, ${frHi})` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CountryCode code={c.country} />
                    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 15.5, fontWeight: 650 }}>{c.label}{c.currency !== 'EUR' && <span className="tag" style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--ok)', background: 'var(--ok-soft)', borderColor: 'transparent' }}>{c.currency}</span>}</span>
                      <span className="faint" style={{ fontSize: 12.5 }}>{c.sub}</span>
                    </span>
                    <span style={amountStyle}>{c.amount}</span>
                    <span style={shareStyle}>{c.share}</span>
                  </div>
                  <div style={{ marginTop: 8, marginLeft: 42 }}><Bar fraction={c.fraction} grow={grow(i)} color={BAR.country} height={8} /></div>
                </div>
                {isFr && open > 0.001 && (
                  <div style={{ overflow: 'hidden', height: subH * frCount }}>
                    {c.entities.map((e, j) => {
                      const hi = e.id === 'ent-di' ? subHi : 0;
                      const eo = Math.min(open, p(f, 224 + j * 3, 232 + j * 3, E.out));
                      return (
                        <div key={e.id} style={{
                          height: L.subRowH, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 42, padding: '0 8px', borderRadius: 8, opacity: f > 250 ? open : eo,
                          transform: `translateX(${(1 - eo) * 14}px)`,
                          background: hi > 0 ? `rgba(239, 236, 251, ${hi})` : undefined, boxShadow: hi > 0 ? `inset ${3 * hi}px 0 0 var(--brand)` : undefined,
                        }}>
                          <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e.name}</span>
                            <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{e.providers}</span>
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
        <div className="card" style={{ ...cardStyle, left: L.preteur.x, width: L.preteur.w, opacity: p(f, 203, 213, E.out) }}>
          <CardHead t="Exposure by capital provider" sub={`Largest provider: ${largest?.label ?? ''} (${largest?.shareRounded ?? ''} of outstanding)`} />
          {GROUP.byProvider.map((l, i) => {
            const o = clamp(p(f, 206, 230, E.inOut) * 3 - i * 0.45);
            return (
              <div key={l.key} style={{ height: 62, padding: '6px 4px 0', opacity: o, transform: `translateX(${(1 - o) * 12}px)` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.label}</span>
                  <span style={{ ...amountStyle, fontSize: 15 }}>{l.amount}</span>
                  <span style={{ ...shareStyle, width: 50 }}>{l.share}</span>
                </div>
                <div style={{ marginTop: 9 }}><Bar fraction={l.fraction} grow={grow(i)} color={(i === 0 ? BAR.provider[0] : BAR.provider[1]) ?? 'var(--c2)'} height={8} /></div>
              </div>
            );
          })}
        </div>

        {/* Par instrument et par devise */}
        <div className="card" style={{ ...cardStyle, left: L.type.x, width: L.type.w, opacity: p(f, 206, 216, E.out) }}>
          <CardHead t="Funding by instrument" sub="Outstanding debt, EUR" />
          {GROUP.byInstrument.map((c, i) => (
            <div key={c.key} style={{ padding: '10px 4px 14px', borderBottom: '1px solid var(--line-2)', opacity: rowIn(i + 2), transform: `translateX(${(1 - rowIn(i + 2)) * 18}px)` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{c.label}</span>
                <span style={{ ...amountStyle, fontSize: 15.5 }}>{c.amount}</span>
                <span style={{ ...shareStyle, width: 50 }}>{c.share}</span>
              </div>
              <div style={{ marginTop: 10 }}><Bar fraction={c.fraction} grow={grow(i + 1)} color={BAR.instrument[c.key] ?? 'var(--c1)'} height={8} /></div>
            </div>
          ))}
          <div style={{ marginTop: 22, opacity: rowIn(5) }}>
            <div className="faint" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 6 }}>By currency</div>
            {GROUP.byCurrency.map((c) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'baseline', gap: 10, height: 30 }}>
                <span className="tag" style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</span>
                <span style={{ flex: 1 }} />
                <span style={{ ...amountStyle, fontSize: 15 }}>{c.amount}</span>
                <span style={{ ...shareStyle, width: 50 }}>{c.share}</span>
              </div>
            ))}
            <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>{GROUP.fxNote}</div>
          </div>
        </div>

        {/* Société ouverte depuis la vue groupe */}
        {pop > 0.001 && <SubsidiaryPopover o={pop} />}

        {/* Pendant l'ouverture, la fenêtre est d'abord le carré de la marque */}
        {content < 1 && <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', opacity: 1 - content }} />}
      </div>
    </div>
    </>
  );
}

/** Fil de navigation (hors interface) : groupe → pays → société, puis retour à la vue consolidée. Images V4. */
export function NavPill({ f }: { f: number }) {
  const o = life(f, 202, 212, 268, 278);
  if (o <= 0.001) return null;
  const fr = GROUP.byCountry.find((c) => c.country === 'FR');
  const steps = [
    { key: 'groupe', label: 'Group', value: GROUP.outstanding, show: 1 },
    { key: 'pays', label: fr?.label ?? 'France', value: fr?.amount ?? '', show: life(f, 222, 230, 258, 266) },
    { key: 'filiale', label: SUBSIDIARY.name, value: SUBSIDIARY.amountCompact, show: life(f, 236, 244, 256, 264) },
  ];
  const active = f >= 240 && f < 258 ? 2 : f >= 226 && f < 260 ? 1 : 0;
  return (
    <div style={{
      position: 'absolute', right: 120, top: 78, height: 56, display: 'flex', alignItems: 'center', padding: '0 6px', borderRadius: 999,
      background: 'rgba(255, 255, 255, 0.94)', border: '1px solid var(--line)', boxShadow: '0 14px 36px rgba(28,25,54,.12)', opacity: o,
      transform: `translateY(${(1 - o) * -10}px)`, whiteSpace: 'nowrap', lineHeight: 1.2,
    }}>
      {steps.map((st, i) => (
        <span key={st.key} style={{ display: 'inline-flex', alignItems: 'center', maxWidth: i === 0 ? 400 : 440 * st.show, opacity: i === 0 ? 1 : st.show, overflow: 'hidden' }}>
          {i > 0 && <span style={{ color: 'var(--ink-3)', fontSize: 22, margin: '0 6px', fontWeight: 500 }}>›</span>}
          <span style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 10, height: 44, padding: '0 16px', borderRadius: 999, alignSelf: 'center', paddingTop: 11,
            background: active === i ? 'var(--brand)' : 'transparent', color: active === i ? '#fff' : 'var(--ink-2)',
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 44, borderBottom: '1px solid var(--line-2)', fontSize: 14.5 }}>
      <span className="faint">{k}</span>
      <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
  return (
    <div className="card" style={{
      position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h, padding: '18px 22px',
      boxShadow: '0 24px 60px rgba(28,25,54,.18), 0 2px 8px rgba(28,25,54,.06)',
      opacity: Math.min(1, o * 2.2), transform: `translateX(${(1 - o) * -24}px) scale(${mix(0.9, 1, o)})`, transformOrigin: '0 30%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <CountryCode code={SUBSIDIARY.country} />
        <span style={{ fontSize: 18, fontWeight: 700 }}>{SUBSIDIARY.name}</span>
      </div>
      {line(SUBSIDIARY.facility, SUBSIDIARY.lender)}
      {line('Outstanding', SUBSIDIARY.amount)}
      {line('Final maturity', SUBSIDIARY.maturity)}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 52, fontSize: 14.5 }}>
        <span className="faint">{COVENANT.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{COVENANT.value}</span>
          <StatusBadge status={COVENANT.status} scale={1.1} />
        </span>
      </div>
    </div>
  );
}
