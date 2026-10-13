/**
 * Géométrie du réseau (S8), partagée avec le dossier (S7) dont les blocs deviennent les premiers nœuds.
 */
import { E, mix, p } from '../../film/anim';

export const NET = { center: { x: 960, y: 664 }, collapse: [790, 810] as const, born: [702, 714] as const };

export interface Ring1Node { key: string; label: string; icon: 'building' | 'financings' | 'schedule' | 'handshake' | 'calculator' | 'covenants' | 'data'; block?: string }

/** Premier anneau : ce que Covenn relie (les blocs du dossier s'y posent ; « Partenaires financiers » s'y ajoute). */
export const RING1: Ring1Node[] = [
  { key: 'filiales', label: 'Filiales', icon: 'building', block: 'data' },
  { key: 'instruments', label: 'Instruments financiers', icon: 'financings', block: 'debt' },
  { key: 'echeances', label: 'Échéances', icon: 'schedule', block: 'schedule' },
  { key: 'partenaires', label: 'Partenaires financiers', icon: 'handshake' },
  { key: 'scenarios', label: 'Scénarios', icon: 'calculator', block: 'scenario' },
  { key: 'covenants', label: 'Covenants', icon: 'covenants', block: 'covenants' },
  { key: 'donnees', label: 'Données', icon: 'data', block: 'proofs' },
];
export const R1 = { rx: 500, ry: 262 };
export const R2 = { rx: 760, ry: 400 };
export const R3 = { rx: 1010, ry: 548 };

export const angle1 = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / RING1.length;

/** Zoom, rotation lente et repli final du réseau. */
export function netMotion(f: number) {
  return {
    zoom: mix(1.06, 0.95, p(f, 712, 800, E.soft)),
    spin: mix(0.1, -0.06, p(f, 700, 810, E.soft)),
    collapse: p(f, NET.collapse[0], NET.collapse[1], E.in),
  };
}

export function netPos(f: number, a: number, rx: number, ry: number, k = 1) {
  const { zoom, spin, collapse } = netMotion(f);
  const s = zoom * (1 - collapse);
  const C = NET.center;
  return { x: C.x + Math.cos(a + spin) * rx * k * s, y: C.y + Math.sin(a + spin) * ry * k * s };
}

/** Position du nœud du premier anneau qui reçoit un bloc du dossier. */
export function ring1ForBlock(blockKey: string, f: number) {
  const i = RING1.findIndex((n) => n.block === blockKey);
  if (i < 0) return null;
  return netPos(f, angle1(i), R1.rx, R1.ry);
}
