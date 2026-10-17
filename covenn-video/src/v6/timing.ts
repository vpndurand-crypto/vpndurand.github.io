/**
 * Conducteur du film V6 « The Capital OS » (anglais, 30 i/s, 900 images) : sept scènes autour d'un seul fil,
 * le financement de l'acquisition Project Falcon. Une seule source de vérité pour l'image et le son :
 * scripts/score-v6.mjs lit ces repères pour caler la musique et le design sonore.
 */
export const FPS = 30;
export const DURATION = 900;

/** Bornes des sept scènes (images). Tous les changements tombent sur un temps de la musique (120 BPM). */
export const SCENES = {
  fragments: [0, 90], // 0:00–0:03   Debt is fragmented. Financing is disconnected.
  overview: [90, 210], // 0:03–0:07  One view. Across your entire group.
  scenario: [210, 330], // 0:07–0:11  Simulate tomorrow. Decide today.
  request: [330, 450], // 0:11–0:15   Prepare your next financing.
  network: [450, 690], // 0:15–0:23   From managing capital to accessing it.
  compare: [690, 795], // 0:23–0:26.5 Compare terms. Choose with confidence.
  brand: [795, 900], // 0:26.5–0:30   Covenn — The operating system for global corporate capital. — Starting with debt.
} as const;

/** Les trois temps de la séquence du réseau : la demande entre dans Covenn, trois voies s'ouvrent, elles s'affinent. */
export const NETWORK = { a: 450, b: 510, c: 615, end: 690 } as const;

/** Textes à l'écran : un message par scène, avec de l'air. */
export const CAPTIONS = {
  problemA: { in: 6, out: 64 },
  problemB: { in: 20, out: 64 },
  overview: { in: 96, out: 202 },
  scenario: { in: 216, out: 314 },
  request: { in: 328, out: 440 },
  network: { in: 458, out: 668 },
  networkSub: { in: 530, out: 668 },
  compare: { in: 696, out: 786 },
} as const;

/** Mentions (haut droite) : état de la feuille de route de la bêta (« In this demo ») et nature des données montrées.
 *  La vision (S5) porte ses propres mentions (« FUTURE VISION », note de bas de page). */
export const MENTIONS = {
  overview: [96, 206] as const,
  scenario: [214, 316] as const,
  request: [326, 446] as const,
  terms: [692, 790] as const,
} as const;

// ---------------------------------------------------------------------------
// Événements de l'image (partagés avec la musique : 120 BPM, un temps = 15 images, une croche = 7,5)
// ---------------------------------------------------------------------------
/** S1 : arrivée des quatre fragments, signal violet sur chacun, alignement, compression dans l'encours. */
export const FRAGMENT_IN = [0, 4, 8, 12] as const;
export const SIGNAL = [48.75, 52.5, 56.25, 60] as const;
export const ALIGN = [62, 77] as const;
export const COMPRESS = [77, 90] as const;
/** S2 : recul de la caméra, puis les pays (et leurs sociétés) qui s'additionnent dans l'encours, puis les prêteurs. */
export const PULLBACK = [104, 138] as const;
export const COUNTRY_HI = [150, 157.5, 165] as const;
export const PROVIDER_SWEEP = [172.5, 187.5] as const;
/** S2 → S3 : « Explore a funding scenario », puis la page du scénario. */
export const NAV = { press: 198, swap: [202, 218] as const } as const;
/** S3 : saisie des hypothèses, recalcul, marge critique à l'horizon, besoin de financement, demande créée. */
export const S3 = { typing: [218, 238] as const, roll: [240, 254] as const, critical: 255, need: 285, press: 300, lift: [302, 330] as const } as const;
/** S4 : les sept pièces disponibles ou reliées se posent en croches ; la pièce à relire ; le dossier peut être généré. */
export const DOCKS = [337.5, 345, 352.5, 360, 367.5, 375, 382.5] as const;
export const REVIEW = 386.25;
export const PREPARED = 405;
/** S5 : paquets de données vers Covenn, puis les trois voies, puis leurs structures. */
export const PACKETS = [480, 487.5, 495, 502.5] as const;
export const PATHWAYS = [517.5, 532.5, 547.5] as const;
export const STRUCTURES = [622.5, 630, 637.5] as const;
export const MATCHES = [645, 652.5, 660] as const;
export const CONVERGE = [660, 692] as const;
/** S6 : les trois propositions, la comparaison ligne par ligne, une proposition retenue pour négociation. */
export const OFFERS_LAND = [690, 693.75, 697.5] as const;
export const COMPARE_ROWS = [712.5, 727.5, 742.5] as const;
export const SELECT = 765;
/** S7 : la marque se pose sur l'impact final. */
export const BRAND_LAND = 795;

// ---------------------------------------------------------------------------
// Repères sonores
// ---------------------------------------------------------------------------
/**
 * tick : donnée qui apparaît · card : carte qui se pose · lock : pièce qui s'emboîte · confirm : information validée ·
 * connect : connexion de données · sweep : le ratio varie · whoosh : mouvement de caméra · hit : impact musical ·
 * tension : marge critique (projection) · riser / reverse : montées vers un impact · chime : demande prête · bell : note finale.
 */
export type CueKind = 'whoosh' | 'tick' | 'card' | 'lock' | 'confirm' | 'connect' | 'sweep' | 'hit' | 'tension' | 'riser' | 'reverse' | 'chime' | 'bell' | 'swallow';
export interface Cue { frame: number; kind: CueKind; gain?: number; pitch?: number; pan?: number; dur?: number }

const series = (frames: readonly number[], kind: CueKind, gain: number, pitch0 = 0, step = 1): Cue[] =>
  frames.map((frame, i) => ({ frame, kind, gain, pitch: pitch0 + i * step, pan: ((i % 5) - 2) * 0.22 }));

export const CUES: Cue[] = [
  // S1 — quatre sources isolées ; un signal violet les relie ; elles se rangent et se fondent dans l'encours
  ...series(FRAGMENT_IN.slice(1), 'tick', 0.18, 0, 2),
  ...series(SIGNAL, 'connect', 0.24, 2, 1),
  { frame: 62, kind: 'reverse', gain: 0.8 },
  { frame: 84, kind: 'swallow', gain: 0.3 },
  { frame: SCENES.overview[0], kind: 'hit', gain: 0.7 },
  // S2 — la vue groupe se découvre ; pays, prêteurs, total
  { frame: PULLBACK[0] + 2, kind: 'whoosh', gain: 0.32, pan: 0.2 },
  ...series([114, 118, 122, 126, 130], 'card', 0.22, 4, 1),
  ...series(COUNTRY_HI, 'tick', 0.3, 7, 2),
  ...series(COUNTRY_HI.map((f) => f + 8), 'connect', 0.2, 9, 2),
  { frame: PROVIDER_SWEEP[0], kind: 'sweep', gain: 0.22, dur: (PROVIDER_SWEEP[1] - PROVIDER_SWEEP[0]) / FPS },
  { frame: 190, kind: 'confirm', gain: 0.26 },
  { frame: NAV.press, kind: 'tick', gain: 0.3, pitch: 9 },
  // S3 — le scénario : saisie, recalcul, marge critique, besoin de financement
  { frame: SCENES.scenario[0], kind: 'hit', gain: 0.42 },
  ...series([223, 228, 233, 238], 'tick', 0.18, 5, 1),
  { frame: S3.roll[0], kind: 'sweep', gain: 0.38, dur: (S3.critical - S3.roll[0]) / FPS },
  { frame: S3.critical, kind: 'tension', gain: 0.75 },
  { frame: S3.need, kind: 'tick', gain: 0.32, pitch: 11 },
  { frame: S3.press, kind: 'lock', gain: 0.34, pitch: 4 },
  { frame: S3.lift[0] + 4, kind: 'whoosh', gain: 0.3, pan: -0.2 },
  // S4 — la demande se construit à partir des données de Covenn
  { frame: SCENES.request[0], kind: 'card', gain: 0.34, pitch: 5 },
  ...series(DOCKS, 'lock', 0.34, 0, 1),
  { frame: REVIEW, kind: 'tick', gain: 0.18, pitch: 2 },
  { frame: PREPARED, kind: 'chime', gain: 0.5 },
  { frame: 432, kind: 'riser', gain: 0.7 },
  // S5 — la vision : la demande entre dans Covenn, trois voies vers le capital s'ouvrent
  { frame: NETWORK.a, kind: 'hit', gain: 1 },
  ...series(PACKETS, 'connect', 0.26, 2, 1),
  { frame: NETWORK.b - 18, kind: 'reverse', gain: 0.55 },
  { frame: NETWORK.b, kind: 'hit', gain: 0.8 },
  ...series(PATHWAYS.map((f) => f - 3.75), 'connect', 0.3, 5, 2),
  ...series(PATHWAYS, 'card', 0.36, 7, 2),
  { frame: 570, kind: 'confirm', gain: 0.28 },
  { frame: NETWORK.c, kind: 'hit', gain: 0.55 },
  ...series(STRUCTURES, 'tick', 0.26, 7, 2),
  ...series(MATCHES, 'connect', 0.22, 9, 1),
  { frame: 664, kind: 'riser', gain: 0.6 },
  { frame: CONVERGE[0] + 16, kind: 'whoosh', gain: 0.42, pan: -0.3 },
  // S6 — les conditions indicatives se comparent ; une proposition est retenue pour négociation
  { frame: SCENES.compare[0], kind: 'hit', gain: 0.5 },
  ...series(OFFERS_LAND, 'card', 0.28, 5, 2),
  ...series(COMPARE_ROWS, 'tick', 0.3, 6, 2),
  { frame: SELECT, kind: 'confirm', gain: 0.36 },
  { frame: 780, kind: 'reverse', gain: 0.7 },
  // S7 — la marque se pose sur l'impact final, puis une note qui s'éteint
  { frame: BRAND_LAND, kind: 'hit', gain: 1 },
  { frame: 807.5, kind: 'bell', gain: 0.6 },
];
