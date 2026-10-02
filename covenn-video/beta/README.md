# Covenn — bêta HEXA

Prototype interactif de Covenn, plateforme de pilotage de la dette et des covenants des PME et ETI.
Application React + TypeScript + Vite compilée en **un seul fichier HTML autonome** : aucun serveur, aucun appel réseau, aucune IA appelée. Toutes les données sont fictives.

## Lancer le projet

```bash
npm install
npm run dev          # http://localhost:5173
```

Le fichier compilé s'ouvre aussi directement : double-clic sur `dist/index.html` (fonctionne en `file://`, dans un aperçu `about:srcdoc` et sur tout hébergement statique HTTPS).

## Générer le HTML

```bash
npm run build        # typecheck → tests → vite build → contrôles du fichier → exécution du fichier compilé
```

Résultat : `dist/index.html` (≈ 553 ko, limite fixée à 700 ko).

## Tester

```bash
npm test                   # 92 tests : moteur, cas de référence, store, routes, parcours vidéo, répétabilité de la démo,
                           # périmètre, réimport modifié, journal, espace de calcul
npm run check:standalone   # exécute dist/index.html en file://, about:srcdoc et https:// : navigation, retour, rechargement,
                           # persistance, absence de requêtes réseau, parcours vidéo, prise 1 → réinitialisation → prise 2
npm run scenario           # rejoue le cas LEVERAGE en console, chiffre par chiffre
npm run typecheck
```

## Avant chaque prise : réinitialiser la démonstration

**Paramètres → Démonstration → « Réinitialiser la démonstration » → confirmer.**
Le calcul du Leverage au 30/09/2026 redevient « Calcul en cours — non enregistré » ; les calculs enregistrés pendant la démo, le réimport modifié, le périmètre et les événements ajoutés au journal sont effacés. L'état réinitialisé survit au rechargement de la page.

Les horodatages de la démonstration sont déterministes (20/10/2026 à 10:30 pour la première action), pour que deux prises affichent la même chose.

## Parcours de démonstration officiel (vidéo HEXA)

| # | Action | Ce que l'on montre |
|---|--------|--------------------|
| 1 | Vue groupe → **Financements** (barre latérale) | Encours 14,0 M€, 4 financements, 4 prêteurs, 3 sociétés, covenants, points d'attention |
| 2 | Clic sur la ligne **Senior Facility Agreement** | Prêteur, type, montant initial, taux, encours, échéance, statut, covenants |
| 3 | **Voir le covenant Leverage** | 3,13x · ≤ 3,50x · Covenant respecté — vigilance |
| 4 | Clic sur **600 000,00 €** | Provenance : balance du 30/09/2026, 4 comptes, « Ouvrir la balance » |
| 5 | Clic sur **≤ 3,50x** | Clause 19.2 du contrat, page 47 surlignée, « Ouvrir le document à la page 47 » |
| 6 | Lecture du calcul | 10 000 000 − 600 000 = 9 400 000 ; 2 850 000 + 150 000 = 3 000 000 ; **3,13x** ; headroom **0,37x** (10,5 %) ; **1 100 000,00 €** mobilisables ; **314 285,71 €** de baisse d'EBITDA absorbable |
| 7 | **Enregistrer le calcul** → **Confirmer** | Calcul figé, daté, signé, empreinte 069afaa8 |
| 8 | **Vue groupe** | « Leverage au 30/09/2026 : calcul enregistré » dans la vision du groupe |

Démonstrations complémentaires : **Journal** (trace de l'enregistrement), **Paramètres → Réimporter la balance modifiée** après l'enregistrement (le calcul reste figé, la fiche affiche « Données modifiées depuis l'enregistrement », +0,03x), sélecteur de **périmètre** dans la barre supérieure (décocher Démo Logistique SAS : 10,5 M€, 2 financements), **Espace de calcul** depuis la fiche covenant.

## Principes

- **IA propose, humain valide, moteur déterministe calcule** : tous les montants, ratios, seuils, marges et statuts viennent de `src/domain` (big.js, aucune virgule flottante).
- **Provenance** : chaque chiffre souligné en pointillé ouvre son origine (contrat, balance, saisie justifiée, calcul).
- **Calcul figé** : un calcul enregistré ne change plus, même si les données changent ; un bandeau signale alors l'écart.
- **Aperçus honnêtes** : Échéances et attribution de variation portent le badge « Aperçu » ; la Feuille de route distingue « Dans la bêta » et « À venir ».
- Architecture : `src/domain` (moteur pur) → `src/store` (état, sélecteurs, persistance locale) → `src/features`, `src/pages`, `src/ui`. Routeur autonome (`createMemoryRouter` + fragment `#/…`), indépendant de l'origine de la page.
