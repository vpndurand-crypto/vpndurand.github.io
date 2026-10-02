import { Link } from 'react-router-dom';
import { paths } from '../../app/routes';
import { COMPARISON_LABELS, FREQUENCY_LABELS, METRIC_LABELS } from '../../data/labels';
import type { ClauseRef, Covenant, CovenantDefinition, SeedData } from '../../data/types';
import { ButtonLink } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { fmt } from '../../ui/values';
import s from './covenant.module.css';

function ClauseLink({ clause, returnTo }: { clause: ClauseRef; returnTo: string }) {
  return <Link to={paths.document(clause.document_id, { page: clause.page, clause: clause.clause_id, retour: returnTo })}>Art. {clause.article}, p. {clause.page}</Link>;
}

/** Onglet Définition (BETA-024) : formule, composantes, retraitements autorisés, marches de seuil. */
export function DefinitionView({ covenant, definition, data, returnTo }: { covenant: Covenant; definition: CovenantDefinition; data: SeedData; returnTo: string }) {
  const document = data.documents.find((d) => d.id === covenant.source_document_id);
  const validator = data.users.find((u) => u.id === definition.validated_by);
  const pages = [...new Set([...definition.components.map((c) => c.clause.page), ...definition.threshold_steps.map((t) => t.clause.page)])].sort((a, b) => a - b);
  const steps = [...definition.threshold_steps].sort((a, b) => a.from_date.localeCompare(b.from_date));
  return (
    <div className={s.defGrid}>
      <div className={s.stack}>
        <Card title="Formule contractuelle">
          <p className={s.formulaBig}>{covenant.short_label} = {definition.numerator_label} / {definition.denominator_label}</p>
          <dl className={s.dl}>
            <dt>Condition</dt><dd>Ratio {COMPARISON_LABELS[definition.comparison]} au seuil en vigueur</dd>
            <dt>Périodicité</dt><dd>{FREQUENCY_LABELS[definition.frequency]}, premier test le {fmt.date(definition.first_test_date)}</dd>
            <dt>Version</dt><dd>Version {definition.version} validée par {validator ? `${validator.first_name} ${validator.last_name}` : definition.validated_by} le {fmt.date(definition.validated_at)}</dd>
          </dl>
        </Card>
        <Card title="Composantes">
          <Table caption="Composantes du covenant" rowKey={(c) => c.id} rows={definition.components} columns={[
            { key: 'side', header: 'Terme', render: (c) => (c.side === 'NUMERATOR' ? definition.numerator_label : definition.denominator_label) },
            { key: 'label', header: 'Composante', render: (c) => `${c.sign === -1 ? '− ' : '+ '}${c.label}` },
            { key: 'source', header: 'Source', render: (c) => (c.source_kind === 'REGISTRY_OUTSTANDING'
              ? `Registre des encours (${c.financing_ids.map((id) => data.financings.find((f) => f.id === id)?.external_reference ?? id).join(', ')})`
              : c.metric_code ? `Balance · ${c.metric_code} ${METRIC_LABELS[c.metric_code]}` : 'Saisie') },
            { key: 'basis', header: 'Base', render: (c) => (c.basis === 'LTM' ? '12 mois glissants' : 'Stock à la date de test') },
            { key: 'clause', header: 'Clause', render: (c) => <ClauseLink clause={c.clause} returnTo={returnTo} /> },
          ]} />
        </Card>
        <Card title="Retraitements autorisés">
          {definition.adjustment_categories.length === 0 ? <p className="muted">Aucun retraitement prévu par le contrat.</p> : (
            <Table caption="Retraitements autorisés" rowKey={(a) => a.id} rows={definition.adjustment_categories} columns={[
              { key: 'label', header: 'Catégorie', render: (a) => a.label },
              { key: 'side', header: 'Appliqué à', render: (a) => `${a.direction === 1 ? '+ ' : '− '}${a.side === 'NUMERATOR' ? definition.numerator_label : definition.denominator_label}` },
              { key: 'cap', header: 'Plafond', render: (a) => (a.cap_type === 'NONE' ? 'Sans plafond' : a.cap_type === 'ABSOLUTE' && a.cap_value ? fmt.money(a.cap_value) : `${a.cap_value ?? ''} de la composante de référence`) },
              { key: 'clause', header: 'Clause', render: (a) => <ClauseLink clause={a.clause} returnTo={returnTo} /> },
            ]} />
          )}
        </Card>
      </div>
      <div className={s.stack}>
        <Card title="Seuils par période">
          <Table caption="Marches de seuil" rowKey={(t) => t.id} rows={steps} columns={[
            { key: 'from', header: 'Période', render: (t) => {
              const next = steps[steps.indexOf(t) + 1];
              return next ? `Du ${fmt.date(t.from_date)} au ${fmt.date(prevDay(next.from_date))}` : `À compter du ${fmt.date(t.from_date)}`;
            } },
            { key: 'value', header: 'Seuil', align: 'right', render: (t) => <strong className="num">{fmt.threshold(definition.comparison, t.threshold, covenant.form)}</strong> },
            { key: 'clause', header: 'Clause', render: (t) => <ClauseLink clause={t.clause} returnTo={returnTo} /> },
          ]} />
        </Card>
        {document && (
          <Card title="Document source">
            <p><strong>{document.title}</strong></p>
            <p className="muted">Signé le {fmt.date(document.document_date)} · pages utilisées : {pages.join(', ')}</p>
            <div style={{ marginTop: 12 }}>
              <ButtonLink to={paths.document(document.id, { page: steps[0]?.clause.page ?? 1, clause: steps[0]?.clause.clause_id ?? '', retour: returnTo })} icon="documents" size="sm">Ouvrir le contrat</ButtonLink>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function prevDay(iso: string): string {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  if (d > 1) return `${y}-${String(m).padStart(2, '0')}-${String(d - 1).padStart(2, '0')}`;
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  const last = [31, (py % 4 === 0 && py % 100 !== 0) || py % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][pm - 1] ?? 30;
  return `${py}-${String(pm).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}
