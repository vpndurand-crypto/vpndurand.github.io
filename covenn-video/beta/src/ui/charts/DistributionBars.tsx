import s from './charts.module.css';

export interface DistributionItem { key: string; label: string; amountText: string; share: number; shareText: string; onSelect?: () => void }

export function DistributionBars({ items, ariaLabel }: { items: readonly DistributionItem[]; ariaLabel: string }) {
  return (
    <ul className={s.bars} aria-label={ariaLabel}>
      {items.map((item) => {
        const content = (
          <>
            <span className={s.barLabel}>{item.label}</span>
            <span className={s.barTrack}><span className={s.barFill} style={{ width: `${Math.max(2, item.share * 100)}%` }} /></span>
            <span className={s.barValue}>{item.amountText} <span className="muted">· {item.shareText}</span></span>
          </>
        );
        return (
          <li key={item.key}>
            {item.onSelect ? <button type="button" className={s.barRow} onClick={item.onSelect}>{content}</button> : <div className={s.barRow}>{content}</div>}
          </li>
        );
      })}
    </ul>
  );
}
