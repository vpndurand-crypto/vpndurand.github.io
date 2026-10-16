/**
 * Conducteur du film Capital OS (anglais, 30 i/s, 900 images) : le montage de la V5 (src/hexa/timing.ts), mêmes séquences,
 * mêmes textes, mêmes temps ; seuls changent les repères de la scène 7 (huit pièces du dossier de la bêta au lieu de six
 * sections) et les mentions. Une seule source de vérité pour l'image et le son : scripts/score.mjs --film capos lit ces repères.
 */
export const FPS = 30;
export const DURATION = 900;

/** Bornes des dix séquences (images). */
export const SCENES = {
  problem: [0, 75], // 0:00–0:02.5  Debt is fragmented. Financing is disconnected.
  enter: [75, 150], // 0:02.5–0:05  Covenn turns complexity into clarity.
  view: [150, 255], // 0:05–0:08.5  One view. Across your entire group.
  control: [255, 330], // 0:08.5–0:11  Every covenant. Backed by its source.
  anticipate: [330, 405], // 0:11–0:13.5  Anticipate. Don’t react.
  simulate: [405, 510], // 0:13.5–0:17  Simulate tomorrow. Decide today.
  prepare: [510, 615], // 0:17–0:20.5  Prepare your next financing.
  beyond: [615, 705], // 0:20.5–0:23.5  Debt is just the starting point. / Capital structure is our ambition.
  access: [705, 810], // 0:23.5–0:27  From managing capital to accessing it.
  reveal: [810, 900], // 0:27–0:30  Covenn — The operating system for corporate capital. Starting with debt.
} as const;

/** Textes à l'écran : un message majeur par séquence. */
export const CAPTIONS = {
  problemA: { in: 4, out: 70 },
  problemB: { in: 16, out: 70 },
  enter: { in: 80, out: 146 },
  view: { in: 156, out: 250 },
  control: { in: 258, out: 326 },
  anticipate: { in: 334, out: 401 },
  simulate: { in: 410, out: 506 },
  prepare: { in: 515, out: 608 },
  beyondA: { in: 620, out: 662 },
  beyondB: { in: 664, out: 702 },
  access: { in: 712, out: 800 },
} as const;

/** Mentions (bas gauche) : démonstration interactive (données fictives), calcul réel du moteur (S4), vision (S9). */
export const MENTIONS = {
  product: [80, 704] as const,
  beta: [258, 330] as const,
  vision: [704, 806] as const,
} as const;

// ---------------------------------------------------------------------------
// Temps des séquences reprises de la V4
// ---------------------------------------------------------------------------
/**
 * Les séquences 2 à 7 reprennent les animations de la V4, écrites en images V4. `warp` donne, pour une image V5,
 * l'image V4 correspondante : correspondance linéaire par morceaux, calée sur les changements de séquence et sur
 * le franchissement du seuil (15,5 s, sur un temps de la musique). Les séquences 1, 8, 9 et 10 sont écrites en images V5.
 */
const KNOTS: readonly (readonly [number, number])[] = [
  [70, 84], // naissance de la marque Covenn
  [75, 90], // S2
  [150, 180], // S3
  [255, 300], // S4
  [330, 390], // S5
  [405, 480], // S6
  [465, 540], // franchissement du seuil
  [510, 600], // S7
  [615, 720], // S8
];

function piecewise(x: number, from: 0 | 1, to: 0 | 1): number {
  const first = KNOTS[0];
  const second = KNOTS[1];
  const last = KNOTS[KNOTS.length - 1];
  const before = KNOTS[KNOTS.length - 2];
  if (!first || !second || !last || !before) return x;
  if (x <= first[from]) return first[to] + (x - first[from]) * ((second[to] - first[to]) / (second[from] - first[from]));
  for (let i = 0; i < KNOTS.length - 1; i += 1) {
    const a = KNOTS[i];
    const b = KNOTS[i + 1];
    if (a && b && x <= b[from]) return a[to] + ((x - a[from]) / (b[from] - a[from])) * (b[to] - a[to]);
  }
  return last[to] + (x - last[from]);
}

/** Image V5 → image V4 (pour les séquences reprises). */
export const warp = (f: number): number => piecewise(f, 0, 1);
/** Image V4 → image V5 (repères sonores des séquences reprises). */
export const unwarp = (f4: number): number => piecewise(f4, 1, 0);

// ---------------------------------------------------------------------------
// Repères sonores
// ---------------------------------------------------------------------------
/**
 * Repères sonores (images V5), calés sur les événements de l'image. `kind` choisit le son ; `gain` dose l'accent ; `pitch` est un degré de la gamme.
 * tick : donnée qui apparaît · card : carte qui se pose · lock : élément qui s'emboîte · confirm : information validée ·
 * connect : connexion de données · sweep : le ratio varie · whoosh : mouvement de caméra · hit : impact musical ·
 * tension : franchissement du seuil (projection) · riser / reverse : montées vers un impact · chime : dossier complet · bell : note finale.
 */
export type CueKind = 'whoosh' | 'tick' | 'card' | 'lock' | 'confirm' | 'connect' | 'sweep' | 'hit' | 'tension' | 'riser' | 'reverse' | 'chime' | 'bell' | 'swallow';
export interface Cue { frame: number; kind: CueKind; gain?: number; pitch?: number; pan?: number; dur?: number }

const series = (frames: readonly number[], kind: CueKind, gain: number, pitch0 = 0, step = 1): Cue[] =>
  frames.map((frame, i) => ({ frame, kind, gain, pitch: pitch0 + i * step, pan: ((i % 5) - 2) * 0.22 }));
const u = unwarp;

/** Arrivées des documents (S1), par rafales : la complexité s'accumule. */
export const BURSTS = [[-10, -6, -2], [10, 13, 16], [24, 26, 28, 30], [34, 36, 38, 40, 42]] as const;
/** S7 : le scénario se replie dans la demande de financement, puis les huit pièces de la liste de préparation se posent en croches. */
export const SCENARIO_LAND = 513.5;
export const CHECK_LOCKS = [521, 528.5, 536, 543.5, 551, 558.5, 566, 573.5] as const;
/** Pièce qui reste « Needs review » dans la bêta (use-of-proceeds summary) : son plus discret. */
export const REVIEW_INDEX = 6;
export const PACKAGE_DONE = 577;

export const CUES: Cue[] = [
  // S1 — les documents arrivent par rafales, puis convergent
  ...series(BURSTS.slice(1).flat().filter((_, i) => i % 2 === 0), 'tick', 0.16, 0, 0),
  { frame: 50, kind: 'reverse', gain: 0.85 },
  { frame: 75, kind: 'hit', gain: 0.75 },
  // S2 — les fichiers entrent dans Covenn ; chaque information extraite se pose
  ...series([114, 124, 134, 144].map(u), 'swallow', 0.26, 0, 0),
  ...series([107, 113, 119, 125].map(u), 'tick', 0.45, 7, 1),
  { frame: u(140), kind: 'confirm', gain: 0.32 },
  { frame: u(150), kind: 'riser', gain: 0.5 },
  { frame: u(164), kind: 'whoosh', gain: 0.45, pan: -0.2 },
  { frame: 150, kind: 'hit', gain: 0.6 },
  // S3 — consolidation : les financements se fondent dans l'encours total, dézoom, groupe → pays → filiale → retour
  { frame: u(186), kind: 'lock', gain: 0.55, pitch: 2 },
  { frame: u(198), kind: 'whoosh', gain: 0.45, pan: 0.3 },
  ...series([u(202), u(206), u(210)], 'card', 0.26, 4, 1),
  { frame: u(222), kind: 'whoosh', gain: 0.3, pan: -0.3 },
  { frame: u(234), kind: 'whoosh', gain: 0.28, pan: -0.1 },
  { frame: u(240), kind: 'tick', gain: 0.34, pitch: 11 },
  { frame: u(258), kind: 'whoosh', gain: 0.4, pan: 0.3 },
  { frame: u(284), kind: 'whoosh', gain: 0.4, pan: 0.5 },
  // S4 — covenant : la tuile s'ouvre, la preuve remonte de la clause au seuil
  { frame: u(300), kind: 'lock', gain: 0.5 },
  { frame: u(310), kind: 'tick', gain: 0.28, pitch: 7 },
  { frame: u(324), kind: 'whoosh', gain: 0.2, pan: 0.6 },
  { frame: u(344), kind: 'connect', gain: 0.32, pitch: 4 },
  { frame: u(366), kind: 'confirm', gain: 0.4 },
  { frame: u(374), kind: 'whoosh', gain: 0.4, pan: -0.5 },
  // S5 — chronologie : la tête de lecture avance ; le point d'attention est détecté avant l'échéance
  ...series([411, 418, 436].map(u), 'tick', 0.38, 7, 2),
  { frame: u(448), kind: 'tick', gain: 0.46, pitch: 3 },
  { frame: u(456), kind: 'riser', gain: 0.65 },
  { frame: u(478), kind: 'whoosh', gain: 0.75, pan: 0.8 },
  // S6 — simulation : décision, recalcul (le ratio monte), franchissement du seuil, appel au financement
  { frame: 405, kind: 'hit', gain: 0.85 },
  { frame: u(504), kind: 'tick', gain: 0.42, pitch: 9 },
  { frame: u(512), kind: 'whoosh', gain: 0.18, pan: 0.4 },
  { frame: u(516), kind: 'sweep', gain: 0.4, dur: (465 - u(516)) / FPS },
  { frame: 465, kind: 'tension', gain: 1 },
  { frame: u(572), kind: 'tick', gain: 0.4, pitch: 12 },
  { frame: u(586), kind: 'whoosh', gain: 0.45, pan: 0 },
  // S7 — demande de financement : le scénario s'y range, les pièces se posent en cascade, la préparation atteint 7/8
  { frame: SCENARIO_LAND, kind: 'lock', gain: 0.4, pitch: 0, pan: 0.3 },
  ...CHECK_LOCKS.map((frame, i): Cue => (i === REVIEW_INDEX
    ? { frame, kind: 'tick', gain: 0.3, pitch: 2, pan: ((i % 5) - 2) * 0.22 }
    : { frame, kind: 'lock', gain: 0.36, pitch: 1 + i, pan: ((i % 5) - 2) * 0.22 })),
  { frame: PACKAGE_DONE, kind: 'chime', gain: 0.55 },
  { frame: 600, kind: 'whoosh', gain: 0.5, pan: 0 },
  // S8 — au-delà de la dette : la caméra recule, la structure du capital apparaît (page Capital overview de la bêta)
  { frame: 615, kind: 'hit', gain: 0.8 },
  ...series([640, 650, 656], 'card', 0.3, 5, 1),
  ...series([654, 659, 664], 'tick', 0.22, 9, 1),
  { frame: 670, kind: 'confirm', gain: 0.3 },
  { frame: 696, kind: 'whoosh', gain: 0.5, pan: -0.4 },
  // S9 — accès au capital : les connexions se construisent des données vers les financeurs
  { frame: 705, kind: 'hit', gain: 0.7 },
  ...series([724, 729, 734], 'connect', 0.3, 2, 2),
  ...series([744, 752, 760], 'connect', 0.38, 7, 2),
  ...series([748, 756, 764], 'card', 0.24, 11, 1),
  { frame: 782, kind: 'riser', gain: 0.9 },
  // S10 — la marque se pose sur l'impact final, puis une note qui s'éteint
  { frame: 810, kind: 'hit', gain: 1 },
  { frame: 822, kind: 'bell', gain: 0.6 },
];
