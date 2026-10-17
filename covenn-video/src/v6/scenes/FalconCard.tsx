/**
 * La demande Project Falcon, d'un bout à l'autre du film : elle naît du bouton « Create financing request from scenario »
 * (S3), devient la demande de financement de la bêta (S4) — sa liste de préparation se remplit à partir des données déjà
 * dans Covenn, pièce par pièce, depuis les rubriques du menu — puis l'entreprise du réseau (S5), avec son besoin de
 * financement et son profil. Une seule carte, qui ne quitte jamais l'écran entre 0:10 et 0:22.
 * Rien n'est validé à la place de l'utilisateur : la pièce « Use-of-proceeds summary » reste « Needs review » (7/8).
 */
import { E, clamp, life, mix, p, quad } from '../../film/anim';
import { Badge, Icon } from '../../capos/kit';
import { COMPANY, PROFILE_PACKETS, REQUEST, REQUEST_PAGE } from '../data';
import { CONVERGE, DOCKS, REVIEW, S3 } from '../timing';
import { NAV_Y, rectToFrame, toFrame, windowCam, type Rect } from '../Window';
import { CTA_RECT, SLOT, docked } from './Pages';
import { NODE, chipRect, netRect } from './Network';

const A = { w: SLOT.w, h: SLOT.h } as const;
const B = { w: NODE.w, h: NODE.h } as const;
const ROW = { y0: 298, h: 46 } as const;
const MORPH = [444, 476] as const;

const mixRect = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });

/** Rectangle de la carte dans l'image : bouton → demande (collée à la page) → entreprise du réseau. */
export function falconRect(f: number): Rect {
  const cam = windowCam(f);
  const slot = rectToFrame(cam, SLOT);
  if (f < S3.lift[1]) return mixRect(rectToFrame(cam, CTA_RECT), slot, p(f, S3.lift[0], S3.lift[1], E.inOut));
  if (f < MORPH[0]) return slot;
  return mixRect(slot, netRect(f, NODE), p(f, MORPH[0], MORPH[1], E.inOut));
}

const brand = [74, 51, 179];
const white = [255, 255, 255];
const rgb = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(mix(v, b[i] ?? v, t))).join(', ')})`;

export function FalconCard({ f }: { f: number }) {
  if (f < S3.press || f > CONVERGE[0] + 24) return null;
  const r = falconRect(f);
  const born = p(f, S3.press, S3.press + 3, E.out);
  const leave = p(f, CONVERGE[0] - 4, CONVERGE[0] + 10, E.inOut);
  const white_ = p(f, S3.lift[0], S3.lift[0] + 12, E.inOut);
  const lifting = life(f, S3.lift[0], S3.lift[0] + 8, S3.lift[1] - 6, S3.lift[1] + 6);
  const oA = Math.min(p(f, S3.lift[0] + 6, S3.lift[0] + 20, E.out), 1 - p(f, MORPH[0] + 4, MORPH[0] + 16, E.in));
  const oB = p(f, MORPH[0] + 18, MORPH[1] - 2, E.out);
  const radius = mix(9, 18, white_) * (r.w / A.w) + (f > MORPH[0] ? 6 * p(f, MORPH[0], MORPH[1]) : 0);
  const cam = windowCam(f);
  const sA = r.w / A.w;
  const sB = r.w / B.w;
  return (
    <>
      <div style={{
        position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radius, overflow: 'hidden', lineHeight: 1.2,
        opacity: born * (1 - leave), background: rgb(brand, white, white_), border: `1px solid ${white_ > 0.5 ? 'var(--line)' : 'transparent'}`,
        boxShadow: `0 ${mix(24, 34, lifting)}px ${mix(60, 90, lifting)}px rgba(28, 25, 54, ${0.12 + 0.08 * lifting}), 0 2px 8px rgba(28, 25, 54, 0.06)`,
      }}>
        {oA > 0.001 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: A.w, height: A.h, transformOrigin: '0 0', transform: `scale(${sA})`, opacity: oA }}>
            <RequestContent f={f} />
          </div>
        )}
        {oB > 0.001 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: B.w, height: B.h, transformOrigin: '0 0', transform: `scale(${sB})`, opacity: oB }}>
            <CompanyContent />
          </div>
        )}
      </div>
      {/* Les pièces viennent des rubriques de Covenn (menu de gauche) et se posent dans la demande */}
      {REQUEST_PAGE.items.map((it, i) => {
        const land = DOCKS[i] ?? 0;
        if (f < land - 14 || f > land + 1) return null;
        const t = p(f, land - 12, land, E.inOut);
        const from = toFrame(cam, 128, NAV_Y[it.from]);
        const to = { x: r.x + (28 + 150) * sA, y: r.y + (ROW.y0 + i * ROW.h + ROW.h / 2) * sA };
        const x = quad(from.x, mix(from.x, to.x, 0.5), to.x, t);
        const y = quad(from.y, Math.min(from.y, to.y) - 30, to.y, t);
        const nav = toFrame(cam, 12, NAV_Y[it.from] - 17);
        const navO = life(f, land - 14, land - 11, land - 7, land - 2);
        return (
          <div key={it.key}>
            <div style={{ position: 'absolute', left: nav.x, top: nav.y, width: 216 * cam.k, height: 34 * cam.k, borderRadius: 8 * cam.k, border: `${2 * cam.k}px solid var(--brand)`, opacity: navO }} />
            <span style={{
              position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(1, 0.92, t)})`, opacity: life(f, land - 14, land - 11, land - 2, land + 1),
              display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px 0 10px', borderRadius: 999, whiteSpace: 'nowrap',
              background: 'var(--surface)', border: '1.5px solid var(--brand-line)', boxShadow: '0 12px 28px rgba(74, 51, 179, 0.2)', fontSize: 15, fontWeight: 650, color: 'var(--brand-ink)',
            }}>
              <Icon name={it.icon} size={16} />{it.label}
            </span>
          </div>
        );
      })}
    </>
  );
}

/** La demande (S4) : en-tête, puis la liste de préparation qui se remplit (7 sur 8 disponibles ou reliées). */
function RequestContent({ f }: { f: number }) {
  const R = REQUEST_PAGE;
  const n = docked(f);
  const fill = clamp(DOCKS.reduce((acc, d) => acc + p(f, d, d + 6, E.out), 0) / R.total);
  const review = p(f, REVIEW - 2, REVIEW + 6, E.out);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 28, top: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon name="financing" size={19} /></span>
        <span style={{ fontSize: 12.5, fontWeight: 750, letterSpacing: '0.12em', color: 'var(--brand-ink)' }}>FINANCING REQUEST</span>
      </div>
      <div style={{ position: 'absolute', left: 28, top: 72, fontSize: 27, fontWeight: 700, letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>{R.title}</div>
      <div style={{ position: 'absolute', left: 26, top: 108, fontSize: 50, fontWeight: 750, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{REQUEST.amount}</div>
      <div className="muted" style={{ position: 'absolute', left: 28, top: 172, fontSize: 16, whiteSpace: 'nowrap' }}>
        {REQUEST.entity} · {REQUEST.instrument}, {REQUEST.tenor} · target close {REQUEST.target}
      </div>
      <div style={{ position: 'absolute', left: 28, right: 28, top: 210, height: 1, background: 'var(--line-2)' }} />

      <div style={{ position: 'absolute', left: 28, top: 224, fontSize: 18, fontWeight: 650 }}>{R.checklistTitle}</div>
      <div style={{ position: 'absolute', left: 28, right: 28, top: 254, display: 'flex', justifyContent: 'space-between', fontSize: 14, whiteSpace: 'nowrap' }}>
        <span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{n} of {R.total}</b> available or linked</span>
        <span className="faint" style={{ opacity: review }}>{R.summaryRight}</span>
      </div>
      <div className="progress" style={{ position: 'absolute', left: 28, right: 28, top: 280, height: 8 }}>
        <div style={{ width: `${fill * 100}%` }} />
      </div>
      {R.items.map((it, i) => {
        const land = DOCKS[i] ?? 0;
        const o = p(f, land - 1, land + 4, E.out);
        const b = p(f, land + 1, land + 7, E.out);
        const flash = life(f, land, land + 2, land + 4, land + 14);
        return (
          <div key={it.key} style={{
            position: 'absolute', left: 16, right: 16, top: ROW.y0 + i * ROW.h, height: ROW.h, display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 12,
            padding: '0 12px', borderRadius: 10, borderBottom: i < R.items.length - 1 ? '1px solid var(--line-2)' : undefined,
            background: flash > 0.01 ? `rgba(239, 236, 251, ${0.9 * flash})` : undefined,
          }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: o > 0.5 ? 'var(--brand-soft)' : 'var(--paper)', color: 'var(--brand)', opacity: Math.max(0.35, o) }}>
              <Icon name={it.icon} size={16} />
            </span>
            <span style={{ minWidth: 0, opacity: Math.max(0.3, o), lineHeight: 1.25 }}>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 650, whiteSpace: 'nowrap' }}>{it.label}</span>
              <span className="faint" style={{ display: 'block', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: o }}>{it.detail}</span>
            </span>
            <span style={{ display: 'grid', justifyItems: 'end', minWidth: 120 }}>
              <span style={{ gridArea: '1 / 1', width: 110, height: 24, borderRadius: 999, border: '1.5px dashed var(--line)', opacity: 1 - b }} />
              <span style={{ gridArea: '1 / 1', opacity: b, transform: `scale(${mix(0.7, 1, b)})`, transformOrigin: '100% 50%' }}>
                <Badge tone={it.tone} scale={1.12}>{it.status}</Badge>
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** L'entreprise (S5) : le groupe, le projet, le besoin de financement, le profil qui circule vers Covenn. */
function CompanyContent() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 26, top: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon name="capital" size={18} /></span>
        <span style={{ fontSize: 13, fontWeight: 750, letterSpacing: '0.14em', color: 'var(--brand-ink)' }}>{COMPANY.group.toUpperCase()}</span>
      </div>
      <div style={{ position: 'absolute', left: 26, top: 72, fontSize: 30, fontWeight: 750, letterSpacing: '-0.02em' }}>{COMPANY.project}</div>
      <div style={{ position: 'absolute', left: 24, top: 108, display: 'flex', alignItems: 'baseline', gap: 12, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--brand-ink)' }}>{COMPANY.need}</span>
        <span className="muted" style={{ fontSize: 18, fontWeight: 550 }}>financing need</span>
      </div>
      <div style={{ position: 'absolute', left: 26, top: 192, fontSize: 16.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{COMPANY.detail}</div>
      <div className="muted" style={{ position: 'absolute', left: 26, top: 218, fontSize: 15.5, whiteSpace: 'nowrap' }}>{COMPANY.borrower}</div>
      <div style={{ position: 'absolute', left: 26, right: 26, top: 254, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="progress" style={{ flex: 1, height: 8 }}><span style={{ display: 'block', height: '100%', width: `${(REQUEST.prep.done / REQUEST.prep.total) * 100}%`, background: 'var(--brand)', borderRadius: 4 }} /></span>
        <span className="faint" style={{ fontSize: 13.5, whiteSpace: 'nowrap' }}>{COMPANY.prep}</span>
      </div>
      <div style={{ position: 'absolute', left: 26, right: 26, top: 288, height: 1, background: 'var(--line-2)' }} />
      {PROFILE_PACKETS.map((pk, i) => {
        const c = chipRect(i);
        return (
          <span key={pk.label} style={{
            position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', borderRadius: 8,
            background: 'var(--paper)', border: '1px solid var(--line-2)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--brand)', display: 'flex' }}><Icon name={pk.icon} size={14} /></span>{pk.label}
          </span>
        );
      })}
    </div>
  );
}
