/**
 * La fenêtre de l'application (coque de la bêta : barre latérale, barre supérieure) et sa caméra, communes aux scènes
 * produit (S2, S3, S4, S6). La caméra fait correspondre un point de l'interface (cx, cy) à un point de l'image (fx, fy),
 * au zoom k. Au repos, la fenêtre de 1600 × 900 occupe l'image de (160, 168) à (1760, 1068) : le titre de scène tient
 * au-dessus, et les calques de premier plan (la demande Project Falcon) s'alignent sur la page.
 */
import type { ReactNode } from 'react';
import { E, p, track, zoomTrack, type Key } from '../film/anim';
import { SHADOW, Sidebar, Topbar, type Section } from '../capos/kit';
import { GROUP } from './data';
import { NAV, PULLBACK, S3 } from './timing';

export const UI = { w: 1600, h: 900, side: 240 } as const;
export interface Cam { k: number; cx: number; cy: number; fx: number; fy: number }
export const REST: Cam = { k: 1, cx: 800, cy: 450, fx: 960, fy: 618 };

/** Colonne de contenu des pages (marges de la bêta, élargies à la fenêtre du film). */
export const COL = { x: 280, w: 1288, r: 1568 } as const;
/** Rangée d'indicateurs de la vue groupe (cinq tuiles, comme la bêta). */
export const KPI = { y: 178, h: 156, w: 248, gap: 12, xs: [280, 540, 800, 1060, 1320] as const } as const;
export const KPI1_CENTER = { x: KPI.xs[0] + KPI.w / 2, y: KPI.y + KPI.h / 2 };
/** Zoom du plan serré sur l'encours (S1 → S2). */
export const TIGHT_K = 2.1;

/** Éléments du menu de la bêta (centre vertical, coordonnées de l'interface) : d'où partent les données de S4. */
export const NAV_Y: Record<Section, number> = {
  overview: 128, capital: 163, debt: 198, covenants: 233, scenarios: 268, financing: 343, providers: 378, data: 453, activity: 488, settings: 523,
};

// Plan serré sur l'encours, recul jusqu'à la vue groupe ; léger souffle pendant le scénario et la demande ;
// recul vers le réseau (S5) ; retour pour la comparaison (S6) ; recul final vers la marque (S7).
const K: Key[] = [
  [90, TIGHT_K], [PULLBACK[0], TIGHT_K], [PULLBACK[1], 1, E.inOut], [NAV.swap[0], 1.012, E.soft], [NAV.swap[1], 1, E.inOut],
  [S3.press, 1.03, E.soft], [S3.lift[1], 1, E.inOut], [440, 1.02, E.soft], [476, 0.84, E.inOut], [682, 0.95], [700, 1, E.out], [782, 1.012, E.soft], [800, 0.96, E.in],
];
const CX: Key[] = [[90, KPI1_CENTER.x], [PULLBACK[0], KPI1_CENTER.x], [PULLBACK[1], REST.cx, E.inOut]];
const CY: Key[] = [[90, KPI1_CENTER.y], [PULLBACK[0], KPI1_CENTER.y], [PULLBACK[1], REST.cy, E.inOut]];
const FY: Key[] = [[90, 560], [PULLBACK[0], 560], [PULLBACK[1], REST.fy, E.inOut], [440, REST.fy], [476, 596, E.inOut], [682, 606], [700, REST.fy, E.out]];

export function windowCam(f: number): Cam {
  return { k: zoomTrack(f, K), cx: track(f, CX), cy: track(f, CY), fx: REST.fx, fy: track(f, FY) };
}
export function toFrame(cam: Cam, x: number, y: number): { x: number; y: number } {
  return { x: cam.fx + cam.k * (x - cam.cx), y: cam.fy + cam.k * (y - cam.cy) };
}
export interface Rect { x: number; y: number; w: number; h: number }
/** Rectangle de l'interface → rectangle de l'image. */
export function rectToFrame(cam: Cam, r: Rect): Rect {
  const a = toFrame(cam, r.x, r.y);
  return { x: a.x, y: a.y, w: r.w * cam.k, h: r.h * cam.k };
}

export function windowOpacity(f: number): number {
  if (f < 300) return p(f, 84, 92);
  if (f < 600) return 1 - p(f, 448, 474, E.in);
  return Math.min(p(f, 682, 698), 1 - p(f, 784, 800, E.in));
}

export function sectionAt(f: number): Section {
  return f < 210 ? 'overview' : f < 316 ? 'scenarios' : 'financing';
}

/** La fenêtre : fond, coque de la bêta, puis le contenu de la page (coordonnées de l'interface). */
export function AppWindow({ f, children }: { f: number; children: ReactNode }) {
  const o = windowOpacity(f);
  if (o <= 0.001) return null;
  const cam = windowCam(f);
  const shell = f < 300 ? p(f, PULLBACK[0], PULLBACK[0] + 20) : 1;
  const blur = f > 440 && f < 600 ? p(f, 446, 474) * 6 : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: UI.w, height: UI.h, transformOrigin: '0 0', lineHeight: 1.5,
        transform: `translate(${cam.fx - cam.k * cam.cx}px, ${cam.fy - cam.k * cam.cy}px) scale(${cam.k})`,
        background: 'var(--paper)', borderRadius: 16, overflow: 'hidden', boxShadow: `${SHADOW}, 0 0 0 1px rgba(28, 25, 54, 0.06)`,
      }}>
        <div style={{ opacity: shell }}>
          <Sidebar active={sectionAt(f)} height={UI.h} />
          <Topbar scope={GROUP.scope} width={UI.w - UI.side} />
        </div>
        {children}
      </div>
    </div>
  );
}
