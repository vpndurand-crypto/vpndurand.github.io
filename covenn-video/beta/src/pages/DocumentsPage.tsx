import { useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DOCUMENT_TYPE_LABELS } from '../data/labels';
import type { FinancingDocument } from '../data/types';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

export function DocumentsPage() {
  useDocumentTitle('Documents');
  const data = useDataView();
  const { perimeter } = useDemoState();
  const navigate = useNavigate();
  const rows = data.documents.filter((d) => perimeter.includes(d.entity_id)).sort((a, b) => b.document_date.localeCompare(a.document_date));
  const userName = (id: string) => { const u = data.users.find((x) => x.id === id); return u ? `${u.first_name} ${u.last_name}` : id; };
  return (
    <>
      <PageHeader title="Documents" subtitle="Contrats et justificatifs : chaque clause utilisée par un calcul s’ouvre à la page citée" />
      <Card>
        <Table<FinancingDocument> caption="Documents" rowKey={(d) => d.id} rows={rows} onRowClick={(d) => navigate(paths.document(d.id))} rowLabel={(d) => `Ouvrir ${d.title}`}
          defaultSort={{ key: 'date', dir: 'desc' }} columns={[
            { key: 'title', header: 'Document', sortValue: (d) => d.title, render: (d) => <span className={s.cellMain}><span className={s.cellTitle}>{d.title}</span><span className={s.cellSub}>{d.file_name}</span></span> },
            { key: 'type', header: 'Type', render: (d) => DOCUMENT_TYPE_LABELS[d.document_type] },
            { key: 'entity', header: 'Société', render: (d) => data.entities.find((e) => e.id === d.entity_id)?.short_name },
            { key: 'financing', header: 'Financement', render: (d) => d.financing_ids.map((id) => data.financings.find((f) => f.id === id)?.label).join(', ') },
            { key: 'date', header: 'Date', sortValue: (d) => d.document_date, render: (d) => fmt.date(d.document_date) },
            { key: 'pages', header: 'Pages', align: 'right', render: (d) => d.page_count },
            { key: 'up', header: 'Déposé', render: (d) => <span className={s.cellMain}><span>{fmt.date(d.uploaded_at)}</span><span className={s.cellSub}>par {userName(d.uploaded_by)}</span></span> },
          ]} />
      </Card>
    </>
  );
}
