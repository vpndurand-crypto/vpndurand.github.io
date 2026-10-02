import { STATUS_META } from '../../data/labels';
import type { EvaluationResult } from '../../data/types';
import { Modal } from '../../ui/Modal';
import { fmt } from '../../ui/values';
import s from './covenant.module.css';

/** Confirmation d'enregistrement (section 14, étape 4) : le calcul sera figé avec son empreinte. */
export function SaveTestDialog({ open, label, result, onConfirm, onCancel }: { open: boolean; label: string; result: EvaluationResult | null; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} title="Enregistrer le calcul ?" confirmLabel="Confirmer" onConfirm={onConfirm} onCancel={onCancel}>
      <p>{label}</p>
      {result?.valueExact && (
        <dl className={s.dialogSummary}>
          <dt>Valeur</dt><dd>{fmt.covenant(result.valueExact, result.threshold, result.form)}</dd>
          <dt>Seuil</dt><dd>{fmt.threshold(result.comparison, result.threshold, result.form)}</dd>
          <dt>Headroom</dt><dd>{result.headroom ? fmt.ratio(result.headroom) : '—'}{result.headroomPct ? ` · ${fmt.pct(result.headroomPct)}` : ''}</dd>
          <dt>Statut</dt><dd>{STATUS_META[result.status].label}</dd>
        </dl>
      )}
      <p>Le calcul sera figé : ses entrées, son résultat et son empreinte ne changeront plus, même si les données évoluent. Il rejoint l’historique du covenant et la vue groupe.</p>
    </Modal>
  );
}
