import { useEffect, useRef } from 'react';
import type { ContractPage as ContractPageData } from '../../data/types';
import { cx } from '../../ui/cx';
import s from './ContractPage.module.css';

/** Page de contrat rédigée (document fictif), clause citée surlignée (plan technique, BETA-031). */
export function ContractPage({ page, pageCount, highlight, compact = false }: { page: ContractPageData; pageCount: number; highlight: string | null; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!compact && highlight) ref.current?.querySelector('[data-highlight="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlight, compact, page]);
  return (
    <div ref={ref} className={cx(s.sheet, compact && s.compact)} aria-label={`Page ${page.page} du document`}>
      <div className={s.header}>{page.running_header}</div>
      <div className={s.body}>
        {page.blocks.map((block) => {
          const hit = block.id === highlight;
          const Tag = block.kind === 'title' ? 'h2' : block.kind === 'heading' ? 'h3' : 'p';
          return <Tag key={block.id} className={cx(s[block.kind], hit && s.highlight)} data-highlight={hit ? 'true' : undefined}>{block.text}</Tag>;
        })}
      </div>
      <div className={s.footer}>Document fictif — démonstration Covenn · page {page.page} sur {pageCount}</div>
    </div>
  );
}
