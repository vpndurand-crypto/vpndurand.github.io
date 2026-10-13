import type { CSSProperties } from 'react';
import { E, life, mix, p } from '../film/anim';
import { CAPTIONS, SCENES } from './timing';
import { cockpitCam } from './scenes/cockpitLayout';

/**
 * Un message par séquence. Les mots montent d'un masque, très vite (≈ 0,3 s), puis la ligne s'efface vers le haut :
 * rien n'attend la fin d'une phrase, l'image continue sous le texte.
 */
export function Punch({ f, text, at, out, x, y, size, align = 'left', accentFrom, color = 'var(--ink-900)', accentColor = 'var(--indigo-600)', weight = 750, stagger = 3, style }: {
  f: number; text: string; at: number; out: number; x: number; y: number; size: number; align?: 'left' | 'center';
  accentFrom?: number; color?: string; accentColor?: string; weight?: number; stagger?: number; style?: CSSProperties;
}) {
  if (f < at - 1 || f > out + 1) return null;
  const words = text.split(' ');
  const leave = p(f, out - 8, out, E.in);
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
              color: accentFrom !== undefined && i >= accentFrom ? accentColor : undefined,
            }}>
              {w}{i < words.length - 1 ? ' ' : ''}
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
  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1500, height: 260, opacity: o, background: 'radial-gradient(1100px 230px at 22% 0%, rgba(247,246,251,0.97) 0%, rgba(247,246,251,0.86) 45%, rgba(247,246,251,0) 100%)' }} />;
}

const TOP = { x: 120, y: 74, size: 64 } as const;

export function Captions({ f }: { f: number }) {
  const c = CAPTIONS;
  const veil = Math.max(
    life(f, c.ingest.in - 4, c.ingest.in + 6, c.dossier.out - 6, c.dossier.out + 4),
  );
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* S1 : grand, au centre, au milieu des fichiers */}
      {f < SCENES.chaos[1] && (
        <div style={{
          position: 'absolute', left: 260, right: 260, top: 380, height: 300, opacity: life(f, c.chaos.in - 4, c.chaos.in + 8, c.chaos.out - 8, c.chaos.out),
          background: 'radial-gradient(closest-side, rgba(247,246,251,0.94) 0%, rgba(247,246,251,0.75) 55%, rgba(247,246,251,0) 100%)',
        }} />
      )}
      <Punch f={f} text="Votre finance est partout." at={c.chaos.in} out={c.chaos.out} x={0} y={478} size={100} align="center" />

      <TopVeil o={veil} />
      {/* Quand la caméra plonge dans le cockpit, un voile pleine largeur sépare le texte de l'interface zoomée. */}
      {f > 180 && f < 272 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: 300, opacity: Math.min(1, Math.max(0, (cockpitCam(f).k - 1.0) / 0.45)),
          background: 'linear-gradient(180deg, rgba(247,246,251,0.98) 0%, rgba(247,246,251,0.94) 48%, rgba(247,246,251,0) 100%)',
        }} />
      )}
      <Punch f={f} text="Covenn connecte les données." at={c.ingest.in} out={c.ingest.out} {...TOP} accentFrom={2} />
      <Punch f={f} text="Une vision. Tout votre groupe." at={c.cockpit.in} out={c.cockpit.out} {...TOP} accentFrom={2} />
      <Punch f={f} text="Chaque engagement sous contrôle." at={c.covenant.in} out={c.covenant.out} {...TOP} accentFrom={3} />
      <Punch f={f} text="Anticipez, ne subissez plus." at={c.timeline.in} out={c.timeline.out} {...TOP} accentFrom={1} />
      <Punch f={f} text="Et si vous pouviez voir demain ?" at={c.simulation.in} out={c.simulation.out} {...TOP} accentFrom={4} />
      <Punch f={f} text="Votre prochain financement commence ici." at={c.dossier.in} out={c.dossier.out} {...TOP} accentFrom={3} />

      {/* S8 : au centre, au-dessus du réseau */}
      <Punch f={f} text="De la donnée à la décision." at={c.networkA.in} out={c.networkA.out} x={0} y={104} size={86} align="center" accentFrom={5} />
      <NetworkB f={f} />
    </div>
  );
}

/** « De la décision au financement. » : enchaîne aussitôt, avec plus de force (léger zoom arrière, flou qui se dissipe). */
function NetworkB({ f }: { f: number }) {
  const c = CAPTIONS.networkB;
  if (f < c.in - 1 || f > c.out + 1) return null;
  const t = p(f, c.in, c.in + 9, E.out);
  const leave = p(f, c.out - 8, c.out, E.in);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontSize: 96, lineHeight: 1.08, fontWeight: 800, letterSpacing: '-0.04em',
      color: 'var(--ink-900)', opacity: t * (1 - leave), transform: `translateY(${(1 - t) * 30}px) scale(${mix(1.08, 1, t) * mix(1, 0.96, leave)})`, transformOrigin: '50% 60%',
      filter: t < 0.999 ? `blur(${(1 - t) * 8}px)` : undefined, whiteSpace: 'nowrap',
    }}>
      De la décision <span style={{ color: 'var(--indigo-700)' }}>au financement.</span>
    </div>
  );
}
