import type { DecompositionNode, SeedData } from '../../data/types';
import type { SourceKind } from '../../ui/SourceChip';

/** Libellé court de l'origine d'un chiffre, affiché dans l'arbre, les tableaux et le panneau. */
export function describeSource(node: DecompositionNode, data: SeedData): { kind: SourceKind; label: string } {
  const p = node.provenance;
  const reference = (documentId: string | null | undefined) => data.documents.find((d) => d.id === documentId)?.reference ?? '';
  switch (p.type) {
    case 'CONTRACT':
      return { kind: 'contract', label: `Contrat ${reference(p.documentId)} · art. ${p.article}, p. ${p.page}` };
    case 'IMPORT':
      return { kind: 'import', label: `Balance comptable · ligne ${p.rows.join(', ')}` };
    case 'MANUAL_ENTRY': {
      if (p.object.kind === 'OUTSTANDING') {
        const od = data.outstanding.find((o) => o.id === p.object.id);
        const financing = data.financings.find((f) => f.id === od?.financing_id);
        return { kind: 'manual', label: `Encours déclaré · ${financing?.external_reference ?? ''}` };
      }
      if (p.object.kind === 'ADJUSTMENT') return { kind: 'manual', label: node.clause ? `Retraitement · contrat ${reference(node.clause.document_id)}, art. ${node.clause.article}` : 'Retraitement justifié' };
      return { kind: 'manual', label: 'Saisie' };
    }
    case 'CALCULATION':
      if (p.rule === 'BR-166') return { kind: 'import', label: `Balance comptable · ${node.label}` };
      if (p.rule === 'BR-179') return { kind: 'import', label: 'Balance comptable · 12 mois glissants' };
      return { kind: 'calc', label: 'Calcul Covenn' };
  }
}

/** Comptes de balance sous un nœud (pour « Ouvrir la balance » avec les lignes surlignées). */
export function importLeaves(node: DecompositionNode): Array<{ balanceId: string; account: string }> {
  if (node.provenance.type === 'IMPORT') return node.provenance.accounts.map((account) => ({ balanceId: node.provenance.type === 'IMPORT' ? node.provenance.balanceId : '', account }));
  return node.children.flatMap(importLeaves);
}
