import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button';
import { useFocusTrap } from '../focusTrap';
import s from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

/** Fenêtre de confirmation : focus sur l'action principale, Échap annule, focus rendu à l'origine. */
export function Modal({ open, title, children, confirmLabel, cancelLabel = 'Annuler', onConfirm, onCancel }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open, onCancel, confirmRef);
  if (!open) return null;
  return createPortal(
    <div className={s.overlay}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={s.dialog}>
        <h2 id={titleId} className={s.title}>{title}</h2>
        <div className={s.body}>{children}</div>
        <div className={s.footer}>
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          {onConfirm && confirmLabel && <Button ref={confirmRef} onClick={onConfirm}>{confirmLabel}</Button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
