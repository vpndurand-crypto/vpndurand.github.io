# Covenn — film produit HEXA (30 s)

Couche de production vidéo **indépendante** de la bêta. Les sources de la bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants (vue groupe, badges de statut, pastilles de provenance, jauge, page de contrat, bandeau, notification, bouton), jetons CSS, police Figtree, données et moteur de calcul.

- Rendu : `out/covenn-hexa-30s-final.mp4` — 1920 × 1080, 30 i/s, 900 images, 30,0 s, H.264 yuv420p.
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
