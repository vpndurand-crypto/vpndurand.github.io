import { Link, useParams, useSearchParams } from 'react-router-dom';
import { isSafeReturnPath, paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { DOCUMENT_TYPE_LABELS } from '../data/labels';
import { ContractPage } from '../features/documents/ContractPage';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { selectDocumentClauses } from '../store/selectors';
import { Button, ButtonLink } from '../ui/Button';
import { cx } from '../ui/cx';
import { fmt } from '../ui/values';
import { NotFoundPage } from './NotFoundPage';
import s from './styles/pages.module.css';

/** Visionneuse (BETA-032) : vignettes, page rédigée, clause surlignée, clauses utilisées par Covenn, retour au covenant. */
export function DocumentViewerPage() {
  const { documentId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const state = useDemoState();
  const data = useDataView();
  const document = data.documents.find((d) => d.id === documentId);
  useDocumentTitle(document?.title ?? 'Document introuvable');
  if (!document) return <NotFoundPage message="Ce document n’existe pas" backTo={paths.documents()} backLabel="Voir les documents" />;
  const pages = data.contractPages.filter((p) => p.document_id === document.id).sort((a, b) => a.page - b.page);
  const requested = Number(params.get('page'));
  const pageNumber = Number.isInteger(requested) && requested >= 1 && requested <= document.page_count ? requested : pages[0]?.page ?? 1;
  const page = pages.find((p) => p.page === pageNumber) ?? null;
  const clause = params.get('clause');
  const back = params.get('retour');
  const clauses = selectDocumentClauses(state, document.id);
  const index = pages.findIndex((p) => p.page === pageNumber);
  const open = (target: number, clauseId?: string) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('page', String(target));
    if (clauseId) next.set('clause', clauseId); else next.delete('clause');
    return next;
  });
  const financings = document.financing_ids.map((id) => data.financings.find((f) => f.id === id)).filter((f) => f !== undefined);
  return (
    <>
      <PageHeader title={document.title} breadcrumbs={[{ label: 'Documents', to: paths.documents() }, { label: document.title }]}
        subtitle={
          <span className={s.meta}>
            <span>{DOCUMENT_TYPE_LABELS[document.document_type]}</span><span aria-hidden="true">·</span>
            <span>{fmt.date(document.document_date)}</span><span aria-hidden="true">·</span>
            <span>{document.reference}</span><span aria-hidden="true">·</span>
            {financings.map((f) => <Link key={f.id} to={paths.financing(f.id)}>{f.label}</Link>)}
          </span>
        }
        actions={isSafeReturnPath(back) ? <ButtonLink to={back} icon="back" variant="primary">Revenir au covenant</ButtonLink> : undefined} />
      <div className={s.viewer}>
        <nav className={s.thumbs} aria-label="Pages reproduites">
          {pages.map((p) => (
            <button key={p.page} type="button" className={cx(s.thumb, p.page === pageNumber && s.thumbActive)} aria-current={p.page === pageNumber ? 'page' : undefined} onClick={() => open(p.page)}>
              <span className={s.thumbPage}>Page {p.page}</span>
              <span>{p.blocks.find((b) => b.kind !== 'paragraph')?.text ?? p.blocks[0]?.text.slice(0, 40)}</span>
            </button>
          ))}
          <p className="muted" style={{ fontSize: 12 }}>{document.page_count - pages.length} autres pages non reproduites dans la démonstration.</p>
        </nav>
        <div>
          <div className={s.pageToolbar}>
            <Button variant="secondary" size="sm" icon="back" disabledReason={index <= 0 ? 'Première page reproduite' : undefined} onClick={() => { const prev = pages[index - 1]; if (prev) open(prev.page); }}>Page précédente</Button>
            <span className="num">Page {pageNumber} sur {document.page_count}</span>
            <Button variant="secondary" size="sm" disabledReason={index < 0 || index >= pages.length - 1 ? 'Dernière page reproduite' : undefined} onClick={() => { const next = pages[index + 1]; if (next) open(next.page); }}>Page suivante</Button>
          </div>
          {page ? <ContractPage page={page} pageCount={document.page_count} highlight={clause} /> : (
            <div className={s.notReproduced}>La page {pageNumber} n’est pas reproduite dans la démonstration. Les pages rédigées sont listées à gauche.</div>
          )}
        </div>
        <aside className={s.clauses} aria-label="Clauses utilisées par Covenn">
          <h2 style={{ fontSize: 16, fontWeight: 650 }}>Clauses utilisées par Covenn</h2>
          {clauses.length === 0 && <p className="muted">Aucune clause de ce document n’alimente un calcul.</p>}
          {clauses.map(({ clause: c, usages }) => (
            <div key={c.clause_id} className={cx(s.clause, c.clause_id === clause && s.clauseActive)}>
              <span className={s.clauseHead}>Article {c.article} · page {c.page}</span>
              <span>{c.excerpt}</span>
              <span className={s.clauseUse}>Utilisée par : {usages.map((u) => `${u.covenant.short_label} (${u.label.toLowerCase()})`).join(', ')}</span>
              <div className={s.clauseActions}>
                {c.clause_id === clause && c.page === pageNumber
                  ? <Button size="sm" variant="secondary" icon="check" disabledReason="Cette clause est surlignée dans la page affichée">Clause affichée</Button>
                  : <Button size="sm" variant="secondary" onClick={() => open(c.page, c.clause_id)}>Afficher dans le document</Button>}
                {[...new Set(usages.map((u) => u.covenant.id))].map((id) => {
                  const covenant = usages.find((u) => u.covenant.id === id)?.covenant;
                  return covenant ? <ButtonLink key={id} to={paths.covenant(id)} size="sm" variant="ghost">Voir le {covenant.short_label}</ButtonLink> : null;
                })}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
