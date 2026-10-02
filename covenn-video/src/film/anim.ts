import { Easing, interpolate } from 'remotion';

/** Courbes du film. `ui` est la courbe de la bêta (--ease : cubic-bezier(.2,.8,.2,1)). */
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.45, 0, 0.25, 1),
  ui: Easing.bezier(0.2, 0.8, 0.2, 1),
  in: Easing.bezier(0.55, 0, 0.75, 0.2),
  linear: (t: number) => t,
} as const;

export type Ease = (t: number) => number;

/** Progression 0 → 1 entre deux images, bornée. */
export function p(frame: number, start: number, end: number, ease: Ease = E.out): number {
  if (end <= start) return frame >= end ? 1 : 0;
  return interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
}

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Apparition puis disparition : 0 → 1 sur [inStart, inEnd], 1 → 0 sur [outStart, outEnd]. */
export function life(frame: number, inStart: number, inEnd: number, outStart = Infinity, outEnd = Infinity, easeIn: Ease = E.out, easeOut: Ease = E.in): number {
  return Math.min(p(frame, inStart, inEnd, easeIn), 1 - p(frame, outStart, outEnd, easeOut));
}

/** Image clé : [image, valeur, courbe du segment qui y arrive]. */
export type Key = readonly [number, number, Ease?];

/** Piste par images clés, segment par segment. */
export function track(frame: number, keys: readonly Key[], ease: Ease = E.inOut): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return 0;
  if (frame <= first[0]) return first[1];
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (a && b && frame <= b[0]) return mix(a[1], b[1], p(frame, a[0], b[0], b[2] ?? ease));
  }
  return last[1];
}

/** Piste d'échelle : interpolation géométrique (un zoom régulier à l'œil). */
export function zoomTrack(frame: number, keys: readonly Key[], ease: Ease = E.inOut): number {
  return Math.exp(track(frame, keys.map(([f, v, e]): Key => (e ? [f, Math.log(v), e] : [f, Math.log(v)])), ease));
}

/** Point sur une courbe de Bézier quadratique (trajectoires en arc). */
export function quad(a: number, c: number, b: number, t: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * c + t * t * b;
}

export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
