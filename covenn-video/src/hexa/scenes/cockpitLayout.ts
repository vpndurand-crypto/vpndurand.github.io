/**
 * Cockpit groupe (S3) : géométrie de l'écran (coordonnées de l'interface, 1600 × 900) et caméra.
 * La caméra fait correspondre un point de l'interface (cx, cy) à un point de l'image (fx, fy), au zoom k.
 */
import { E, track, zoomTrack, type Key } from '../../film/anim';

export const UI = { w: 1600, h: 900, sidebar: 248, topbar: 64 } as const;

export const LAYOUT = {
  header: { x: 280, y: 92 },
  kpiY: 178,
  kpiH: 128,
  kpiX: [280, 606, 932, 1258] as const,
  kpiW: 310,
  cardsY: 330,
  cardsH: 540,
  pays: { x: 280, w: 460 },
  preteur: { x: 764, w: 388 },
  type: { x: 1176, w: 392 },
  rowH: 70,
  subRowH: 50,
  popover: { x: 772, y: 446, w: 400, h: 286 },
} as const;

/** Centre de la valeur « Encours total » (tuile 1) et de la tuile covenant (tuile 4). */
export const TOTAL_VALUE = { x: LAYOUT.kpiX[0] + 106, y: LAYOUT.kpiY + 64 };
export const COVENANT_TILE = { x: LAYOUT.kpiX[3], y: LAYOUT.kpiY, w: LAYOUT.kpiW, h: LAYOUT.kpiH };
/** Centre du nombre « 3,13x » dans la tuile (après le mot « Leverage »). */
export const COVENANT_VALUE = { x: LAYOUT.kpiX[3] + 229, y: LAYOUT.kpiY + 61 };
/** Pictogramme de la marque dans la barre latérale (bêta : 30 × 30 à 20 px du bord). */
export const BRAND_MARK = { x: 35, y: 32, size: 30 };

/** La marque Covenn de S2, et l'ouverture de la fenêtre du cockpit à partir d'elle. */
export const MARK_HOME = { x: 560, y: 560, size: 116 } as const;
export const REVEAL = { start: 166, end: 188, contentFrom: 170, contentTo: 186 } as const;

export interface Cam { k: number; cx: number; cy: number; fx: number; fy: number; opacity: number }

// Plan serré sur l'encours total (k = 2,4), dézoom vers la vue groupe (k = 0,9), zoom France puis Démo Industrie, retour,
// puis plongée vers la tuile du covenant.
const TILE4 = { x: COVENANT_TILE.x + COVENANT_TILE.w / 2, y: COVENANT_TILE.y + COVENANT_TILE.h / 2 };
const K: Key[] = [[166, 2.4], [196, 2.4], [216, 0.9, E.inOut], [220, 0.9], [232, 1.62, E.inOut], [244, 1.9, E.inOut], [256, 1.9], [268, 0.9, E.inOut], [284, 0.92, E.soft], [300, 1.55, E.in]];
const CX: Key[] = [[166, 410], [196, 410], [216, 800, E.inOut], [220, 800], [232, 520, E.inOut], [244, 650, E.inOut], [256, 652], [268, 800, E.inOut], [284, 820, E.soft], [300, TILE4.x, E.in]];
const CY: Key[] = [[166, 252], [196, 252], [216, 450, E.inOut], [220, 450], [232, 520, E.inOut], [244, 550, E.inOut], [256, 552], [268, 450, E.inOut], [284, 446, E.soft], [300, TILE4.y, E.in]];
const FX: Key[] = [[166, 960], [196, 960], [216, 960, E.inOut], [220, 960], [232, 820, E.inOut], [244, 840, E.inOut], [256, 840], [268, 960, E.inOut], [284, 960], [300, 1180, E.in]];
const FY: Key[] = [[166, 580], [196, 580], [216, 600, E.inOut], [220, 600], [232, 660, E.inOut], [244, 640, E.inOut], [256, 640], [268, 600, E.inOut], [284, 602], [300, 470, E.in]];

export function cockpitCam(f: number): Cam {
  return {
    k: zoomTrack(f, K),
    cx: track(f, CX),
    cy: track(f, CY),
    fx: track(f, FX),
    fy: track(f, FY),
    opacity: track(f, [[292, 1], [304, 0, E.in]]),
  };
}

export function toFrame(cam: Cam, x: number, y: number): { x: number; y: number } {
  return { x: cam.fx + cam.k * (x - cam.cx), y: cam.fy + cam.k * (y - cam.cy) };
}

/** Rectangle de la fenêtre du cockpit dans l'image. */
export function windowRect(cam: Cam) {
  return { x: cam.fx - cam.k * cam.cx, y: cam.fy - cam.k * cam.cy, w: UI.w * cam.k, h: UI.h * cam.k };
}

/** Transformation CSS de l'interface (origine en haut à gauche). */
export function camTransform(cam: Cam): string {
  return `translate(${cam.fx - cam.k * cam.cx}px, ${cam.fy - cam.k * cam.cy}px) scale(${cam.k})`;
}
