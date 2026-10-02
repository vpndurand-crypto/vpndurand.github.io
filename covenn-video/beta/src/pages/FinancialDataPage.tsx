import { useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

/** Données financières (BETA-063, version légère) : balances importées et versionnées, chacune ouvrant son détail. */
export function FinancialDataPage() {
  useDocumentTitle('Données financières');
  const data = useDataView();
  const { perimeter } = useDemoState();
  const navigate = useNavigate();
  const entityName = (id: string) => data.entities.find((e) => e.id === id)?.name ?? id;
  const rows = data.balances.filter((b) => perimeter.includes(b.entity_id))
    .sort((a, b) => entityName(a.entity_id).localeCompare(entityName(b.entity_id)) || b.period_end.localeCompare(a.period_end) || b.version - a.version);
  const job = (id: string) => data.importJobs.find((j) => j.id === id);
  const userName = (id: string | undefined) => { const u = data.users.find((x) => x.id === id); return u ? `${u.first_name} ${u.last_name}` : '—'; };
  return (
    <>
      <PageHeader title="Données financières" subtitle="Balances importées et versionnées : les calculs enregistrés citent la version qu’ils ont utilisée" />
      <Card title="Balances" label={`${rows.length} balances sur le périmètre`}>
        <Table caption="Balances importées" rowKey={(b) => b.id} rows={rows} onRowClick={(b) => navigate(paths.balance(b.id))} rowLabel={(b) => `Ouvrir la balance ${entityName(b.entity_id)} au ${fmt.date(b.period_end)}`} columns={[
          { key: 'entity', header: 'Société', render: (b) => <span className={s.cellTitle}>{entityName(b.entity_id)}</span> },
          { key: 'date', header: 'Date d’arrêté', render: (b) => <strong className="num">{fmt.date(b.period_end)}</strong> },
          { key: 'version', header: 'Version', align: 'right', render: (b) => b.version },
          { key: 'status', header: 'Statut', render: (b) => (b.status === 'ACTIVE' ? 'Active' : <span className="muted">Remplacée</span>) },
          { key: 'lines', header: 'Lignes', align: 'right', render: (b) => b.lines.length },
          { key: 'total', header: 'Total débit', align: 'right', render: (b) => fmt.money(b.total_debit) },
          { key: 'file', header: 'Import', render: (b) => { const j = job(b.import_job_id); return <span className={s.cellMain}><span>{j?.file_name ?? '—'}</span><span className={s.cellSub}>{j ? `${fmt.dateTime(j.created_at)} par ${userName(j.created_by)}` : ''}</span></span>; } },
        ]} />
      </Card>
    </>
  );
}
