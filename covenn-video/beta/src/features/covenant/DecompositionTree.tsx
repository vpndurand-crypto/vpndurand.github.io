import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { DecompositionNode, EvaluationResult, SeedData } from '../../data/types';
import { openProvenance } from '../../store/actions';
import { useDemoDispatch } from '../../store/hooks';
import { Button } from '../../ui/Button';
import { cx } from '../../ui/cx';
import { Icon } from '../../ui/Icon';
import { SourceChip } from '../../ui/SourceChip';
import { fmt } from '../../ui/values';
import { ClickableValue, describeSource } from '../provenance';
import s from './covenant.module.css';

interface Row { node: DecompositionNode; level: number; parent: string | null }

/** Décomposition du calcul (BETA-023) : niveaux 1 et 2 dépliés, navigation au clavier (flèches, Entrée). */
export function DecompositionTree({ result, scope, occurrence, data }: { result: EvaluationResult; scope: string; occurrence: number | null; data: SeedData }) {
  const dispatch = useDemoDispatch();
  const top = result.tree.children;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(top.filter((n) => n.role !== 'THRESHOLD').map((n) => n.id)));
  const [focus, setFocus] = useState(0);
  const refs = useRef<Array<HTMLLIElement | null>>([]);
  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (nodes: DecompositionNode[], level: number, parent: string | null) => {
      for (const node of nodes) {
        out.push({ node, level, parent });
        if (expanded.has(node.id)) walk(node.children, level + 1, node.id);
      }
    };
    walk(top, 1, null);
    return out;
  }, [top, expanded]);
  const target = (nodeId: string) => ({ scope, nodeId, occurrence });
  const toggle = (id: string, open?: boolean) => setExpanded((prev) => {
    const next = new Set(prev);
    if (open ?? !next.has(id)) next.add(id); else next.delete(id);
    return next;
  });
  const move = (index: number) => {
    const bounded = Math.max(0, Math.min(rows.length - 1, index));
    setFocus(bounded);
    refs.current[bounded]?.focus();
  };
  const onKey = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    const row = rows[index];
    if (!row || event.target !== event.currentTarget) return;
    const hasChildren = row.node.children.length > 0;
    const open = expanded.has(row.node.id);
    switch (event.key) {
      case 'ArrowDown': move(index + 1); break;
      case 'ArrowUp': move(index - 1); break;
      case 'Home': move(0); break;
      case 'End': move(rows.length - 1); break;
      case 'ArrowRight': if (hasChildren && !open) toggle(row.node.id, true); else if (hasChildren) move(index + 1); break;
      case 'ArrowLeft': if (hasChildren && open) toggle(row.node.id, false); else if (row.parent) move(rows.findIndex((r) => r.node.id === row.parent)); break;
      case 'Enter': case ' ': dispatch(openProvenance(target(row.node.id))); break;
      default: return;
    }
    event.preventDefault();
  };
  const numerator = top.find((n) => n.role === 'NUMERATOR');
  const denominator = top.find((n) => n.role === 'DENOMINATOR');
  const collectIds = (nodes: DecompositionNode[]): string[] => nodes.flatMap((n) => (n.children.length ? [n.id, ...collectIds(n.children)] : []));
  const allOpen = collectIds(top).every((id) => expanded.has(id));
  return (
    <div>
      {numerator && (
        <div className={s.formulaHead}>
          <span className={s.formulaName}>{result.tree.label} = {numerator.label}{denominator ? ` / ${denominator.label}` : ''}</span>
          <span className={s.formulaLine}>
            <ClickableValue target={target(numerator.id)} text={fmt.node(numerator)} />
            {denominator && <><span aria-hidden="true">/</span><ClickableValue target={target(denominator.id)} text={fmt.node(denominator)} /></>}
            <span aria-hidden="true">=</span>
            <ClickableValue target={target(result.tree.id)} text={result.valueExact ? fmt.covenant(result.valueExact, result.threshold, result.form) : '—'} />
          </span>
        </div>
      )}
      <ul role="tree" aria-label="Décomposition du calcul" className={s.tree}>
        {rows.map((row, index) => {
          const hasChildren = row.node.children.length > 0;
          const open = expanded.has(row.node.id);
          const source = row.level > 1 || row.node.role === 'THRESHOLD' ? describeSource(row.node, data) : null;
          return (
            <li key={row.node.id} ref={(el) => { refs.current[index] = el; }} role="treeitem" aria-level={row.level} aria-expanded={hasChildren ? open : undefined}
              aria-selected={false} tabIndex={index === focus ? 0 : -1} className={cx(s.item, row.level === 1 && s.level1)} onKeyDown={(e) => onKey(e, index)} onFocus={() => setFocus(index)}>
              <div className={s.row} style={{ paddingLeft: (row.level - 1) * 22 }}>
                {hasChildren
                  ? <button type="button" tabIndex={-1} className={s.toggle} aria-label={open ? `Replier ${row.node.label}` : `Déplier ${row.node.label}`} onClick={() => toggle(row.node.id)}><Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} /></button>
                  : <span />}
                <span className={s.sign} aria-hidden="true">{row.level > 1 ? (row.node.sign === -1 ? '−' : '+') : ''}</span>
                <span className={s.nodeLabel}>
                  <span className={s.nodeText}>{row.node.role === 'THRESHOLD' ? `${row.node.label} (${fmt.threshold(result.comparison, row.node.value ?? '0', result.form).split(' ')[0]})` : row.node.label}</span>
                  {source && <SourceChip kind={source.kind} label={source.label} />}
                </span>
                <ClickableValue target={target(row.node.id)} text={fmt.node(row.node)} size={row.level === 1 ? 'md' : 'sm'} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className={s.treeTools}>
        <Button variant="ghost" size="sm" icon={allOpen ? 'chevronUp' : 'chevronDown'}
          onClick={() => setExpanded(allOpen ? new Set(top.filter((n) => n.role !== 'THRESHOLD').map((n) => n.id)) : new Set(collectIds(top)))}>
          {allOpen ? 'Replier le détail' : 'Tout déplier jusqu’aux comptes'}
        </Button>
      </div>
    </div>
  );
}
