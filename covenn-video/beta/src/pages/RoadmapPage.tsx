import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { PageHeader } from '../features/layout/PageHeader';
import { useDataView, useDemoState } from '../store/hooks';
import { selectCovenantList } from '../store/selectors';
import { ButtonLink } from '../ui/Button';
import { cx } from '../ui/cx';
import s from './styles/pages.module.css';

/** Feuille de route produit (BETA-073) : ce que la bêta montre déjà, et ce qui viendra ensuite. */
export function RoadmapPage() {
  useDocumentTitle('Feuille de route');
  const data = useDataView();
  const state = useDemoState();
  const closest = [...selectCovenantList(state)].filter((c) => c.result?.headroomPct).sort((a, b) => Number(a.result?.headroomPct) - Number(b.result?.headroomPct))[0];
  const links: Record<number, { to: string; label: string } | undefined> = {
    1: { to: paths.financings(), label: 'Voir les financements' },
    2: closest ? { to: paths.covenant(closest.covenant.id), label: `Voir le calcul du ${closest.covenant.short_label}` } : undefined,
    3: { to: paths.schedule(), label: 'Voir l’aperçu des échéances' },
  };
  return (
    <>
      <PageHeader title="Feuille de route" subtitle="Comprendre, structurer, anticiper, décider : de la dette dispersée au pilotage du haut de bilan" />
      <div className={s.steps4}>
        {[...data.preview.roadmap].sort((a, b) => a.order - b.order).map((step) => {
          const link = links[step.order];
          return (
            <section key={step.id} className={cx(s.stepCard, step.in_beta && s.stepCardBeta)} aria-label={step.title}>
              <span className={s.stepOrder}>Étape {step.order} · {step.horizon}</span>
              <h2 className={s.stepTitle}>{step.title}</h2>
              <span className={step.in_beta ? s.badgeBeta : s.badgeNext}>{step.in_beta ? 'Dans la bêta' : 'À venir'}</span>
              <p>{step.summary}</p>
              <ul className={s.stepList}>{step.capabilities.map((c) => <li key={c}>{c}</li>)}</ul>
              {link && <ButtonLink to={link.to} size="sm" variant={step.in_beta ? 'secondary' : 'ghost'}>{link.label}</ButtonLink>}
            </section>
          );
        })}
      </div>
    </>
  );
}
