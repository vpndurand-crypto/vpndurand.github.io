import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { METRIC_LABELS } from '../data/labels';
import { PageHeader } from '../features/layout/PageHeader';
import { useDemoState } from '../store/hooks';
import { selectBalanceView } from '../store/selectors';
import { Banner } from '../ui/Banner';
import { Button, ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import { NotFoundPage } from './NotFoundPage';
import s from './styles/pages.module.css';

/** Détail d'une balance (BETA-033) : lignes filtrables par agrégat, comptes cités surlignés. */
export function BalancePage() {
  const { balanceId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const view = selectBalanceView(useDemoState(), balanceId);
  const title = view ? `Balance au ${fmt.date(view.balance.period_end)}` : 'Balance introuvable';
  useDocumentTitle(title);
  const aggregate = params.get('agregat') ?? '';
  const accounts = params.get('comptes');
  useEffect(() => {
    window.document.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: 'center' });
  }, [balanceId, aggregate, accounts]);
  if (!view) return <NotFoundPage message="Cette balance n’existe pas" backTo={paths.data()} backLabel="Voir les données financières" />;
  const { balance, entity, job, importedBy } = view;
  const selected = view.aggregates.find((a) => a.code === aggregate) ?? null;
  const highlight = accounts ? accounts.split(',') : selected ? selected.accounts : [];
  const rows = selected ? view.rows.filter((r) => selected.accounts.includes(r.line.account_number)) : view.rows;
  return (
    <>
      <PageHeader title={title} breadcrumbs={[{ label: 'Données financières', to: paths.data() }, { label: title }]}
        subtitle={`${entity?.name ?? ''} · version ${balance.version} · ${balance.lines.length} lignes`}
        actions={<Button variant="secondary" icon="back" onClick={() => navigate(-1)}>Page précédente</Button>} />
      {view.replacement && (
        <Banner tone="modified" title={`Version remplacée par la version ${view.replacement.version}${balance.superseded_at ? ` le ${fmt.dateTime(balance.superseded_at)}` : ''}`}
          action={<ButtonLink to={paths.balance(view.replacement.id)} size="sm">Voir la version active</ButtonLink>}>
          Les calculs en cours utilisent la version active ; les calculs enregistrés gardent la version qu’ils citent.
        </Banner>
      )}
      <Card>
        <dl className={s.dl}>
          <dt>Fichier importé</dt><dd>{job?.file_name}</dd>
          <dt>Import</dt><dd>{job ? `${fmt.dateTime(job.created_at)} par ${importedBy ? `${importedBy.first_name} ${importedBy.last_name}` : job.created_by}` : '—'}</dd>
          <dt>Exercice ouvert le</dt><dd>{fmt.date(balance.fiscal_year_start)}</dd>
          <dt>Totaux</dt><dd className="num">Débit {fmt.money(balance.total_debit)} · Crédit {fmt.money(balance.total_credit)} (équilibrée)</dd>
          <dt>Statut</dt><dd>{balance.status === 'ACTIVE' ? 'Active : utilisée par les calculs' : 'Remplacée'}</dd>
        </dl>
      </Card>
      <div className={s.filters}>
        <Select id="balance-agregat" label="Agrégat" value={aggregate} onChange={(v) => setParams(v ? { agregat: v } : {})}
          options={[{ value: '', label: 'Tous les comptes' }, ...view.aggregates.map((a) => ({ value: a.code, label: `${a.code} · ${a.label} (${a.accounts.length} comptes)` }))]} />
        {(aggregate || accounts) && <Button variant="ghost" size="sm" icon="reset" onClick={() => setParams({})}>Afficher toutes les lignes</Button>}
        {accounts && <span className="muted">{highlight.length} {highlight.length > 1 ? 'comptes cités surlignés' : 'compte cité surligné'}</span>}
      </div>
      <Card>
        <Table caption={title} rowKey={(r) => r.line.account_number} rows={rows} highlightKeys={highlight} columns={[
          { key: 'row', header: 'Ligne', align: 'right', render: (r) => r.line.row },
          { key: 'account', header: 'Compte', render: (r) => <strong className="num">{r.line.account_number}</strong> },
          { key: 'label', header: 'Libellé', render: (r) => r.line.label },
          { key: 'debit', header: 'Débit', align: 'right', render: (r) => (r.line.debit === '0.00' ? '' : fmt.amount(r.line.debit)) },
          { key: 'credit', header: 'Crédit', align: 'right', render: (r) => (r.line.credit === '0.00' ? '' : fmt.amount(r.line.credit)) },
          { key: 'balance', header: 'Solde', align: 'right', render: (r) => fmt.amount(r.line.balance) },
          { key: 'metric', header: 'Agrégat', render: (r) => (r.metric ? <span className={s.cellSub}>{r.metric} · {METRIC_LABELS[r.metric]}</span> : '—') },
        ]} />
      </Card>
    </>
  );
}
