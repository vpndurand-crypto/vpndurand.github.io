import { cx } from '../cx';
import s from './SourceChip.module.css';

export type SourceKind = 'contract' | 'import' | 'manual' | 'calc';

/** Origine d'un chiffre : contrat, balance importée, saisie ou calcul. */
export function SourceChip({ kind, label }: { kind: SourceKind; label: string }) {
  return <span className={cx(s.chip, s[kind])}>{label}</span>;
}
