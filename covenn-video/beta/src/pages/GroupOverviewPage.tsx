import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DATE_ARRETE, DEMO_TODAY } from '../config/demo';
import { STATUS_META } from '../data/labels';
import { CovenantCard } from '../features/covenant';
import { PageHeader } from '../features/layout/PageHeader';
import { ClickableValue } from '../features/provenance';
import { useDataView, useDemoState } from '../store/hooks';
import { selectCovenantList, selectKpis, type CovenantListItem } from '../store/selectors';
import { Card } from '../ui/Card';
import { DistributionBars } from '../ui/charts';
import { TabPanel, Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { Icon, type IconName } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';
import { Table } from '../ui/Table';
import { Tooltip } from '../ui/Tooltip';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

interface Attention { key: string; icon: IconName; tone: 'watch' | 'ok' | 'info'; title: string; text: string; to: string }

function addMonths(iso: string, months: number): string {
  const [y = 0, m = 1] = iso.split('-').map(Number);
  const index = y * 12 + (m - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-${iso.slice(8, 10)}`;
}

/** Vue groupe (BETA-052) : situation, covenant le plus proche du seuil, points d'attention, covenants, répartition. */
export function GroupOverviewPage() {
  useDocumentTitle('Vue groupe');
  const state = useDemoState();
  const data = useDataView();
  const navigate = useNavigate();
  const kpis = selectKpis(state);
  const [axis, setAxis] = useState<'preteur' | 'type' | 'maturite'>('preteur');
  const covenants = selectCovenantList(state).filter((c) => state.perimeter.includes(c.covenant.entity_id));
  const ranked = [...covenants].filter((c) => c.result?.headroomPct).sort((a, b) => Number(a.result?.headroomPct) - Number(b.result?.headroomPct));
  const closest = ranked[0];
  const watch = covenants.filter((c) => c.result && STATUS_META[c.result.status].tone !== 'ok');
  const kpiTarget = (nodeId: string) => ({ scope: 'kpi', nodeId, occurrence: null });

  const attention: Attention[] = [];
  for (const c of watch) {
    if (!c.result?.headroomPct) continue;
    attention.push({ key: `w-${c.covenant.id}`, icon: 'warning', tone: 'watch', title: `${c.covenant.short_label} : ${STATUS_META[c.result.status].label.toLowerCase()}`,
      text: `Marge de ${fmt.pct(c.result.headroomPct)} sous le seuil au ${fmt.date(c.result.calcDate)}`, to: paths.covenant(c.covenant.id) });
  }
  const computable = covenants.filter((c) => c.result && c.result.status !== 'NOT_COMPUTABLE');
  for (const c of computable) {
    const saved = c.view.latestSaved;
    if (c.savedUpToDate && saved) {
      attention.push({ key: `s-${c.covenant.id}`, icon: 'check', tone: 'ok', title: `${c.covenant.short_label} au ${fmt.date(DATE_ARRETE)} : calcul enregistré`, text: `Figé le ${fmt.dateTime(saved.closed_at)} · empreinte ${saved.snapshot.inputs_hash.slice(0, 8)}`, to: paths.covenant(c.covenant.id) });
    }
  }
  const pending = computable.filter((c) => !c.savedUpToDate);
  if (pending[0]) {
    attention.push({ key: 'pending', icon: 'save', tone: 'info', title: `${pending.length} ${pending.length > 1 ? 'calculs' : 'calcul'} au ${fmt.date(DATE_ARRETE)} à enregistrer`,
      text: `${pending.map((c) => c.covenant.short_label).join(', ')} : calcul en cours, non figé`, to: paths.covenant(pending[0].covenant.id) });
  }
  for (const c of covenants) {
    const step = c.result?.nextThresholdStep;
    if (step && c.result) attention.push({ key: `t-${c.covenant.id}`, icon: 'calendar', tone: 'info', title: `Seuil du ${c.covenant.short_label} abaissé à ${fmt.ratio(step.threshold)}`, text: `À compter du ${fmt.date(step.from_date)}`, to: paths.covenant(c.covenant.id, { onglet: 'definition' }) });
  }
  const horizon = addMonths(DEMO_TODAY, 12);
  for (const f of data.financings.filter((x) => state.perimeter.includes(x.entity_id) && x.maturity_date <= horizon)) {
    attention.push({ key: `m-${f.id}`, icon: 'calendar', tone: 'info', title: `Maturité du ${f.label.toLowerCase()}`, text: `Le ${fmt.date(f.maturity_date)} · à refinancer ou renouveler`, to: paths.financing(f.id) });
  }
  const nextTest = covenants.map((c) => c.nextTestDate).filter((d): d is string => Boolean(d)).sort()[0];
  if (nextTest) attention.push({ key: 'next', icon: 'schedule', tone: 'info', title: 'Prochain test des covenants', text: `Le ${fmt.date(nextTest)}`, to: paths.covenants() });

  const statusWatch = watch.length;
  return (
    <>
      <PageHeader title="Vue groupe" subtitle={`${data.organization.name} · ${kpis.entityCount} sociétés · données au ${fmt.date(DATE_ARRETE)}`} />
      <section className={s.kpis} aria-label="Situation du groupe">
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Encours total</span>
          <span className={s.kpiValue}><ClickableValue target={kpiTarget(kpis.outstanding.id)} text={fmt.compact(kpis.outstanding.value ?? '0')} title={fmt.money(kpis.outstanding.value ?? '0')} size="inherit" /></span>
          <span className={s.kpiSub}>{kpis.financingCount} financements actifs · {kpis.lenderCount} {kpis.lenderCount > 1 ? 'prêteurs' : 'prêteur'}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Trésorerie comptable</span>
          <span className={s.kpiValue}><ClickableValue target={kpiTarget(kpis.cash.id)} text={fmt.compact(kpis.cash.value ?? '0')} title={fmt.money(kpis.cash.value ?? '0')} size="inherit" /></span>
          <span className={s.kpiSub}>Balances au {fmt.date(DATE_ARRETE)}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>
            Dette nette de gestion
            <Tooltip content="Encours total moins trésorerie comptable du périmètre. Elle se distingue de l’endettement financier net défini par chaque contrat."><span tabIndex={0} aria-label="Définition"><Icon name="info" size={14} /></span></Tooltip>
          </span>
          <span className={s.kpiValue}><ClickableValue target={kpiTarget(kpis.netDebt.id)} text={fmt.compact(kpis.netDebt.value ?? '0')} title={fmt.money(kpis.netDebt.value ?? '0')} size="inherit" /></span>
          <span className={s.kpiSub}>Encours − trésorerie</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiLabel}>Covenants</span>
          <Link className={s.kpiLink} to={paths.covenants(statusWatch ? { statut: 'WATCH' } : {})}>{covenants.length}</Link>
          <span className={s.kpiSub}>{statusWatch ? `dont ${statusWatch} en vigilance ou à risque` : 'tous respectés'}</span>
        </div>
      </section>
      <div className={s.row84}>
        <Card title="Covenant le plus proche du seuil" label={closest ? `${closest.entity?.name ?? ''} · ${closest.financing?.label ?? ''} · ${closest.lender?.name ?? ''}` : undefined} signature>
          {closest ? <CovenantCard item={closest} showComponents showConversions /> : <EmptyState icon="covenants" title="Aucun covenant sur ce périmètre" />}
        </Card>
        <Card title="Points d’attention">
          <ul className={s.attention}>
            {attention.map((a) => (
              <li key={a.key}>
                <Link to={a.to} className={s.attentionLink}>
                  <span className={a.tone === 'watch' ? s.watchIcon : a.tone === 'ok' ? s.okIcon : s.infoIcon}><Icon name={a.icon} size={16} /></span>
                  <span className={s.attentionText}><span className={s.attentionTitle}>{a.title}</span><span className="muted">{a.text}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className={s.row75}>
        <Card title="Covenants du groupe" label={`Valeurs au ${fmt.date(DATE_ARRETE)} : calcul enregistré s’il est à jour, sinon calcul en cours`}>
          <Table<CovenantListItem> dense caption="Covenants du groupe" rowKey={(c) => c.covenant.id} rows={covenants} onRowClick={(c) => navigate(paths.covenant(c.covenant.id))}
            rowLabel={(c) => `Ouvrir le covenant ${c.covenant.short_label}`} columns={[
              { key: 'name', header: 'Covenant', render: (c) => <span className={s.cellMain}><span className={s.cellTitle}>{c.covenant.short_label}</span><span className={s.cellSub}>{c.financing?.external_reference}</span></span> },
              { key: 'value', header: 'Valeur', align: 'right', render: (c) => (c.result?.valueExact ? <ClickableValue target={{ scope: c.view.key, nodeId: c.view.key, occurrence: c.savedUpToDate ? c.view.latestSaved?.occurrence ?? null : null }} text={fmt.covenant(c.result.valueExact, c.result.threshold, c.result.form)} /> : '—') },
              { key: 'threshold', header: 'Seuil', align: 'right', render: (c) => (c.result ? fmt.threshold(c.result.comparison, c.result.threshold, c.result.form) : '—') },
              { key: 'headroom', header: 'Headroom', align: 'right', render: (c) => (c.result?.headroomPct ? fmt.pct(c.result.headroomPct) : '—') },
              { key: 'status', header: 'Statut', render: (c) => (c.result ? <StatusBadge status={c.result.status} size="sm" short /> : '—') },
              { key: 'calc', header: 'Calcul', render: (c) => (c.savedUpToDate ? <span className={s.cellMain}><span>Enregistré</span><span className={s.cellSub}>{c.view.latestSaved ? fmt.date(c.view.latestSaved.closed_at) : ''}</span></span> : <span className="muted">En cours</span>) },
            ]} />
        </Card>
        <Card title="Répartition de l’encours" label={`Total ${fmt.money(kpis.outstanding.value ?? '0')} au ${fmt.date(DATE_ARRETE)}`}>
          <Tabs idPrefix="repartition" ariaLabel="Axe de répartition" value={axis} onChange={(id) => setAxis(id as typeof axis)}
            items={[{ id: 'preteur', label: 'Par prêteur' }, { id: 'type', label: 'Par type' }, { id: 'maturite', label: 'Par maturité' }]} />
          <TabPanel idPrefix="repartition" id={axis}>
            {axis === 'preteur' && <DistributionBars ariaLabel="Encours par prêteur" items={kpis.byLender.map((l) => ({
              key: l.lenderId, label: l.label, amountText: fmt.compact(l.amount), share: Number(l.share), shareText: fmt.pct(l.share),
              onSelect: () => navigate(paths.financings({ preteur: l.lenderId })),
            }))} />}
            {axis === 'type' && <DistributionBars ariaLabel="Encours par type" items={kpis.byCategory.map((c) => ({
              key: c.key, label: c.label, amountText: fmt.compact(c.amount), share: Number(c.share), shareText: fmt.pct(c.share),
              onSelect: () => navigate(paths.financings({ categorie: c.key })),
            }))} />}
            {axis === 'maturite' && <DistributionBars ariaLabel="Encours par année de maturité" items={kpis.byMaturityYear.map((m) => ({
              key: m.key, label: `Maturité ${m.label}`, amountText: fmt.compact(m.amount), share: Number(m.share), shareText: fmt.pct(m.share),
            }))} />}
          </TabPanel>
        </Card>
      </div>
    </>
  );
}
