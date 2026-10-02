import { memo, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from '../../beta/src/features/layout/Sidebar';
import { DemoBanner } from '../../beta/src/features/layout/DemoBanner';
import { Topbar } from '../../beta/src/features/layout/Topbar';
import { GroupOverviewPage } from '../../beta/src/pages/GroupOverviewPage';
import shell from '../../beta/src/app/AppShell.module.css';
import sidebarCss from '../../beta/src/features/layout/Sidebar/Sidebar.module.css';
import pages from '../../beta/src/pages/styles/pages.module.css';
import covenantCss from '../../beta/src/features/covenant/covenant.module.css';
import { FrozenDemo } from './FrozenDemo';
import { stateInitial } from './demo';

/** Fenêtre virtuelle de la bêta : 1600 × 900 (16:9), la largeur où la bêta s'affiche sans repli. */
export const UI_W = 1600;
export const UI_H = 900;

export interface UiRect { x: number; y: number; w: number; h: number }
export type UiRects = Record<'miniValue' | 'threshold' | 'debt' | 'cash' | 'ebitda' | 'card' | 'kpis', UiRect>;

/** Sélecteurs construits avec les classes réelles de la bêta (mêmes modules CSS, donc mêmes noms hachés). */
export const SELECTORS: Record<keyof UiRects, string> = {
  card: `.${pages.row84} > section:nth-child(1)`,
  kpis: `.${pages.kpis}`,
  miniValue: `.${covenantCss.miniValue} button`,
  threshold: `.${covenantCss.miniValues} > span:nth-child(2) button`,
  debt: `.${covenantCss.miniComponents} > div:nth-child(1) button`,
  cash: `.${covenantCss.miniComponents} > div:nth-child(2) button`,
  ebitda: `.${covenantCss.miniComponents} > div:nth-child(4) button`,
};

/** Position dans la fenêtre virtuelle, indépendante de toute transformation (chaîne offsetParent). */
function offsetRect(el: HTMLElement, root: HTMLElement): UiRect {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** Ajustements propres au film : la fenêtre virtuelle remplace la hauteur de l'écran (100vh) de la bêta. */
const FRAME_CSS = `
.covenn-frame .${shell.shell} { min-height: ${UI_H}px; height: ${UI_H}px; }
.covenn-frame .${sidebarCss.sidebar} { height: ${UI_H}px; position: relative; }
.covenn-frame .skip-link { display: none; }
`;

/** Interface réelle de la bêta (vue groupe), rendue par ses propres composants avec un état figé. */
const BetaOverview = memo(function BetaOverview() {
  return (
    <FrozenDemo state={stateInitial}>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className={shell.shell}>
          <Sidebar />
          <div className={shell.column}>
            <DemoBanner />
            <Topbar />
            <main id="main" className={shell.main}>
              <div className={shell.content}>
                <Routes>
                  <Route path="/" element={<GroupOverviewPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </MemoryRouter>
    </FrozenDemo>
  );
});

export function AppFrame({ style, frameCss, onMeasured }: { style: CSSProperties; frameCss: string; onMeasured: (rects: UiRects) => void }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const rects = {} as UiRects;
    for (const [key, selector] of Object.entries(SELECTORS) as Array<[keyof UiRects, string]>) {
      const target = el.querySelector<HTMLElement>(selector);
      if (!target) throw new Error(`Élément introuvable dans la vue groupe : ${key} (${selector})`);
      rects[key] = offsetRect(target, el);
    }
    onMeasured(rects);
    // Mesure unique : la mise en page de la bêta est statique pendant tout le film.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="covenn-frame" style={{ position: 'absolute', left: 0, top: 0, width: UI_W, height: UI_H, transformOrigin: '0 0', overflow: 'hidden', background: 'var(--canvas)', ...style }}>
      <style>{FRAME_CSS + frameCss}</style>
      <div ref={root} style={{ position: 'relative', width: UI_W, height: UI_H }}>
        <BetaOverview />
      </div>
    </div>
  );
}

/** Classes réelles utiles aux révélations progressives image par image. */
export const CLASSES = { pages, covenantCss, shell };
