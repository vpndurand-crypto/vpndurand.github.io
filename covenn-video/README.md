# Covenn — films produit HEXA (30 s)

Couche de production vidéo **indépendante** de la bêta. Les sources de la bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants (badges de statut, pastilles de source, jauge, page de contrat, barre latérale), jetons CSS, police Figtree, données de démonstration et moteur de calcul.

- **Version finale V4** : `out/covenn-hexa-v4-30s.mp4` — 1920 × 1080 natif, 30 i/s, 900 images, 30,000 s, H.264 High (yuv420p, BT.709) + AAC 48 kHz stéréo 256 kb/s, −16 LUFS, crête −2 dBFS.
- **Version sans musique** : `out/covenn-hexa-v4-30s-sans-musique.mp4` — même image, design sonore seul, au niveau exact qu'il a dans la version complète.
- Versions précédentes : `out/covenn-hexa-v3-30s.mp4` (première version « vision »), `out/covenn-hexa-30s-v2.mp4` et `out/covenn-hexa-30s-v1.mp4` (démonstration d'une fonctionnalité).
- Technologie : Remotion 4 + React/TypeScript, rendu image par image déterministe ; musique et sons synthétisés par script (aucun échantillon externe).

## Commandes

```bash
npm install
npm run studio                                   # prévisualisation (les deux compositions, avec le son)
npm run score                                    # musique + design sonore : public/audio/covenn-vision-score.wav
npm run score:sfx                                # design sonore seul, même gain (après npm run score) : public/audio/covenn-vision-sfx.wav
npm run render:vision                            # rendu image (out/covenn-hexa-vision-raw.mp4)
npm run master:vision                            # fichiers livrés : out/covenn-hexa-v4-30s.mp4 et out/covenn-hexa-v4-30s-sans-musique.mp4
node scripts/stills.mjs out/qa 120 300 580       # images de contrôle (COMP=CovennHexa pour la v2)
npm run verify:vision                            # cohérence des chiffres du film
npm run verify:values                            # 28 valeurs de la bêta (calculées par son moteur)
npm run verify:beta                              # la copie de la bêta est identique à l'archive livrée
npm run typecheck                                # TypeScript strict
node scripts/score.mjs --stems                   # musique + pistes séparées dans out/audio-stems/
```

## V4 : déroulé

| Temps | Séquence | Texte à l'écran | Statut affiché |
|---|---|---|---|
| 0:00–0:03 | Le monde d'avant : balances, contrats, relevés et contrats des filiales étrangères arrivent de plus en plus vite, puis convergent vers un point | Votre finance est partout. | — |
| 0:03–0:06 | Covenn naît du point de convergence, lit un contrat (contrat, taux, échéance, covenant, encours, page source) ; les financements « prêteur · montant » filent vers l'encours du groupe | Covenn connecte les données. | Projection produit |
| 0:06–0:10 | Consolidation : plan serré sur **20,0 M€**, dézoom sur le cockpit (6 sociétés dont 3 à l'étranger, 4 pays, 7 financements, 4 prêteurs) ; navigation Groupe → France → Démo Industrie SAS → retour au groupe | Une vision. Tout votre groupe. | Projection produit |
| 0:10–0:13 | Le covenant : 3,13x, seuil ≤ 3,50x, marge 0,37x, clause art. 19.2 p. 47 reliée au seuil | Chaque engagement sous contrôle. | Bêta : calcul réel sur données fictives |
| 0:13–0:16 | Chronologie : test, échéance, crédit renouvelable à refinancer, seuil abaissé à 3,25x (vigilance), maturité | Anticipez, ne subissez plus. | Projection produit |
| 0:16–0:20 | Simulation en trois temps — **avant** : 3,13x sous le seuil contractuel ≤ 3,50x, covenant respecté ; **décision** : « Nouvelle acquisition » activée (4,0 M€ de dette, 800 k€ d'EBITDA), recalcul ; **après** : la barre franchit le seuil à 3,53x (orange puis rouge, accent sonore), « Risque de dépassement », appel « Préparer le financement → » | Et si vous pouviez voir demain ? | Projection produit |
| 0:20–0:24 | Le scénario devient une pièce du dossier : Structure de dette consolidée, Données financières, Échéanciers, Covenants et ratios, Scénario étudié, Besoin de financement (4,0 M€) ; « Dossier constitué » (jamais « financement prêt ») | Votre prochain financement commence ici. | Projection produit |
| 0:24–0:27 | Les blocs deviennent des nœuds ; trois orbites s'allument autour de Covenn : 1 Piloter la dette → 2 Piloter le haut de bilan → 3 Faciliter le financement | De la donnée à la décision. / De la décision au financement. | Projection produit |
| 0:27–0:30 | Aurore rose-violet du pitch deck, la marque se pose sur l'impact final de la musique | Covenn — Le copilote IA du haut de bilan. (covenn.io, discret) | — |

Les séquences « projection » portent la mention « Projection produit — Vision Covenn · données fictives » ; la séquence covenant porte « Bêta Covenn · calcul réel sur données fictives ». Aucune projection n'est présentée comme réalisée.

### Données (une seule histoire, un seul groupe)

`src/hexa/data.ts` part du « Groupe Démonstration » de la bêta (Démo Industrie, Démo Logistique, Démo Services ; prêteurs fictifs Banque Exemple, Banque Aurore, Banque Méridienne, Finance Bail Exemple ; encours au 30/09/2026 ; Leverage calculé par le moteur ; échéancier et alertes d'aperçu) et y ajoute, **en projection**, trois filiales étrangères fictives (Démo Iberia S.L., Démo Deutschland GmbH, Démo USA Inc.) et un scénario d'acquisition. Totaux, parts et ratios sont calculés en décimal exact et vérifiés par `scripts/verify-vision.mjs` :

- encours du groupe 20,0 M€ (France 14,0 · Espagne 2,5 · Allemagne 2,0 · États-Unis 1,5) ; par prêteur 11,5 / 4,6 / 2,5 / 1,4 M€ ;
- Leverage 3,13x = 9,4 M€ / 3,0 M€ (bêta) ; scénario : (9,4 + 4,0) / (3,0 + 0,8) = 3,53x, marge −0,03x ; encours 20,0 → 24,0 M€.

### Musique et design sonore

`scripts/score.mjs` synthétise la musique (120 BPM : chaque changement de séquence tombe sur un temps) et les sons d'interface à partir des repères de `src/hexa/timing.ts` (`CUES`, mêmes images que le film). La musique est rendue avant les repères, avec sa propre graine : la retouche des sons ne la modifie pas. Impacts à 3, 6 et 16 s ; accent marqué au franchissement du seuil (18,0 s) ; six « verrous » pour les blocs du dossier ; impact à 25,5 s sur « De la décision au financement. » ; la marque se pose sur l'impact final (27,0 s) ; extinction jusqu'au silence à 30,000 s. `npm run score:sfx` rend le design sonore seul avec le gain de la version complète (`public/audio/score-levels.json`). Pour remplacer la musique par un titre sous licence, déposer le fichier dans `public/audio/covenn-vision-score.wav` (30 s, 48 kHz) puis relancer `npm run render:vision && npm run master:vision`.

### Structure

- `src/hexa/Hexa.tsx` — assemblage (calques, fond, son) ; `timing.ts` — conducteur (séquences, textes, repères sonores) ; `data.ts` — données ; `kit.tsx` — écrans de projection dessinés avec les classes et jetons de la bêta ; `Captions.tsx`, `Mention.tsx`.
- `src/hexa/scenes/` — `Chaos`, `Ingest`, `Cockpit` (+ `cockpitLayout`), `Covenant`, `Timeline`, `Simulation`, `Dossier`, `Network` (+ `networkLayout`), `Signature`.
- `src/film/`, `src/bridge/` — version 2 (démonstration de la bêta) et pont vers la bêta, partagés.

## Version 2 : déroulé (pour mémoire)

| Temps | Scène | Texte à l'écran |
|---|---|---|
| 0:00–0:04 | Le problème : fichiers réels de la démo, accumulation | Cinq fichiers Excel. Trois contrats PDF. Une dette à piloter. |
| 0:04–0:08 | La rupture : les documents passent sous Covenn, leurs chiffres rejoignent la vue groupe réelle | Et si tout devenait clair ? |
| 0:08–0:13 | La preuve produit : 3,13x, seuil ≤ 3,50x, marge, 1,1 M€ mobilisable | Vos covenants. Calculés. Suivis. Maîtrisés. |
| 0:13–0:18 | La différenciation : arbre de provenance, balance (lignes 20–23), contrat art. 19.2 p. 47 | Chaque chiffre. Une source. Une preuve. |
| 0:18–0:23 | De la mesure à l'anticipation : calcul enregistré, réimport, 3,17x (+0,03x), bandeau | Les écarts détectés. Les décisions éclairées. |
| 0:23–0:27 | La vision : réseau abstrait autour de la marque Covenn | Aujourd'hui, la dette. Demain, tout le haut de bilan. |
| 0:27–0:30 | La signature : aurore du deck, logo | L'intelligence au cœur de votre stratégie financière. — covenn.io |
