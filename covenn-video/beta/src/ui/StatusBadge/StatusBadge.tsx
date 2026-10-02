import { STATUS_META } from '../../data/labels';
import type { CalcStatus } from '../../data/types';
import { cx } from '../cx';
import s from './StatusBadge.module.css';

/** Statut d'un covenant : libellé et couleur lus dans labels.ts (VERT, ORANGE, ROUGE, GRIS). */
export function StatusBadge({ status, size = 'md', short = false }: { status: CalcStatus; size?: 'sm' | 'md'; short?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span className={cx(s.badge, s[meta.tone], size === 'sm' && s.sm)}>
      <span className={s.dot} aria-hidden="true" />
      {short ? meta.short : meta.label}
    </span>
  );
}
