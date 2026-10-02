import s from './Select.module.css';

export interface SelectOption { value: string; label: string }

export function Select({ id, label, value, options, onChange, hideLabel = false }: {
  id: string; label: string; value: string; options: readonly SelectOption[]; onChange: (value: string) => void; hideLabel?: boolean;
}) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : s.label}>{label}</label>
      <select id={id} className={s.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
