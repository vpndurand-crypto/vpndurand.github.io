// Musique et design sonore du film HEXA V6 « The Capital OS » (30 s), synthétisés de façon déterministe : aucun échantillon
// externe, aucune banque de sons sous licence. Mêmes instruments, même harmonie et même tempo que la V5 (scripts/score.mjs) ;
// l'arrangement suit le découpage de la V6 et ses repères (src/v6/timing.ts, mêmes images que le film) :
//   0–3 s tension · 3–11 s montée rythmique · 11–15 s élan · 15–23 s expansion (accent à l'ouverture des trois voies, 17 s)
//   · 23–26,5 s résolution · 26,5–30 s conclusion sur la marque, qui se résout à 30,0 s.
//
// Usage : node scripts/score-v6.mjs              → public/audio/v6-score.wav (48 kHz, stéréo, 30,000 s)
//         node scripts/score-v6.mjs --stems      → écrit aussi les pistes séparées dans out/audio-stems-v6/
//         node scripts/score-v6.mjs --sfx-only   → public/audio/v6-sfx.wav : le design sonore seul (version « sans musique »),
//                                                  au même niveau que dans la version complète (à lancer après la version complète)
//
// Tempo 120 BPM : un temps = 0,5 s = 15 images ; chaque changement de scène (3 · 7 · 11 · 15 · 17 · 20,5 · 23 · 26,5 s)
// tombe sur un temps.
import { build } from 'esbuild';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const withStems = process.argv.includes('--stems');
const sfxOnly = process.argv.includes('--sfx-only');
const FILM = { timing: 'src/v6/timing.ts', prefix: 'v6', levels: 'v6-score-levels.json', stems: 'out/audio-stems-v6' };

// ---------------------------------------------------------------------------
// Repères du film
// ---------------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'covenn-score-'));
await build({ entryPoints: [join(root, FILM.timing)], bundle: true, platform: 'node', format: 'esm', outfile: join(tmp, 'timing.mjs'), logLevel: 'error' });
const { CUES, FPS, DURATION } = await import(pathToFileURL(join(tmp, 'timing.mjs')).href);
rmSync(tmp, { recursive: true, force: true });

const SR = 48000;
const DUR = DURATION / FPS; // 30 s
const N = Math.round(SR * DUR);
const BEAT = 0.5; // 120 BPM
const S16 = BEAT / 4;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261016);
const noise = () => rand() * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const db = (d) => Math.pow(10, d / 20);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (x) => x * x * (3 - 2 * x);

class Bus {
  constructor(name) { this.name = name; this.L = new Float32Array(N); this.R = new Float32Array(N); }
  add(i, l, r) { if (i >= 0 && i < N) { this.L[i] += l; this.R[i] += r; } }
}
const pan2 = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)]; // loi à puissance constante

/** Filtre biquadratique (formules RBJ), coefficients recalculables à la volée. */
class Biquad {
  constructor() { this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0; this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; }
  set(type, fc, q = 0.707, gainDb = 0) {
    const w = TAU * clamp(fc, 10, SR * 0.45) / SR;
    const cw = Math.cos(w); const sw = Math.sin(w); const alpha = sw / (2 * q);
    let b0; let b1; let b2; let a0; let a1; let a2;
    if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
    else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
    else if (type === 'bp') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
    else { const A = Math.pow(10, gainDb / 40); b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

/** Dent de scie à bande limitée (polyBLEP). */
function polyBlep(t, dt) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}
class Saw {
  constructor(phase = 0) { this.ph = phase; }
  next(f) { const dt = f / SR; this.ph += dt; if (this.ph >= 1) this.ph -= 1; return 2 * this.ph - 1 - polyBlep(this.ph, dt); }
}
class Sine {
  constructor(phase = 0) { this.ph = phase; }
  next(f) { this.ph += f / SR; if (this.ph >= 1) this.ph -= 1; return Math.sin(TAU * this.ph); }
}

/** Enveloppe ADSR (secondes) ; `gate` = durée tenue avant relâchement. */
function adsr(t, a, d, s, r, gate) {
  if (t < 0) return 0;
  const sustainPart = (tt) => (tt < a ? tt / a : tt < a + d ? 1 - (1 - s) * smooth((tt - a) / d) : s);
  if (t < gate) return sustainPart(t);
  const v = sustainPart(gate);
  const rt = t - gate;
  return rt >= r ? 0 : v * (1 - rt / r) * (1 - rt / r);
}

// ---------------------------------------------------------------------------
// Pistes
// ---------------------------------------------------------------------------
const pad = new Bus('pad');
const keys = new Bus('arpeges');
const bass = new Bus('basse');
const drums = new Bus('batterie');
const fx = new Bus('effets');
const ui = new Bus('interface');
const sendHall = new Bus('envoi-hall');
const sendRoom = new Bus('envoi-piece');
const sendDelay = new Bus('envoi-echo');

// ---------------------------------------------------------------------------
// Harmonie : D mineur pour la tension, fa majeur pour la résolution
// ---------------------------------------------------------------------------
const CH = {
  tension: [50, 57, 64, 65, 69], // Dm(add9) serré : ré la mi fa la
  F9: [53, 60, 64, 67, 69], // Fmaj9
  CE: [52, 55, 60, 62, 67], // C(add9)/E
  Bb9: [46, 53, 57, 60, 62], // Bbmaj9
  Dm9: [50, 57, 60, 64, 65], // Dm9
  FA: [45, 53, 60, 64, 69], // Fmaj7/A
  C9: [48, 55, 62, 64, 67], // C(add9)
  Gm9: [43, 50, 53, 57, 58], // Gm9
  A7s: [45, 52, 55, 62, 64], // A7sus4
  C69: [48, 55, 57, 62, 64], // C6/9
  Ffinal: [41, 48, 57, 60, 65, 67, 69, 72], // fa majeur (add9), large
};
const ROOT = { tension: 38, F9: 41, CE: 40, Bb9: 34, Dm9: 38, FA: 33, C9: 36, Gm9: 31, A7s: 33, C69: 36, Ffinal: 29 };
const PROG = [
  [0, 3, 'tension'], // des sources éparses
  [3, 4, 'F9'], [4, 5, 'CE'], [5, 7, 'Bb9'], // une vue sur tout le groupe
  [7, 9, 'Dm9'], [9, 10, 'Gm9'], [10, 11, 'A7s'], // simuler : la marge devient critique à 8,5 s, suspension
  [11, 13, 'Bb9'], [13, 15, 'C9'], // préparer le financement : l'élan
  [15, 17, 'F9'], [17, 19, 'CE'], [19, 20.5, 'Bb9'], [20.5, 22, 'Dm9'], [22, 23, 'C69'], // la vision : l'expansion
  [23, 24.5, 'FA'], [24.5, 25.5, 'Bb9'], [25.5, 26.5, 'C69'], // comparer : la résolution
  [26.5, 30, 'Ffinal'], // la marque
];
/** Changements de scène (s) et temps laissés vides avant les grands impacts. */
const CUTS = [3, 7, 11, 15, 17, 20.5, 23, 26.5];
const GAPS = [14.5, 26];
const inGap = (t) => GAPS.some((g) => t >= g - 1e-6 && t < g + BEAT - 1e-6);
/** Expansion de la vision : 0 avant 15 s, puis jusqu'à 1 à 23 s (maintenu jusqu'à la marque). */
const rise = (t) => (t < 15 ? 0 : Math.min(1, (t - 15) / 8));
/** Fin du groove (la marque se pose sans batterie). */
const END = 26.5;
const chordAt = (t) => (PROG.find(([a, b]) => t >= a && t < b) ?? PROG[PROG.length - 1])[2];

/** Courbe par points [temps, valeur] (interpolation douce). */
const curve = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [t0, v0] = pts[i]; const [t1, v1] = pts[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
};

// Automations
const padLevel = curve([[0, -34], [2.9, -15], [3, -15], [3.6, -17.5], [7, -16.5], [7.2, -17.5], [10.9, -15.5], [11, -15], [14.4, -14], [15, -12], [17, -11.5], [23, -10.5], [26.4, -10], [26.55, -9], [30, -9]]);
const padCut = curve([[0, 380], [2.9, 2400], [3, 2800], [7, 2600], [7.2, 1500], [8.5, 1100], [10.9, 2200], [11, 2600], [14.4, 3000], [15, 3600], [23, 4400], [26.4, 4600], [26.55, 5200], [30, 3400]]);
const arpLevel = curve([[0, -60], [3, -60], [3.02, -24], [7, -22], [7.2, -23], [11, -20.5], [15, -19], [23, -16], [26.4, -15.5], [26.5, -80]]);

// ---------------------------------------------------------------------------
// Pad (nappe) : trois scies désaccordées par note et par côté, filtre passe-bas automatisé
// ---------------------------------------------------------------------------
function renderPad() {
  for (const [a, b, name] of PROG) {
    const notes = CH[name];
    const start = a;
    const gate = b - a + (name === 'Ffinal' ? 0 : 0.05);
    const release = name === 'Ffinal' ? 0.01 : 1.1;
    const attack = name === 'tension' ? 1.6 : a === 3 || a === 15 || a === 17 || a === 26.5 ? 0.03 : 0.45;
    for (const m of notes) {
      const f = hz(m);
      const voices = [-9, -2, 4, 10].map((cents, k) => ({ osc: new Saw(rand()), mul: Math.pow(2, cents / 1200), side: k % 2 === 0 ? -0.75 : 0.75 }));
      const lp = [new Biquad(), new Biquad()];
      const i0 = Math.round(start * SR);
      const len = Math.round((gate + release + (name === 'Ffinal' ? 0 : 0)) * SR);
      const end = name === 'Ffinal' ? N - i0 : len;
      for (let n = 0; n < end; n += 1) {
        const i = i0 + n;
        if (i >= N) break;
        const t = n / SR;
        const tt = start + t;
        if (n % 32 === 0) {
          const fc = padCut(tt) * (1 + 0.08 * Math.sin(TAU * 0.23 * tt + m)) * (m > 64 ? 1.15 : 1);
          lp[0].set('lp', fc, 0.8); lp[1].set('lp', fc, 0.8);
        }
        let env = adsr(t, attack, 0.6, 0.85, release, gate);
        if (name === 'Ffinal') env = 4 * (t < 0.02 ? t / 0.02 : 1) * (0.5 + 0.5 * Math.exp(-t / 1.2)) * Math.exp(-t / 6); // seule voix restante : tenue jusqu'à 30 s
        if (env <= 0) continue;
        let l = 0; let r = 0;
        for (const v of voices) {
          const s = v.osc.next(f * v.mul);
          const [gl, gr] = pan2(v.side);
          l += s * gl; r += s * gr;
        }
        const g = db(padLevel(tt)) * env * 0.16 / Math.sqrt(notes.length);
        const yl = lp[0].run(l) * g;
        const yr = lp[1].run(r) * g;
        pad.add(i, yl, yr);
        sendHall.add(i, yl * 0.55, yr * 0.55);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Arpèges (« pluck ») : notes du pad à l'octave supérieure, en doubles croches, écho pointé et hall
// ---------------------------------------------------------------------------
function pluck(t0, m, vel, pan, bright = 1) {
  const f = hz(m);
  const a = new Saw(rand()); const b = new Saw(rand()); const lp = new Biquad();
  const i0 = Math.round(t0 * SR);
  const len = Math.round(0.6 * SR);
  const [gl, gr] = pan2(pan);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    if (n % 16 === 0) lp.set('lp', 600 + 5200 * bright * Math.exp(-t / 0.09), 1.1);
    const env = (t < 0.003 ? t / 0.003 : 1) * Math.exp(-t / 0.2);
    const s = lp.run(0.6 * a.next(f) + 0.4 * b.next(f * 1.004)) * env * vel;
    keys.add(i, s * gl, s * gr);
    sendDelay.add(i, s * gl * 0.42, s * gr * 0.42);
    sendHall.add(i, s * gl * 0.28, s * gr * 0.28);
  }
}
const PATTERN = [0, 2, 1, 3, 2, 1, 3, 0];
function renderArps() {
  for (let t = 3; t < END - 1e-6; t += S16) {
    const step = Math.round((t - 3) / S16);
    // Croches pendant la simulation (7–11 s) et la comparaison (23–26,5 s) ; doubles croches ailleurs.
    if (((t >= 7 && t < 11) || t >= 23) && step % 2 === 1) continue;
    if (inGap(t)) continue;
    const name = chordAt(t);
    const upper = CH[name].slice(-4).map((m) => m + 12);
    let m = upper[PATTERN[step % PATTERN.length] % upper.length];
    if (t >= 11 && t < 15 && step % 8 >= 6) m += 12; // la demande se construit
    if (t >= 15 && t < 23 && step % 16 >= 12) m += 12; // l'ouverture des voies
    const accent = step % 4 === 0 ? 1 : 0.72;
    const lvl = db(arpLevel(t)) * accent * 0.5;
    const bright = t >= 15 && t < 23 ? 1.25 : t >= 7 && t < 11 ? 0.7 : 1;
    pluck(t, m, lvl, (step % 2 ? 0.35 : -0.35) * (t >= 15 && t < 23 ? 1.4 : 1), bright);
  }
}

// ---------------------------------------------------------------------------
// Halo (vision) : les notes hautes de la nappe à l'octave, qui montent doucement de 15 à 26,5 s
// ---------------------------------------------------------------------------
function renderShimmer() {
  for (const [a, b, name] of PROG) {
    if (a < 15 || a >= END) continue;
    const notes = CH[name].slice(-3).map((m) => m + 12);
    for (const m of notes) {
      const f = hz(m);
      const voices = [-6, 7].map((cents, k) => ({ osc: new Saw(rand()), mul: Math.pow(2, cents / 1200), side: k ? 0.8 : -0.8 }));
      const lp = new Biquad();
      const i0 = Math.round(a * SR);
      const len = Math.round((b - a + 0.9) * SR);
      for (let n = 0; n < len; n += 1) {
        const i = i0 + n; if (i >= N) break;
        const t = n / SR; const tt = a + t;
        if (n % 32 === 0) lp.set('lp', 2600 + 2400 * clamp((tt - 15) / 8, 0, 1), 0.7);
        const env = adsr(t, 0.35, 0.4, 0.9, 0.8, b - a);
        if (env <= 0) continue;
        const lvl = db(-31 + 11 * smooth(clamp((tt - 15) / 8, 0, 1))) * env * 0.16 / Math.sqrt(notes.length);
        let l = 0; let r = 0;
        for (const v of voices) { const x = v.osc.next(f * v.mul); const [gl, gr] = pan2(v.side); l += x * gl; r += x * gr; }
        const y = lp.run((l + r) * 0.5) * lvl;
        pad.add(i, y + l * lvl * 0.15, y + r * lvl * 0.15);
        sendHall.add(i, y * 0.7, y * 0.7);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Basse et batterie (compression latérale déterministe à partir des temps de grosse caisse)
// ---------------------------------------------------------------------------
const KICKS = [];
for (let t = 3; t < END - 1e-6; t += BEAT) {
  if (inGap(t)) continue; // un temps de silence avant la vision et avant la marque
  KICKS.push(t);
}
function duck(t, depth, rel = 0.14) {
  let last = -1;
  for (let k = KICKS.length - 1; k >= 0; k -= 1) { if (KICKS[k] <= t) { last = KICKS[k]; break; } }
  if (last < 0) return 1;
  return 1 - depth * Math.exp(-(t - last) / rel);
}

function kick(t0, vel) {
  const osc = new Sine(0); const hp = new Biquad().set('hp', 1800, 0.7);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.5 * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const f = 46 + 120 * Math.exp(-t / 0.032);
    const body = osc.next(f) * Math.exp(-t / 0.3) * (t < 0.002 ? t / 0.002 : 1);
    const click = hp.run(noise()) * Math.exp(-t / 0.004) * 0.25;
    const s = Math.tanh((body + click) * 1.6) * vel * 0.5;
    drums.add(i, s, s);
  }
}
function hat(t0, vel, open, pan) {
  const hp = new Biquad().set('hp', 7600, 0.8); const pk = new Biquad().set('peak', 10500, 1.2, 5);
  const i0 = Math.round(t0 * SR); const len = Math.round((open ? 0.28 : 0.09) * SR);
  const [gl, gr] = pan2(pan);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const env = Math.exp(-t / (open ? 0.11 : 0.028));
    const s = pk.run(hp.run(noise())) * env * vel * 0.18;
    drums.add(i, s * gl, s * gr);
    sendRoom.add(i, s * gl * 0.2, s * gr * 0.2);
  }
}
function clap(t0, vel) {
  const bp = new Biquad().set('bp', 1450, 1.1); const hp = new Biquad().set('hp', 600, 0.7);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.35 * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const bursts = [0, 0.009, 0.018].reduce((acc, o) => acc + (t >= o ? Math.exp(-(t - o) / (o === 0.018 ? 0.09 : 0.006)) : 0), 0);
    const s = hp.run(bp.run(noise())) * bursts * vel * 0.32;
    drums.add(i, s * 0.95, s);
    sendHall.add(i, s * 0.35, s * 0.35);
  }
}
function shaker(t0, vel, pan) {
  const bp = new Biquad().set('bp', 6200, 1.4);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.09 * SR);
  const [gl, gr] = pan2(pan);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const env = (t < 0.012 ? t / 0.012 : 1) * Math.exp(-Math.max(0, t - 0.012) / 0.035);
    const s = bp.run(noise()) * env * vel * 0.16;
    drums.add(i, s * gl, s * gr);
  }
}
function renderDrums() {
  for (const t of KICKS) kick(t, t < 7 ? 0.74 + 0.06 * (t - 3) / 4 : t < 11 ? 0.86 : t < 15 ? 0.95 : t < 23 ? 1 + 0.1 * rise(t) : 0.9);
  // Tic-tac des sources éparses (0,25 → 3 s), de plus en plus présent : la tension
  for (let t = 0.25; t < 2.95; t += S16) hat(t, 0.15 + 0.5 * ((t - 0.25) / 2.7) ** 1.5, false, Math.sin(t * 7) * 0.4);
  // Shaker quand la vue groupe se découvre
  for (let t = 3; t < 5 - 1e-6; t += S16) shaker(t, Math.round((t - 3) / S16) % 2 === 0 ? 0.9 : 0.55, Math.round((t - 3) / S16) % 2 ? 0.3 : -0.3);
  // Charleston ouvert sur les contretemps ; fermé en doubles croches à partir de la demande (l'élan)
  for (let t = 3; t < END - 1e-6; t += BEAT) {
    if (inGap(t)) continue;
    hat(t + BEAT / 2, 0.72 + 0.18 * rise(t), true, 0.25);
  }
  for (let t = 7; t < 11 - 1e-6; t += S16) if (Math.round((t - 7) / S16) % 4 === 3) hat(t, 0.3, false, -0.25);
  for (let t = 11; t < END - 1e-6; t += S16) {
    if (inGap(t) || Math.round((t - 11) / S16) % 2 === 0) continue;
    hat(t, t < 15 ? 0.34 : t < 23 ? 0.38 + 0.12 * rise(t) : 0.32, false, -0.3);
  }
  // Claquements sur les temps 2 et 4, à partir de 5 s
  for (let bar = 5; bar < END; bar += 2) {
    for (const t of [bar + 0.5, bar + 1.5]) if (!inGap(t - BEAT) && !inGap(t) && t < END) clap(t, (t === bar + 0.5 ? 0.8 : 0.85) * (1 + 0.15 * rise(t)));
  }
}
function renderBass() {
  for (let t = 3; t < END - 1e-6; t += BEAT / 2) {
    const name = chordAt(t);
    if (inGap(t)) continue;
    const step = Math.round((t - 3) / (BEAT / 2));
    const m = ROOT[name] + (step % 4 === 3 ? 12 : 0);
    const f = hz(m);
    const s1 = new Sine(0); const s2 = new Saw(rand()); const lp = new Biquad().set('lp', 420, 0.9);
    const i0 = Math.round(t * SR); const len = Math.round(0.26 * SR);
    for (let n = 0; n < len; n += 1) {
      const i = i0 + n; if (i >= N) break;
      const tt = n / SR;
      const env = adsr(tt, 0.004, 0.12, 0.7, 0.03, 0.2);
      const x = (s1.next(f) * 0.8 + lp.run(s2.next(f)) * 0.45) * env;
      const s = Math.tanh(x * 1.4) * 0.3 * duck(t + tt, 0.75, 0.12) * (t >= 15 && t < 23 ? 1.1 : 1);
      bass.add(i, s, s);
    }
  }
  const tie = (t0, t1, m, lvl) => {
    const s1 = new Sine(0); const i0 = Math.round(t0 * SR); const len = Math.round((t1 - t0) * SR);
    for (let n = 0; n < len; n += 1) {
      const i = i0 + n; if (i >= N) break;
      const tt = n / SR;
      const env = Math.min(1, tt / 0.02) * Math.min(1, (t1 - t0 - tt) / 0.15);
      const s = s1.next(hz(m)) * env * lvl;
      bass.add(i, s, s);
    }
  };
  // Tenue grave sous la marge critique (8,5 → 9,5 s)
  tie(8.5, 9.5, ROOT.Dm9, 0.16);
}

// ---------------------------------------------------------------------------
// Design sonore (repères de l'image)
// ---------------------------------------------------------------------------
const PENTA = [0, 2, 4, 7, 9]; // fa majeur pentatonique : fa sol la do ré
const degreeToMidi = (d, base = 77) => base + 12 * Math.floor(d / 5) + PENTA[((d % 5) + 5) % 5];

function tick(t0, g, pitch, pan) {
  const f = hz(degreeToMidi(pitch ?? 0));
  const o = new Sine(rand()); const o2 = new Sine(rand()); const hp = new Biquad().set('hp', 3000, 0.7);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.25 * SR);
  const [gl, gr] = pan2(pan ?? 0);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const env = (t < 0.002 ? t / 0.002 : 1) * Math.exp(-t / 0.055);
    const s = (o.next(f) * 0.8 + o2.next(f * 2.01) * 0.15 * Math.exp(-t / 0.02)) * env + hp.run(noise()) * Math.exp(-t / 0.0025) * 0.25;
    const v = s * g * 0.35;
    ui.add(i, v * gl, v * gr);
    sendHall.add(i, v * gl * 0.35, v * gr * 0.35);
    sendDelay.add(i, v * gl * 0.18, v * gr * 0.18);
  }
}
function lock(t0, g, pitch, pan) {
  const ping = hz(degreeToMidi((pitch ?? 0) + 2, 72));
  const thump = new Sine(0); const tri = new Sine(rand()); const bp = new Biquad().set('bp', 2600, 2);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.4 * SR);
  const [gl, gr] = pan2(pan ?? 0);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const low = thump.next(150 * Math.exp(-t / 0.08) + 70) * Math.exp(-t / 0.06) * 0.7;
    const click = bp.run(noise()) * Math.exp(-t / 0.004) * 0.9;
    const tone = tri.next(ping) * Math.exp(-t / 0.13) * 0.32 * (t < 0.003 ? t / 0.003 : 1);
    const v = (low + click + tone) * g * 0.45;
    ui.add(i, v * gl, v * gr);
    sendRoom.add(i, v * gl * 0.3, v * gr * 0.3);
    sendHall.add(i, tone * g * 0.12 * gl, tone * g * 0.12 * gr);
  }
}
function swallow(t0, g) {
  const o = new Sine(0); const lp = new Biquad().set('lp', 900, 0.7);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.18 * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const s = (o.next(260 * Math.exp(-t / 0.07) + 90) * 0.7 + lp.run(noise()) * 0.25) * Math.sin(Math.PI * Math.min(1, t / 0.18)) * g * 0.35;
    ui.add(i, s, s);
  }
}
function whoosh(t0, g, pan, dur = 0.6) {
  const bp1 = new Biquad(); const bp2 = new Biquad();
  const i0 = Math.round((t0 - dur * 0.55) * SR); const len = Math.round(dur * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i < 0 || i >= N) continue;
    const x = n / len;
    if (n % 32 === 0) { const fc = 350 * Math.pow(12, Math.sin(Math.PI * x * 0.9)); bp1.set('bp', fc, 0.9); bp2.set('bp', fc * 1.06, 0.9); }
    const env = Math.pow(Math.sin(Math.PI * x), 1.6);
    const p = clamp((pan ?? 0) * (x * 2 - 1), -1, 1);
    const [gl, gr] = pan2(p);
    const v = env * g * 0.5;
    fx.add(i, bp1.run(noise()) * v * gl, bp2.run(noise()) * v * gr);
    sendHall.add(i, bp1.y1 * v * 0.2, bp2.y1 * v * 0.2);
  }
}
function riser(tEnd, g, dur = 1.2) {
  const bp = new Biquad(); const saw = new Saw(0); const lp = new Biquad();
  const root = hz(ROOT[chordAt(tEnd - 0.01)] + 36);
  const i0 = Math.round((tEnd - dur) * SR); const len = Math.round(dur * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i < 0 || i >= N) continue;
    const x = n / len;
    if (n % 32 === 0) { bp.set('bp', 500 * Math.pow(16, x), 1.4); lp.set('lp', 800 + 5000 * x * x, 0.9); }
    const env = Math.pow(x, 2.2) * (1 - Math.pow(Math.max(0, x - 0.96) / 0.04, 2));
    const tone = lp.run(saw.next(root * Math.pow(2, x))) * (sfxOnly ? 0 : 0.22);
    const s = (bp.run(noise()) * 0.7 + tone) * env * g * 0.45;
    const w = Math.sin(x * TAU * 2) * 0.3;
    fx.add(i, s * (1 - w), s * (1 + w));
    sendHall.add(i, s * 0.3, s * 0.3);
  }
}
/** Accord rendu puis inversé : il « aspire » vers l'impact. */
function reverse(tEnd, g, dur = 1.1) {
  if (sfxOnly) return;
  const len = Math.round(dur * SR);
  const L = new Float32Array(len); const R = new Float32Array(len);
  const notes = CH.F9.map((m) => m + 12);
  const lp = new Biquad().set('lp', 3800, 0.7);
  const oscs = notes.map(() => new Saw(rand()));
  for (let n = 0; n < len; n += 1) {
    const t = n / SR;
    let s = 0;
    oscs.forEach((o, k) => { s += o.next(hz(notes[k])); });
    const env = Math.exp(-t / 0.35) * (t < 0.002 ? t / 0.002 : 1);
    const v = lp.run(s / notes.length) * env;
    L[n] = v; R[n] = v * 0.92 + noise() * 0.002;
  }
  // un court halo (réverbération à peigne) avant inversion
  const dl = Math.round(0.031 * SR); const dr = Math.round(0.031 * 1.13 * SR);
  for (let n = dl; n < len; n += 1) L[n] += L[n - dl] * 0.55;
  for (let n = dr; n < len; n += 1) R[n] += R[n - dr] * 0.55;
  const i0 = Math.round((tEnd - dur) * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i < 0 || i >= N) continue;
    const x = n / len;
    const env = Math.pow(x, 1.8) * (x > 0.97 ? (1 - x) / 0.03 : 1);
    fx.add(i, L[len - 1 - n] * env * g * 0.5, R[len - 1 - n] * env * g * 0.5);
  }
}
function hit(t0, g, final = false) {
  // Sous-grave qui tombe, souffle bref, accord frappé (l'accord du moment), queue dans le hall
  const name = final ? 'Ffinal' : chordAt(t0 + 0.01);
  const sub = new Sine(0); const lp = new Biquad().set('lp', 2400, 0.7);
  const oscs = CH[name].map((m) => [new Saw(rand()), new Saw(rand()), m + (final ? 12 : 12)]);
  const flt = [new Biquad(), new Biquad()];
  const i0 = Math.round(t0 * SR); const len = Math.round((final ? DUR - t0 : 2.2) * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const subV = sub.next(34 + 60 * Math.exp(-t / 0.25)) * Math.exp(-t / (final ? 1.1 : 0.75)) * (t < 0.003 ? t / 0.003 : 1) * 0.55;
    const air = lp.run(noise()) * Math.exp(-t / 0.18) * 0.22;
    if (n % 32 === 0) { const fc = 900 + 5200 * Math.exp(-t / (final ? 0.6 : 0.3)); flt[0].set('lp', fc, 0.8); flt[1].set('lp', fc * 1.03, 0.8); }
    let l = 0; let r = 0;
    for (const [a, b, m] of oscs) { l += a.next(hz(m) * 0.997); r += b.next(hz(m) * 1.003); }
    const stabEnv = Math.exp(-t / (final ? 1.25 : 0.55)) * (t < 0.004 ? t / 0.004 : 1);
    const k = sfxOnly ? 0 : (final ? 0.11 : 0.08) / Math.sqrt(oscs.length);
    const sl = flt[0].run(l) * stabEnv * k; const sr = flt[1].run(r) * stabEnv * k;
    const vL = (subV + air + sl) * g; const vR = (subV + air + sr) * g;
    fx.add(i, vL, vR);
    sendHall.add(i, (sl + air * 0.5) * g * 0.9, (sr + air * 0.5) * g * 0.9);
  }
}
function tension(t0, g) {
  // Franchissement du seuil (projection) : coup sourd et seconde mineure qui frotte, sans dramatiser
  const tom = new Sine(0); const a = new Sine(rand()); const b = new Sine(rand());
  const i0 = Math.round(t0 * SR); const len = Math.round(1.6 * SR);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const low = tom.next(70 + 50 * Math.exp(-t / 0.06)) * Math.exp(-t / 0.32) * 0.7;
    const rub = (a.next(hz(69)) + b.next(hz(70))) * Math.exp(-t / 0.7) * 0.12 * (t < 0.01 ? t / 0.01 : 1);
    const v = (low + rub) * g * 0.6;
    fx.add(i, v, v * 0.96);
    sendHall.add(i, rub * g * 0.6, rub * g * 0.6);
  }
}
/** Cloche FM (porteuse 1, modulante 3,5) : signature du dossier complet et note finale. */
function bell(t0, m, g, decay = 1.6, pan = 0) {
  const f = hz(m);
  let cph = 0; let mph = 0;
  const i0 = Math.round(t0 * SR); const len = Math.round(Math.min(decay * 3, DUR - t0) * SR);
  const [gl, gr] = pan2(pan);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    cph += f / SR; if (cph >= 1) cph -= 1;
    mph += (f * 3.5) / SR; if (mph >= 1) mph -= 1;
    const index = 2.2 * Math.exp(-t / 0.4);
    const s = Math.sin(TAU * cph + index * Math.sin(TAU * mph)) * Math.exp(-t / decay) * (t < 0.002 ? t / 0.002 : 1);
    const v = s * g * 0.28;
    ui.add(i, v * gl, v * gr);
    sendHall.add(i, v * gl * 0.8, v * gr * 0.8);
    sendDelay.add(i, v * gl * 0.25, v * gr * 0.25);
  }
}
function chime(t0, g) {
  [77, 81, 84, 89].forEach((m, k) => bell(t0 + k * 0.06, m, g * (1 - k * 0.12), 1.1, -0.4 + k * 0.27));
}
/** Carte qui se pose : un « pop » rond et court (sinus qui se cale sur sa note), sans clic. */
function card(t0, g, pitch, pan) {
  const f = hz(degreeToMidi(pitch ?? 0, 72));
  const o = new Sine(rand()); const o2 = new Sine(rand());
  const i0 = Math.round(t0 * SR); const len = Math.round(0.22 * SR);
  const [gl, gr] = pan2(pan ?? 0);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const glide = 1 - 0.06 * Math.exp(-t / 0.012);
    const env = (t < 0.004 ? t / 0.004 : 1) * Math.exp(-t / 0.07);
    const v = (o.next(f * glide) * 0.75 + o2.next(f * 2 * glide) * 0.12 * Math.exp(-t / 0.03)) * env * g * 0.3;
    ui.add(i, v * gl, v * gr);
    sendHall.add(i, v * gl * 0.25, v * gr * 0.25);
  }
}
/** Information validée : deux notes brèves qui montent d'une quinte, douces. */
function confirm(t0, g) {
  [[0, 77], [0.07, 84]].forEach(([dt, m]) => {
    const f = hz(m); const o = new Sine(rand());
    const i0 = Math.round((t0 + dt) * SR); const len = Math.round(0.3 * SR);
    for (let n = 0; n < len; n += 1) {
      const i = i0 + n; if (i >= N) break;
      const t = n / SR;
      const env = (t < 0.003 ? t / 0.003 : 1) * Math.exp(-t / 0.12);
      const v = (o.next(f) + 0.2 * Math.sin(TAU * f * 3 * t) * Math.exp(-t / 0.03)) * env * g * 0.22;
      ui.add(i, v, v);
      sendHall.add(i, v * 0.35, v * 0.35);
      sendDelay.add(i, v * 0.12, v * 0.12);
    }
  });
}
/** Connexion de données : un glissé ascendant bref, une liaison qui s'établit. */
function connect(t0, g, pitch, pan) {
  const f1 = hz(degreeToMidi(pitch ?? 0, 72)); const f0 = f1 / 2;
  let ph = rand(); const hp = new Biquad().set('hp', 5000, 0.7);
  const i0 = Math.round(t0 * SR); const len = Math.round(0.28 * SR);
  const [gl, gr] = pan2(pan ?? 0);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const t = n / SR;
    const f = f0 * Math.pow(f1 / f0, smooth(Math.min(1, t / 0.11)));
    ph += f / SR; if (ph >= 1) ph -= 1;
    const env = Math.sin(Math.PI * Math.min(1, t / 0.28)) ** 1.5;
    const v = (Math.sin(TAU * ph) * 0.8 + hp.run(noise()) * 0.08) * env * g * 0.28;
    ui.add(i, v * gl, v * gr);
    sendHall.add(i, v * gl * 0.3, v * gr * 0.3);
    sendDelay.add(i, v * gl * 0.15, v * gr * 0.15);
  }
}
/** Le ratio varie : une tenue filtrée qui monte jusqu'au franchissement du seuil. */
function sweep(t0, g, dur = 0.8) {
  const i0 = Math.round(t0 * SR); const len = Math.round(dur * SR);
  const bp = new Biquad(); const o = new Sine(rand());
  const f0 = hz(65); const f1 = hz(72);
  for (let n = 0; n < len; n += 1) {
    const i = i0 + n; if (i >= N) break;
    const x = n / len;
    if (n % 32 === 0) bp.set('bp', 600 + 2600 * x * x, 2.2);
    const env = Math.pow(x, 1.4) * (x > 0.94 ? (1 - x) / 0.06 : 1);
    const v = (o.next(f0 * Math.pow(f1 / f0, x)) * 0.5 + bp.run(noise()) * 0.6) * env * g * 0.25;
    fx.add(i, v, v * 0.95);
    sendHall.add(i, v * 0.25, v * 0.25);
  }
}

function renderCues() {
  for (const c of CUES) {
    const t = c.frame / FPS;
    const g = c.gain ?? 0.5;
    switch (c.kind) {
      case 'tick': tick(t, g, c.pitch, c.pan); break;
      case 'lock': lock(t, g, c.pitch, c.pan); break;
      case 'swallow': swallow(t, g); break;
      case 'whoosh': whoosh(t, g, c.pan); break;
      case 'riser': riser(nextHit(t), g, nextHit(t) - t); break;
      case 'reverse': reverse(nextHit(t), g, nextHit(t) - t); break;
      case 'hit': hit(t, g, Math.abs(t - END) < 0.01); break;
      case 'tension': tension(t, g); break;
      case 'chime': chime(t, g); break;
      case 'card': card(t, g, c.pitch, c.pan); break;
      case 'confirm': confirm(t, g); break;
      case 'connect': connect(t, g, c.pitch, c.pan); break;
      case 'sweep': sweep(t, g, c.dur ?? 0.8); break;
      case 'bell': bell(t, 77, g, 1.4); bell(t + 0.004, 89, g * 0.35, 0.9); break;
      default: throw new Error(`Repère inconnu : ${c.kind}`);
    }
  }
}
/** Une montée se termine sur l'impact (ou le changement de séquence) qui la suit. */
function nextHit(t) {
  const hits = CUES.filter((c) => c.kind === 'hit').map((c) => c.frame / FPS).filter((x) => x > t + 0.2).sort((a, b) => a - b);
  const sceneCuts = CUTS.filter((x) => x > t + 0.2);
  return Math.min(hits[0] ?? DUR, sceneCuts[0] ?? DUR);
}

// ---------------------------------------------------------------------------
// Effets de bus : réverbération (réseau de retards rétroactifs), écho ping-pong
// ---------------------------------------------------------------------------
function fdnReverb(send, rt60, damping, predelay, width = 1) {
  const outL = new Float32Array(N); const outR = new Float32Array(N);
  const base = [1559, 1747, 1913, 2111, 2297, 2477, 2663, 2851];
  const lens = base.map((x) => Math.round(x * (SR / 44100)));
  const lines = lens.map((l) => ({ buf: new Float32Array(l), idx: 0, lp: 0, g: Math.pow(10, (-3 * l) / (SR * rt60)) }));
  const ap = [[142, 0.7], [107, 0.7], [379, 0.65], [277, 0.65]].map(([l, g]) => ({ buf: new Float32Array(Math.round(l * SR / 44100)), idx: 0, g }));
  const pre = Math.round(predelay * SR);
  const h = 1 / Math.sqrt(8);
  const v = new Float32Array(8); const w = new Float32Array(8);
  for (let n = 0; n < N; n += 1) {
    const j = n - pre;
    let x = j >= 0 ? (send.L[j] + send.R[j]) * 0.5 : 0;
    for (const a of ap) { const y = a.buf[a.idx]; const o = -a.g * x + y; a.buf[a.idx] = x + a.g * o; a.idx = (a.idx + 1) % a.buf.length; x = o; }
    for (let k = 0; k < 8; k += 1) {
      const L = lines[k]; const y = L.buf[L.idx];
      L.lp = y * (1 - damping) + L.lp * damping;
      v[k] = L.lp * L.g;
    }
    // Hadamard 8 × 8 (rapide)
    for (let k = 0; k < 8; k += 1) w[k] = v[k];
    for (let s = 1; s < 8; s <<= 1) for (let k = 0; k < 8; k += s << 1) for (let m = k; m < k + s; m += 1) { const a = w[m]; const b = w[m + s]; w[m] = a + b; w[m + s] = a - b; }
    for (let k = 0; k < 8; k += 1) {
      const L = lines[k];
      L.buf[L.idx] = w[k] * h + x * (k % 2 ? -0.35 : 0.35);
      L.idx = (L.idx + 1) % L.buf.length;
    }
    const l = v[0] + v[2] + v[4] + v[6]; const r = v[1] + v[3] + v[5] + v[7];
    const mid = (l + r) * 0.5; const side = (l - r) * 0.5 * width;
    outL[n] = (mid + side) * 0.5; outR[n] = (mid - side) * 0.5;
  }
  return { L: outL, R: outR };
}
function pingPong(send, time, fb, tone) {
  const d = Math.round(time * SR);
  const bl = new Float32Array(d); const br = new Float32Array(d);
  let idx = 0; let lpl = 0; let lpr = 0;
  const outL = new Float32Array(N); const outR = new Float32Array(N);
  for (let n = 0; n < N; n += 1) {
    const yl = bl[idx]; const yr = br[idx];
    lpl = yl * (1 - tone) + lpl * tone; lpr = yr * (1 - tone) + lpr * tone;
    const inMono = (send.L[n] + send.R[n]) * 0.5;
    bl[idx] = inMono + lpr * fb; br[idx] = lpl * fb;
    idx = (idx + 1) % d;
    outL[n] = yl; outR[n] = yr;
  }
  return { L: outL, R: outR };
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
const t0 = Date.now();
renderPad();
renderArps();
renderShimmer();
renderBass();
renderDrums();
if (sfxOnly) for (const b of [pad, keys, bass, drums, fx, ui, sendHall, sendRoom, sendDelay]) { b.L.fill(0); b.R.fill(0); }
renderCues();

// L'écho alimente un peu le hall.
const echo = pingPong(sendDelay, 0.375, 0.36, 0.45);
for (let n = 0; n < N; n += 1) { sendHall.L[n] += echo.L[n] * 0.25; sendHall.R[n] += echo.R[n] * 0.25; }
const hall = fdnReverb(sendHall, 3.1, 0.42, 0.024, 1.1);
const room = fdnReverb(sendRoom, 0.8, 0.3, 0.008, 0.8);

// Compression latérale des nappes et arpèges sous la grosse caisse
const master = new Bus('master');
for (let n = 0; n < N; n += 1) {
  const t = n / SR;
  const dPad = duck(t, 0.32, 0.16); const dKeys = duck(t, 0.22, 0.12);
  master.L[n] = pad.L[n] * dPad + keys.L[n] * dKeys + bass.L[n] + drums.L[n] + fx.L[n] + ui.L[n] + hall.L[n] * 0.55 * dPad + room.L[n] * 0.4 + echo.L[n] * 0.32 * dKeys;
  master.R[n] = pad.R[n] * dPad + keys.R[n] * dKeys + bass.R[n] + drums.R[n] + fx.R[n] + ui.R[n] + hall.R[n] * 0.55 * dPad + room.R[n] * 0.4 + echo.R[n] * 0.32 * dKeys;
}
for (let n = 0; n < N; n += 1) if (!Number.isFinite(master.L[n]) || !Number.isFinite(master.R[n])) throw new Error(`Échantillon invalide à ${(n / SR).toFixed(3)} s`);
// Coupe-bas de sécurité (DC et infra-graves), extinction finale douce jusqu'à 30,000 s
const hpL = new Biquad().set('hp', 24, 0.7); const hpR = new Biquad().set('hp', 24, 0.7);
for (let n = 0; n < N; n += 1) {
  const t = n / SR;
  // Pas d'extinction prématurée : l'accord final sonne jusqu'au bout, seule la dernière fraction de seconde se referme.
  const fade = t < 29.6 ? 1 : Math.cos(Math.PI / 2 * clamp((t - 29.6) / (DUR - 29.6), 0, 1));
  const fadeIn = Math.min(1, t / 0.01);
  master.L[n] = hpL.run(master.L[n]) * fade * fadeIn;
  master.R[n] = hpR.run(master.R[n]) * fade * fadeIn;
}
// Normalisation de crête à −3 dBFS avant le traitement de sonie
let peak = 0;
for (let n = 0; n < N; n += 1) peak = Math.max(peak, Math.abs(master.L[n]), Math.abs(master.R[n]));
const levelsFile = join(root, 'public/audio', FILM.levels);
const norm = sfxOnly ? JSON.parse(readFileSync(levelsFile, 'utf8')).norm : db(-3) / (peak || 1);
for (let n = 0; n < N; n += 1) { master.L[n] *= norm; master.R[n] *= norm; }

function writeWav(path, bus, gain = 1) {
  const data = Buffer.alloc(N * 2 * 3);
  for (let n = 0; n < N; n += 1) {
    for (let c = 0; c < 2; c += 1) {
      const v = clamp((c === 0 ? bus.L[n] : bus.R[n]) * gain, -1, 1);
      const x = Math.round(v * 8388607);
      data.writeIntLE(x, (n * 2 + c) * 3, 3);
    }
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 2 * 3, 28); header.writeUInt16LE(6, 32); header.writeUInt16LE(24, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

const outDir = join(root, 'public/audio');
mkdirSync(outDir, { recursive: true });
const raw = join(root, 'out', sfxOnly ? `${FILM.prefix}-sfx-raw.wav` : `${FILM.prefix}-score-raw.wav`);
mkdirSync(join(root, 'out'), { recursive: true });
writeWav(raw, master);
if (withStems && !sfxOnly) {
  const stemDir = join(root, FILM.stems);
  mkdirSync(stemDir, { recursive: true });
  for (const b of [pad, keys, bass, drums, fx, ui]) writeWav(join(stemDir, `${b.name}.wav`), b, norm);
  writeWav(join(stemDir, 'reverberation.wav'), { L: hall.L.map((x, n) => x * 0.55 + room.L[n] * 0.4), R: hall.R.map((x, n) => x * 0.55 + room.R[n] * 0.4) }, norm);
}

// Sonie : gain linéaire vers −16 LUFS intégrés, puis limiteur doux (crête ≤ −2 dBFS) ; durée exacte conservée.
const loudness = (file) => {
  const txt = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const summary = txt.slice(txt.lastIndexOf('Summary:'));
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
  return { I, TP };
};
const before = loudness(raw);
const gainDb = sfxOnly ? JSON.parse(readFileSync(levelsFile, 'utf8')).gainDb : -16 - before.I;
if (!sfxOnly) writeFileSync(levelsFile, `${JSON.stringify({ norm, gainDb }, null, 2)}\n`);
const final = join(outDir, sfxOnly ? `${FILM.prefix}-sfx.wav` : `${FILM.prefix}-score.wav`);
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af',
  `volume=${gainDb.toFixed(2)}dB,alimiter=limit=0.79:attack=4:release=80:level=false,atrim=end_sample=${N},apad=whole_len=${N}`,
  '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s24le', final]);
const after = loudness(final);
const m = { input_i: before.I, input_tp: before.TP, output_i: after.I, output_tp: after.TP };
console.log(`${sfxOnly ? 'Design sonore seul rendu' : 'Musique rendue'} en ${((Date.now() - t0) / 1000).toFixed(1)} s → ${final}`);
console.log(`Sonie : ${m.input_i} → ${m.output_i} LUFS intégrés ; crête vraie ${m.input_tp} → ${m.output_tp} dBTP ; ${CUES.length} repères sonores.`);
