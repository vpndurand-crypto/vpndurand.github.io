import { useNavigate } from 'react-router-dom';
import { paths } from '../app/routes';
import { useDocumentTitle } from '../app/useDocumentTitle';
import { CURRENT_USER_ID } from '../config/demo';
import { signIn } from '../store/actions';
import { useDataView, useDemoDispatch } from '../store/hooks';
import { Button } from '../ui/Button';
import s from './LoginPage.module.css';

export function LoginPage() {
  useDocumentTitle('Connexion');
  const navigate = useNavigate();
  const dispatch = useDemoDispatch();
  const data = useDataView();
  const user = data.users.find((u) => u.id === CURRENT_USER_ID);
  const enter = () => {
    dispatch(signIn());
    navigate(paths.overview());
  };
  return (
    <main className={s.page}>
      <section className={s.brand}>
        <span className={s.wordmark}>Covenn</span>
        <p className={s.promise}>La dette d’un groupe, lisible en un regard : chaque chiffre relié à son contrat, sa balance ou sa saisie.</p>
      </section>
      <section className={s.panel}>
        <h1 className={s.title}>Connexion</h1>
        <p className={s.hint}>Espace de démonstration : les identifiants sont préremplis.</p>
        <label className={s.field}>
          <span>Adresse e-mail</span>
          <input readOnly value={user?.email ?? ''} />
        </label>
        <label className={s.field}>
          <span>Mot de passe</span>
          <input readOnly type="password" value="demonstration" />
        </label>
        <Button onClick={enter}>Se connecter</Button>
      </section>
    </main>
  );
}
