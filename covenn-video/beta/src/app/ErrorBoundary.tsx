import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearPersisted } from '../store/persistence';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface State { failed: boolean }

/** Écran de secours : l'application ne doit jamais rester blanche pendant une démonstration. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Covenn — erreur de rendu', error, info.componentStack);
  }

  private readonly resetDemo = () => {
    clearPersisted();
    window.location.hash = '';
    window.location.reload();
  };

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <EmptyState
          icon="warning"
          title="Une erreur inattendue a interrompu l’affichage"
          text="Rechargez la page. Si l’erreur persiste, réinitialisez la démonstration : les données fictives d’origine seront restaurées."
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => window.location.reload()}>Recharger</Button>
              <Button variant="secondary" onClick={this.resetDemo}>Réinitialiser la démonstration</Button>
            </div>
          }
        />
      </main>
    );
  }
}
