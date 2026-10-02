import { useEffect } from 'react';
import { dismissToast } from '../../../store/actions';
import { useDemoDispatch, useDemoState } from '../../../store/hooks';
import { Toast } from '../../../ui/Toast';

export function ToastHost() {
  const { ui } = useDemoState();
  const dispatch = useDemoDispatch();
  const toast = ui.toast;
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => dispatch(dismissToast(toast.id)), 4000);
    return () => window.clearTimeout(timer);
  }, [toast, dispatch]);
  if (!toast) return null;
  return <Toast text={toast.text} {...(toast.detail ? { detail: toast.detail } : {})} onDismiss={() => dispatch(dismissToast(toast.id))} />;
}
