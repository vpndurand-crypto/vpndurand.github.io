import { Link, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { AUDIT_ACTION_LABELS } from '../data/labels';
import type { AuditAction } from '../data/types';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { selectAuditList, type AuditRow } from '../store/selectors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Select } from '../ui/Select';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

function detail(row: AuditRow): string {
  const { before, after } = row.event;
  if (before && after) return Object.keys(after).map((k) => `${k} : ${before[k] ?? '—'} → ${after[k]}`).join(' · ');
  if (after) return Object.entries(after).map(([k, v]) => `${k} : ${v}`).join(' · ');
  return '—';
}

/** Journal (BETA-064) : lecture seule des événements du jeu initial et de la démonstration, du plus récent au plus ancien. */
export function AuditPage() {
  useDocumentTitle('Journal');
  const state = useDemoState();
  const data = useDataView();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const societe = params.get('societe') ?? '';
  const all = selectAuditList(state).filter((r) => !r.event.entity_id || state.perimeter.includes(r.event.entity_id));
  const rows = all.filter((r) => (!type || r.event.action === type) && (!societe || r.event.entity_id === societe));
  const demoCount = all.filter((r) => r.event.origin === 'DEMO').length;
  const actions = [...new Set(all.map((r) => r.event.action))] as AuditAction[];
  const set = (key: string, value: string) => setParams((prev) => { const next = new URLSearchParams(prev); if (value) next.set(key, value); else next.delete(key); return next; });
  const userName = (r: AuditRow) => (r.user ? `${r.user.first_name} ${r.user.last_name}` : r.event.user_id);
  const target = (r: AuditRow) => {
    const t = r.target;
    if (!t) return r.event.target_label;
    const to = t.kind === 'covenant' ? paths.covenant(t.id, t.date ? { date: t.date } : {}) : t.kind === 'financing' ? paths.financing(t.id) : t.kind === 'document' ? paths.document(t.id) : paths.balance(t.id);
    return <Link to={to}>{r.event.target_label}</Link>;
  };
  return (
    <>
      <PageHeader title="Journal" subtitle={`${all.length} événements · ${demoCount === 0 ? 'aucun ajouté pendant la démonstration' : `${demoCount} ajouté${demoCount > 1 ? 's' : ''} pendant la démonstration`} · lecture seule`} />
      <div className={s.filters}>
        <Select id="j-type" label="Action" value={type} onChange={(v) => set('type', v)} options={[{ value: '', label: 'Toutes les actions' }, ...actions.map((a) => ({ value: a, label: AUDIT_ACTION_LABELS[a] }))]} />
        <Select id="j-societe" label="Société" value={societe} onChange={(v) => set('societe', v)} options={[{ value: '', label: 'Toutes les sociétés' }, ...data.entities.filter((e) => state.perimeter.includes(e.id)).map((e) => ({ value: e.id, label: e.name }))]} />
        {(type || societe) && <Button variant="ghost" size="sm" icon="reset" onClick={() => setParams({})}>Effacer les filtres</Button>}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState icon="search" title="Aucun événement pour ces filtres" action={<Button variant="secondary" onClick={() => setParams({})}>Effacer les filtres</Button>} /> : (
          <Table<AuditRow> caption="Journal des événements" rowKey={(r) => r.event.id} rows={rows} highlightKeys={rows.filter((r) => r.event.origin === 'DEMO').map((r) => r.event.id)} columns={[
            { key: 'date', header: 'Date', render: (r) => <span className={s.cellMain}><span className={s.nowrap}>{fmt.dateTime(r.event.created_at)}</span>{r.event.origin === 'DEMO' && <span className={s.cellSub}>Pendant la démonstration</span>}</span> },
            { key: 'user', header: 'Auteur', render: (r) => userName(r) },
            { key: 'action', header: 'Action', render: (r) => <strong>{AUDIT_ACTION_LABELS[r.event.action]}</strong> },
            { key: 'target', header: 'Objet', render: (r) => target(r) },
            { key: 'entity', header: 'Société', render: (r) => r.entity?.short_name ?? '—' },
            { key: 'financing', header: 'Financement', render: (r) => r.financing?.label ?? '—' },
            { key: 'detail', header: 'Détail', render: (r) => <span className={s.cellSub}>{detail(r)}</span> },
          ]} />
        )}
      </Card>
    </>
  );
}
