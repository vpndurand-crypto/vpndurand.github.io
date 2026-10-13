# Covenn — film produit HEXA (30 s)

Couche de production vidéo **indépendante** de la bêta. Les sources de la bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants (vue groupe, badges de statut, pastilles de provenance, jauge, page de contrat, bandeau, notification, bouton), jetons CSS, police Figtree, données et moteur de calcul.

- Rendu final : `out/covenn-hexa-30s-v2.mp4` — 1920 × 1080, 30 i/s, 900 images, 30,0 s, H.264 yuv420p (`out/covenn-hexa-30s-v1.mp4` : premier cut).
- Technologie : Remotion 4 + React/TypeScript, rendu image par image déterministe.

## Commandes

```bash
npm install
npm run studio                                 # prévisualisation
npm run render                                 # rendu MP4 (out/covenn-hexa-30s.mp4)
node scripts/stills.mjs out/qa 120 300 580     # images de contrôle
node scripts/verify-values.mjs                 # 28 valeurs affichées = brief validé (calculées par le moteur de la bêta)
node scripts/verify-beta.mjs [archive.zip]     # la copie de la bêta est identique à l'archive livrée
```

## Structure

- `src/bridge/demo.ts` — états réels du parcours (calcul en cours → enregistré → balance réimportée) et toutes les valeurs affichées, lues dans la bêta.
- `src/bridge/AppFrame.tsx` — la vraie vue groupe de la bêta, rendue par ses composants avec un état figé.
- `src/film/scenes/` — S1 sources, S2 convergence (caméra), S3–S5 calcul / preuve / calcul figé, S6 signature.
- `src/film/Film.tsx` — assemblage et textes.

## Déroulé (version 2)

| Temps | Scène | Texte à l'écran |
|---|---|---|
| 0:00–0:04 | Le problème : fichiers réels de la démo, accumulation | Cinq fichiers Excel. Trois contrats PDF. Une dette à piloter. |
| 0:04–0:08 | La rupture : les documents passent sous Covenn, leurs chiffres rejoignent la vue groupe réelle | Et si tout devenait clair ? |
| 0:08–0:13 | La preuve produit : 3,13x, seuil ≤ 3,50x, marge, 1,1 M€ mobilisable | Vos covenants. Calculés. Suivis. Maîtrisés. |
| 0:13–0:18 | La différenciation : arbre de provenance, balance (lignes 20–23), contrat art. 19.2 p. 47 | Chaque chiffre. Une source. Une preuve. |
| 0:18–0:23 | De la mesure à l'anticipation : calcul enregistré, réimport, 3,17x (+0,03x), bandeau | Les écarts détectés. Les décisions éclairées. |
| 0:23–0:27 | La vision : réseau abstrait autour de la marque Covenn | Aujourd'hui, la dette. Demain, tout le haut de bilan. |
| 0:27–0:30 | La signature : aurore du deck, logo | L'intelligence au cœur de votre stratégie financière. — covenn.io |
