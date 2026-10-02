import s from './charts.module.css';

export function Sparkline({ values, label }: { values: Array<number | null>; label: string }) {
  const known = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (known.length < 2) return <span className="muted">—</span>;
  const lo = Math.min(...known.map((p) => p.v));
  const hi = Math.max(...known.map((p) => p.v));
  const x = (i: number) => 2 + (i * 76) / Math.max(1, values.length - 1);
  const y = (v: number) => 20 - ((v - lo) * 16) / Math.max(hi - lo, 1e-9);
  const last = known[known.length - 1];
  return (
    <svg viewBox="0 0 80 24" className={s.spark} role="img" aria-label={label}>
      <polyline points={known.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} className={s.sparkLine} />
      {last && <circle cx={x(last.i)} cy={y(last.v)} r={2.5} className={s.sparkDot} />}
    </svg>
  );
}
