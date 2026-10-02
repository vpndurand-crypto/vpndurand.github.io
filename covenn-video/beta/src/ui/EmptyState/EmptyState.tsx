import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import s from './EmptyState.module.css';

export function EmptyState({ icon = 'info', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <Icon name={icon} size={32} strokeWidth={1.5} className={s.icon} />
      <h2 className={s.title}>{title}</h2>
      {text && <p className={s.text}>{text}</p>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
