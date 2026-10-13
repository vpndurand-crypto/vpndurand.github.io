/**
 * Géométrie de la vision (S8), partagée avec le dossier (S7) dont les blocs deviennent des nœuds.
 * Trois orbites autour de Covenn, une par ambition du deck : piloter la dette → piloter le haut de bilan → faciliter le financement.
 */
import { E, mix, p } from '../../film/anim';

export const NET = { center: { x: 960, y: 640 }, collapse: [788, 808] as const, born: [700, 712] as const };

export const ORBITS = [
  { key: 'dette', label: 'Piloter la dette', rx: 330, ry: 168, draw: [704, 720] as const },
  { key: 'bilan', label: 'Piloter le haut de bilan', rx: 600, ry: 290, draw: [722, 740] as const },
  { key: 'financement', label: 'Faciliter le financement', rx: 700, ry: 380, draw: [742, 760] as const },
] as const;

export type NodeIcon = 'financings' | 'schedule' | 'covenants' | 'building' | 'calculator' | 'data' | 'handshake' | 'save';
export interface VisionNode { key: string; label: string; icon: NodeIcon; orbit: 0 | 1 | 2; angle: number; block?: string }

/** Les nœuds : six viennent des blocs du dossier, deux s'ajoutent avec leur orbite. Angles en degrés (0 = à droite, 90 = en bas). */
export const NODES: VisionNode[] = [
  { key: 'instruments', label: 'Instruments financiers', icon: 'financings', orbit: 0, angle: -90, block: 'debt' },
  { key: 'echeances', label: 'Échéances', icon: 'schedule', orbit: 0, angle: 22, block: 'schedule' },
  { key: 'covenants', label: 'Covenants', icon: 'covenants', orbit: 0, angle: 158, block: 'covenants' },
  { key: 'filiales', label: 'Filiales', icon: 'building', orbit: 1, angle: -142, block: 'data' },
  { key: 'scenarios', label: 'Scénarios', icon: 'calculator', orbit: 1, angle: -38, block: 'scenario' },
  { key: 'donnees', label: 'Données', icon: 'data', orbit: 1, angle: 92 },
  { key: 'partenaires', label: 'Partenaires financiers', icon: 'handshake', orbit: 2, angle: -12 },
  { key: 'dossiers', label: 'Dossiers de financement', icon: 'save', orbit: 2, angle: 160, block: 'need' },
];

/** Respiration du réseau : léger zoom arrière, rotation lente des positions (le texte reste droit), repli final. */
export function netMotion(f: number) {
  return {
    zoom: mix(1.04, 0.97, p(f, 704, 788, E.soft)),
    spin: mix(0.05, -0.04, p(f, 700, 808, E.soft)),
    collapse: p(f, NET.collapse[0], NET.collapse[1], E.in),
  };
}

export function orbitPos(f: number, orbit: number, angleDeg: number, k = 1) {
  const { zoom, spin, collapse } = netMotion(f);
  const o = ORBITS[orbit] ?? ORBITS[0];
  const a = (angleDeg * Math.PI) / 180 + spin;
  const s = zoom * (1 - collapse) * k;
  return { x: NET.center.x + Math.cos(a) * o.rx * s, y: NET.center.y + Math.sin(a) * o.ry * s };
}

/** Position du nœud qui reçoit un bloc du dossier. */
export function nodeForBlock(blockKey: string, f: number) {
  const n = NODES.find((x) => x.block === blockKey);
  return n ? orbitPos(f, n.orbit, n.angle) : null;
}
