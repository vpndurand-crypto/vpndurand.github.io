import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import s from './Banner.module.css';

export type BannerTone = 'info' | 'watch' | 'preview' | 'modified' | 'success';
const DEFAULT_ICON: Record<BannerTone, IconName> = { info: 'info', watch: 'warning', preview: 'preview', modified: 'warning', success: 'check' };

export interface BannerProps {
  tone?: BannerTone;
  icon?: IconName;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  live?: boolean;
}

export function Banner({ tone = 'info', icon, title, children, action, live = false }: BannerProps) {
  return (
    <div className={cx(s.banner, s[tone])} role={live ? 'status' : undefined}>
      <Icon name={icon ?? DEFAULT_ICON[tone]} size={16} className={s.icon} />
      <div className={s.text}>
        {title && <div className={s.title}>{title}</div>}
        {children && <div>{children}</div>}
      </div>
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
