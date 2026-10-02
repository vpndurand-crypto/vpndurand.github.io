import type { Tone } from '../../data/labels';
import { openProvenance, pushProvenance } from '../../store/actions';
import { useDemoDispatch, useDemoState } from '../../store/hooks';
import type { DrawerTarget } from '../../store/state';
import { cx } from '../../ui/cx';
import s from './ClickableValue.module.css';

/**
 * Chiffre cliquable (plan technique, 11.4) : un clic ouvre sa provenance ; dans le panneau, il empile un niveau.
 * Un clic sur une autre valeur remplace le contenu du panneau sans le fermer (C-02).
 */
export function ClickableValue({ target, text, size = 'md', tone, push = false, title }: {
  target: DrawerTarget; text: string; size?: 'sm' | 'md' | 'lg' | 'hero' | 'inherit'; tone?: Tone | undefined; push?: boolean; title?: string | undefined;
}) {
  const dispatch = useDemoDispatch();
  const top = useDemoState().ui.provenanceStack.at(-1);
  const active = top?.scope === target.scope && top.nodeId === target.nodeId && top.occurrence === target.occurrence;
  return (
    <button type="button" className={cx(s.value, s[size], tone && s[tone], active && s.active)} title={title}
      aria-label={`${text} — voir la provenance`} aria-controls="provenance-panel" aria-pressed={active}
      onClick={(event) => { event.stopPropagation(); dispatch(push ? pushProvenance(target) : openProvenance(target)); }}>
      {text}
    </button>
  );
}
