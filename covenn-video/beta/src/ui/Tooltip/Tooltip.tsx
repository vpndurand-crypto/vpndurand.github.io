import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import s from './Tooltip.module.css';

/** Info-bulle au survol et au focus, délai de 300 ms. */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(true), 300); };
  const hide = () => { window.clearTimeout(timer.current); setOpen(false); };
  return (
    <span className={s.wrap} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} aria-describedby={open ? id : undefined}>
      {children}
      {open && <span role="tooltip" id={id} className={s.bubble}>{content}</span>}
    </span>
  );
}
