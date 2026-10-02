import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DATE_ARRETE } from '../config/demo';
import type { DecompositionNode } from '../data/types';
import { SaveTestDialog } from '../features/covenant';
import { PageHeader } from '../features/layout/PageHeader';
import { ClickableValue, describeSource } from '../features/provenance';
import { closeProvenance, saveTest, showToast } from '../store/actions';
import { useDataView, useDemoDispatch, useDemoState } from '../store/hooks';
import { selectCovenantView } from '../store/selectors';
import { Button, ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { cx } from '../ui/cx';
import { Icon } from '../ui/Icon';
import { SourceChip } from '../ui/SourceChip';
import { StatusBadge } from '../ui/StatusBadge';
import { fmt } from '../ui/values';
import { NotFoundPage } from './NotFoundPage';
import s from './styles/pages.module.css';

const STEPS = ['Lecture des balances', 'Résolution des composantes', 'Application de la définition'];
const STEP_MS = 300;

/**
 * Espace de calcul (BETA-060, version de démonstration) : entrées sourcées, retraitements, séquence de calcul et enregistrement.
 * Le résultat vient du moteur déterministe ; la séquence ne fait qu'en montrer les étapes (plan, section 14).
 */
export function CalculationPage() {
  const { covenantId = '' } = useParams();
  const [params] = useSearchParams();
  const state = useDemoState();
  const data = useDataView();
  const dispatch = useDemoDispatch();
  const covenant = data.covenants.find((x) => x.id === covenantId);
  const rawDate = params.get('date');
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : DATE_ARRETE;
  const view = covenant ? selectCovenantView(state, covenant.id, date) : null;
  const frozen = view?.latestSaved && !view.modifiedSinceSave ? view.latestSaved : null;
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>(frozen ? 'done' : 'ready');
  const [step, setStep] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => { setPhase(frozen ? 'done' : 'ready'); setStep(0); }, [date, covenantId, frozen]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useDocumentTitle(covenant ? 'Espace de calcul' : 'Covenant introuvable');
  if (!covenant || !view) return <NotFoundPage message="Ce covenant n’existe pas" backTo={paths.covenants()} backLabel="Voir les covenants" />;

  const result = frozen ? frozen.snapshot.result : view.current.result;
  const occurrence = frozen?.occurrence ?? null;
  const computable = Boolean(result && result.status !== 'NOT_COMPUTABLE');
  const title = `${covenant.short_label} au ${fmt.date(date)}`;
  const run = () => {
    setPhase('running');
    setStep(0);
    STEPS.forEach((_, i) => timers.current.push(window.setTimeout(() => setStep(i + 1), STEP_MS * (i + 1))));
    timers.current.push(window.setTimeout(() => setPhase('done'), STEP_MS * STEPS.length + 50));
  };
  const confirmSave = () => {
    const action = saveTest(state, covenant.id, date);
    dispatch(action);
    dispatch(closeProvenance());
    if (action.type === 'SAVE_TEST') dispatch(showToast('Calcul enregistré', `${title} · empreinte ${action.test.snapshot.inputs_hash.slice(0, 8)}`));
    setConfirming(false);
  };
  const sides = result?.tree.children.filter((n) => n.role === 'NUMERATOR' || n.role === 'DENOMINATOR') ?? [];
  const adjustments = data.adjustments.filter((a) => a.test_key === view.key);
  const userName = (id: string) => { const u = data.users.find((x) => x.id === id); return u ? `${u.first_name} ${u.last_name}` : id; };
  const input = (node: DecompositionNode) => {
    const source = describeSource(node, data);
    return (
      <div key={node.id} className={s.inputRow}>
        <span className="muted" aria-hidden="true">{node.sign === -1 ? '−' : '+'}</span>
        <span className={s.cellMain}><span>{node.label}</span><SourceChip kind={source.kind} label={source.label} /></span>
        <ClickableValue target={{ scope: view.key, nodeId: node.id, occurrence }} text={fmt.node(node)} />
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Espace de calcul" subtitle={title}
        breadcrumbs={[{ label: 'Covenants', to: paths.covenants() }, { label: covenant.short_label, to: paths.covenant(covenant.id, { date }) }, { label: 'Espace de calcul' }]}
        actions={<ButtonLink to={paths.covenant(covenant.id, { date })} icon="back" variant="secondary">Retour à la fiche</ButtonLink>} />
      <div className={s.row75}>
        <div className={s.stack}>
          <Card title="Entrées" label={`Données au ${fmt.date(date)} · chaque montant ouvre sa provenance`}>
            {!computable && <p className="muted">Entrées incomplètes à cette date : voir la liste des données manquantes.</p>}
            {sides.map((side) => (
              <div key={side.id} style={{ marginBottom: 12 }}>
                <h3 className={s.month} style={{ textTransform: 'none' }}>{side.label}</h3>
                {side.children.map(input)}
              </div>
            ))}
          </Card>
          <Card title="Retraitements" label="Saisis et justifiés par l’utilisateur ; lecture seule dans la démonstration">
            {adjustments.length === 0 ? <p className="muted">Aucun retraitement à cette date.</p> : adjustments.map((a) => {
              const doc = data.documents.find((d) => d.id === a.document_id);
              return (
                <dl key={a.id} className={s.dl}>
                  <dt>Libellé</dt><dd>{a.label}</dd>
                  <dt>Montant</dt><dd className="num"><strong>{fmt.money(a.amount)}</strong></dd>
                  <dt>Justification</dt><dd>{a.justification}</dd>
                  <dt>Justificatif</dt><dd>{doc ? <Link to={paths.document(doc.id)}>{doc.title}</Link> : '—'}</dd>
                  <dt>Saisi</dt><dd>{fmt.dateTime(a.created_at)} par {userName(a.created_by)}</dd>
                </dl>
              );
            })}
          </Card>
        </div>
        <Card title="Calcul" label={frozen ? 'Calcul enregistré : lecture seule' : `Définition v${result?.definitionVersion ?? 1} · moteur déterministe`}>
          {!computable && result && (
            <>
              <StatusBadge status={result.status} />
              <ul className={s.stepList} style={{ marginTop: 12 }}>{result.missing.map((m) => <li key={m.label}>{m.label}</li>)}</ul>
            </>
          )}
          {computable && phase !== 'done' && (
            <>
              <ol className={s.sequence} aria-live="polite">
                {STEPS.map((label, i) => (
                  <li key={label} className={cx(step > i && s.seqDone, phase === 'running' && step === i && s.seqActive)}>
                    <span className={s.seqDot}>{step > i && <Icon name="check" size={12} />}</span>{label}{i === 2 ? ` v${result?.definitionVersion ?? 1}` : ''}
                  </li>
                ))}
              </ol>
              {phase === 'ready' && <p className={s.help} style={{ marginBottom: 12 }}>Prêt à calculer : {sides.reduce((n, side) => n + side.children.length, 0)} entrées sourcées.</p>}
              <Button icon="covenants" disabledReason={phase === 'running' ? 'Calcul en cours' : undefined} onClick={run}>Calculer</Button>
            </>
          )}
          {computable && phase === 'done' && result?.valueExact && (
            <div className={s.stackSm}>
              <div className={s.resultBig}>{fmt.covenant(result.valueExact, result.threshold, result.form)}</div>
              <StatusBadge status={result.status} />
              <dl className={s.dl}>
                <dt>Seuil</dt><dd>{fmt.threshold(result.comparison, result.threshold, result.form)}</dd>
                <dt>Headroom</dt><dd>{result.headroom ? fmt.ratio(result.headroom) : '—'}{result.headroomPct ? ` · ${fmt.pct(result.headroomPct)}` : ''}</dd>
                {result.deltaNumerator && <><dt>{result.deltaLabels.numerator}</dt><dd>{fmt.money(result.deltaNumerator)}</dd></>}
                {result.deltaDenominator && <><dt>{result.deltaLabels.denominator}</dt><dd>{fmt.money(result.deltaDenominator)}</dd></>}
              </dl>
              <p className={s.help}>{frozen
                ? `Enregistré le ${fmt.dateTime(frozen.closed_at)} par ${userName(frozen.closed_by)} — figé · empreinte ${frozen.snapshot.inputs_hash.slice(0, 8)}`
                : 'Calcul en cours — non enregistré · recalculé à chaque consultation'}</p>
              <div className={s.settingsActions}>
                {!frozen && view.current.canonical && <Button icon="save" onClick={() => setConfirming(true)}>{view.latestSaved ? 'Enregistrer ce nouveau calcul' : 'Enregistrer le calcul'}</Button>}
                <ButtonLink to={paths.covenant(covenant.id, { date })} variant="secondary">Voir la fiche du covenant</ButtonLink>
              </div>
            </div>
          )}
        </Card>
      </div>
      <SaveTestDialog open={confirming} label={`${title}, calculé à partir des données au ${fmt.date(date)}.`} result={view.current.result} onConfirm={confirmSave} onCancel={() => setConfirming(false)} />
    </>
  );
}
