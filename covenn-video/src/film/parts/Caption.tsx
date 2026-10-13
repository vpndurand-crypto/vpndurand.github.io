import type { CSSProperties } from 'react';
import { E, life, p } from '../anim';

export interface CaptionLine { text: string; in: number; out: number }

/**
 * Texte du film : lignes qui montent de quelques pixels en apparaissant, puis s'effacent.
 * Une seule voix typographique : Figtree 700, encre presque noire, approche resserrée.
 */
export function Caption({ frame, lines, x, y, size = 48, lineHeight = 1.18, color = 'var(--ink-900)', weight = 700, style }: {
  frame: number; lines: readonly CaptionLine[]; x: number; y: number; size?: number; lineHeight?: number; color?: string; weight?: number; style?: CSSProperties;
}) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, fontSize: size, lineHeight, fontWeight: weight, color, letterSpacing: '-0.025em', whiteSpace: 'nowrap', ...style }}>
      {lines.map((line) => {
        const o = life(frame, line.in, line.in + 14, line.out - 10, line.out, E.out, E.in);
        const rise = (1 - p(frame, line.in, line.in + 18, E.out)) * 0.42 * size;
        const leave = p(frame, line.out - 10, line.out, E.in) * -0.18 * size;
        return (
          <div key={line.text} style={{ opacity: o, transform: `translateY(${rise + leave}px)`, height: size * lineHeight }}>
            {line.text}
          </div>
        );
      })}
    </div>
  );
}

export interface Word { text: string; in: number }

/** Une ligne dont les segments apparaissent un à un, au rythme des preuves montrées, puis s'effacent ensemble. */
export function Words({ frame, words, out, x, y, size = 50, color = 'var(--ink-900)', accent }: {
  frame: number; words: readonly Word[]; out: number; x: number; y: number; size?: number; color?: string; accent?: number;
}) {
  const leave = p(frame, out - 10, out, E.in);
  return (
    <div style={{ position: 'absolute', left: x, top: y, fontSize: size, lineHeight: 1.18, fontWeight: 700, color, letterSpacing: '-0.025em', whiteSpace: 'nowrap', opacity: 1 - leave, transform: `translateY(${-leave * 0.18 * size}px)` }}>
      {words.map((w, i) => {
        const o = p(frame, w.in, w.in + 12, E.out);
        const rise = (1 - p(frame, w.in, w.in + 16, E.out)) * 0.36 * size;
        return (
          <span key={w.text} style={{ display: 'inline-block', opacity: o, transform: `translateY(${rise}px)`, marginRight: '0.28em', color: accent === i ? 'var(--indigo-600)' : undefined }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
