// Styles d'origine de la bêta : polices embarquées, jetons de couleur et de typographie, base.
import '../beta/src/ui/styles/fonts.css';
import '../beta/src/ui/styles/tokens.css';
import '../beta/src/ui/styles/base.css';
import { Composition } from 'remotion';
import { Film } from './film/Film';

export const FPS = 30;
export const DURATION = 900; // 30,0 s

export function RemotionRoot() {
  return <Composition id="CovennHexa" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />;
}
