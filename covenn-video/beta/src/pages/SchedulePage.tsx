import { Link, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { SCHEDULE_KIND_LABELS } from '../data/labels';
import type { ScheduleKind } from '../data/types';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { selectAlerts } from '../store/selectors';
import { Banner } from '../ui/Banner';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { PreviewBadge } from '../ui/PreviewBadge';
import { Select } from '../ui/Select';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Échéances (aperçu, BETA-071) : chronologie saisie pour la démonstration et alertes, en lecture seule. */
export function SchedulePage() {
  useDocumentTitle('Échéances');
  const state = useDemoState();
  const data = useDataView();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const events = data.preview.schedule.filter((e) => state.perimeter.includes(e.entity_id) && (!type || e.kind === type)).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const alerts = selectAlerts(state).filter((a) => state.perimeter.includes(a.entity_id));
  const months = [...new Set(events.map((e) => e.event_date.slice(0, 7)))];
  const financing = (id: string) => data.financings.find((f) => f.id === id);
  return (
    <>
      <PageHeader title="Échéances" badge={<PreviewBadge />} subtitle="Douze prochains mois : tests de covenants, échéances, maturités et marches de seuil" />
      <Banner tone="info" title="Aperçu : cette page illustre la direction de Covenn">
        Les dates et montants sont saisis pour la démonstration ; aucun échéancier n’est calculé et aucune alerte n’est envoyée.
      </Banner>
      <div className={s.row75}>
        <Card title="Chronologie">
          <div className={s.filters} style={{ marginBottom: 16 }}>
            <Select id="e-type" label="Type" value={type} onChange={(v) => setParams(v ? { type: v } : {})}
              options={[{ value: '', label: 'Tous les types' }, ...(Object.keys(SCHEDULE_KIND_LABELS) as ScheduleKind[]).map((k) => ({ value: k, label: SCHEDULE_KIND_LABELS[k] }))]} />
          </div>
          {months.map((month) => (
            <div key={month}>
              <h3 className={s.month}>{MONTHS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}</h3>
              <Table caption={`Échéances de ${month}`} rowKey={(e) => e.id} rows={events.filter((e) => e.event_date.startsWith(month))} columns={[
                { key: 'date', header: 'Date', render: (e) => <strong className="num">{fmt.date(e.event_date)}</strong> },
                { key: 'kind', header: 'Type', render: (e) => SCHEDULE_KIND_LABELS[e.kind] },
                { key: 'label', header: 'Événement', render: (e) => (e.covenant_ids.length === 1 && e.covenant_ids[0]
                  ? <Link to={paths.covenant(e.covenant_ids[0], { onglet: 'definition' })}>{e.label}</Link> : e.label) },
                { key: 'financing', header: 'Financement', render: (e) => { const f = financing(e.financing_id); return f ? <Link to={paths.financing(f.id)}>{f.label}</Link> : '—'; } },
                { key: 'amount', header: 'Montant', align: 'right', render: (e) => (e.total ? <span className={s.cellMain}><span>{fmt.money(e.total)}</span><span className={s.cellSub}>capital {fmt.money(e.principal ?? '0')}</span></span> : '—') },
              ]} />
            </div>
          ))}
          {data.preview.scheduleGaps.filter((g) => state.perimeter.includes(financing(g.financing_id)?.entity_id ?? '')).map((g) => (
            <p key={g.financing_id} className={s.help}>{financing(g.financing_id)?.label} : {g.note}</p>
          ))}
        </Card>
        <Card title="Alertes" label="Lecture seule">
          <ul className={s.attention}>
            {alerts.map((a) => (
              <li key={a.id}>
                <Link to={a.target.kind === 'COVENANT' ? paths.covenant(a.target.id) : paths.financing(a.target.id)} className={s.attentionLink}>
                  <span className={a.severity === 'WATCH' ? s.watchIcon : s.infoIcon}><Icon name={a.severity === 'WATCH' ? 'warning' : 'calendar'} size={16} /></span>
                  <span className={s.attentionText}><span className={s.attentionTitle}>{a.title}</span><span className="muted">{a.message}</span><span className="muted">Échéance : {fmt.date(a.due_date)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
