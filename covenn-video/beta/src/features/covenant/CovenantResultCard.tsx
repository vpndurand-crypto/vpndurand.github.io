import { Link } from 'react-router-dom';
import { paths } from '../../app/routes';
import { STATUS_META } from '../../data/labels';
import type { Covenant, EvaluationResult, SavedTest, SeedData } from '../../data/types';
import { Button, ButtonLink } from '../../ui/Button';
import { SignatureCard } from '../../ui/SignatureCard';
import { HeadroomGauge } from '../../ui/charts';
import { Icon } from '../../ui/Icon';
import { StatusBadge } from '../../ui/StatusBadge';
import { fmt } from '../../ui/values';
import { ClickableValue } from '../provenance';
import s from './covenant.module.css';

function userName(data: SeedData, id: string) {
  const user = data.users.find((u) => u.id === id);
  return user ? `${user.first_name} ${user.last_name}` : id;
}

/** Zone 1 de la fiche covenant (BETA-022) : résultat, statut, seuil, marge, conversions, nature du calcul, enregistrement. */
export function CovenantResultCard({ covenant, date, result, error, snapshot, data, saveLabel, onSave, calculationTo }: {
  covenant: Covenant; date: string; result: EvaluationResult | null; error: string | null; snapshot: SavedTest | null; data: SeedData;
  saveLabel: string | null; onSave: () => void; calculationTo?: string | undefined;
}) {
  const title = `${covenant.short_label} au ${fmt.date(date)}`;
  if (!result) {
    return <SignatureCard label={title} title="Calcul impossible"><p>{error ?? 'Aucune définition validée à cette date.'}</p></SignatureCard>;
  }
  const scope = `${covenant.id}@${date}`;
  const target = (nodeId: string) => ({ scope, nodeId, occurrence: snapshot?.occurrence ?? null });
  const thresholdText = fmt.threshold(result.comparison, result.threshold, result.form);

  if (result.status === 'NOT_COMPUTABLE' || result.status === 'NOT_MEANINGFUL') {
    return (
      <SignatureCard label={title}>
        <div className={s.heroLine}><StatusBadge status={result.status} /></div>
        {result.status === 'NOT_COMPUTABLE' ? (
          <>
            <p>Covenn ne produit aucune valeur tant que ces données manquent :</p>
            <ul className={s.missingList}>
              {result.missing.map((m) => (
                <li key={m.label}>
                  <Icon name="warning" size={16} />
                  {m.code === 'OUTSTANDING_MISSING' && m.financingId
                    ? <Link to={paths.financing(m.financingId, 'encours')}>{m.label}</Link>
                    : <span>{m.label}</span>}
                </li>
              ))}
            </ul>
          </>
        ) : <p>Le dénominateur est nul ou négatif : le ratio n’a pas de sens économique à cette date.</p>}
        <p className={s.nextStep}>Seuil applicable : {thresholdText}</p>
      </SignatureCard>
    );
  }

  const tone = STATUS_META[result.status].tone;
  const valueText = result.valueExact ? fmt.covenant(result.valueExact, result.threshold, result.form) : '—';
  const headroom = result.headroom ? (result.form === 'RATIO' ? fmt.ratio(result.headroom) : fmt.money(result.headroom)) : '—';
  return (
    <SignatureCard>
      <div className={s.result}>
        <div>
          <div className={s.resultLabel}>{title}</div>
          <div className={s.heroLine}>
            <ClickableValue target={target(scope)} text={valueText} size="hero" tone={tone} />
            <StatusBadge status={result.status} />
          </div>
          <div className={s.nature}>
            {snapshot ? (
              <span className={s.natureFrozen}>
                <Icon name="lock" size={14} /> Enregistré le {fmt.dateTime(snapshot.closed_at)} par {userName(data, snapshot.closed_by)} — figé · empreinte {snapshot.snapshot.inputs_hash.slice(0, 8)}
              </span>
            ) : (
              <span>Calcul en cours — non enregistré · définition v{result.definitionVersion} · recalculé à chaque consultation</span>
            )}
          </div>
          {(saveLabel || calculationTo) && (
            <div className={s.resultActions}>
              {saveLabel && <Button icon="save" onClick={onSave}>{saveLabel}</Button>}
              {calculationTo && <ButtonLink to={calculationTo} variant="secondary">Ouvrir l’espace de calcul</ButtonLink>}
            </div>
          )}
        </div>
        <div className={s.side}>
          <div className={s.facts}>
            <div className={s.fact}>
              <span className={s.factLabel}>Seuil contractuel</span>
              <span className={s.factValue}><ClickableValue target={target(`${scope}/threshold`)} text={thresholdText} size="lg" /></span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>Headroom</span>
              <span className={s.factValue}>{headroom}{result.headroomPct && <span className={s.factSub}> · {fmt.pct(result.headroomPct)}</span>}</span>
            </div>
          </div>
          {result.value && (
            <HeadroomGauge value={Number(result.value)} threshold={Number(result.threshold)} comparison={result.comparison} tone={tone} valueText={valueText} thresholdText={thresholdText} />
          )}
          {result.deltaNumerator && (
            <div className={s.conversions}>
              <div className={s.conversion}>
                <span className={s.conversionValue}>{fmt.money(result.deltaNumerator)}</span>
                <span className={s.conversionLabel}>{result.deltaLabels.numerator}</span>
              </div>
              {result.deltaDenominator && (
                <div className={s.conversion}>
                  <span className={s.conversionValue}>{fmt.money(result.deltaDenominator)}</span>
                  <span className={s.conversionLabel}>{result.deltaLabels.denominator}</span>
                </div>
              )}
            </div>
          )}
          {result.nextThresholdStep && (
            <p className={s.nextStep}>
              <Icon name="calendar" size={14} />
              Seuil de {fmt.ratio(result.nextThresholdStep.threshold)} à compter du {fmt.date(result.nextThresholdStep.from_date)}
            </p>
          )}
        </div>
      </div>
    </SignatureCard>
  );
}
