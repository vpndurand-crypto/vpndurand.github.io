/**
 * Textes du film V6 : un message par scène. S1 et S5 au centre ; S2, S3, S4 et S6 en haut à gauche, alignés sur la
 * fenêtre de l'application. Les mots montent d'un masque (Punch, repris du film Capital OS).
 */
import { E, life, p } from '../film/anim';
import { Punch } from '../capos/Captions';
import { CAPTIONS, NETWORK } from './timing';
import { windowCam } from './Window';

const TOP = { x: 160, y: 58, size: 62 } as const;

/** Voile clair en haut de l'image, quand l'interface zoomée passe sous le texte. */
function WideVeil({ o, height = 220 }: { o: number; height?: number }) {
  if (o <= 0.001) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height, opacity: o, background: 'linear-gradient(180deg, rgba(245,245,248,0.97) 0%, rgba(245,245,248,0.9) 55%, rgba(245,245,248,0) 100%)' }} />;
}

export function Captions({ f }: { f: number }) {
  const c = CAPTIONS;
  const k = f >= 90 && f < 140 ? windowCam(f).k : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* S1 : au centre, entre les fragments */}
      {f < c.problemB.out + 2 && (
        <div style={{
          position: 'absolute', left: 260, right: 260, top: 392, height: 290, opacity: life(f, c.problemA.in - 4, c.problemA.in + 6, c.problemB.out - 8, c.problemB.out),
          background: 'radial-gradient(closest-side, rgba(245,245,248,0.96) 0%, rgba(245,245,248,0.82) 60%, rgba(245,245,248,0) 100%)',
        }} />
      )}
      <Punch f={f} text="Debt is fragmented." at={c.problemA.in} out={c.problemA.out} x={0} y={428} size={88} align="center" accent={[2]} />
      <Punch f={f} text="Financing is disconnected." at={c.problemB.in} out={c.problemB.out} x={0} y={528} size={88} align="center" accent={[2]} />

      {/* S2 à S4, S6 : en haut à gauche ; pendant le plan serré, un voile sépare le texte de l'interface */}
      <WideVeil o={Math.min(1, Math.max(0, (k - 1.04) / 0.3)) * life(f, c.overview.in - 6, c.overview.in + 2)} />
      <Punch f={f} text="One view. Across your entire group." at={c.overview.in} out={c.overview.out} {...TOP} accent={[2]} />
      <Punch f={f} text="Simulate tomorrow. Decide today." at={c.scenario.in} out={c.scenario.out} {...TOP} accent={[2]} />
      <Punch f={f} text="Prepare your next financing." at={c.request.in} out={c.request.out} {...TOP} accent={[2]} />
      <Punch f={f} text="Compare terms. Choose with confidence." at={c.compare.in} out={c.compare.out} {...TOP} accent={[3]} />

      {/* S5 : la vision, au centre */}
      <Eyebrow f={f} />
      <Punch f={f} text="From managing capital to accessing it." at={c.network.in} out={c.network.out} x={0} y={74} size={64} align="center" accent={[4]} stagger={2} />
      <Sub f={f} />
      <VisionNote f={f} />
    </div>
  );
}

/** « FUTURE VISION » : la séquence du réseau est une vision, pas une fonction du produit. */
function Eyebrow({ f }: { f: number }) {
  const o = life(f, NETWORK.a + 2, NETWORK.a + 12, CAPTIONS.network.out - 8, CAPTIONS.network.out);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center', opacity: o }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, height: 30, padding: '0 14px', borderRadius: 999, fontSize: 14.5, fontWeight: 750, letterSpacing: '0.14em',
        color: 'var(--brand-ink)', border: '1px solid var(--brand-line)', background: 'rgba(239, 236, 251, 0.92)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c2)' }} />FUTURE VISION
      </span>
    </div>
  );
}

function Sub({ f }: { f: number }) {
  const c = CAPTIONS.networkSub;
  if (f < c.in || f > c.out + 1) return null;
  const leave = p(f, c.out - 8, c.out, E.in);
  const parts = ['One company.', 'One financing profile.', 'Multiple potential sources of capital.'];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 154, display: 'flex', justifyContent: 'center', gap: 14, fontSize: 30, fontWeight: 650, letterSpacing: '-0.015em', whiteSpace: 'nowrap', opacity: 1 - leave }}>
      {parts.map((t, i) => {
        const o = p(f, c.in + i * 6, c.in + i * 6 + 9, E.out);
        return <span key={t} style={{ opacity: o, transform: `translateY(${(1 - o) * 12}px)`, color: i === 2 ? 'var(--brand)' : 'var(--ink-2)', display: 'inline-block' }}>{t}</span>;
      })}
    </div>
  );
}

/** Note de bas de page de la vision : capacité future, illustration, aucune connexion réelle. */
function VisionNote({ f }: { f: number }) {
  const o = life(f, NETWORK.b, NETWORK.b + 10, CAPTIONS.network.out - 10, CAPTIONS.network.out);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontSize: 17, fontWeight: 550, color: 'var(--ink-3)', opacity: o, whiteSpace: 'nowrap' }}>
      Future capability · conceptual illustration — no live connections, partnerships or offers
    </div>
  );
}
