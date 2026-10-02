import { Outlet, ScrollRestoration } from 'react-router-dom';
import { DemoBanner } from '../features/layout/DemoBanner';
import { Sidebar } from '../features/layout/Sidebar';
import { ToastHost } from '../features/layout/ToastHost';
import { Topbar } from '../features/layout/Topbar';
import { ProvenanceDrawer, useDrawerMode } from '../features/provenance';
import { useDemoState } from '../store/hooks';
import { cx } from '../ui/cx';
import s from './AppShell.module.css';

export function AppShell() {
  const focusMain = () => document.getElementById('main')?.focus();
  const mode = useDrawerMode();
  const drawerOpen = useDemoState().ui.provenanceStack.length > 0;
  return (
    <div className={cx(s.shell, drawerOpen && mode === 'docked' && s.withDrawer)}>
      <button type="button" className="skip-link" onClick={focusMain}>Aller au contenu</button>
      <Sidebar />
      <div className={s.column}>
        <DemoBanner />
        <Topbar />
        <main id="main" tabIndex={-1} className={s.main}>
          <div className={s.content}>
            <Outlet />
          </div>
        </main>
      </div>
      <ProvenanceDrawer mode={mode} />
      <ToastHost />
      <ScrollRestoration />
    </div>
  );
}
