import { useLayoutEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { AppFrame, type UiRects } from '../bridge/AppFrame';
import { E, life, p, track } from './anim';
import { useFontsReady } from './fonts';
import { Caption, Words } from './parts/Caption';
import { DOC_CSS } from './parts/Windows';
import { appCamera, revealCss } from './scenes/appCamera';
import { CovenantStage } from './scenes/CovenantStage';
import { EndCard } from './scenes/EndCard';
import { Sources } from './scenes/Sources';
import { Vision, VisionMark } from './scenes/Vision';

/** Le film tourne sur ses propres images : aucune transition CSS de la bêta ne doit s'exécuter en temps réel. */
const FILM_CSS = `
*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent; }
`;

const BACKGROUND = 'radial-gradient(1400px 900px at 18% 8%, #FFFFFF 0%, rgba(255,255,255,0) 62%), var(--canvas)';

export function Film() {
  const f = useCurrentFrame();
  const fontsReady = useFontsReady();
  const [rects, setRects] = useState<UiRects | null>(null);
  const [handle] = useState(() => delayRender('Mesure de la vue groupe réelle'));
  useLayoutEffect(() => {
    if (rects) continueRender(handle);
  }, [rects, handle]);

  if (!fontsReady) return <AbsoluteFill style={{ background: 'var(--canvas)' }} />;

  const cam = rects ? appCamera(f, rects) : null;
  const appVisible = Boolean(cam && cam.opacity > 0.001);
  const mention = life(f, 150, 166, 686, 698);

  return (
    <AbsoluteFill style={{ background: BACKGROUND, overflow: 'hidden' }}>
      <style>{FILM_CSS + DOC_CSS}</style>

      {/* S2 → S3 : la vraie vue groupe de la bêta, rendue par ses composants */}
      <AppFrame
        onMeasured={setRects}
        frameCss={revealCss(f)}
        style={{
          zIndex: 2,
          visibility: appVisible ? 'visible' : 'hidden',
          opacity: cam?.opacity ?? 0,
          transform: cam ? `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.k})` : undefined,
          filter: cam && cam.blur > 0.05 ? `blur(${(cam.blur / Math.max(cam.k, 0.01)).toFixed(2)}px)` : undefined,
          borderRadius: 16,
          boxShadow: '0 40px 120px rgba(28, 26, 43, 0.16), 0 0 0 1px rgba(28, 26, 43, 0.06)',
        }}
      />

      {/* S1 → S2 : les sources dispersées (sous la fenêtre Covenn), puis leurs chiffres qui la rejoignent (au-dessus) */}
      {rects && f < 176 && <Sources frame={f} uiRects={rects} />}

      {/* S3 → S5 : calcul, preuve, calcul enregistré et écart */}
      {rects && <CovenantStage f={f} rects={rects} />}

      {/* Textes du film */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
        {f < 122 && (
          <div style={{ position: 'absolute', left: 0, top: 560, width: 1100, height: 520, background: 'radial-gradient(640px 300px at 32% 62%, rgba(247,246,251,0.96) 0%, rgba(247,246,251,0) 100%)', opacity: life(f, 0, 10, 110, 120) }} />
        )}
        <Caption frame={f} x={120} y={720} size={66} lines={[
          { text: 'Cinq fichiers Excel.', in: 4, out: 120 },
          { text: 'Trois contrats PDF.', in: 30, out: 120 },
          { text: 'Une dette à piloter.', in: 58, out: 120 },
        ]} />
        <Question f={f} />
        <Words frame={f} x={120} y={84} out={394} words={[
          { text: 'Vos covenants.', in: 262 }, { text: 'Calculés.', in: 304 }, { text: 'Suivis.', in: 322 }, { text: 'Maîtrisés.', in: 344 },
        ]} />
        <Words frame={f} x={120} y={84} out={538} words={[
          { text: 'Chaque chiffre.', in: 400 }, { text: 'Une source.', in: 446 }, { text: 'Une preuve.', in: 480 },
        ]} />
        <Words frame={f} x={120} y={84} out={688} words={[
          { text: 'Les écarts détectés.', in: 614 }, { text: 'Les décisions éclairées.', in: 652 },
        ]} />
        {mention > 0.001 && (
          <div style={{ position: 'absolute', left: 120, bottom: 30, fontSize: 15, fontWeight: 500, color: 'var(--ink-400)', opacity: mention }}>
            Données fictives — environnement de démonstration
          </div>
        )}
      </div>

      {/* S6 : la vision ; S7 : la signature */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}><Vision f={f} /></div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 7 }}><EndCard f={f} /></div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 8 }}><VisionMark f={f} /></div>

      {/* Fondu d'ouverture */}
      <AbsoluteFill style={{ zIndex: 9, background: '#F7F6FB', opacity: 1 - life(f, 0, 8, Infinity, Infinity, E.out), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}

/** S2 — la question de rupture : elle naît à la place du constat, puis monte laisser la place à Covenn. */
function Question({ f }: { f: number }) {
  const o = life(f, 120, 134, 204, 214);
  if (o <= 0.001) return null;
  const y = track(f, [[138, 720], [160, 84, E.inOut]]);
  const scale = track(f, [[138, 1], [160, 50 / 66, E.inOut]]);
  const rise = (1 - p(f, 120, 138, E.out)) * 24;
  return (
    <div style={{ position: 'absolute', left: 120, top: y, fontSize: 66, lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink-900)', whiteSpace: 'nowrap',
      opacity: o, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: '0 0' }}>
      Et si tout devenait clair{'\u202F'}?
    </div>
  );
}
