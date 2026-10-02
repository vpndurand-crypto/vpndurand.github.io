import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import s from './Button.module.css';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
  size?: 'md' | 'sm';
  icon?: IconName;
  /** Présente : le bouton est désactivé et la raison s'affiche en info-bulle. */
  disabledReason?: string | undefined;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, disabledReason, className, children, type = 'button', ...rest },
  ref,
) {
  const disabled = disabledReason !== undefined;
  return (
    <button
      ref={ref}
      type={type}
      className={cx(s.button, s[variant], size === 'sm' && s.sm, className)}
      disabled={disabled}
      title={disabledReason}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
});
