import type { CovenantDefinition } from '../../data/types';
import { STATUS_META } from '../../data/labels';
import { useDemoState } from '../../store/hooks';
import { selectVariation, type CovenantView } from '../../store/selectors';
import { Card } from '../../ui/Card';
import { HistoryChart } from '../../ui/charts';
import { PreviewBadge } from '../../ui/PreviewBadge';
import { fmt } from '../../ui/values';
import s from './covenant.module.css';

/** Historique (BETA-025) : valeurs aux dates de test, seuil en escalier, variation attribuée (Aperçu). */
export function CovenantHistoryCard({ covenantId, label, definition, entries, activeDate, onSelect }: {
  covenantId: string; label: string; definition: CovenantDefinition; entries: Array<{ date: string; view: CovenantView }>; activeDate: string; onSelect: (date: string) => void;
}) {
  const state = useDemoState();
  const lastStep = [...definition.threshold_steps].sort((a, b) => a.from_date.localeCompare(b.from_date)).pop();
  const axis: Array<{ date: string; label: string }> = [];
  const quarter = ['03-31', '06-30', '09-30', '12-31'];
  const end = lastStep ? `${lastStep.from_date.slice(0, 4)}-09-30` : entries.at(-1)?.date ?? activeDate;
  for (let year = Number(definition.first_test_date.slice(0, 4)); year <= Number(end.slice(0, 4)); year += 1) {
    for (const q of quarter) {
      const date = `${year}-${q}`;
      if (date >= definition.first_test_date && date <= end) axis.push({ date, label: `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(2, 4)}` });
    }
  }
  const variation = selectVariation(state, covenantId, activeDate);
  return (
    <Card title="Historique" label={`${label}, valeurs aux dates de test`}>
      <HistoryChart
        ariaLabel={`Historique du ${label}`}
        axis={axis}
        tick={(v) => fmt.ratio(v.toFixed(2))}
        onSelect={onSelect}
        steps={definition.threshold_steps.map((t) => ({ from: t.from_date, value: Number(t.threshold) }))}
        points={entries.map(({ date, view }) => {
          const r = view.displayed;
          return {
            date, active: date === activeDate, value: r?.value ? Number(r.value) : null, tone: r ? STATUS_META[r.status].tone : 'na',
            label: r?.valueExact ? `${fmt.date(date)} : ${fmt.covenant(r.valueExact, r.threshold, r.form)}, ${STATUS_META[r.status].label}` : `${fmt.date(date)} : non calculable`,
          };
        })}
      />
      <p className="muted" style={{ fontSize: 12 }}>Trait plein : valeur du covenant. Pointillés : seuil contractuel.</p>
      {variation && (
        <div className={s.variation}>
          <PreviewBadge tooltip="Lecture indicative : attribution déterministe de la variation entre deux dates de test ; elle ne modifie aucun résultat." />
          <span>
            {fmt.ratio(variation.fromValue)} → {fmt.ratio(variation.toValue)} : effet {definition.numerator_label.toLowerCase()} {fmt.signedRatio(variation.numeratorEffect)} ; effet {definition.denominator_label} {fmt.signedRatio(variation.denominatorEffect)}
          </span>
        </div>
      )}
    </Card>
  );
}
