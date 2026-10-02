import { useDemoState } from '../../../store/hooks';
import { Icon } from '../../../ui/Icon';
import s from './DemoBanner.module.css';

export function DemoBanner() {
  const { ui } = useDemoState();
  return (
    <div className={s.banner} role="note" data-print="hide">
      <Icon name="info" size={14} />
      <span>
        Environnement de démonstration : toutes les données sont fictives.
        {!ui.storageAvailable && ' Sauvegarde locale indisponible : vos actions ne seront pas conservées à la fermeture.'}
      </span>
    </div>
  );
}
