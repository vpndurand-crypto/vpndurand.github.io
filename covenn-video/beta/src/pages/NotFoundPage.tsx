import { useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { Button, ButtonLink } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export function NotFoundPage({ message = 'Cette page n’existe pas', backTo, backLabel }: { message?: string; backTo?: string; backLabel?: string }) {
  useDocumentTitle('Page introuvable');
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="search"
      title={message}
      text="Le lien est incomplet ou l’élément a été retiré de la démonstration."
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <ButtonLink to={backTo ?? paths.overview()} variant="primary">{backLabel ?? 'Revenir à la vue groupe'}</ButtonLink>
          <Button variant="ghost" onClick={() => navigate(-1)}>Page précédente</Button>
        </div>
      }
    />
  );
}
