import { CURRENT_USER_ID, DATE_ARRETE } from '../../../config/demo';
import { formatDate } from '../../../domain/format';
import { setPerimeter } from '../../../store/actions';
import { useDataView, useDemoDispatch, useDemoState } from '../../../store/hooks';
import { MultiSelect } from '../../../ui/MultiSelect';
import { Icon } from '../../../ui/Icon';
import s from './Topbar.module.css';

export function Topbar() {
  const data = useDataView();
  const { perimeter } = useDemoState();
  const dispatch = useDemoDispatch();
  const user = data.users.find((u) => u.id === CURRENT_USER_ID);
  const count = perimeter.length;
  return (
    <header className={s.topbar} data-print="hide">
      <div className={s.org}>
        <Icon name="building" size={16} />
        <span>{data.organization.name}</span>
      </div>
      <span className={s.divider} aria-hidden="true" />
      <MultiSelect label="Périmètre" icon="building" summary={`${count} ${count > 1 ? 'sociétés' : 'société'} sur ${data.entities.length}`}
        options={data.entities.map((e) => ({ value: e.id, label: e.name }))} value={perimeter}
        note="Au moins une société reste sélectionnée. Totaux, listes et compteurs suivent le périmètre."
        onChange={(next) => { if (next.length > 0) dispatch(setPerimeter(next)); }} />
      <div className={s.spacer} />
      <span className={s.pill}>
        <Icon name="calendar" size={14} />
        Données au {formatDate(DATE_ARRETE)}
      </span>
      {user && (
        <span className={s.avatar} title={`${user.first_name} ${user.last_name}, ${user.job_title}`}>
          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
        </span>
      )}
    </header>
  );
}
