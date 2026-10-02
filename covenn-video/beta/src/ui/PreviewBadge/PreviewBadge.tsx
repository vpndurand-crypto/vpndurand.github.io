import { Tooltip } from '../Tooltip';
import s from './PreviewBadge.module.css';

export const PREVIEW_TOOLTIP = 'Fonctionnalité en aperçu : elle illustre la direction de Covenn et n’est pas encore livrée.';

export function PreviewBadge({ tooltip = PREVIEW_TOOLTIP }: { tooltip?: string }) {
  return (
    <Tooltip content={tooltip}>
      <span className={s.badge} tabIndex={0} aria-label={`Aperçu. ${tooltip}`}>Aperçu</span>
    </Tooltip>
  );
}
