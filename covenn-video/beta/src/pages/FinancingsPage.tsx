import { useNavigate, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DATE_ARRETE } from '../config/demo';
import { FINANCING_CATEGORY_LABELS, STATUS_META } from '../data/labels';
import { rateParts } from '../features/financings/terms';
import { PageHeader } from '../features/layout/PageHeader';
import { ClickableValue } from '../features/provenance';
import { useDataView, useDemoState } from '../store/hooks';
import { selectFinancingList, sumAmounts, type FinancingListItem } from '../store/selectors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

export function FinancingsPage() {
  useDocumentTitle('Financements');
  const state = useDemoState();
  const data = useDataView();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const societe = params.get('societe') ?? '';
  const preteur = params.get('preteur') ?? '';
  const categorie = params.get('categorie') ?? '';
  const query = params.get('q') ?? '';
  const set = (key: string, value: string) => setParams((prev) => { const next = new URLSearchParams(prev); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: key === 'q' });
  const all = selectFinancingList(state).filter((i) => state.perimeter.includes(i.financing.entity_id));
  const rows = all.filter((i) => (!societe || i.financing.entity_id === societe) && (!preteur || i.financing.lender_id === preteur)
    && (!categorie || i.financing.category === categorie)
    && (!query || `${i.financing.label} ${i.financing.external_reference} ${i.lender?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())));
  const total = sumAmounts(rows.map((r) => r.outstanding?.amount ?? '0'));
  const filtered = Boolean(societe || preteur || categorie || query);
  return (
    <>
      <PageHeader title="Financements" subtitle={`${all.length} financements actifs, encours déclarés au ${fmt.date(DATE_ARRETE)}`} />
      <div className={s.filters}>
        <Select id="f-societe" label="Société" value={societe} onChange={(v) => set('societe', v)} options={[{ value: '', label: 'Toutes les sociétés' }, ...data.entities.map((e) => ({ value: e.id, label: e.name }))]} />
        <Select id="f-preteur" label="Prêteur" value={preteur} onChange={(v) => set('preteur', v)} options={[{ value: '', label: 'Tous les prêteurs' }, ...data.lenders.map((l) => ({ value: l.id, label: l.name }))]} />
        <Select id="f-categorie" label="Type" value={categorie} onChange={(v) => set('categorie', v)} options={[{ value: '', label: 'Tous les types' }, ...Object.entries(FINANCING_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))]} />
        <div className={s.search}>
          <label htmlFor="f-q">Recherche</label>
          <input id="f-q" type="search" value={query} placeholder="Libellé, référence, prêteur" onChange={(e) => set('q', e.target.value)} />
        </div>
        {filtered && <Button variant="ghost" size="sm" icon="reset" onClick={() => setParams({})}>Effacer les filtres</Button>}
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="search" title="Aucun financement ne correspond à ces filtres" action={<Button variant="secondary" onClick={() => setParams({})}>Effacer les filtres</Button>} />
        ) : (
          <Table<FinancingListItem> dense caption="Financements" rowKey={(i) => i.financing.id} rows={rows} onRowClick={(i) => navigate(paths.financing(i.financing.id))}
            rowLabel={(i) => `Ouvrir la fiche ${i.financing.label}`}
            footer={<tr><td colSpan={5}>Total des encours{filtered ? ' (filtre appliqué)' : ''}</td><td style={{ textAlign: 'right' }} className="num">{fmt.money(total)}</td><td colSpan={3} /></tr>}
            columns={[
              { key: 'label', header: 'Financement', sortValue: (i) => i.financing.label, render: (i) => (
                <span className={s.cellMain}>
                  <span className={s.cellTitle} style={{ whiteSpace: 'nowrap' }}>{i.financing.label}</span>
                  <span className={s.cellSub}>{i.financing.external_reference} · {i.entity?.short_name}</span>
                  {i.covenants.length > 0 && <span><span className={s.tag}>Financement à covenants</span></span>}
                </span>
              ) },
              { key: 'lender', header: 'Prêteur', sortValue: (i) => i.lender?.name ?? '', render: (i) => i.lender?.name },
              { key: 'type', header: 'Type', render: (i) => FINANCING_CATEGORY_LABELS[i.financing.category] },
              { key: 'initial', header: 'Montant initial', align: 'right', render: (i) => (i.financing.initial_amount ? fmt.money(i.financing.initial_amount) : i.financing.authorized_limit ? <span className={s.cellMain}><span>{fmt.money(i.financing.authorized_limit)}</span><span className={s.cellSub}>plafond</span></span> : '—') },
              { key: 'rate', header: 'Taux', render: (i) => { const [main, sub] = rateParts(i.financing); return <span className={s.cellMain}><span style={{ whiteSpace: 'nowrap' }}>{main}</span><span className={s.cellSub}>{sub}</span></span>; } },
              { key: 'outstanding', header: `Encours au ${fmt.date(DATE_ARRETE)}`, align: 'right', sortValue: (i) => Number(i.outstanding?.amount ?? 0), render: (i) => (i.outstanding
                ? <ClickableValue target={{ scope: 'outstanding', nodeId: i.outstanding.id, occurrence: null }} text={fmt.money(i.outstanding.amount)} />
                : <span className="muted">Non déclaré</span>) },
              { key: 'maturity', header: 'Échéance', sortValue: (i) => i.financing.maturity_date, render: (i) => <span className="num" style={{ whiteSpace: 'nowrap' }}>{fmt.date(i.financing.maturity_date)}</span> },
              { key: 'covenants', header: 'Covenants', render: (i) => {
                const worst = [...i.covenants].filter((c) => c.result).sort((a, b) => STATUS_META[a.result!.status].severity - STATUS_META[b.result!.status].severity)[0];
                return worst?.result ? <span className={s.cellMain}><span style={{ whiteSpace: 'nowrap' }}>{worst.covenant.short_label} <StatusBadge status={worst.result.status} size="sm" short /></span><span className={s.cellSub}>{i.covenants.length} covenants suivis</span></span> : <span className="muted">Aucun</span>;
              } },
              { key: 'status', header: 'Statut', render: (i) => (i.financing.status === 'ACTIVE' ? 'Actif' : 'Clos') },
            ]} />
        )}
      </Card>
    </>
  );
}
