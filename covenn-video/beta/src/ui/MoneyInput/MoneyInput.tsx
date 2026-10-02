import { parseMoneyInput } from '../../domain/format';
import s from './MoneyInput.module.css';

/** Champ montant : accepte « 150 000 » ou « 150000,00 », renvoie une chaîne décimale ou null si invalide. */
export function MoneyInput({ id, label, value, onChange, error, hint }: {
  id: string; label: string; value: string; onChange: (raw: string, parsed: string | null) => void; error?: string; hint?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <div className={s.control}>
        <input id={id} className={s.input} inputMode="decimal" autoComplete="off" value={value} aria-invalid={error ? true : undefined}
          aria-describedby={describedBy} onChange={(event) => onChange(event.target.value, parseMoneyInput(event.target.value))} />
        <span className={s.suffix} aria-hidden="true">€</span>
      </div>
      {error ? <p id={`${id}-error`} className={s.error}>{error}</p> : hint ? <p id={`${id}-hint`} className={s.hint}>{hint}</p> : null}
    </div>
  );
}
