import type { CSSProperties } from 'react';
import { E, life, mix, p } from '../film/anim';
import { CAPTIONS, SCENES, warp } from './timing';
import { cockpitCam } from './scenes/cockpitLayout';

/**
 * Un message majeur par séquence. Les mots montent d'un masque, très vite (≈ 0,3 s), puis la ligne s'efface vers le haut :
 * rien n'attend la fin d'une phrase, l'image continue sous le texte. `accent` colore un groupe de mots [de, à[.
 */
export function Punch({ f, text, at, out, x, y, size, align = 'left', accent, color = 'var(--ink)', accentColor = 'var(--brand)', weight = 750, stagger = 3, style }: {
  f: number; text: string; at: number; out: number; x: number; y: number; size: number; align?: 'left' | 'center';
  accent?: readonly [number, number?]; color?: string; accentColor?: string; weight?: number; stagger?: number; style?: CSSProperties;
}) {
  if (f < at - 1 || f > out + 1) return null;
  const words = text.split(' ');
  const leave = p(f, out - 8, out, E.in);
  const isAccent = (i: number) => accent !== undefined && i >= accent[0] && i < (accent[1] ?? words.length);
  return (
    <div style={{
      position: 'absolute', left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, top: y, textAlign: align,
      fontSize: size, lineHeight: 1.08, fontWeight: weight, letterSpacing: '-0.035em', whiteSpace: 'nowrap', color,
      opacity: 1 - leave, transform: `translateY(${-leave * 0.22 * size}px)`, ...style,
    }}>
      {words.map((w, i) => {
        const t = p(f, at + i * stagger, at + i * stagger + 9, E.out);
        return (
          <span key={`${w}-${i}`} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
            <span style={{
              display: 'inline-block', transform: `translateY(${(1 - t) * 105}%)`, opacity: mix(0.2, 1, t),
              color: isAccent(i) ? accentColor : undefined,
            }}>
              {w}{i < words.length - 1 ? '\u00A0' : ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Voile clair derrière les textes du haut, pour qu'ils restent lisibles quand l'interface passe dessous. */
function TopVeil({ o }: { o: number }) {
  if (o <= 0.001) return null;
  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1500, height: 270, opacity: o, background: 'radial-gradient(1100px 240px at 22% 0%, rgba(245,245,248,0.97) 0%, rgba(245,245,248,0.86) 45%, rgba(245,245,248,0) 100%)' }} />;
}

/** Voile pleine largeur (zooms dans l'interface, scènes de vision). */
function WideVeil({ o, height = 300 }: { o: number; height?: number }) {
  if (o <= 0.001) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height, opacity: o, background: 'linear-gradient(180deg, rgba(245,245,248,0.98) 0%, rgba(245,245,248,0.93) 50%, rgba(245,245,248,0) 100%)' }} />;
}

const TOP = { x: 120, y: 74, size: 64 } as const;

export function Captions({ f }: { f: number }) {
  const c = CAPTIONS;
  const w = warp(f);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* S1 : grand, au centre, au milieu des documents */}
      {f < SCENES.problem[1] && (
        <div style={{
          position: 'absolute', left: 200, right: 200, top: 330, height: 420, opacity: life(f, c.problemA.in - 4, c.problemA.in + 6, c.problemA.out - 8, c.problemA.out),
          background: 'radial-gradient(closest-side, rgba(245,245,248,0.95) 0%, rgba(245,245,248,0.8) 55%, rgba(245,245,248,0) 100%)',
        }} />
      )}
      <Punch f={f} text="Debt is fragmented." at={c.problemA.in} out={c.problemA.out} x={0} y={420} size={96} align="center" accent={[2]} />
      <Punch f={f} text="Financing is disconnected." at={c.problemB.in} out={c.problemB.out} x={0} y={530} size={96} align="center" accent={[2]} />

      <TopVeil o={life(f, c.enter.in - 4, c.enter.in + 6, c.prepare.out - 6, c.prepare.out + 4)} />
      {/* Quand la caméra plonge dans le cockpit, un voile pleine largeur sépare le texte de l'interface zoomée. */}
      {w > 180 && w < 272 && <WideVeil o={Math.min(1, Math.max(0, (cockpitCam(w).k - 0.95) / 0.3))} />}
      <Punch f={f} text="Covenn turns complexity into clarity." at={c.enter.in} out={c.enter.out} {...TOP} accent={[3]} />
      <Punch f={f} text="One view. Across your entire group." at={c.view.in} out={c.view.out} {...TOP} accent={[2]} />
      <ViewSub f={f} />
      <Punch f={f} text="Every covenant. Backed by its source." at={c.control.in} out={c.control.out} {...TOP} accent={[2]} />
      <Punch f={f} text="Anticipate. Don’t react." at={c.anticipate.in} out={c.anticipate.out} {...TOP} accent={[0, 1]} />
      <Punch f={f} text="Simulate tomorrow. Decide today." at={c.simulate.in} out={c.simulate.out} {...TOP} accent={[2]} />
      <Punch f={f} text="Prepare your next financing." at={c.prepare.in} out={c.prepare.out} {...TOP} accent={[2]} />

      {/* S8 et S9 : la vision, au centre, au-dessus de l'interface qui s'élargit */}
      <WideVeil o={life(f, c.beyondA.in - 6, c.beyondA.in + 4, c.access.out - 4, c.access.out + 6)} height={280} />
      <Punch f={f} text="Debt is just the starting point." at={c.beyondA.in} out={c.beyondA.out} x={0} y={86} size={80} align="center" accent={[3]} />
      <Punch f={f} text="Capital structure is our ambition." at={c.beyondB.in} out={c.beyondB.out} x={0} y={86} size={80} align="center" accent={[0, 2]} />
      <Eyebrow f={f} />
      <Punch f={f} text="From managing capital to accessing it." at={c.access.in} out={c.access.out} x={0} y={110} size={74} align="center" accent={[4]} stagger={2} />
    </div>
  );
}

/** Sous-titre de S3 : chaque dimension s'allume quand la caméra la montre (prêteurs, pays, sociétés). */
function ViewSub({ f }: { f: number }) {
  const c = CAPTIONS.view;
  if (f < c.in || f > c.out + 1) return null;
  const leave = p(f, c.out - 8, c.out, E.in);
  const items = [
    { text: 'Multi-bank.', at: c.in + 8, hi: life(f, 166, 172, 182, 186) },
    { text: 'Multi-entity.', at: c.in + 12, hi: life(f, 196, 200, 216, 222) },
    { text: 'Multi-country.', at: c.in + 16, hi: life(f, 182, 186, 196, 200) },
  ];
  return (
    <div style={{ position: 'absolute', left: TOP.x + 2, top: TOP.y + 84, display: 'flex', gap: 18, fontSize: 32, fontWeight: 650, letterSpacing: '-0.02em', opacity: 1 - leave, whiteSpace: 'nowrap' }}>
      {items.map((it) => {
        const t = p(f, it.at, it.at + 8, E.out);
        return (
          <span key={it.text} style={{ opacity: t, transform: `translateY(${(1 - t) * 14}px)`, color: it.hi > 0.5 ? 'var(--brand)' : 'var(--ink-3)', display: 'inline-block' }}>{it.text}</span>
        );
      })}
    </div>
  );
}

/** Marqueur discret de la vision long terme, au début de S9. */
function Eyebrow({ f }: { f: number }) {
  const c = CAPTIONS.access;
  const o = life(f, c.in - 4, c.in + 6, c.out - 8, c.out);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 68, display: 'flex', justifyContent: 'center', opacity: o }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, height: 30, padding: '0 14px', borderRadius: 999, fontSize: 15, fontWeight: 700, letterSpacing: '0.12em',
        color: 'var(--brand-ink)', border: '1px solid var(--brand-line)', background: 'var(--brand-soft)',
      }}>
        OUR VISION
      </span>
    </div>
  );
}
