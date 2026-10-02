import { useEffect, useState } from 'react';
import type { DrawerMode } from '../../ui/Drawer';

/** Ancré à partir de 1 400 px, superposé de 1 024 à 1 399 px, plein écran en dessous (décisions C-01, C-03). */
function current(): DrawerMode {
  if (typeof window === 'undefined') return 'overlay';
  if (window.innerWidth >= 1400) return 'docked';
  return window.innerWidth >= 1024 ? 'overlay' : 'modal';
}

export function useDrawerMode(): DrawerMode {
  const [mode, setMode] = useState<DrawerMode>(current);
  useEffect(() => {
    const onResize = () => setMode(current());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mode;
}
