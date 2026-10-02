import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import s from './Button.module.css';

/** Lien de navigation présenté comme un bouton (même apparence, sémantique de lien). */
export function ButtonLink({ to, variant = 'secondary', size = 'md', icon, children }: {
  to: string; variant?: 'primary' | 'secondary' | 'ghost' | 'link'; size?: 'md' | 'sm'; icon?: IconName; children: ReactNode;
}) {
  return (
    <Link to={to} className={cx(s.button, s[variant], size === 'sm' && s.sm)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </Link>
  );
}
