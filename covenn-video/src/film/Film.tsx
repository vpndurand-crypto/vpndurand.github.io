import { useLayoutEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { AppFrame, type UiRects } from '../bridge/AppFrame';
import { E, life } from './anim';
import { useFontsReady } from './fonts';
import { Caption } from './parts/Caption';
import { DOC_CSS } from './parts/Windows';
import { appCamera, revealCss } from './scenes/appCamera';
import { CovenantStage } from './scenes/CovenantStage';
import { EndCard } from './scenes/EndCard';
import { Sources } from './scenes/Sources';

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
  const mention = life(f, 100, 116, 784, 800);

  return (
    <AbsoluteFill style={{ background: BACKGROUND, overflow: 'hidden' }}>
      <style>{FILM_CSS + DOC_CSS}</style>

      {/* S2 → S3 : la vraie vue groupe de la bêta, rendue par ses composants */}
      <AppFrame
        onMeasured={setRects}
        frameCss={revealCss(f)}
        style={{
          visibility: appVisible ? 'visible' : 'hidden',
          opacity: cam?.opacity ?? 0,
          transform: cam ? `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.k})` : undefined,
          filter: cam && cam.blur > 0.05 ? `blur(${(cam.blur / Math.max(cam.k, 0.01)).toFixed(2)}px)` : undefined,
          borderRadius: 16,
          boxShadow: '0 40px 120px rgba(28, 26, 43, 0.16), 0 0 0 1px rgba(28, 26, 43, 0.06)',
        }}
      />

      {/* S1 : les sources dispersées, puis leurs chiffres qui rejoignent Covenn */}
      {rects && f < 132 && <Sources frame={f} uiRects={rects} />}

      {/* S3 → S5 : calcul, preuve, calcul figé et donnée modifiée */}
      {rects && <CovenantStage f={f} rects={rects} />}

      {/* Textes du film */}
      {f < 100 && (
        <div style={{ position: 'absolute', left: 0, top: 560, width: 1100, height: 520, background: 'radial-gradient(640px 300px at 32% 62%, rgba(247,246,251,0.96) 0%, rgba(247,246,251,0) 100%)', opacity: life(f, 0, 10, 88, 98) }} />
      )}
      <Caption frame={f} x={120} y={720} size={66} lines={[
        { text: 'Cinq fichiers Excel.', in: 4, out: 98 },
        { text: 'Trois contrats PDF.', in: 30, out: 98 },
        { text: 'Plusieurs logiciels.', in: 56, out: 98 },
      ]} />
      <Caption frame={f} x={120} y={84} size={50} lines={[{ text: 'Vous ouvrez Covenn.', in: 100, out: 178 }]} />
      <Caption frame={f} x={120} y={84} size={50} lines={[
        { text: 'Chaque covenant, recalculé depuis son contrat.', in: 226, out: 362 },
        { text: 'Avec sa marge restante.', in: 320, out: 364 },
      ]} />
      <Caption frame={f} x={120} y={84} size={50} lines={[{ text: 'Chaque chiffre remonte à sa source.', in: 370, out: 600 }]} />
      <Caption frame={f} x={120} y={84} size={50} lines={[
        { text: 'Le calcul est figé.', in: 606, out: 782 },
        { text: 'Tout écart est signalé.', in: 704, out: 782 },
      ]} />

      {mention > 0.001 && (
        <div style={{ position: 'absolute', left: 120, bottom: 30, fontSize: 15, fontWeight: 500, color: 'var(--ink-400)', opacity: mention }}>
          Données fictives — environnement de démonstration
        </div>
      )}

      <EndCard f={f} />
      {/* Fondu d'ouverture */}
      <AbsoluteFill style={{ background: '#F7F6FB', opacity: 1 - life(f, 0, 8, Infinity, Infinity, E.out), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
