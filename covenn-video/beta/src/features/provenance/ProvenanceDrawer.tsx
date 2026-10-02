import { useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { paths } from '../../app/routes';
import { PROVENANCE_TYPE_LABELS } from '../../data/labels';
import type { DecompositionNode, SeedData } from '../../data/types';
import { closeProvenance, popProvenance } from '../../store/actions';
import { useDataView, useDemoDispatch, useDemoState } from '../../store/hooks';
import { selectDrawerContent, type DrawerContent } from '../../store/selectors';
import { ButtonLink } from '../../ui/Button';
import { Drawer, type DrawerMode } from '../../ui/Drawer';
import { EmptyState } from '../../ui/EmptyState';
import { SourceChip } from '../../ui/SourceChip';
import { fmt } from '../../ui/values';
import { ContractPage } from '../documents/ContractPage';
import { ClickableValue } from './ClickableValue';
import { describeSource, importLeaves } from './describeSource';
import s from './ProvenanceDrawer.module.css';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h4 className={s.sectionTitle}>{title}</h4>
      {children}
    </section>
  );
}

function userName(data: SeedData, id: string) {
  const user = data.users.find((u) => u.id === id);
  return user ? `${user.first_name} ${user.last_name}` : id;
}

function Origin({ content, data, returnTo }: { content: DrawerContent; data: SeedData; returnTo: string }) {
  const { node, target } = content;
  const p = node.provenance;
  if (p.type === 'CONTRACT') {
    const document = data.documents.find((d) => d.id === p.documentId);
    const page = data.contractPages.find((c) => c.document_id === p.documentId && c.page === p.page);
    return (
      <Section title="Origine : clause du contrat">
        <p className={s.meta}>{document?.title} · article {p.article}, page {p.page}</p>
        {page && document && <div className={s.excerpt}><ContractPage page={page} pageCount={document.page_count} highlight={p.clauseId} compact /></div>}
        <ButtonLink to={paths.document(p.documentId, { page: p.page, clause: p.clauseId, retour: returnTo })} icon="documents" size="sm">
          Ouvrir le document à la page {p.page}
        </ButtonLink>
      </Section>
    );
  }
  if (p.type === 'IMPORT') {
    const balance = data.balances.find((b) => b.id === p.balanceId);
    const job = data.importJobs.find((j) => j.id === p.importJobId);
    const lines = balance?.lines.filter((l) => p.rows.includes(l.row)) ?? [];
    return (
      <Section title="Origine : balance comptable importée">
        <table className={s.mini}>
          <thead><tr><th>Ligne</th><th>Compte</th><th>Libellé</th><th className={s.right}>Solde</th></tr></thead>
          <tbody>{lines.map((l) => <tr key={l.row}><td>{l.row}</td><td>{l.account_number}</td><td>{l.label}</td><td className={s.right}>{fmt.money(l.balance)}</td></tr>)}</tbody>
        </table>
        <p className={s.meta}>
          Fichier {p.fileName}, version {p.balanceVersion}{job ? `, importé le ${fmt.dateTime(job.created_at)} par ${userName(data, job.created_by)}` : ''}. Colonne {p.column}.
        </p>
        <ButtonLink to={paths.balance(p.balanceId, { comptes: p.accounts.join(',') })} icon="data" size="sm">Ouvrir la balance</ButtonLink>
      </Section>
    );
  }
  if (p.type === 'MANUAL_ENTRY') {
    const document = p.documentId ? data.documents.find((d) => d.id === p.documentId) : undefined;
    const od = p.object.kind === 'OUTSTANDING' ? data.outstanding.find((o) => o.id === p.object.id) : undefined;
    const financing = od ? data.financings.find((f) => f.id === od.financing_id) : undefined;
    return (
      <Section title={p.object.kind === 'OUTSTANDING' ? 'Origine : encours déclaré' : p.object.kind === 'ADJUSTMENT' ? 'Origine : retraitement saisi et justifié' : 'Origine : saisie'}>
        <dl className={s.facts}>
          <dt>Saisi par</dt><dd>{userName(data, p.userId)}</dd>
          <dt>Le</dt><dd>{fmt.dateTime(p.recordedAt)}</dd>
          {p.justification && <><dt>Justification</dt><dd>{p.justification}</dd></>}
          {document && <><dt>Justificatif</dt><dd>{document.title}</dd></>}
          {financing && <><dt>Financement</dt><dd>{financing.label} ({financing.external_reference})</dd></>}
        </dl>
        <div className={s.actions}>
          {document && <ButtonLink to={paths.document(document.id, { page: document.excerpt_pages[0] ?? 1, retour: returnTo })} icon="documents" size="sm">Voir le justificatif</ButtonLink>}
          {financing && target.scope !== 'outstanding' && <ButtonLink to={paths.financing(financing.id, 'encours')} icon="financings" size="sm" variant="ghost">Voir les encours du financement</ButtonLink>}
        </div>
      </Section>
    );
  }
  const leaves = importLeaves(node);
  const balanceIds = [...new Set(leaves.map((l) => l.balanceId))];
  return (
    <Section title="Calcul">
      <div className={s.formula}><span className={s.rule}>{p.rule}</span>{p.formula}</div>
      {node.children.length > 0 && (
        <ul className={s.terms} aria-label="Composantes du calcul">
          {node.children.map((child) => {
            const source = describeSource(child, data);
            return (
              <li key={child.id} className={s.term}>
                <span className={s.sign} aria-hidden="true">{child.sign === -1 ? '−' : '+'}</span>
                <span className={s.termLabel}>{child.label}<SourceChip kind={source.kind} label={source.label} /></span>
                <ClickableValue target={{ ...target, nodeId: child.id }} text={fmt.node(child)} push size="sm" />
              </li>
            );
          })}
        </ul>
      )}
      {balanceIds.length === 1 && balanceIds[0] && (
        <ButtonLink to={paths.balance(balanceIds[0], { comptes: leaves.map((l) => l.account).join(',') })} icon="data" size="sm">
          Ouvrir la balance ({leaves.length} {leaves.length > 1 ? 'comptes surlignés' : 'compte surligné'})
        </ButtonLink>
      )}
    </Section>
  );
}

function Panel({ content }: { content: DrawerContent }) {
  const data = useDataView();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const location = useLocation();
  const { node, snapshot } = content;
  const source = describeSource(node, data);
  const returnTo = `${location.pathname}${location.search}`;
  const trail = state.ui.provenanceStack.map((t) => selectDrawerContent(state, t)?.node.label ?? '…');
  const p = node.provenance;
  return (
    <div className={s.panel}>
      {trail.length > 1 && (
        <nav aria-label="Niveaux parcourus" className={s.trail}>
          {trail.map((label, index) => (
            index < trail.length - 1
              ? <span key={index}><button type="button" className={s.trailLink} onClick={() => dispatch(popProvenance(index + 1))}>{label}</button><span aria-hidden="true"> › </span></span>
              : <span key={index} aria-current="true">{label}</span>
          ))}
        </nav>
      )}
      <div className={s.head}>
        <span className={s.context}>{content.context} · {snapshot ? 'calcul enregistré, figé' : 'calcul en cours'}</span>
        <h3 className={s.label}>{node.label}</h3>
        <div className={s.value}>{node.value === null ? 'Non calculable' : node.role === 'THRESHOLD' && content.threshold ? fmt.threshold(content.threshold.comparison, node.value, content.threshold.form) : fmt.node(node)}</div>
        <div className={s.chips}><SourceChip kind={source.kind} label={source.label} /><span className={s.type}>{PROVENANCE_TYPE_LABELS[p.type]}</span></div>
      </div>
      {node.missing.length > 0 && (
        <Section title="Données manquantes">
          <ul className={s.missing}>{node.missing.map((m) => <li key={m.label}>{m.label}</li>)}</ul>
        </Section>
      )}
      <Origin content={content} data={data} returnTo={returnTo} />
      {node.clause && p.type !== 'CONTRACT' && (
        <Section title="Définition contractuelle">
          <blockquote className={s.quote}>{node.clause.excerpt}</blockquote>
          <ButtonLink to={paths.document(node.clause.document_id, { page: node.clause.page, clause: node.clause.clause_id, retour: returnTo })} size="sm" variant="ghost" icon="documents">
            Voir l’article {node.clause.article}, page {node.clause.page}
          </ButtonLink>
        </Section>
      )}
      <p className={s.footer}>
        {snapshot
          ? `Valeur figée dans le calcul enregistré le ${fmt.dateTime(snapshot.closed_at)} par ${userName(data, snapshot.closed_by)} · empreinte ${snapshot.snapshot.inputs_hash.slice(0, 8)}`
          : p.type === 'CONTRACT'
            ? `Clause validée par ${userName(data, p.validatedBy)} le ${fmt.date(p.validatedAt)}`
            : p.type === 'CALCULATION' ? 'Recalculée à chaque consultation à partir des données courantes, par le moteur déterministe.' : 'Donnée source : non modifiée par Covenn.'}
      </p>
    </div>
  );
}

export function ProvenanceDrawer({ mode }: { mode: DrawerMode }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const location = useLocation();
  const top = state.ui.provenanceStack.at(-1);
  // Fermeture au changement de route, appliquée pendant le rendu de la nouvelle page : un clic sur une valeur
  // juste après la navigation ne peut pas être annulé par une fermeture différée (course corrigée).
  useLayoutEffect(() => { dispatch(closeProvenance()); }, [location.pathname, location.search, dispatch]);
  const content = top ? selectDrawerContent(state, top) : null;
  return (
    <Drawer open={Boolean(top)} mode={mode} title="Provenance du chiffre" onClose={() => dispatch(closeProvenance())} id="provenance-panel">
      {content ? <Panel content={content} /> : <EmptyState icon="search" title="Cette valeur n’est plus disponible" text="Les données ont changé depuis l’ouverture du panneau." />}
    </Drawer>
  );
}

export type { DecompositionNode };
