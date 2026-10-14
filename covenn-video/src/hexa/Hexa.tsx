import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { useFontsReady } from '../film/fonts';
import { DOC_CSS } from '../film/parts/Windows';
import { Captions } from './Captions';
import { Mention } from './Mention';
import { Access } from './scenes/Access';
import { CapitalStructure, packageTransform } from './scenes/CapitalStructure';
import { Chaos } from './scenes/Chaos';
import { Cockpit, NavPill } from './scenes/Cockpit';
import { Covenant, S4 } from './scenes/Covenant';
import { Dossier } from './scenes/Dossier';
import { INGEST, Ingest } from './scenes/Ingest';
import { Signature } from './scenes/Signature';
import { Simulation } from './scenes/Simulation';
import { Timeline, heroTarget } from './scenes/Timeline';
import { warp } from './timing';

const HERO_TARGET = heroTarget();

/** Le film tourne sur ses propres images : aucune transition CSS de la bêta ne doit s'exécuter en temps réel. */
const FILM_CSS = `
*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent; }
`;

/** Calque plein cadre : chaque séquence a son propre contexte d'empilement. */
function Layer({ z, children }: { z: number; children: ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: z }}>{children}</div>;
}

/** Fond vivant : trois halos aux couleurs de l'aurore Covenn, très légers, qui dérivent lentement. */
function Ambient({ f }: { f: number }) {
  const t = f / 30;
  const o = 1 - Math.min(1, Math.max(0, (f - 806) / 20));
  const blob = (x: number, y: number, r: number, color: string) => `radial-gradient(${r}px ${r * 0.75}px at ${x}px ${y}px, ${color} 0%, rgba(255,255,255,0) 70%)`;
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: o,
      background: [
        blob(1650 + 60 * Math.sin(t * 0.21), 120 + 40 * Math.cos(t * 0.17), 1100, 'rgba(245, 185, 194, 0.20)'),
        blob(160 + 50 * Math.cos(t * 0.19), 980 + 30 * Math.sin(t * 0.23), 1200, 'rgba(157, 186, 230, 0.16)'),
        blob(1500 + 70 * Math.cos(t * 0.15), 1040 + 30 * Math.sin(t * 0.2), 900, 'rgba(198, 146, 182, 0.12)'),
      ].join(', '),
    }} />
  );
}

const BACKGROUND = 'radial-gradient(1500px 1000px at 20% 6%, #FFFFFF 0%, rgba(255,255,255,0) 64%), var(--canvas)';

/**
 * COVENN — HEXA V5 (anglais) : 30 s, 10 séquences. Les séquences 2 à 7 reprennent les animations de la V4 sur leur
 * propre horloge (`warp` : image V5 → image V4) ; les séquences 1, 8, 9 et 10 sont écrites directement en images V5.
 */
export function Hexa() {
  const f = useCurrentFrame();
  const w = warp(f);
  const fontsReady = useFontsReady();
  if (!fontsReady) return <AbsoluteFill style={{ background: 'var(--canvas)' }} />;
  const pkg = packageTransform(f);
  return (
    <AbsoluteFill style={{ background: BACKGROUND, overflow: 'hidden', lineHeight: 1.2 }}>
      <style>{FILM_CSS + DOC_CSS}</style>
      <Layer z={0}><Ambient f={f} /></Layer>
      <Layer z={1}><Chaos f={f} /></Layer>
      <Layer z={2}><CapitalStructure f={f} /></Layer>
      <Layer z={3}><Cockpit f={w} hideTotal={w < INGEST.land} hideCovenantValue={w >= S4.morph[0]} /></Layer>
      <Layer z={4}><Ingest f={w} /></Layer>
      <Layer z={5}><Covenant f={w} timelineTarget={HERO_TARGET} /></Layer>
      <Layer z={6}><Timeline f={w} /></Layer>
      <Layer z={7}>
        {pkg.opacity > 0.001 && (
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 602px', transform: pkg.transform, opacity: pkg.opacity }}><Dossier f={w} /></div>
        )}
      </Layer>
      <Layer z={8}><Simulation f={w} /></Layer>
      <Layer z={9}><Access f={f} /></Layer>
      <Layer z={10}><Signature f={f} /></Layer>
      <Layer z={100}><Captions f={f} /></Layer>
      <Layer z={105}><NavPill f={w} /></Layer>
      <Layer z={110}><Mention f={f} /></Layer>
      {/* Musique et design sonore : scripts/score.mjs (mêmes repères que l'image, src/hexa/timing.ts) */}
      <Audio src={staticFile('audio/covenn-vision-score.wav')} />
    </AbsoluteFill>
  );
}
