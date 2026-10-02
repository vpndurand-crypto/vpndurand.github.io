import type { SavedTest, SeedData } from '../../data/types';
import type { CovenantView } from '../../store/selectors';
import { StatusBadge } from '../../ui/StatusBadge';
import { Table } from '../../ui/Table';
import { fmt } from '../../ui/values';
import s from './covenant.module.css';

function who(data: SeedData, test: SavedTest) {
  const user = data.users.find((u) => u.id === test.closed_by);
  return user ? `${user.first_name} ${user.last_name}` : test.closed_by;
}

/** Calculs du covenant par date de test (BETA-025) : enregistré (figé), en cours, non calculable. */
export function TestHistory({ entries, activeDate, onSelect, data }: {
  entries: Array<{ date: string; view: CovenantView }>; activeDate: string; onSelect: (date: string) => void; data: SeedData;
}) {
  const rows = [...entries].reverse();
  return (
    <Table caption="Calculs par date de test" rowKey={(r) => r.date} rows={rows} highlightKeys={[activeDate]} onRowClick={(r) => onSelect(r.date)}
      rowLabel={(r) => `Afficher le calcul au ${fmt.date(r.date)}`} columns={[
        { key: 'date', header: 'Date de test', render: (r) => <strong className="num">{fmt.date(r.date)}</strong> },
        { key: 'value', header: 'Valeur', align: 'right', render: (r) => (r.view.displayed?.valueExact ? fmt.covenant(r.view.displayed.valueExact, r.view.displayed.threshold, r.view.displayed.form) : '—') },
        { key: 'threshold', header: 'Seuil', align: 'right', render: (r) => (r.view.displayed ? fmt.threshold(r.view.displayed.comparison, r.view.displayed.threshold, r.view.displayed.form) : '—') },
        { key: 'headroom', header: 'Headroom', align: 'right', render: (r) => (r.view.displayed?.headroom && r.view.displayed.headroomPct ? `${fmt.ratio(r.view.displayed.headroom)} · ${fmt.pct(r.view.displayed.headroomPct)}` : '—') },
        { key: 'status', header: 'Statut', render: (r) => (r.view.displayed ? <StatusBadge status={r.view.displayed.status} size="sm" /> : '—') },
        { key: 'nature', header: 'Calcul', render: (r) => {
          const saved = r.view.latestSaved;
          if (saved) {
            return <span className={s.cellMain}><span>Enregistré le {fmt.date(saved.closed_at)} par {who(data, saved)}</span><span className={s.cellSub}>{r.view.modifiedSinceSave ? 'Données modifiées depuis' : 'Figé'}{r.view.saved.length > 1 ? ` · ${r.view.saved.length} enregistrements` : ''}</span></span>;
          }
          return r.view.current.result?.status === 'NOT_COMPUTABLE' ? <span className="muted">Données à compléter</span> : <span>En cours — non enregistré</span>;
        } },
        { key: 'ref', header: 'Référence', render: (r) => <span className="num muted">{r.view.latestSaved ? r.view.latestSaved.snapshot.inputs_hash.slice(0, 8) : '—'}</span> },
      ]} />
  );
}
