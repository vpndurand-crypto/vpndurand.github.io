import type { CSSProperties } from 'react';
import { E, life, mix, p, quad } from '../../film/anim';
import { EXTRACTION, GROUP, REGISTRY } from '../data';
import { balanceFile, doc } from '../docs';
import { Badge, CountryCode, FilePill, Icon, Mark, SHADOW, SourceLink } from '../kit';
import { CENTER } from './Chaos';
import { MARK_HOME, REVEAL, TOTAL_VALUE, cockpitCam, toFrame } from './cockpitLayout';

/**
 * S2 — « Covenn turns complexity into clarity. » (démonstration de la bêta ; images V4, voir timing.warp)
 * Le point central devient la marque Covenn. Les fichiers de la bêta y entrent ; il en sort les termes du contrat SFA,
 * relus et validés par une personne (« Assisted contract extraction with human validation », un aperçu dans la bêta),
 * puis le registre des six financements du groupe. Les encours rejoignent l'encours du groupe (vue d'ensemble).
 */
const HOME = { x: MARK_HOME.x, y: MARK_HOME.y };
const MARK = MARK_HOME.size;
const CARD = { x: 850, y: 226, w: 930, h: 640 };
const FIELD = { top: 120, h: 118 };
const REG = { top: 96, h: 76 };

/** Fichiers entrants : contrats, balances, liasses et relevés des sociétés du groupe (noms de fichiers de la bêta). */
const INCOMING: { name: string; kind: 'PDF' | 'XLSX' }[] = [
  { name: doc('doc-01').file_name, kind: 'PDF' },
  { name: balanceFile('tb-di-2026-09-30'), kind: 'XLSX' },
  { name: doc('doc-10').file_name, kind: 'PDF' },
  { name: doc('doc-04').file_name, kind: 'PDF' },
  { name: doc('doc-11').file_name, kind: 'PDF' },
  { name: balanceFile('tb-de-2026-09-30'), kind: 'XLSX' },
  { name: doc('doc-13').file_name, kind: 'PDF' },
];
const LANES = [300, 392, 470, 556, 640, 724, 812];

export const INGEST = { flightsStart: 164, land: 186, markLand: REVEAL.start + 10 } as const;

/** Position et taille de la marque Covenn (S2), jusqu'à l'ouverture de la fenêtre de l'application. */
export function markState(f: number) {
  const born = p(f, 84, 98, E.out);
  const toHome = p(f, 98, 116, E.inOut);
  const x = mix(CENTER.x, HOME.x, toHome);
  const y = mix(CENTER.y, HOME.y, toHome);
  let size = MARK * mix(0.35, 1, born);
  // La fenêtre de l'application naît du carré de la marque : le pictogramme s'efface pendant que la fenêtre s'ouvre.
  const fade = p(f, REVEAL.start, REVEAL.start + 10, E.in);
  size *= 1 + 0.12 * fade;
  return { x, y, size, o: born * (1 - fade), landed: f >= INGEST.markLand };
}

export function Ingest({ f }: { f: number }) {
  if (f < 82 || f > INGEST.land + 6) return null;
  const mark = markState(f);
  // Pulsation à chaque fichier absorbé.
  const absorb = Math.max(0, ...INCOMING.map((_, i) => life(f, 112 + i * 5, 114 + i * 5, 116 + i * 5, 122 + i * 5)));
  const cardO = life(f, 96, 106, 164, 174);
  const fieldsO = 1 - p(f, 138, 144, E.in);
  const regO = p(f, 144, 150, E.out);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Fichiers entrants (de gauche vers la marque) */}
      {INCOMING.map((file, i) => {
        const t = p(f, 94 + i * 5, 118 + i * 5, E.linear);
        if (t <= 0 || t >= 1) return null;
        const u = E.in(t);
        const lane = LANES[i] ?? HOME.y;
        // Le bord droit de la pastille glisse jusqu'à la marque, en accélérant ; la pastille s'y engouffre.
        const right = mix(470, HOME.x - MARK * 0.2, u);
        const y = mix(lane, HOME.y, u);
        const s = mix(0.92, 0.18, p(u, 0.45, 1, E.in));
        return (
          <div key={file.name} style={{ position: 'absolute', left: right, top: y, transform: `translate(-100%, -50%) scale(${s})`, transformOrigin: '100% 50%', opacity: Math.min(1, t * 6) * (1 - p(u, 0.82, 1)) }}>
            <FilePill name={file.name} kind={file.kind} scale={1.15} />
          </div>
        );
      })}

      {/* Particules : chaque terme lu part de la marque vers sa ligne */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {EXTRACTION.fields.map((field, i) => {
          const y = CARD.y + FIELD.top + i * FIELD.h + FIELD.h / 2;
          const t = p(f, 100 + i * 6, 109 + i * 6, E.inOut);
          if (t <= 0 || t >= 1) return null;
          const c = { x: (HOME.x + CARD.x) / 2, y: mix(HOME.y, y, 0.2) - 40 };
          const px = quad(HOME.x + MARK / 2, c.x, CARD.x + 24, t);
          const py = quad(HOME.y, c.y, y, t);
          return (
            <g key={field.key}>
              <circle cx={px} cy={py} r={7} fill="var(--brand)" />
              <circle cx={px} cy={py} r={16} fill="rgba(143, 128, 220, 0.2)" />
            </g>
          );
        })}
      </svg>

      {/* Carte de sortie : extraction assistée, puis registre des financements */}
      {cardO > 0.001 && (
        <div className="card" style={{
          position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 18, boxShadow: SHADOW, opacity: cardO,
          transform: `translateX(${(1 - p(f, 96, 108, E.out)) * 40}px) scale(${mix(1, 0.96, p(f, 164, 174, E.in))})`, overflow: 'hidden',
        }}>
          {/* En-tête : ce que Covenn est en train de lire */}
          <div style={{ position: 'absolute', left: 28, right: 28, top: 22, height: 60, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line-2)' }}>
            <span style={{ color: 'var(--brand)', display: 'grid', placeItems: 'center' }}><Icon name={regO > 0.5 ? 'debt' : 'file'} size={22} /></span>
            <span style={{ position: 'relative', flex: 1, height: 60 }}>
              <span style={{ position: 'absolute', left: 0, top: 8, fontSize: 21, fontWeight: 700, opacity: fieldsO, whiteSpace: 'nowrap' }}>Assisted contract extraction</span>
              <span className="faint" style={{ position: 'absolute', left: 0, top: 36, fontSize: 14, opacity: fieldsO, whiteSpace: 'nowrap' }}>{EXTRACTION.file}</span>
              <span style={{ position: 'absolute', left: 0, top: 8, fontSize: 21, fontWeight: 700, opacity: regO, whiteSpace: 'nowrap' }}>Facility register</span>
              <span className="faint" style={{ position: 'absolute', left: 0, top: 36, fontSize: 14, opacity: regO, whiteSpace: 'nowrap' }}>
                {GROUP.facilityCount} facilities · {GROUP.entityCount} entities · {GROUP.countryCount} countries · {GROUP.currencies.join(' and ')}
              </span>
            </span>
            {/* Dans la bêta, l'extraction est un aperçu : chaque valeur est relue, corrigée ou validée par une personne */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: fieldsO }}>
              <span className="faint" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>with human validation</span>
              <Badge tone="b-info" scale={1.25}>Preview</Badge>
            </span>
          </div>

          {/* Termes extraits, page source à l'appui */}
          <div style={{ position: 'absolute', inset: 0, opacity: fieldsO, transform: `translateY(${-p(f, 138, 144, E.in) * 24}px)` }}>
            {EXTRACTION.fields.map((field, i) => {
              const reveal = p(f, 107 + i * 6, 115 + i * 6, E.out);
              const scan = life(f, 107 + i * 6, 110 + i * 6, 113 + i * 6, 122 + i * 6);
              const badge = p(f, 112 + i * 6, 118 + i * 6, E.out);
              return (
                <div key={field.key}>
                  {/* Ligne en attente de lecture */}
                  {reveal < 1 && (
                    <div style={{ position: 'absolute', left: 28, right: 28, top: FIELD.top + i * FIELD.h, height: FIELD.h - 10, borderRadius: 12, border: '1px dashed var(--line)', opacity: 1 - reveal, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px' }}>
                      <span style={{ width: 90, height: 10, borderRadius: 5, background: 'var(--line-2)' }} />
                      <span style={{ width: 260 + (i % 3) * 60, height: 16, borderRadius: 8, background: 'var(--line-2)' }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', left: 28, right: 28, top: FIELD.top + i * FIELD.h, height: FIELD.h - 10, borderRadius: 12, padding: '0 18px',
                    display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr) 236px', alignItems: 'center', columnGap: 16, opacity: reveal,
                    background: `linear-gradient(90deg, rgba(239,236,251,${0.95 * scan}) 0%, rgba(245,243,253,${0.6 * scan}) 60%, rgba(255,255,255,0) 100%)`,
                    border: '1px solid var(--line)', transform: `translateX(${(1 - reveal) * -18}px)`,
                  }}>
                    <span className="muted" style={{ fontSize: 17, fontWeight: 600 }}>{field.label}</span>
                    <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.015em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{field.value}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <SourceLink label={`Contract · page ${field.page}`} size={15} />
                      <span style={{ opacity: badge, transform: `scale(${mix(0.85, 1, badge)})`, transformOrigin: '100% 50%' }}>
                        <Badge tone={field.status.tone} scale={1.2}>{field.status.label}</Badge>
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Registre des financements du groupe */}
          {regO > 0.001 && (
            <div style={{ position: 'absolute', inset: 0 }}>
              {REGISTRY.map((r, i) => {
                const o = p(f, 145 + i * 3, 154 + i * 3, E.out);
                const flown = p(f, INGEST.flightsStart + i, INGEST.flightsStart + i + 4, E.linear);
                return (
                  <div key={r.id} style={{
                    position: 'absolute', left: 28, right: 28, top: REG.top + i * REG.h, height: REG.h, display: 'flex', alignItems: 'center', gap: 14,
                    borderBottom: i < REGISTRY.length - 1 ? '1px solid var(--line-2)' : undefined, opacity: o, transform: `translateX(${(1 - o) * 30}px)`,
                  }}>
                    <CountryCode code={r.country} scale={1.15} />
                    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 650, whiteSpace: 'nowrap' }}>{r.label}</span>
                      <span className="faint" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{r.entity} · {r.lender}</span>
                    </span>
                    {r.local && <span className="faint" style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums', opacity: 1 - flown }}>{r.local} →</span>}
                    <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', opacity: 1 - flown }}>{r.amount}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AmountFlights f={f} />

      {/* La marque Covenn */}
      {mark.o > 0.001 && !mark.landed && (
        <div style={{ position: 'absolute', left: mark.x - mark.size / 2, top: mark.y - mark.size / 2, opacity: Math.min(1, mark.o * 1.4), zIndex: 5 }}>
          <Mark size={mark.size} glow={Math.max(absorb, life(f, 86, 92, 96, 108))} />
        </div>
      )}
    </div>
  );
}

/** Les six encours quittent le registre et se fondent dans l'encours du groupe (vue d'ensemble). */
function AmountFlights({ f }: { f: number }) {
  if (f < INGEST.flightsStart || f > INGEST.land + 4) return null;
  const chip: CSSProperties = {
    position: 'absolute', transform: 'translate(-50%, -50%)', background: 'var(--surface)', border: '1px solid var(--brand-line)', borderRadius: 10, padding: '6px 12px',
    fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--brand-ink)', whiteSpace: 'nowrap',
    boxShadow: '0 10px 30px rgba(74,51,179,.16), 0 2px 6px rgba(28,25,54,.06)',
  };
  return (
    <>
      {REGISTRY.map((r, i) => {
        // Chaque financement (prêteur et montant) rejoint l'encours du groupe : plusieurs prêteurs, une seule vue.
        const start = INGEST.flightsStart + i * 1.5;
        const end = INGEST.land - 7 + i;
        const t = p(f, start, end, E.inOut);
        if (t <= 0 || f > end + 2) return null;
        const from = { x: CARD.x + CARD.w - 150, y: CARD.y + REG.top + i * REG.h + REG.h / 2 };
        const cam = cockpitCam(end);
        const to = toFrame(cam, TOTAL_VALUE.x, TOTAL_VALUE.y);
        const c = { x: mix(from.x, to.x, 0.45), y: Math.min(from.y, to.y) - 90 - i * 12 };
        const scale = mix(1, 0.72, t);
        return (
          <div key={r.id} style={{ ...chip, left: quad(from.x, c.x, to.x, t), top: quad(from.y, c.y, to.y, t), opacity: 1 - p(f, end - 3, end + 1, E.in), scale: String(scale) }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{r.lender}</span>
            <span style={{ color: 'var(--ink-3)', margin: '0 8px' }}>·</span>
            {r.amount}
          </div>
        );
      })}
    </>
  );
}
