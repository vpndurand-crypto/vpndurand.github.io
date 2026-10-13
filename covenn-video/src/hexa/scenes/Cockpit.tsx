import type { CSSProperties, ReactNode } from 'react';
import { StatusBadge } from '../../../beta/src/ui/StatusBadge';
import { Icon } from '../../../beta/src/ui/Icon';
import { E, clamp, life, mix, p } from '../../film/anim';
import { COVENANT, GROUP, SUBSIDIARY } from '../data';
import { Bar, CountryCode, Donut, ProjectionBadge, SHADOW, Sidebar, Topbar, type NavEntry } from '../kit';
import { LAYOUT as L, MARK_HOME, REVEAL, UI, camTransform, cockpitCam, windowRect } from './cockpitLayout';

/**
 * S3 — « Une vision. Tout votre groupe. » (projection)
 * Vue groupe consolidée : encours total, pays, prêteurs, types de financement ; zoom groupe → pays → filiale, puis retour.
 */
export const NAV: NavEntry[] = [
  { label: 'Vue groupe', icon: 'overview', active: true },
  { label: 'Financements', icon: 'financings' },
  { label: 'Covenants', icon: 'covenants' },
  { label: 'Échéances', icon: 'schedule' },
  { label: 'Simulations', icon: 'calculator' },
  { label: 'Dossiers de financement', icon: 'save' },
  { label: 'Documents', icon: 'documents' },
  { label: 'Données financières', icon: 'data' },
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
  i: number; labelText: string; value: ReactNode; sub: string; o: number; extra?: ReactNode; brand?: boolean; glow?: number;
}) {
  return (
    <div style={{
      position: 'absolute', left: L.kpiX[i], top: L.kpiY, width: L.kpiW, height: L.kpiH, background: 'var(--surface)', borderRadius: 12, padding: '18px 22px',
      border: brand ? '1.5px solid var(--indigo-600)' : '1px solid var(--line)', opacity: o, transform: `translateY(${(1 - o) * 14}px)`,
      display: 'flex', flexDirection: 'column', gap: 6, boxShadow: glow > 0 ? `0 0 0 ${6 * glow}px rgba(175, 163, 230, ${0.55 * glow})` : undefined,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{labelText}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 42 }}>
        <span style={{ fontSize: 34, lineHeight: '42px', fontWeight: 700, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
        {extra}
      </span>
      <span style={{ fontSize: 13, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{sub}</span>
    </div>
  );
}

/** Ouverture progressive de la France (trois sociétés), puis repli au retour à la vue groupe. */
export function franceOpen(f: number): number {
  return Math.min(p(f, 222, 238, E.inOut), 1 - p(f, 256, 266, E.inOut));
}

export function Cockpit({ f, hideBrandMark, hideTotal, hideCovenantValue }: { f: number; hideBrandMark: boolean; hideTotal: boolean; hideCovenantValue: boolean }) {
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
  const subHi = life(f, 238, 246, 256, 264);
  const frHi = life(f, 218, 226, 256, 266);
  const pop = life(f, 242, 252, 256, 263, E.out, E.in);
  const tileGlow = life(f, 274, 284, 300, 306);

  const kpiO = (i: number) => p(f, 180 + i * 4, 194 + i * 4, E.out);
  const grow = (i: number) => p(f, 192 + i * 4, 214 + i * 4, E.out);
  const donut = p(f, 194, 224, E.inOut);
  const headO = p(f, 176, 188, E.out);

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
        <style>{hideBrandMark ? '.cockpit-brand-hidden nav > div:first-child > span:first-child { visibility: hidden; }' : ''}</style>
        <div className={hideBrandMark ? 'cockpit-brand-hidden' : undefined}>
          <Sidebar items={NAV} height={UI.h} />
        </div>
        <Topbar org={GROUP.name} perimeter={`Périmètre : ${GROUP.entityCount} sociétés · ${GROUP.countryCount} pays`} asOf={GROUP.asOf} width={UI.w - UI.sidebar} />

        {/* En-tête de page */}
        <div style={{ position: 'absolute', left: L.header.x, top: L.header.y, opacity: headO }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}>Vue groupe</h1>
            <ProjectionBadge />
          </div>
          <p style={{ marginTop: 2, color: 'var(--ink-500)', fontSize: 14 }}>{GROUP.name} · {GROUP.entityCount} sociétés · {GROUP.countryCount} pays · données au {GROUP.asOf}</p>
        </div>

        {/* Indicateurs */}
        <Kpi i={0} o={kpiO(0)} labelText="Encours total du groupe" value={<span style={{ visibility: hideTotal ? 'hidden' : 'visible' }}>{GROUP.total}</span>} sub={`${GROUP.financingCount} financements · ${GROUP.lenderCount} prêteurs`} />
        <Kpi i={1} o={kpiO(1)} labelText="Périmètre" value={`${GROUP.entityCount} sociétés`} sub={GROUP.byCountry.map((c) => c.label).join(' · ')} />
        <Kpi i={2} o={kpiO(2)} labelText="Prochaine échéance" value="31/12/2026" sub="Test du Leverage · prêt équipement" />
        <Kpi i={3} o={kpiO(3)} brand glow={tileGlow} labelText="Covenant le plus proche du seuil" value={<>Leverage <span style={{ visibility: hideCovenantValue ? 'hidden' : 'visible' }}>{COVENANT.value}</span></>}
          extra={<StatusBadge status={COVENANT.status} size="sm" short />} sub={`${SUBSIDIARY.name} · SFA`} />

        {/* Par pays : groupe → pays → filiale */}
        <div style={{ ...card, left: L.pays.x, width: L.pays.w, opacity: kpiO(1) }}>
          <CardHead l={`${GROUP.countryCount} pays · ${GROUP.entityCount} sociétés`} t="Encours par pays" />
          {rows.map((c, i) => {
            const isFr = c.country === 'FR';
            const top = ROWS_TOP + i * L.rowH + (i > 0 ? subH * 3 : 0);
            return (
              <div key={c.key} style={{ position: 'absolute', left: 16, right: 16, top, height: L.rowH + (isFr ? subH * 3 : 0) }}>
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
                    {c.entities.map((e) => {
                      const hi = e.id === 'ent-di' ? subHi : 0;
                      return (
                        <div key={e.id} style={{
                          height: L.subRowH, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 42, padding: '0 8px', borderRadius: 8, opacity: open,
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
        <div style={{ ...card, left: L.preteur.x, width: L.preteur.w, opacity: kpiO(2) }}>
          <CardHead l={`${GROUP.lenderCount} prêteurs`} t="Encours par prêteur" />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <div style={{ position: 'relative' }}>
              <Donut size={196} thickness={30} draw={donut} slices={GROUP.byLender.map((l, i) => ({ fraction: l.fraction, color: LENDER_TINTS[i] ?? 'var(--indigo-200)' }))} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <span>
                  <span style={{ display: 'block', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{GROUP.total}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-500)' }}>encours</span>
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {GROUP.byLender.map((l, i) => (
              <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 6px', borderBottom: i < GROUP.byLender.length - 1 ? '1px solid var(--line)' : undefined, opacity: clamp(donut * 4 - i * 0.6) }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: LENDER_TINTS[i] }} />
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.label}</span>
                <span style={{ fontSize: 14.5, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{l.amount}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12.5, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{l.share}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par type */}
        <div style={{ ...card, left: L.type.x, width: L.type.w, opacity: kpiO(3) }}>
          <CardHead l={`${GROUP.byCategory.length} catégories`} t="Encours par type" />
          {GROUP.byCategory.map((c, i) => (
            <div key={c.key} style={{ padding: '12px 4px 16px', borderBottom: '1px solid var(--line)' }}>
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
            Devises : EUR, USD · contre-valeur en euros
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
      opacity: o, transform: `translateX(${(1 - o) * -16}px) scale(${mix(0.97, 1, o)})`, transformOrigin: '0 30%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <CountryCode code="FR" />
        <span style={{ fontSize: 18, fontWeight: 700 }}>{SUBSIDIARY.name}</span>
      </div>
      {line(SUBSIDIARY.financing, SUBSIDIARY.lender)}
      {line('Encours', SUBSIDIARY.amount)}
      {line('Échéance finale', SUBSIDIARY.maturity)}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 52, fontSize: 14.5 }}>
        <span style={{ color: 'var(--ink-500)' }}>Leverage</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{SUBSIDIARY.covenant}</span>
          <StatusBadge status={SUBSIDIARY.status} size="sm" short />
        </span>
      </div>
    </div>
  );
}

