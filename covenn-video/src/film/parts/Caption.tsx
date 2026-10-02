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
