import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paths, type FinancingTab } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DATE_ARRETE } from '../config/demo';
import { AUDIT_ACTION_LABELS, DOCUMENT_TYPE_LABELS, FINANCING_CATEGORY_LABELS } from '../data/labels';
import { CovenantCard } from '../features/covenant';
import { rateText } from '../features/financings/terms';
import { PageHeader } from '../features/layout/PageHeader';
import { ClickableValue } from '../features/provenance';
import { useDataView, useDemoState } from '../store/hooks';
import { selectFinancingList } from '../store/selectors';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Table } from '../ui/Table';
import { TabPanel, Tabs } from '../ui/Tabs';
import { fmt } from '../ui/values';
import { NotFoundPage } from './NotFoundPage';
import s from './styles/pages.module.css';

const TABS: Array<{ id: FinancingTab; label: string }> = [
  { id: 'synthese', label: 'Synthèse' }, { id: 'encours', label: 'Encours' }, { id: 'documents', label: 'Documents' }, { id: 'historique', label: 'Historique' },
];

export function FinancingPage() {
  const { financingId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useDemoState();
  const data = useDataView();
  const item = selectFinancingList(state).find((i) => i.financing.id === financingId);
  useDocumentTitle(item?.financing.label ?? 'Financement introuvable');
  if (!item) return <NotFoundPage message="Ce financement n’existe pas" backTo={paths.financings()} backLabel="Voir les financements" />;
  const { financing, lender, entity, outstanding } = item;
  const tab = TABS.find((t) => t.id === params.get('onglet'))?.id ?? 'synthese';
  const userName = (id: string) => { const u = data.users.find((x) => x.id === id); return u ? `${u.first_name} ${u.last_name}` : id; };
  const odIds = new Set(item.declarations.map((d) => d.id));
  const covenantIds = item.covenants.map((c) => c.covenant.id);
  const events = data.audit.filter((e) => e.target_id === financing.id || odIds.has(e.target_id) || covenantIds.some((id) => e.target_id.startsWith(`${id}@`)) || item.documents.some((d) => d.id === e.target_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const drawn = financing.authorized_limit && outstanding ? Number(outstanding.amount) / Number(financing.authorized_limit) : null;

  return (
    <>
      <PageHeader title={financing.label} breadcrumbs={[{ label: 'Financements', to: paths.financings() }, { label: financing.label }]}
        subtitle={`${financing.external_reference} · ${lender?.name ?? ''} · ${entity?.name ?? ''} · ${FINANCING_CATEGORY_LABELS[financing.category]}`} />
      <div className={s.kpis}>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Encours au {fmt.date(DATE_ARRETE)}</span>
          <span className={s.kpiValue}>{outstanding ? <ClickableValue target={{ scope: 'outstanding', nodeId: outstanding.id, occurrence: null }} text={fmt.money(outstanding.amount)} size="inherit" /> : 'Non déclaré'}</span>
          <span className={s.kpiSub}>{outstanding?.comment}</span>
          {drawn !== null && <div className={s.drawn}><div className={s.drawnTrack}><div className={s.drawnFill} style={{ width: `${Math.round(drawn * 100)}%` }} /></div><span className={s.kpiSub}>Tiré sur un plafond de {fmt.money(financing.authorized_limit ?? '0')}</span></div>}
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>{financing.initial_amount ? 'Montant initial' : 'Plafond autorisé'}</span>
          <span className={s.kpiValue}>{fmt.money(financing.initial_amount ?? financing.authorized_limit ?? '0')}</span>
          <span className={s.kpiSub}>Mis à disposition le {fmt.date(financing.availability_date)}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Maturité</span>
          <span className={s.kpiValue}>{fmt.date(financing.maturity_date)}</span>
          <span className={s.kpiSub}>{financing.amortization_profile}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Taux</span>
          <span className={s.kpiValue} style={{ fontSize: 20, lineHeight: "38px", whiteSpace: "nowrap" }}>{rateText(financing)}</span>
          <span className={s.kpiSub}>{financing.rate_type === 'FIXED' ? 'Taux fixe' : 'Taux variable'}</span>
        </div>
      </div>
      <Tabs idPrefix="financing" ariaLabel="Sections du financement" items={TABS} value={tab} onChange={(id) => setParams({ onglet: id })} />
      {tab === 'synthese' && (
        <TabPanel idPrefix="financing" id="synthese">
          <div className={s.row84}>
            <Card title="Covenants rattachés" label={item.covenants.length ? `Testés trimestriellement, valeurs au ${fmt.date(DATE_ARRETE)}` : undefined}>
              {item.covenants.length === 0 ? <EmptyState icon="covenants" title="Aucun covenant rattaché" text="Ce financement ne comporte pas d’engagement financier suivi dans Covenn." /> : (
                <div className={s.stack}>
                  {item.covenants.map((c, index) => <CovenantCard key={c.covenant.id} item={c} showComponents={index === 0} />)}
                </div>
              )}
            </Card>
            <div className={s.stack}>
              <Card title="Conditions">
                <dl className={s.dl}>
                  <dt>Référence</dt><dd>{financing.external_reference}</dd>
                  <dt>Emprunteur</dt><dd>{entity?.name}</dd>
                  <dt>Prêteur</dt><dd>{lender?.name}</dd>
                  <dt>Signature</dt><dd>{fmt.date(financing.signature_date)}</dd>
                  <dt>Mise à disposition</dt><dd>{fmt.date(financing.availability_date)}</dd>
                  <dt>Maturité</dt><dd>{fmt.date(financing.maturity_date)}</dd>
                  <dt>Taux</dt><dd>{rateText(financing)}</dd>
                  <dt>Amortissement</dt><dd>{financing.amortization_profile}</dd>
                </dl>
              </Card>
              <Card title="Documents">
                <ul className={s.attention}>
                  {item.documents.map((d) => (
                    <li key={d.id}><Link className={s.attentionLink} to={paths.document(d.id)}>
                      <span className={s.infoIcon}><Icon name="documents" size={16} /></span>
                      <span className={s.attentionText}><span className={s.attentionTitle}>{d.title}</span><span>{DOCUMENT_TYPE_LABELS[d.document_type]} · {fmt.date(d.document_date)} · {d.page_count} pages</span></span>
                    </Link></li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </TabPanel>
      )}
      {tab === 'encours' && (
        <TabPanel idPrefix="financing" id="encours">
          <Card title="Encours déclarés" label="Registre des financements : une déclaration par date de test">
            <Table caption="Encours déclarés" rowKey={(d) => d.id} rows={item.declarations} empty="Aucun encours déclaré." columns={[
              { key: 'date', header: 'Date', render: (d) => <strong className="num">{fmt.date(d.as_of_date)}</strong> },
              { key: 'amount', header: 'Montant', align: 'right', render: (d) => <ClickableValue target={{ scope: 'outstanding', nodeId: d.id, occurrence: null }} text={fmt.money(d.amount)} /> },
              { key: 'source', header: 'Source', render: (d) => d.comment },
              { key: 'doc', header: 'Justificatif', render: (d) => { const doc = data.documents.find((x) => x.id === d.document_id); return doc ? <Link to={paths.document(doc.id)}>{doc.title}</Link> : <span className="muted">—</span>; } },
              { key: 'by', header: 'Saisi le', render: (d) => `${fmt.dateTime(d.created_at)} par ${userName(d.created_by)}` },
            ]} />
          </Card>
        </TabPanel>
      )}
      {tab === 'documents' && (
        <TabPanel idPrefix="financing" id="documents">
          <Card>
            <Table caption="Documents du financement" rowKey={(d) => d.id} rows={item.documents} onRowClick={(d) => navigate(paths.document(d.id))} rowLabel={(d) => `Ouvrir ${d.title}`} columns={[
              { key: 'title', header: 'Document', render: (d) => <span className={s.cellTitle}>{d.title}</span> },
              { key: 'type', header: 'Type', render: (d) => DOCUMENT_TYPE_LABELS[d.document_type] },
              { key: 'date', header: 'Date', render: (d) => fmt.date(d.document_date) },
              { key: 'pages', header: 'Pages', align: 'right', render: (d) => d.page_count },
              { key: 'up', header: 'Déposé le', render: (d) => `${fmt.dateTime(d.uploaded_at)} par ${userName(d.uploaded_by)}` },
            ]} />
          </Card>
        </TabPanel>
      )}
      {tab === 'historique' && (
        <TabPanel idPrefix="financing" id="historique">
          <Card title="Historique" label="Journal des actions sur ce financement, ses encours, ses documents et ses covenants">
            <Table caption="Historique du financement" rowKey={(e) => e.id} rows={events} empty="Aucun événement." columns={[
              { key: 'date', header: 'Date', render: (e) => fmt.dateTime(e.created_at) },
              { key: 'user', header: 'Par', render: (e) => userName(e.user_id) },
              { key: 'action', header: 'Action', render: (e) => AUDIT_ACTION_LABELS[e.action] },
              { key: 'target', header: 'Objet', render: (e) => e.target_label },
            ]} />
          </Card>
        </TabPanel>
      )}
    </>
  );
}
