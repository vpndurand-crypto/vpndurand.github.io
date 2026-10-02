import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import s from './Breadcrumbs.module.css';

export interface Crumb { label: string; to?: string }

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={s.nav}>
      <ol className={s.list}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={s.item}>
              {item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}
              {!last && <Icon name="chevronRight" size={12} className={s.sep} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
