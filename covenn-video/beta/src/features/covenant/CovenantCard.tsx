import { Link } from 'react-router-dom';
import { paths } from '../../app/routes';
import { STATUS_META } from '../../data/labels';
import type { DecompositionNode } from '../../data/types';
import type { CovenantListItem } from '../../store/selectors';
import { ButtonLink } from '../../ui/Button';
import { HeadroomGauge } from '../../ui/charts';
import { Icon } from '../../ui/Icon';
import { StatusBadge } from '../../ui/StatusBadge';
import { fmt } from '../../ui/values';
import { ClickableValue } from '../provenance';
import s from './covenant.module.css';

function findNode(root: DecompositionNode, id: string): DecompositionNode | null {
  if (root.id === id) return root;
  for (const child of root.children) { const hit = findNode(child, id); if (hit) return hit; }
  return null;
}

/** Résumé d'un covenant (fiche financement, vue groupe) : valeur, seuil, marge, statut, état du calcul. */
export function CovenantCard({ item, showComponents = false, showConversions = false }: { item: CovenantListItem; showComponents?: boolean; showConversions?: boolean }) {
  const { covenant, result, savedUpToDate, view } = item;
  if (!result) return null;
  const scope = view.key;
  const occurrence = savedUpToDate ? view.latestSaved?.occurrence ?? null : null;
  const target = (nodeId: string) => ({ scope, nodeId, occurrence });
  const valueText = result.valueExact ? fmt.covenant(result.valueExact, result.threshold, result.form) : '—';
  const thresholdText = fmt.threshold(result.comparison, result.threshold, result.form);
  const tone = STATUS_META[result.status].tone;
  const components = result.tree.children.filter((n) => n.role === 'NUMERATOR' || n.role === 'DENOMINATOR')
    .flatMap((side) => (side.role === 'NUMERATOR' ? [...side.children, side] : [side]));
  return (
    <div className={s.mini}>
      <div className={s.miniHead}>
        <span className={s.miniTitle}><Link to={paths.covenant(covenant.id)}>{covenant.short_label}</Link> <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>au {fmt.date(result.calcDate)}</span></span>
        <StatusBadge status={result.status} />
      </div>
      <div className={s.miniValues}>
        <span className={s.miniValue}><ClickableValue target={target(scope)} text={valueText} size="lg" tone={tone} /></span>
        <span><span className={s.factLabel}>Seuil </span><ClickableValue target={target(`${scope}/threshold`)} text={thresholdText} /></span>
        {result.headroom && <span><span className={s.factLabel}>Headroom </span><strong className="num">{fmt.ratio(result.headroom)}</strong>{result.headroomPct && <span className="muted"> · {fmt.pct(result.headroomPct)}</span>}</span>}
      </div>
      {result.value && <HeadroomGauge value={Number(result.value)} threshold={Number(result.threshold)} comparison={result.comparison} tone={tone} valueText={valueText} thresholdText={thresholdText} />}
      {showComponents && (
        <div className={s.miniComponents}>
          {components.map((node) => {
            const n = findNode(result.tree, node.id);
            return n ? (
              <div key={node.id} className={s.fact}>
                <span className={s.factLabel}>{n.label}</span>
                <ClickableValue target={target(n.id)} text={fmt.node(n)} />
              </div>
            ) : null;
          })}
        </div>
      )}
      {showConversions && result.deltaNumerator && (
        <div className={s.conversions}>
          <div className={s.conversion}><span className={s.conversionValue}>{fmt.money(result.deltaNumerator)}</span><span className={s.conversionLabel}>{result.deltaLabels.numerator}</span></div>
          {result.deltaDenominator && <div className={s.conversion}><span className={s.conversionValue}>{fmt.money(result.deltaDenominator)}</span><span className={s.conversionLabel}>{result.deltaLabels.denominator}</span></div>}
        </div>
      )}
      <div className={s.miniFoot}>
        <span className={s.nature}>
          {savedUpToDate && view.latestSaved
            ? <span className={s.natureFrozen}><Icon name="lock" size={14} /> Calcul enregistré le {fmt.date(view.latestSaved.closed_at)} — figé</span>
            : <span>Calcul en cours — non enregistré</span>}
        </span>
        <ButtonLink to={paths.covenant(covenant.id)} size="sm" icon="covenants">Voir le covenant {covenant.short_label}</ButtonLink>
      </div>
    </div>
  );
}
