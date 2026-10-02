import { NavLink } from 'react-router-dom';
import { paths } from '../../../app/routes';
import { CURRENT_USER_ID } from '../../../config/demo';
import { useDataView } from '../../../store/hooks';
import { cx } from '../../../ui/cx';
import { Icon, type IconName } from '../../../ui/Icon';
import s from './Sidebar.module.css';

interface NavItem { to: string; label: string; icon: IconName; end?: boolean; preview?: boolean }

const PRIMARY: readonly NavItem[] = [
  { to: paths.overview(), label: 'Vue groupe', icon: 'overview', end: true },
  { to: paths.financings(), label: 'Financements', icon: 'financings' },
  { to: paths.covenants(), label: 'Covenants', icon: 'covenants' },
  { to: paths.documents(), label: 'Documents', icon: 'documents' },
  { to: paths.data(), label: 'Données financières', icon: 'data' },
  { to: paths.schedule(), label: 'Échéances', icon: 'schedule', preview: true },
];
const SECONDARY: readonly NavItem[] = [
  { to: paths.audit(), label: 'Journal', icon: 'audit' },
  { to: paths.settings(), label: 'Paramètres', icon: 'settings' },
  { to: paths.roadmap(), label: 'Feuille de route', icon: 'roadmap' },
];

function NavList({ items }: { items: readonly NavItem[] }) {
  return (
    <ul className={s.list}>
      {items.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.end ?? false} title={item.label} className={({ isActive }) => cx(s.item, isActive && s.active)}>
            <Icon name={item.icon} size={18} />
            <span className={s.text}>{item.label}</span>
            {item.preview && <span className={s.badge}>Aperçu</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar() {
  const data = useDataView();
  const user = data.users.find((u) => u.id === CURRENT_USER_ID);
  const initials = user ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : '';
  return (
    <nav className={s.sidebar} aria-label="Navigation principale" data-print="hide">
      <div className={s.brand}>
        <span className={s.mark} aria-hidden="true">
          <svg viewBox="0 0 32 32" width="18" height="18"><path d="M21.5 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </span>
        <span className={s.wordmark}>Covenn</span>
      </div>
      <div className={s.scroll}>
        <NavList items={PRIMARY} />
        <div className={s.separator} role="separator" />
        <NavList items={SECONDARY} />
      </div>
      {user && (
        <div className={s.user}>
          <span className={s.avatar} aria-hidden="true">{initials}</span>
          <span className={s.userText}>
            <span className={s.userName}>{user.first_name} {user.last_name}</span>
            <span className={s.userRole}>{user.job_title}</span>
          </span>
        </div>
      )}
    </nav>
  );
}
