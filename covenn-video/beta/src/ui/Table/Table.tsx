import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from '../Icon';
import s from './Table.module.css';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T) => ReactNode;
  /** Valeur de tri (nombre ou texte). Absente : colonne non triable. */
  sortValue?: (row: T) => string | number;
}

export interface TableProps<T> {
  /** Marges réduites pour les tableaux à nombreuses colonnes. */
  dense?: boolean;
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  highlightKeys?: readonly string[];
  empty?: ReactNode;
  caption?: string;
  footer?: ReactNode;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
}

export function Table<T>({ dense = false, columns, rows, rowKey, onRowClick, rowLabel, highlightKeys, empty, caption, footer, defaultSort }: TableProps<T>) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const highlighted = useMemo(() => new Set(highlightKeys ?? []), [highlightKeys]);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const getValue = column?.sortValue;
    if (!getValue) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'fr') * factor;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key: string) => {
    setSort((current) => (current && current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };
  const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={s.wrap}>
      <table className={cx(s.table, dense && s.dense)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const ariaSort = active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined;
              return (
                <th key={column.key} scope="col" style={column.width ? { width: column.width } : undefined}
                  className={cx(column.align === 'right' && s.right, column.align === 'center' && s.center)} aria-sort={ariaSort}>
                  {column.sortValue ? (
                    <button type="button" className={s.sortButton} onClick={() => toggleSort(column.key)}>
                      {column.header}
                      {active && <Icon name={sort?.dir === 'asc' ? 'chevronUp' : 'chevronDown'} size={12} />}
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className={s.empty}>{empty ?? 'Aucune ligne.'}</td></tr>
          )}
          {sorted.map((row) => {
            const key = rowKey(row);
            const clickable = Boolean(onRowClick);
            return (
              <tr key={key}
                className={cx(clickable && s.clickable, highlighted.has(key) && s.highlight)}
                tabIndex={clickable ? 0 : undefined}
                data-interactive={clickable ? 'row' : undefined}
                data-highlighted={highlighted.has(key) ? 'true' : undefined}
                aria-label={clickable && rowLabel ? rowLabel(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => onRowKey(event, row) : undefined}>
                {columns.map((column) => (
                  <td key={column.key} className={cx(column.align === 'right' && s.right, column.align === 'center' && s.center)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
