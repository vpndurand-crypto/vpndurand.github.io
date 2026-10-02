import { Icon } from '../Icon';
import s from './Toast.module.css';

export interface ToastProps { text: string; detail?: string; onDismiss: () => void }

export function Toast({ text, detail, onDismiss }: ToastProps) {
  return (
    <div className={s.toast} role="status" aria-live="polite">
      <Icon name="check" size={16} className={s.icon} />
      <div>
        <div className={s.text}>{text}</div>
        {detail && <div className={s.detail}>{detail}</div>}
      </div>
      <button type="button" className={s.close} onClick={onDismiss} aria-label="Fermer la notification">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
