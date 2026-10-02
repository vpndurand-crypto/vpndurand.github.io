import type { ReactNode } from 'react';
import { cx } from '../cx';
import s from './Card.module.css';

export interface CardProps {
  label?: string | undefined;
  title?: string | undefined;
  action?: ReactNode;
  dense?: boolean;
  signature?: boolean;
  className?: string | undefined;
  children?: ReactNode;
}

export function Card({ label, title, action, dense = false, signature = false, className, children }: CardProps) {
  const hasHeader = Boolean(label || title || action);
  return (
    <section className={cx(s.card, dense && s.dense, signature && s.signature, className)} aria-label={title ?? label}>
      {hasHeader && (
        <header className={s.header}>
          <div>
            {label && <div className="label">{label}</div>}
            {title && <h2 className={s.title}>{title}</h2>}
          </div>
          {action && <div className={s.action}>{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
