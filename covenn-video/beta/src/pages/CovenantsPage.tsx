import { useNavigate, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import type { CalcStatus } from '../data/types';
import { STATUS_META } from '../data/labels';
import { PageHeader } from '../features/layout/PageHeader';
import { ClickableValue } from '../features/provenance';
import { useDemoState } from '../store/hooks';
import { selectCovenantList, type CovenantListItem } from '../store/selectors';
import { Card } from '../ui/Card';
import { Sparkline } from '../ui/charts';
import { cx } from '../ui/cx';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import cs from '../features/covenant/covenant.module.css';
import s from './styles/pages.module.css';

const GROUPS: Array<{ id: string; label: string; match: (status: CalcStatus) => boolean }> = [
  { id: 'COMPLIANT', label: 'Respectés', match: (st) => st === 'COMPLIANT' },
  { id: 'WATCH', label: 'Vigilance', match: (st) => st === 'WATCH' },
  { id: 'RISK', label: 'À risque', match: (st) => st === 'CRITICAL' || st === 'BREACH' || st === 'NOT_MEANINGFUL' },
  { id: 'NA', label: 'Non calculables', match: (st) => st === 'NOT_COMPUTABLE' },
];

export function CovenantsPage() {
  useDocumentTitle('Covenants');
  const state = useDemoState();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const items = selectCovenantList(state).filter((i) => state.perimeter.includes(i.covenant.entity_id));
  const active = GROUPS.find((g) => g.id === params.get('statut')) ?? null;
  const rows = active ? items.filter((i) => i.result && active.match(i.result.status)) : items;
  const setFilter = (id: string | null) => setParams(id ? { statut: id } : {});
  return (
    <>
      <PageHeader title="Covenants" subtitle={`Engagements financiers suivis, valeurs au ${fmt.date(items[0]?.result?.calcDate ?? '2026-09-30')}`} />
      <div className={cs.counters} role="group" aria-label="Filtrer par statut">
        <button type="button" className={cx(cs.counter, !active && cs.counterActive)} aria-pressed={!active} onClick={() => setFilter(null)}>Tous <span className={cs.counterCount}>{items.length}</span></button>
        {GROUPS.map((g) => {
          const count = items.filter((i) => i.result && g.match(i.result.status)).length;
          return (
            <button key={g.id} type="button" className={cx(cs.counter, active?.id === g.id && cs.counterActive)} aria-pressed={active?.id === g.id} onClick={() => setFilter(g.id)}>
              {g.label} <span className={cs.counterCount}>{count}</span>
            </button>
          );
        })}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState icon="covenants" title="Aucun covenant pour ce filtre" action={<button type="button" className={cs.counter} onClick={() => setFilter(null)}>Afficher tous les covenants</button>} /> : (
          <Table<CovenantListItem> caption="Covenants" rowKey={(i) => i.covenant.id} rows={rows} onRowClick={(i) => navigate(paths.covenant(i.covenant.id))}
            rowLabel={(i) => `Ouvrir le covenant ${i.covenant.short_label}`} columns={[
              { key: 'name', header: 'Covenant', sortValue: (i) => i.covenant.short_label, render: (i) => (
                <span className={s.cellMain}><span className={s.cellTitle}>{i.covenant.short_label}</span><span className={s.cellSub}>{i.covenant.label.split('—')[1]?.trim()}</span></span>
              ) },
              { key: 'financing', header: 'Financement', render: (i) => <span className={s.cellMain}><span>{i.financing?.label}</span><span className={s.cellSub}>{i.entity?.short_name} · {i.lender?.name}</span></span> },
              { key: 'value', header: 'Valeur', align: 'right', sortValue: (i) => Number(i.result?.value ?? 0), render: (i) => (i.result?.valueExact
                ? <ClickableValue target={{ scope: i.view.key, nodeId: i.view.key, occurrence: i.savedUpToDate ? i.view.latestSaved?.occurrence ?? null : null }} text={fmt.covenant(i.result.valueExact, i.result.threshold, i.result.form)} />
                : '—') },
              { key: 'threshold', header: 'Seuil', align: 'right', render: (i) => (i.result ? fmt.threshold(i.result.comparison, i.result.threshold, i.result.form) : '—') },
              { key: 'headroom', header: 'Headroom', align: 'right', sortValue: (i) => Number(i.result?.headroomPct ?? 0), render: (i) => (i.result?.headroom && i.result.headroomPct ? <span className={s.cellMain}><span>{fmt.ratio(i.result.headroom)}</span><span className={s.cellSub}>{fmt.pct(i.result.headroomPct)}</span></span> : '—') },
              { key: 'status', header: 'Statut', sortValue: (i) => (i.result ? STATUS_META[i.result.status].severity : 9), render: (i) => (i.result ? <StatusBadge status={i.result.status} size="sm" /> : '—') },
              { key: 'trend', header: 'Évolution', render: (i) => <Sparkline values={i.history.map((h) => (h.value ? Number(h.value) : null))} label={`Évolution du ${i.covenant.short_label}`} /> },
              { key: 'next', header: 'Prochain test', render: (i) => (i.nextTestDate ? fmt.date(i.nextTestDate) : '—') },
              { key: 'calc', header: 'Calcul au 30/09', render: (i) => (i.savedUpToDate && i.view.latestSaved ? <span className={s.cellMain}><span>Enregistré</span><span className={s.cellSub}>le {fmt.date(i.view.latestSaved.closed_at)}</span></span> : <span className="muted">En cours</span>) },
            ]} />
        )}
      </Card>
    </>
  );
}
