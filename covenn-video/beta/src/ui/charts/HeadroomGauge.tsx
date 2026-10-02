import type { Comparison } from '../../data/types';
import type { Tone } from '../../data/labels';
import { cx } from '../cx';
import s from './charts.module.css';

/** Position de la valeur par rapport au seuil ; la zone hachurée matérialise la marge (headroom). */
export function HeadroomGauge({ value, threshold, comparison, tone, valueText, thresholdText }: {
  value: number; threshold: number; comparison: Comparison; tone: Tone; valueText: string; thresholdText: string;
}) {
  const upper = comparison === 'LTE' || comparison === 'LT';
  const max = upper ? Math.max(threshold * 1.25, value * 1.08) : Math.max(value * 1.15, threshold * 1.5);
  const pct = (x: number) => Math.max(0, Math.min(100, (x / max) * 100));
  const v = pct(value);
  const t = pct(threshold);
  return (
    <div className={s.gauge} role="img" aria-label={`Valeur ${valueText}, seuil ${thresholdText}`}>
      <div className={s.track}>
        <div className={cx(s.fill, s[tone])} style={{ width: `${v}%` }} />
        <div className={s.headroom} style={{ left: `${Math.min(v, t)}%`, width: `${Math.abs(t - v)}%` }} />
        <div className={s.limit} style={{ left: `${t}%` }} />
      </div>
      <div className={s.gaugeScale}>
        <span>0</span>
        <span className={s.limitLabel} style={{ left: `${t}%` }}>{thresholdText}</span>
      </div>
    </div>
  );
}
