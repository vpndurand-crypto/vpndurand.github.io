import { useEffect, useId, useRef, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import s from './MultiSelect.module.css';

export interface MultiOption { value: string; label: string }

export function MultiSelect({ label, options, value, onChange, summary, icon, note }: {
  label: string; options: readonly MultiOption[]; value: readonly string[]; onChange: (value: string[]) => void; summary: string; icon?: IconName; note?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Node && rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : options.map((o) => o.value).filter((v) => v === optionValue || value.includes(v)));
  };
  const allSelected = options.every((o) => value.includes(o.value));
  return (
    <div className={s.root} ref={rootRef}>
      <button type="button" className={s.trigger} aria-haspopup="true" aria-expanded={open} aria-controls={popoverId}
        aria-label={`${label} : ${summary}`} onClick={() => setOpen((v) => !v)}>
        {icon && <Icon name={icon} size={14} />}
        <span>{summary}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div id={popoverId} className={s.popover} role="group" aria-label={label}>
          {options.map((option) => (
            <label key={option.value} className={s.option}>
              <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggle(option.value)} />
              {option.label}
            </label>
          ))}
          {note && <p className={s.note}>{note}</p>}
          <div className={s.footer}>
            <button type="button" className={s.linkButton} disabled={allSelected} onClick={() => onChange(options.map((o) => o.value))}>
              Tout sélectionner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
