import { useLayoutEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DATE_ARRETE } from '../config/demo';
import { AUDIT_ACTION_LABELS, STATUS_META } from '../data/labels';
import { CovenantHistoryCard, CovenantResultCard, DecompositionTree, DefinitionView, SaveTestDialog, TestHistory } from '../features/covenant';
import { PageHeader } from '../features/layout/PageHeader';
import { closeProvenance, saveTest, showToast } from '../store/actions';
import { useDataView, useDemoDispatch, useDemoState } from '../store/hooks';
import { selectCovenantView, selectTestHistory } from '../store/selectors';
import { Banner } from '../ui/Banner';
import { Button, ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { Table } from '../ui/Table';
import { TabPanel, Tabs } from '../ui/Tabs';
import { fmt } from '../ui/values';
import { NotFoundPage } from './NotFoundPage';
import cs from '../features/covenant/covenant.module.css';
import s from './styles/pages.module.css';

const TABS = [{ id: 'suivi', label: 'Suivi' }, { id: 'definition', label: 'Définition' }, { id: 'calculs', label: 'Calculs' }] as const;
const isIsoDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export function CovenantPage() {
  const { covenantId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const data = useDataView();
  const covenant = data.covenants.find((c) => c.id === covenantId);
  const rawDate = params.get('date');
  const date = isIsoDate(rawDate) ? rawDate : DATE_ARRETE;
  const [showCurrent, setShowCurrent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useLayoutEffect(() => { setShowCurrent(false); }, [date, covenantId]);
  useDocumentTitle(covenant?.short_label ?? 'Covenant introuvable');
  if (!covenant) return <NotFoundPage message="Ce covenant n’existe pas" backTo={paths.covenants()} backLabel="Voir les covenants" />;

  const tab = TABS.find((t) => t.id === params.get('onglet'))?.id ?? 'suivi';
  const update = (key: string, value: string) => setParams((prev) => { const next = new URLSearchParams(prev); next.set(key, value); return next; });
  const view = selectCovenantView(state, covenant.id, date);
  const history = selectTestHistory(state, covenant.id);
  const definition = view.current.definition;
  const financing = data.financings.find((f) => covenant.financing_ids.includes(f.id));
  const lender = financing ? data.lenders.find((l) => l.id === financing.lender_id) : undefined;
  const entity = data.entities.find((e) => e.id === covenant.entity_id);
  const snapshot = view.latestSaved && !(view.modifiedSinceSave && showCurrent) ? view.latestSaved : null;
  const result = snapshot ? snapshot.snapshot.result : view.current.result;
  const canSave = !snapshot && view.current.canonical !== null;
  const returnTo = `${location.pathname}${location.search}`;
  const title = `${covenant.short_label} au ${fmt.date(date)}`;
  const options = history.map((h) => ({ value: h.date, label: `${fmt.date(h.date)} — ${h.view.displayed ? STATUS_META[h.view.displayed.status].label : 'non calculable'}` }));
  if (!options.some((o) => o.value === date)) options.push({ value: date, label: fmt.date(date) });
  const threshold = definition?.threshold_steps.find((t) => t.id === result?.thresholdStep.id) ?? definition?.threshold_steps[0];

  const confirmSave = () => {
    const action = saveTest(state, covenant.id, date);
    dispatch(action);
    dispatch(closeProvenance());
    if (action.type === 'SAVE_TEST') dispatch(showToast('Calcul enregistré', `${title} · empreinte ${action.test.snapshot.inputs_hash.slice(0, 8)}`));
    setConfirming(false);
    setShowCurrent(false);
  };
  const tests = data.savedTests.filter((t) => t.covenant_id === covenant.id).sort((a, b) => b.closed_at.localeCompare(a.closed_at));
  const events = data.audit.filter((e) => e.target_id.startsWith(`${covenant.id}@`) || e.target_id === definition?.id || (e.action === 'ADJUSTMENT_SAVED' && e.target_label.includes(covenant.short_label)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHeader
        title={covenant.short_label}
        badge={result ? <StatusBadge status={result.status} /> : undefined}
        breadcrumbs={[{ label: 'Covenants', to: paths.covenants() }, { label: covenant.short_label }]}
        subtitle={
          <span className={s.meta}>
            <span>{entity?.name}</span><span aria-hidden="true">·</span>
            {financing && <Link to={paths.financing(financing.id)}>{financing.label}</Link>}<span aria-hidden="true">·</span>
            <span>{lender?.name}</span><span aria-hidden="true">·</span><span>{covenant.label.split('—')[1]?.trim()}</span>
          </span>
        }
        actions={
          <div className={s.headerActions}>
            <Select id="covenant-date" label="Date de test" value={date} options={options} onChange={(value) => update('date', value)} />
            {threshold && <ButtonLink to={paths.document(threshold.clause.document_id, { page: threshold.clause.page, clause: threshold.clause.clause_id, retour: returnTo })} icon="documents">Voir la clause du contrat</ButtonLink>}
          </div>
        }
      />
      <Tabs idPrefix="covenant" ariaLabel="Sections du covenant" items={TABS} value={tab} onChange={(id) => update('onglet', id)} />
      {tab === 'suivi' && (
        <TabPanel idPrefix="covenant" id="suivi">
          <div className={cs.stack}>
            {view.modifiedSinceSave && view.latestSaved && view.current.result?.valueExact && (
              <Banner tone="modified" title="Données modifiées depuis l’enregistrement"
                action={<Button variant="secondary" size="sm" onClick={() => setShowCurrent((v) => !v)}>{showCurrent ? 'Revenir au calcul enregistré' : 'Voir le calcul actuel'}</Button>}>
                Calcul actuel : {fmt.covenant(view.current.result.valueExact, view.current.result.threshold, view.current.result.form)}{view.valueDelta ? ` (${fmt.signedRatio(view.valueDelta)})` : ''}. Le calcul enregistré reste figé.
              </Banner>
            )}
            <CovenantResultCard covenant={covenant} date={date} result={result} error={view.current.error?.message ?? null} snapshot={snapshot} data={data}
              saveLabel={canSave ? (view.latestSaved ? 'Enregistrer ce nouveau calcul' : 'Enregistrer le calcul') : null} onSave={() => setConfirming(true)}
              calculationTo={paths.calculation(covenant.id, date)} />
            <div className={cs.split}>
              <Card title="Décomposition du calcul" label="Chaque montant ouvre sa provenance">
                {result && result.status !== 'NOT_COMPUTABLE'
                  ? <DecompositionTree key={`${view.key}-${snapshot?.occurrence ?? 'courant'}`} result={result} scope={view.key} occurrence={snapshot?.occurrence ?? null} data={data} />
                  : <p className="muted">Aucune décomposition : le calcul n’est pas possible à cette date.</p>}
              </Card>
              {definition && <CovenantHistoryCard covenantId={covenant.id} label={covenant.short_label} definition={definition} entries={history} activeDate={date} onSelect={(d) => update('date', d)} />}
            </div>
            <Card title="Calculs de ce covenant">
              <TestHistory entries={history} activeDate={date} onSelect={(d) => update('date', d)} data={data} />
            </Card>
          </div>
        </TabPanel>
      )}
      {tab === 'definition' && (
        <TabPanel idPrefix="covenant" id="definition">
          {definition ? <DefinitionView covenant={covenant} definition={definition} data={data} returnTo={returnTo} /> : <p>Aucune définition validée à cette date.</p>}
        </TabPanel>
      )}
      {tab === 'calculs' && (
        <TabPanel idPrefix="covenant" id="calculs">
          <div className={cs.stack}>
            <Card title="Calculs enregistrés" label="Chaque calcul enregistré est figé avec son empreinte">
              <Table caption="Calculs enregistrés" rowKey={(t) => `${t.key}#${t.occurrence}`} rows={tests} onRowClick={(t) => { update('date', t.test_date); update('onglet', 'suivi'); }}
                rowLabel={(t) => `Afficher le calcul au ${fmt.date(t.test_date)}`} empty="Aucun calcul enregistré." columns={[
                  { key: 'date', header: 'Date de test', render: (t) => <strong className="num">{fmt.date(t.test_date)}</strong> },
                  { key: 'occ', header: 'Occurrence', align: 'right', render: (t) => t.occurrence },
                  { key: 'value', header: 'Valeur', align: 'right', render: (t) => (t.snapshot.result.valueExact ? fmt.covenant(t.snapshot.result.valueExact, t.snapshot.result.threshold, t.snapshot.result.form) : '—') },
                  { key: 'status', header: 'Statut', render: (t) => <StatusBadge status={t.snapshot.result.status} size="sm" /> },
                  { key: 'closed', header: 'Enregistré le', render: (t) => fmt.dateTime(t.closed_at) },
                  { key: 'hash', header: 'Empreinte', render: (t) => <span className="num" title={t.snapshot.inputs_hash}>{t.snapshot.inputs_hash.slice(0, 12)}</span> },
                ]} />
            </Card>
            <Card title="Journal de ce covenant">
              <Table caption="Événements du covenant" rowKey={(e) => e.id} rows={events} empty="Aucun événement." columns={[
                { key: 'date', header: 'Date', render: (e) => fmt.dateTime(e.created_at) },
                { key: 'action', header: 'Action', render: (e) => AUDIT_ACTION_LABELS[e.action] },
                { key: 'target', header: 'Objet', render: (e) => e.target_label },
                { key: 'detail', header: 'Détail', render: (e) => (e.after ? Object.entries(e.after).map(([k, v]) => `${k} : ${v}`).join(' · ') : '—') },
              ]} />
            </Card>
          </div>
        </TabPanel>
      )}
      <SaveTestDialog open={confirming} label={`${title}, calculé à partir des données au ${fmt.date(date)}.`} result={view.current.result} onConfirm={confirmSave} onCancel={() => setConfirming(false)} />
    </>
  );
}
