import '../capos/beta.css';
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, getStaticFiles, staticFile, useCurrentFrame } from 'remotion';
import { useFontsReady } from '../film/fonts';
import { Captions } from './Captions';
import { Mention } from './Mention';
import { EndCard, AURORA } from './scenes/EndCard';
import { FalconCard } from './scenes/FalconCard';
import { Fragments } from './scenes/Fragments';
import { Network, NetworkBackdrop } from './scenes/Network';
import { ComparePage, OverviewPage, RequestPage, SELECTED_AT, ScenarioPage } from './scenes/Pages';
import { AppWindow, toFrame, windowCam } from './Window';

/** Le film tourne sur ses propres images : aucune transition CSS de la bêta ne doit s'exécuter en temps réel. */
const FILM_CSS = `
.capos *, .capos *::before, .capos *::after { transition: none !important; animation: none !important; caret-color: transparent; }
`;

function Layer({ z, children }: { z: number; children: ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: z }}>{children}</div>;
}

/** Fond vivant : trois halos aux teintes de la bêta, très légers, qui dérivent lentement. */
function Ambient({ f }: { f: number }) {
  const t = f / 30;
  const o = 1 - Math.min(1, Math.max(0, (f - 790) / 20));
  const blob = (x: number, y: number, r: number, color: string) => `radial-gradient(${r}px ${r * 0.75}px at ${x}px ${y}px, ${color} 0%, rgba(255,255,255,0) 70%)`;
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: o,
      background: [
        blob(1650 + 60 * Math.sin(t * 0.21), 120 + 40 * Math.cos(t * 0.17), 1100, 'rgba(143, 128, 220, 0.16)'),
        blob(160 + 50 * Math.cos(t * 0.19), 980 + 30 * Math.sin(t * 0.23), 1200, 'rgba(86, 121, 179, 0.12)'),
        blob(1500 + 70 * Math.cos(t * 0.15), 1040 + 30 * Math.sin(t * 0.2), 900, 'rgba(180, 90, 134, 0.08)'),
      ].join(', '),
    }} />
  );
}

const BACKGROUND = 'radial-gradient(1500px 1000px at 20% 6%, #FFFFFF 0%, rgba(255,255,255,0) 64%), var(--paper)';
const SCORE = 'audio/v6-score.wav';
/** Origine de l'aurore finale : le badge « Selected for negotiation », à l'image où elle s'ouvre. */
const AURORA_FROM = toFrame(windowCam(AURORA[0]), SELECTED_AT.x, SELECTED_AT.y);

/**
 * COVENN — The Capital OS, film HEXA V6 (anglais, 30 s) : un seul fil, le financement de l'acquisition Project Falcon,
 * sur la bêta « Capital operating system » (ses écrans, ses classes CSS, ses libellés, les valeurs de son moteur).
 * 0–3 s sources éparses · 3–7 s vue groupe · 7–11 s scénario · 11–15 s demande de financement · 15–23 s vision du réseau
 * de capital (capacité future, illustration) · 23–26,5 s comparaison des conditions indicatives · 26,5–30 s la marque.
 */
export function HexaV6() {
  const f = useCurrentFrame();
  const fontsReady = useFontsReady();
  if (!fontsReady) return <AbsoluteFill className="capos" style={{ background: 'var(--paper)' }} />;
  const hasScore = getStaticFiles().some((s) => s.name === SCORE);
  return (
    <AbsoluteFill className="capos" style={{ background: BACKGROUND, overflow: 'hidden', lineHeight: 1.2, height: '100%' }}>
      <style>{FILM_CSS}</style>
      <Layer z={0}><Ambient f={f} /></Layer>
      <Layer z={1}><Fragments f={f} /></Layer>
      <Layer z={2}>
        <AppWindow f={f}>
          <OverviewPage f={f} />
          <ScenarioPage f={f} />
          <RequestPage f={f} />
          <ComparePage f={f} />
        </AppWindow>
      </Layer>
      <Layer z={3}><NetworkBackdrop f={f} /></Layer>
      <Layer z={4}><FalconCard f={f} /></Layer>
      <Layer z={5}><Network f={f} /></Layer>
      <Layer z={6}><EndCard f={f} from={AURORA_FROM} /></Layer>
      <Layer z={100}><Captions f={f} /></Layer>
      <Layer z={110}><Mention f={f} /></Layer>
      {/* Musique et design sonore : scripts/score-v6.mjs (mêmes repères que l'image, src/v6/timing.ts) */}
      {hasScore && <Audio src={staticFile(SCORE)} />}
    </AbsoluteFill>
  );
}
