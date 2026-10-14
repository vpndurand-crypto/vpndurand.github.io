// Styles d'origine de la bêta : polices embarquées, jetons de couleur et de typographie, base.
import '../beta/src/ui/styles/fonts.css';
import '../beta/src/ui/styles/tokens.css';
import '../beta/src/ui/styles/base.css';
import { Composition } from 'remotion';
import { Film } from './film/Film';
import { Hexa } from './hexa/Hexa';
import { DURATION as HEXA_DURATION, FPS as HEXA_FPS } from './hexa/timing';

export const FPS = 30;
export const DURATION = 900; // 30,0 s

export function RemotionRoot() {
  return (
    <>
      {/* HEXA V5 (anglais) : la version finale. Les versions précédentes restent dans l'historique git et dans out/. */}
      <Composition id="CovennHexaV5" component={Hexa} durationInFrames={HEXA_DURATION} fps={HEXA_FPS} width={1920} height={1080} />
      {/* Version précédente (v2), conservée pour mémoire et pour pouvoir la régénérer. */}
      <Composition id="CovennHexa" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    </>
  );
}
