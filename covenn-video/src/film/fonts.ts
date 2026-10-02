import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

let ready: Promise<void> | null = null;

/** Charge Figtree (police embarquée de la bêta) et son complément de symboles (≤ →) avant la première image. */
function loadFonts(): Promise<void> {
  if (!ready) {
    const weights = ['400', '500', '600', '650', '700', '800'];
    ready = Promise.all(weights.map((w) => document.fonts.load(`${w} 40px Figtree`, 'Covenn 0123456789 €')))
      .then(() => document.fonts.load('700 40px Figtree', '≤ → ✓'))
      .then(() => document.fonts.ready)
      .then(() => undefined);
  }
  return ready;
}

export function useFontsReady(): boolean {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('Chargement des polices de la bêta'));
  useEffect(() => {
    let alive = true;
    loadFonts().then(() => { if (alive) setOk(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (ok) continueRender(handle);
  }, [ok, handle]);
  return ok;
}
