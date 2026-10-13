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
  cockpit: { in: 186, out: 292 },
  covenant: { in: 302, out: 384 },
  timeline: { in: 394, out: 474 },
  simulation: { in: 486, out: 592 },
  dossier: { in: 606, out: 712 },
  networkA: { in: 726, out: 763 },
  networkB: { in: 765, out: 808 },
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
  // S1 — les documents s'accumulent (apparitions de plus en plus serrées), puis convergent
  ...series([9, 13, 16, 19, 22, 25, 27, 29, 31, 33, 35, 37, 39], 'tick', 0.16, 0, 0),
  { frame: 66, kind: 'reverse', gain: 0.85 },
  { frame: 90, kind: 'hit', gain: 0.7 },
  // S2 — les fichiers entrent dans Covenn ; chaque information extraite se pose ; le registre se remplit
  ...series([114, 119, 124, 129, 134, 139, 144], 'swallow', 0.32, 0, 0),
  ...series([107, 113, 119, 125, 131], 'tick', 0.5, 7, 1),
  ...series([145, 148, 151, 154, 157, 160, 163], 'tick', 0.18, 9, 0),
  { frame: 150, kind: 'riser', gain: 0.55 },
  { frame: 164, kind: 'whoosh', gain: 0.55, pan: -0.2 },
  { frame: 180, kind: 'hit', gain: 0.6 },
  { frame: 188, kind: 'lock', gain: 0.45 },
  // S3 — cockpit : groupe → pays → filiale → retour
  { frame: 214, kind: 'whoosh', gain: 0.32, pan: -0.4 },
  { frame: 232, kind: 'whoosh', gain: 0.28, pan: -0.2 },
  { frame: 244, kind: 'tick', gain: 0.42, pitch: 11 },
  { frame: 250, kind: 'whoosh', gain: 0.42, pan: 0.3 },
  { frame: 276, kind: 'tick', gain: 0.38, pitch: 9 },
  { frame: 284, kind: 'whoosh', gain: 0.4, pan: 0.5 },
  // S4 — covenant : la tuile s'ouvre, la preuve remonte de la clause au seuil
  { frame: 300, kind: 'lock', gain: 0.5 },
  { frame: 310, kind: 'tick', gain: 0.3, pitch: 7 },
  { frame: 324, kind: 'whoosh', gain: 0.22, pan: 0.6 },
  { frame: 366, kind: 'lock', gain: 0.45 },
  { frame: 374, kind: 'whoosh', gain: 0.4, pan: -0.5 },
  // S5 — chronologie : la tête de lecture révèle les échéances ; la marche de seuil est mise en avant
  ...series([411, 418, 436], 'tick', 0.42, 7, 2),
  { frame: 448, kind: 'tick', gain: 0.5, pitch: 3 },
  { frame: 456, kind: 'riser', gain: 0.75 },
  { frame: 470, kind: 'whoosh', gain: 0.75, pan: 0.8 },
  // S6 — simulation : impact à l'arrivée, puis franchissement du seuil (projection)
  { frame: 480, kind: 'hit', gain: 0.9 },
  { frame: 498, kind: 'tick', gain: 0.4, pitch: 9 },
  { frame: 504, kind: 'tick', gain: 0.22, pitch: 11 },
  { frame: 513, kind: 'tick', gain: 0.22, pitch: 12 },
  { frame: 546, kind: 'tension', gain: 0.75 },
  { frame: 584, kind: 'whoosh', gain: 0.45, pan: 0 },
  // S7 — dossier : six blocs s'emboîtent, le dossier est structuré
  ...series([606, 616, 626, 636, 646, 656], 'lock', 0.42, 0, 1),
  { frame: 664, kind: 'chime', gain: 0.55 },
  { frame: 690, kind: 'whoosh', gain: 0.5, pan: 0 },
  // S8 — réseau : la vision s'étend ; « Le futur du haut de bilan. »
  ...series([716, 724, 733, 741, 752, 760], 'tick', 0.2, 7, 2),
  { frame: 765, kind: 'hit', gain: 0.6 },
  { frame: 780, kind: 'riser', gain: 0.9 },
  // S9 — signature : impact final, puis une note qui s'éteint
  { frame: 810, kind: 'hit', gain: 1 },
  { frame: 830, kind: 'bell', gain: 0.6 },
];
