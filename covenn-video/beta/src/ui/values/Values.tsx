import { cx } from '../cx';
import { fmt } from './fmt';

export function Money({ value, compact = false, className }: { value: string; compact?: boolean; className?: string | undefined }) {
  return <span className={cx('num', className)} title={compact ? fmt.money(value) : undefined}>{compact ? fmt.compact(value) : fmt.money(value)}</span>;
}
export function Ratio({ value, className }: { value: string; className?: string | undefined }) {
  return <span className={cx('num', className)}>{fmt.ratio(value)}</span>;
}
export function Percent({ value, className }: { value: string; className?: string | undefined }) {
  return <span className={cx('num', className)}>{fmt.pct(value)}</span>;
}
export function DateText({ value, withTime = false }: { value: string; withTime?: boolean }) {
  return <time dateTime={value} className="num">{withTime ? fmt.dateTime(value) : fmt.date(value)}</time>;
}
