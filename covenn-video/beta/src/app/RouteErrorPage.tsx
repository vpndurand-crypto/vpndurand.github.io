import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ButtonLink } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { paths } from './routes';
import { useDocumentTitle } from './useDocumentTitle';

export function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  useDocumentTitle(notFound ? 'Page introuvable' : 'Erreur');
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <EmptyState
        icon={notFound ? 'search' : 'warning'}
        title={notFound ? 'Cette page n’existe pas' : 'Cette page n’a pas pu s’afficher'}
        text={notFound ? 'Le lien est incomplet ou l’élément a été retiré de la démonstration.' : 'Revenez à la vue groupe : vos données de démonstration sont conservées.'}
        action={<ButtonLink to={paths.overview()} variant="primary">Revenir à la vue groupe</ButtonLink>}
      />
    </main>
  );
}
