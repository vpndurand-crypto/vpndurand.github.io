import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { STATUS_THRESHOLDS } from '../config/demo';
import { PageHeader } from '../features/layout/PageHeader';
import { reimportModifiedBalance, resetDemo, showToast } from '../store/actions';
import { useDataView, useDemoDispatch, useDemoState } from '../store/hooks';
import { isPristine, pickPersisted } from '../store/persistence';
import { Button, ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { Table } from '../ui/Table';
import { fmt } from '../ui/values';
import s from './styles/pages.module.css';

/** Paramètres (BETA-065, sous-ensemble) : état et réinitialisation de la démonstration, réimport modifié, organisation, seuils. */
export function SettingsPage() {
  useDocumentTitle('Paramètres');
  const state = useDemoState();
  const data = useDataView();
  const dispatch = useDemoDispatch();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<'reset' | 'reimport' | null>(null);
  const pristine = isPristine(pickPersisted(state));
  const reimport = state.balanceReimports[0] ?? null;
  const preview = reimportModifiedBalance(state);
  const reimportEvent = preview.type === 'REIMPORT_BALANCE' ? preview.audit[0] : undefined;
  const affected = data.covenants.find((c) => c.entity_id === reimportEvent?.entity_id && state.savedTests.some((t) => t.covenant_id === c.id))
    ?? data.covenants.find((c) => c.entity_id === reimportEvent?.entity_id);
  const covenantLabel = (id: string) => data.covenants.find((c) => c.id === id)?.short_label ?? id;

  const doReset = () => {
    setConfirm(null);
    dispatch(resetDemo());
    dispatch(showToast('Démonstration réinitialisée', 'Toutes les données sont revenues à leur état initial.'));
    navigate(paths.overview());
  };
  const doReimport = () => {
    setConfirm(null);
    dispatch(reimportModifiedBalance(state));
    dispatch(showToast('Balance version 2 importée', 'Les calculs enregistrés restent figés ; leur fiche signale l’écart.'));
  };

  return (
    <>
      <PageHeader title="Paramètres" subtitle={`${data.organization.name} · démonstration et données de référence`} />
      <div className={s.row75}>
        <div className={s.stack}>
          <Card title="Démonstration" label="À utiliser avant chaque prise">
            <p className={s.stateLine}>
              <Icon name={pristine ? 'check' : 'info'} size={16} />
              {pristine ? 'État initial : aucune action de démonstration enregistrée.' : 'Démonstration en cours : des actions ont été enregistrées depuis l’état initial.'}
            </p>
            <dl className={s.dl}>
              <dt>Calculs enregistrés</dt>
              <dd>{state.savedTests.length === 0 ? 'Aucun pendant la démonstration' : state.savedTests.map((t) => `${covenantLabel(t.covenant_id)} au ${fmt.date(t.test_date)} · empreinte ${t.snapshot.inputs_hash.slice(0, 8)}`).join(' ; ')}</dd>
              <dt>Journal</dt><dd>{state.auditAppended.length === 0 ? 'Aucun événement ajouté' : `${state.auditAppended.length} ${state.auditAppended.length > 1 ? 'événements ajoutés' : 'événement ajouté'}`}</dd>
              <dt>Réimport modifié</dt><dd>{reimport ? `Appliqué le ${fmt.dateTime(reimport.at)}` : 'Non appliqué'}</dd>
              <dt>Périmètre</dt><dd>{state.perimeter.length} {state.perimeter.length > 1 ? 'sociétés' : 'société'} sur {data.entities.length}</dd>
              <dt>Sauvegarde locale</dt><dd>{state.ui.storageAvailable ? 'Active : l’état est conservé au rechargement de la page' : 'Indisponible dans ce navigateur : l’état repart de l’état initial à chaque ouverture'}</dd>
            </dl>
            <div className={s.settingsActions}>
              <Button icon="reset" disabledReason={pristine ? 'La démonstration est déjà dans son état initial' : undefined} onClick={() => setConfirm('reset')}>Réinitialiser la démonstration</Button>
            </div>
            <p className={s.help}>Le calcul du Leverage au 30/09/2026 redevient « en cours, non enregistré » ; financements, contrats, balances et calculs de référence ne changent pas.</p>
          </Card>
          <Card title="Données de démonstration" label="Montrer qu’un calcul enregistré reste figé">
            <p>
              Simule l’import d’une nouvelle version : {reimportEvent?.target_label}. Trésorerie {reimportEvent?.before?.['trésorerie']} → {reimportEvent?.after?.['trésorerie']}.
            </p>
            <p className={s.help}>Enregistrez d’abord le calcul du Leverage, puis réimportez : le calcul enregistré ne change pas, et sa fiche signale l’écart avec les données courantes.</p>
            <div className={s.settingsActions}>
              <Button variant="secondary" icon="data" disabledReason={reimport ? 'Réimport déjà appliqué : réinitialisez la démonstration pour revenir à la version 1' : undefined}
                onClick={() => setConfirm('reimport')}>Réimporter la balance modifiée</Button>
              {reimport && affected && <ButtonLink to={paths.covenant(affected.id)} variant="ghost" icon="covenants">Voir l’effet sur le {affected.short_label}</ButtonLink>}
            </div>
          </Card>
        </div>
        <div className={s.stack}>
          <Card title="Organisation" label={data.organization.name}>
            <Table caption="Sociétés" rowKey={(e) => e.id} rows={data.entities} columns={[
              { key: 'name', header: 'Société', render: (e) => e.name },
              { key: 'close', header: 'Clôture', render: (e) => `${String(e.fiscal_year_end_day).padStart(2, '0')}/${String(e.fiscal_year_end_month).padStart(2, '0')}` },
            ]} />
            <div style={{ height: 16 }} />
            <Table caption="Utilisateurs" rowKey={(u) => u.id} rows={data.users} columns={[
              { key: 'name', header: 'Utilisateur', render: (u) => `${u.first_name} ${u.last_name}` },
              { key: 'job', header: 'Fonction', render: (u) => u.job_title },
            ]} />
          </Card>
          <Card title="Seuils de statut" label="Lecture seule · marge relative par rapport au seuil">
            <dl className={s.dl}>
              <dt><StatusBadge status="COMPLIANT" size="sm" /></dt><dd>Marge ≥ {fmt.pct(STATUS_THRESHOLDS.compliant, 0)}</dd>
              <dt><StatusBadge status="WATCH" size="sm" short /></dt><dd>Marge ≥ {fmt.pct(STATUS_THRESHOLDS.watch, 0)} et &lt; {fmt.pct(STATUS_THRESHOLDS.compliant, 0)}</dd>
              <dt><StatusBadge status="CRITICAL" size="sm" short /></dt><dd>Seuil respecté, marge &lt; {fmt.pct(STATUS_THRESHOLDS.watch, 0)}</dd>
              <dt><StatusBadge status="BREACH" size="sm" short /></dt><dd>Seuil dépassé</dd>
            </dl>
          </Card>
        </div>
      </div>
      <Modal open={confirm === 'reset'} title="Réinitialiser la démonstration ?" confirmLabel="Réinitialiser la démonstration" onConfirm={doReset} onCancel={() => setConfirm(null)}>
        <p>L’état actuel de la démonstration sera restauré à l’état initial : les calculs enregistrés pendant la démonstration, le réimport modifié, le périmètre et les événements ajoutés au journal sont effacés.</p>
        <p className={s.help}>Les données de référence (financements, contrats, balances, calculs du 31/03 et du 30/06/2026) ne changent pas.</p>
      </Modal>
      <Modal open={confirm === 'reimport'} title="Réimporter la balance modifiée ?" confirmLabel="Réimporter" onConfirm={doReimport} onCancel={() => setConfirm(null)}>
        <p>La version 2 de la balance remplace la version 1 pour les calculs en cours. Les calculs déjà enregistrés restent figés sur la version 1.</p>
      </Modal>
    </>
  );
}
