import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import s from './Tabs.module.css';

export interface TabItem { id: string; label: string }

export function tabIds(idPrefix: string, id: string) {
  return { tab: `${idPrefix}-tab-${id}`, panel: `${idPrefix}-panel-${id}` };
}

interface TabsProps {
  items: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
}

export function Tabs({ items, value, onChange, ariaLabel, idPrefix }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    const item = items[next];
    if (!item) return;
    event.preventDefault();
    onChange(item.id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className={s.list}>
      {items.map((item, index) => {
        const ids = tabIds(idPrefix, item.id);
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[index] = el; }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            className={cx(s.tab, selected && s.selected)}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idPrefix, id, children }: { idPrefix: string; id: string; children: ReactNode }) {
  const ids = tabIds(idPrefix, id);
  return (
    <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className={s.panel}>
      {children}
    </div>
  );
}
