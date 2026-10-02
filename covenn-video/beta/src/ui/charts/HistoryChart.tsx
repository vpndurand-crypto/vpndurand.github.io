import type { KeyboardEvent } from 'react';
import type { Tone } from '../../data/labels';
import { cx } from '../cx';
import s from './charts.module.css';

export interface HistoryPoint { date: string; value: number | null; tone: Tone; active: boolean; label: string }
export interface ThresholdSegment { from: string; value: number }

const W = 520; const H = 210; const L = 44; const R = 30; const T = 14; const B = 30;

/** Valeurs aux dates de test et seuil contractuel en escalier. */
export function HistoryChart({ axis, points, steps, onSelect, tick, ariaLabel }: {
  axis: Array<{ date: string; label: string }>;
  points: HistoryPoint[];
  steps: ThresholdSegment[];
  onSelect: (date: string) => void;
  tick: (value: number) => string;
  ariaLabel: string;
}) {
  const thresholdAt = (date: string) => [...steps].filter((st) => st.from <= date).pop()?.value ?? null;
  const values = [...points.map((p) => p.value), ...axis.map((a) => thresholdAt(a.date))].filter((v): v is number => v !== null);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.35 + 0.15;
  const y0 = Math.max(0, lo - pad);
  const y1 = hi + pad;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, axis.length - 1);
  const y = (v: number) => T + ((y1 - v) * (H - T - B)) / (y1 - y0);
  const ticks = [y0 + (y1 - y0) * 0.15, (y0 + y1) / 2, y1 - (y1 - y0) * 0.15];

  let stepPath = '';
  axis.forEach((a, i) => {
    const v = thresholdAt(a.date);
    if (v === null) return;
    stepPath += stepPath ? ` L ${x(i)} ${y(thresholdAt(axis[i - 1]?.date ?? a.date) ?? v)} L ${x(i)} ${y(v)}` : `M ${x(i)} ${y(v)}`;
  });
  const located = points.map((p) => ({ ...p, i: axis.findIndex((a) => a.date === p.date) })).filter((p) => p.i >= 0);
  const line = located.filter((p) => p.value !== null).map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i)} ${y(p.value ?? 0)}`).join(' ');
  const onKey = (event: KeyboardEvent<SVGGElement>, date: string) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(date); }
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.history} role="group" aria-label={ariaLabel}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={s.grid} />
          <text x={L - 8} y={y(v) + 4} className={s.tick} textAnchor="end">{tick(v)}</text>
        </g>
      ))}
      <path d={stepPath} className={s.step} />
      <path d={line} className={s.line} />
      {axis.map((a, i) => <text key={a.date} x={x(i)} y={H - 8} className={s.tick} textAnchor="middle">{a.label}</text>)}
      {located.map((p) => (p.value === null ? (
        <text key={p.date} x={x(p.i)} y={H - B - 8} className={s.na} textAnchor="middle"><title>{p.label}</title>n.c.</text>
      ) : (
        <g key={p.date} role="button" tabIndex={0} aria-label={p.label} data-interactive="point" className={s.pointGroup}
          onClick={() => onSelect(p.date)} onKeyDown={(e) => onKey(e, p.date)}>
          <title>{p.label}</title>
          <circle cx={x(p.i)} cy={y(p.value)} r={14} className={s.hit} />
          <circle cx={x(p.i)} cy={y(p.value)} r={p.active ? 7 : 5} className={cx(s.point, s[p.tone], p.active && s.active)} />
        </g>
      )))}
    </svg>
  );
}
