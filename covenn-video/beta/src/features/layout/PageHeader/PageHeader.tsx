import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '../../../ui/Breadcrumbs';
import s from './PageHeader.module.css';

export function PageHeader({ title, subtitle, breadcrumbs, actions, badge }: {
  title: string; subtitle?: ReactNode; breadcrumbs?: readonly Crumb[]; actions?: ReactNode; badge?: ReactNode;
}) {
  return (
    <header className={s.header}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className={s.row}>
        <div className={s.titles}>
          <div className={s.titleLine}>
            <h1 className={s.title}>{title}</h1>
            {badge}
          </div>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
    </header>
  );
}
