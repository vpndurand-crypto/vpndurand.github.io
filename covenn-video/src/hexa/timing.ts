/**
 * Conducteur du film « vision » (30 i/s, 900 images). Une seule source de vérité pour l'image et le son :
 * scripts/score.mjs lit ces repères pour caler la musique et le design sonore.
 */
export const FPS = 30;
export const DURATION = 900;

/** Bornes des neuf séquences (images). */
export const SCENES = {
  chaos: [0, 90],
  ingest: [90, 180],
  cockpit: [180, 300],
  covenant: [300, 390],
  timeline: [390, 480],
  simulation: [480, 600],
  dossier: [600, 720],
  network: [720, 810],
  signature: [810, 900],
} as const;

/** Textes à l'écran : un message par séquence. */
export const CAPTIONS = {
  chaos: { in: 8, out: 74 },
  ingest: { in: 96, out: 172 },
  cockpit: { in: 190, out: 292 },
  covenant: { in: 302, out: 384 },
  timeline: { in: 394, out: 474 },
  simulation: { in: 484, out: 588 },
  dossier: { in: 604, out: 708 },
  networkA: { in: 720, out: 758 },
  networkB: { in: 762, out: 804 },
} as const;

/**
 * Repères sonores (images), calés sur les événements de l'image. `kind` choisit le son ; `gain` dose l'accent ; `pitch` est un degré de la gamme.
 * tick : donnée qui apparaît · lock : élément qui s'emboîte · whoosh : mouvement de caméra · hit : impact musical ·
 * tension : franchissement du seuil (projection) · riser / reverse : montées vers un impact · chime : dossier complet · bell : note finale.
 */
export type CueKind = 'whoosh' | 'tick' | 'lock' | 'hit' | 'tension' | 'riser' | 'reverse' | 'chime' | 'bell' | 'swallow';
export interface Cue { frame: number; kind: CueKind; gain?: number; pitch?: number; pan?: number }

const series = (frames: readonly number[], kind: CueKind, gain: number, pitch0 = 0, step = 1): Cue[] =>
  frames.map((frame, i) => ({ frame, kind, gain, pitch: pitch0 + i * step, pan: ((i % 5) - 2) * 0.22 }));

export const CUES: Cue[] = [
  // S1 — les documents s'accumulent de plus en plus vite (début nerveux), puis convergent
  ...series([9, 16, 22, 27, 31, 35, 39], 'tick', 0.14, 0, 0),
  { frame: 66, kind: 'reverse', gain: 0.85 },
  { frame: 90, kind: 'hit', gain: 0.7 },
  // S2 — les fichiers entrent dans Covenn ; chaque information extraite se pose
  ...series([114, 124, 134, 144], 'swallow', 0.26, 0, 0),
  ...series([107, 113, 119, 125, 131], 'tick', 0.45, 7, 1),
  { frame: 150, kind: 'riser', gain: 0.55 },
  { frame: 164, kind: 'whoosh', gain: 0.5, pan: -0.2 },
  { frame: 180, kind: 'hit', gain: 0.6 },
  // S3 — consolidation : les financements se fondent dans l'encours total, dézoom, groupe → pays → filiale → retour
  { frame: 186, kind: 'lock', gain: 0.55, pitch: 2 },
  { frame: 198, kind: 'whoosh', gain: 0.45, pan: 0.3 },
  { frame: 222, kind: 'whoosh', gain: 0.3, pan: -0.3 },
  { frame: 234, kind: 'whoosh', gain: 0.28, pan: -0.1 },
  { frame: 240, kind: 'tick', gain: 0.34, pitch: 11 },
  { frame: 258, kind: 'whoosh', gain: 0.4, pan: 0.3 },
  { frame: 276, kind: 'tick', gain: 0.3, pitch: 9 },
  { frame: 284, kind: 'whoosh', gain: 0.4, pan: 0.5 },
  // S4 — covenant : la tuile s'ouvre, la preuve remonte de la clause au seuil
  { frame: 300, kind: 'lock', gain: 0.5 },
  { frame: 310, kind: 'tick', gain: 0.28, pitch: 7 },
  { frame: 324, kind: 'whoosh', gain: 0.2, pan: 0.6 },
  { frame: 366, kind: 'lock', gain: 0.42 },
  { frame: 374, kind: 'whoosh', gain: 0.4, pan: -0.5 },
  // S5 — chronologie : la tête de lecture révèle les échéances ; la marche de seuil est mise en avant
  ...series([411, 418, 436], 'tick', 0.38, 7, 2),
  { frame: 448, kind: 'tick', gain: 0.46, pitch: 3 },
  { frame: 456, kind: 'riser', gain: 0.75 },
  { frame: 478, kind: 'whoosh', gain: 0.75, pan: 0.8 },
  // S6 — simulation : impact à l'arrivée, décision, recalcul, franchissement du seuil (accent marqué), appel au financement
  { frame: 480, kind: 'hit', gain: 0.9 },
  { frame: 504, kind: 'tick', gain: 0.42, pitch: 9 },
  { frame: 512, kind: 'whoosh', gain: 0.18, pan: 0.4 },
  { frame: 540, kind: 'tension', gain: 1 },
  { frame: 572, kind: 'tick', gain: 0.4, pitch: 12 },
  { frame: 586, kind: 'whoosh', gain: 0.45, pan: 0 },
  // S7 — dossier : six blocs s'emboîtent, le dossier est constitué
  ...series([604, 614, 624, 634, 644, 654], 'lock', 0.4, 0, 1),
  { frame: 658, kind: 'chime', gain: 0.55 },
  { frame: 688, kind: 'whoosh', gain: 0.5, pan: 0 },
  // S8 — vision : trois orbites (dette → haut de bilan → financement), « De la décision au financement. »
  ...series([706, 724, 744], 'tick', 0.3, 7, 3),
  { frame: 765, kind: 'hit', gain: 0.6 },
  { frame: 780, kind: 'riser', gain: 0.9 },
  // S9 — signature : la marque se pose sur l'impact final, puis une note qui s'éteint
  { frame: 810, kind: 'hit', gain: 1 },
  { frame: 822, kind: 'bell', gain: 0.6 },
];
