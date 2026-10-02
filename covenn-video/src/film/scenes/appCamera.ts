import { CLASSES, SELECTORS, UI_H, UI_W, type UiRect, type UiRects } from '../../bridge/AppFrame';
import { E, life, p, track, zoomTrack } from '../anim';

export interface Cam { k: number; tx: number; ty: number; opacity: number; blur: number }

export const center = (r: UiRect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Atterrissage des chiffres venus des sources (S2) : image où chaque valeur rejoint la vue groupe. */
export const LANDING = { threshold: 126, debt: 128, cash: 132, ebitda: 134 } as const;

/**
 * Caméra sur l'interface réelle (S2 → S3) : la fenêtre apparaît, s'approche,
 * puis plonge vers le Leverage de la carte « Covenant le plus proche du seuil ».
 */
export function appCamera(f: number, r: UiRects): Cam {
  const mv = center(r.miniValue);
  const k = zoomTrack(f, [[96, 0.8], [124, 0.84, E.out], [166, 0.93, E.soft], [212, 2.4, E.inOut], [242, 3.1, E.out]]);
  const cx = track(f, [[96, UI_W / 2], [124, UI_W / 2], [166, 790, E.soft], [212, mv.x, E.inOut]]);
  const cy = track(f, [[96, UI_H / 2], [124, UI_H / 2], [166, 470, E.soft], [212, mv.y, E.inOut]]);
  const fx = track(f, [[96, 960], [124, 960], [166, 960, E.soft], [212, 930, E.inOut]]);
  const fy = track(f, [[96, 680], [124, 638, E.out], [166, 615, E.soft], [212, 560, E.inOut]]);
  const opacity = track(f, [[96, 0], [118, 1, E.out], [200, 1], [228, 0.12, E.inOut], [252, 0, E.in]]);
  const blur = track(f, [[202, 0], [230, 12, E.inOut]]);
  return { k, tx: fx - k * cx, ty: fy - k * cy, opacity, blur };
}

export const toFrame = (cam: Cam, x: number, y: number) => ({ x: cam.tx + cam.k * x, y: cam.ty + cam.k * y });

/** Révélation progressive des blocs réels de la vue groupe et accent sur les valeurs qui reçoivent un chiffre. */
export function revealCss(f: number): string {
  const { pages, shell } = CLASSES;
  const rules: string[] = [];
  const show = (selector: string, start: number, dy = 16) => {
    const t = p(f, start, start + 16, E.out);
    rules.push(`.covenn-frame ${selector} { opacity: ${t.toFixed(4)}; transform: translateY(${((1 - t) * dy).toFixed(2)}px); }`);
  };
  show(`.${shell.content} > header`, 102);
  for (let i = 0; i < 4; i += 1) show(`.${pages.kpis} > div:nth-child(${i + 1})`, 108 + i * 5);
  show(`.${pages.row84} > section:nth-child(1)`, 122);
  show(`.${pages.row84} > section:nth-child(2)`, 130);
  show(`.${pages.row75}`, 138);
  const pulse = (selector: string, land: number) => {
    const a = life(f, land - 2, land + 3, land + 10, land + 30, E.out, E.soft);
    if (a > 0) rules.push(`.covenn-frame ${selector} { background-color: rgba(207, 200, 241, ${(0.95 * a).toFixed(3)}) !important; color: var(--indigo-800) !important; }`);
  };
  const handOff = p(f, 203, 206, E.linear);
  if (handOff > 0) rules.push(`.covenn-frame ${SELECTORS.miniValue} { opacity: ${(1 - handOff).toFixed(3)}; }`);
  pulse(SELECTORS.threshold, LANDING.threshold);
  pulse(SELECTORS.debt, LANDING.debt);
  pulse(SELECTORS.cash, LANDING.cash);
  pulse(SELECTORS.ebitda, LANDING.ebitda);
  return rules.join('\n');
}
