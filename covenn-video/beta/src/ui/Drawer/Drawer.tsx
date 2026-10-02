import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { Icon } from '../Icon';
import { useFocusTrap } from '../focusTrap';
import s from './Drawer.module.css';

export type DrawerMode = 'docked' | 'overlay' | 'modal';

/** Éléments qui agissent au clic : ils ne ferment jamais le panneau (règle C-02). */
const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="tab"], [data-interactive]';

export interface DrawerProps {
  open: boolean;
  mode: DrawerMode;
  title: string;
  onClose: () => void;
  children: ReactNode;
  id?: string;
}

export function Drawer({ open, mode, title, onClose, children, id }: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useFocusTrap(panelRef, open && mode === 'modal', onClose, titleRef);

  useEffect(() => {
    if (!open || mode === 'modal') return undefined;
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !panelRef.current) return;
      if (panelRef.current.contains(target) || !document.body.contains(target)) return;
      if (target.closest(INTERACTIVE)) return;
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open, mode]);

  if (!open) return null;
  const panel = (
    <aside ref={panelRef} id={id} className={cx(s.drawer, s[mode])} role={mode === 'modal' ? 'dialog' : 'complementary'}
      aria-modal={mode === 'modal' ? true : undefined} aria-label={title} data-print="hide">
      <header className={s.header}>
        <h2 ref={titleRef} tabIndex={-1} className={s.title}>{title}</h2>
        <button type="button" className={s.close} onClick={onClose} aria-label="Fermer le panneau">
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className={s.body}>{children}</div>
    </aside>
  );
  if (mode === 'docked') return panel;
  return createPortal(
    <>
      {mode === 'modal' && <div className={s.veil} onClick={onClose} aria-hidden="true" />}
      {panel}
    </>,
    document.body,
  );
}
