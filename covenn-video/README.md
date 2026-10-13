# Covenn — films produit HEXA (30 s)

Couche de production vidéo **indépendante** de la bêta. Les sources de la bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants (badges de statut, pastilles de source, jauge, page de contrat, barre latérale), jetons CSS, police Figtree, données de démonstration et moteur de calcul.

- **Version finale « vision »** : `out/covenn-hexa-vision-30s.mp4` — 1920 × 1080, 30 i/s, 900 images, 30,000 s, H.264 (yuv420p) + AAC 48 kHz stéréo, −16 LUFS.
- Versions précédentes (démonstration d'une fonctionnalité) : `out/covenn-hexa-30s-v2.mp4`, `out/covenn-hexa-30s-v1.mp4`.
- Technologie : Remotion 4 + React/TypeScript, rendu image par image déterministe ; musique synthétisée par script (aucun échantillon externe).

## Commandes

```bash
npm install
npm run studio                                   # prévisualisation (les deux compositions, avec le son)
npm run score                                    # régénère la musique : public/audio/covenn-vision-score.wav
npm run render:vision                            # rendu brut (out/covenn-hexa-vision-raw.mp4)
npm run master:vision                            # fichier livré : out/covenn-hexa-vision-30s.mp4 (yuv420p, AAC, 30,000 s)
node scripts/stills.mjs out/qa 120 300 580       # images de contrôle (COMP=CovennHexa pour la v2)
npm run verify:vision                            # cohérence des chiffres du film « vision »
npm run verify:values                            # 28 valeurs de la bêta (calculées par son moteur)
npm run verify:beta                              # la copie de la bêta est identique à l'archive livrée
node scripts/score.mjs --stems                   # musique + pistes séparées dans out/audio-stems/
```

## Version « vision » : déroulé

| Temps | Séquence | Texte à l'écran | Statut affiché |
|---|---|---|---|
| 0:00–0:03 | Le monde d'avant : balances, contrats et relevés (fichiers de la démo) et contrats de filiales étrangères s'accumulent, puis convergent | Votre finance est partout. | — |
| 0:03–0:06 | Covenn lit un contrat (contrat, taux, échéance, covenant, encours, page source) puis relie les financements des six sociétés | Covenn connecte les données. | Projection produit |
| 0:06–0:10 | Cockpit groupe : encours total, pays, prêteurs, types ; zoom groupe → France → Démo Industrie, puis retour | Une vision. Tout votre groupe. | Projection produit |
| 0:10–0:13 | Le covenant : 3,13x, seuil ≤ 3,50x, marge 0,37x, clause art. 19.2 p. 47 reliée au seuil | Chaque engagement sous contrôle. | Bêta : calcul réel sur données fictives |
| 0:13–0:16 | Chronologie : test, échéance, crédit renouvelable à refinancer, seuil abaissé à 3,25x (vigilance), maturité | Anticipez, ne subissez plus. | Projection produit |
| 0:16–0:20 | Simulation « Nouvelle acquisition » : 4,0 M€ de dette, 800 k€ d'EBITDA, leverage projeté 3,53x, dépassement identifié comme projection | Et si vous pouviez voir demain ? | Projection produit |
| 0:20–0:24 | Dossier de financement : six blocs s'emboîtent, « Dossier structuré » (jamais « financement accordé ») | Votre prochain financement commence ici. | Projection produit |
| 0:24–0:27 | Réseau autour de Covenn : filiales, données, instruments, échéances, covenants, scénarios, partenaires financiers | Bien plus qu'un outil de dette. / Le futur du haut de bilan. | Projection produit |
| 0:27–0:30 | Aurore du pitch deck, logo | Le copilote IA du haut de bilan. — L'intelligence au cœur de votre stratégie financière. — covenn.io | Projection produit, données fictives |

### Données (une seule histoire, un seul groupe)

`src/hexa/data.ts` part du « Groupe Démonstration » de la bêta (Démo Industrie, Démo Logistique, Démo Services ; prêteurs fictifs Banque Exemple, Banque Aurore, Banque Méridienne, Finance Bail Exemple ; encours au 30/09/2026 ; Leverage calculé par le moteur ; échéancier et alertes d'aperçu) et y ajoute, **en projection**, trois filiales étrangères fictives (Démo Iberia S.L., Démo Deutschland GmbH, Démo USA Inc.) et un scénario d'acquisition. Totaux, parts et ratios sont calculés en décimal exact et vérifiés par `scripts/verify-vision.mjs` :

- encours du groupe 20,0 M€ (France 14,0 · Espagne 2,5 · Allemagne 2,0 · États-Unis 1,5) ; par prêteur 11,5 / 4,6 / 2,5 / 1,4 M€ ;
- Leverage 3,13x = 9,4 M€ / 3,0 M€ (bêta) ; scénario : (9,4 + 4,0) / (3,0 + 0,8) = 3,53x, marge −0,03x ; encours 20,0 → 24,0 M€.

### Musique et design sonore

`scripts/score.mjs` synthétise la musique (120 BPM : chaque changement de séquence tombe sur un temps) et les sons d'interface à partir des repères de `src/hexa/timing.ts` (`CUES`, mêmes images que le film). Impacts à 3, 6, 16 et 27 s, tension au franchissement du seuil (18,2 s), six « verrous » pour les blocs du dossier, extinction jusqu'au silence à 30,000 s. Pour remplacer la musique par un titre sous licence, déposer le fichier dans `public/audio/covenn-vision-score.wav` (30 s, 48 kHz) puis relancer `npm run render:vision && npm run master:vision`.

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
