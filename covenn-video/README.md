# Covenn — films produit HEXA (30 s)

Couche de production vidéo **indépendante** de la bêta. Les sources de la bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants et classes CSS (barre latérale, barre supérieure, pastilles de source, jauge, page de contrat, badges), jetons CSS, police Figtree, données de démonstration et moteur de calcul.

- **Version finale V5 (anglais)** : `out/Covenn_Hexa_V5_English_30s.mp4` — 1920 × 1080 natif, 30 i/s, 900 images, 30,000 s, H.264 High (yuv420p, BT.709) + AAC 48 kHz stéréo 256 kb/s, −16 LUFS, crête −2 dBFS. Rendu à partir des sources (images PNG, sans perte), un seul encodage final.
- **Version sans musique** : `out/Covenn_Hexa_V5_English_30s_no-music.mp4` — même image, design sonore seul, au niveau exact qu'il a dans la version complète.
- Versions précédentes : `out/covenn-hexa-v4-30s.mp4` (et sa version sans musique), `out/covenn-hexa-v3-30s.mp4`, `out/covenn-hexa-30s-v2.mp4`, `out/covenn-hexa-30s-v1.mp4` (en français).
- Technologie : Remotion 4 + React/TypeScript, rendu image par image déterministe ; musique et sons synthétisés par script (aucun échantillon externe).

## Commandes

```bash
npm install
npm run studio                                   # prévisualisation (avec le son)
npm run score                                    # musique + design sonore : public/audio/covenn-vision-score.wav
npm run score:sfx                                # design sonore seul, même gain (après npm run score) : public/audio/covenn-vision-sfx.wav
npm run render:v5                                # rendu image (out/covenn-hexa-v5-raw.mp4, images PNG, CRF 8)
npm run master:v5                                # fichiers livrés : out/Covenn_Hexa_V5_English_30s.mp4 et …_no-music.mp4
node scripts/stills.mjs out/qa 120 300 580       # images de contrôle (COMP=CovennHexa pour la v2)
npm run verify:vision                            # cohérence des chiffres du film
npm run audit:text                               # tous les textes rendus, image par image : aucun mot ni format français
npm run verify:values                            # 28 valeurs de la bêta (calculées par son moteur)
npm run verify:beta                              # la copie de la bêta est identique à l'archive livrée
npm run typecheck                                # TypeScript strict
node scripts/score.mjs --stems                   # musique + pistes séparées dans out/audio-stems/
```

## V5 : déroulé

Fil narratif : fragmentation → intelligence → contrôle → anticipation → décision → préparation du financement → pilotage du capital → accès au capital. Les scènes 2 à 7 montrent le produit (une seule application, un seul groupe fictif) ; les scènes 8 et 9 élargissent le même logiciel, sans changer de design.

| Temps | Séquence | Texte à l'écran | Mention |
|---|---|---|---|
| 0:00–0:02.5 | Contrats, balances, relevés et contrats des filiales étrangères arrivent par rafales, avec des étiquettes de banques, de sociétés et de pays ; tout converge vers un point | Debt is fragmented. / Financing is disconnected. | — |
| 0:02.5–0:05 | Covenn naît du point de convergence ; extraction des termes d'un contrat (Facility amount, Interest rate, Maturity date, Financial covenants, page source à l'appui), registre des financements, les montants « Bank · amount » filent vers l'encours | Covenn turns complexity into clarity. | Product vision — illustrative data |
| 0:05–0:08.5 | Plan serré sur €20.0M, dézoom sur le cockpit (€20.0M, 6 entities, 4 countries, 3.13x), Groupe → France → Demo Industries SAS → retour | One view. Across your entire group. / Multi-bank. Multi-entity. Multi-country. | Product vision |
| 0:08.5–0:11 | Net leverage 3.13x, Covenant Limit ≤ 3.50x, Covenant Headroom 0.37x, clause 19.2 p. 47 reliée au seuil | Every covenant. Backed by its source. | Covenn beta — real calculation on illustrative data |
| 0:11–0:13.5 | Chronologie : Covenant review, Repayment, Refinancing, Debt maturity ; la marche de seuil à 3.25x en orange (Warning, signalée 8 mois avant) | Anticipate. Don’t react. | Product vision |
| 0:13.5–0:17 | Scenario Analysis : Current Position → New Scenario (acquisition debt €4.0M, target EBITDA €800k), recalcul, 3.53x franchit la limite, « Projected Covenant Breach », « Prepare financing → » | Simulate tomorrow. Decide today. | Product vision |
| 0:17–0:20.5 | Financing Package : six sections passent à « Ready » en cascade, « Package complete », « Share for review » (jamais « financement accordé ») | Prepare your next financing. | Product vision |
| 0:20.5–0:23.5 | La caméra recule : le dossier n'est que la carte « Debt » du cockpit Capital Structure (Debt €20.0M, Equity €24.0M, Other capital instruments €3.5M), modules Capital Structure, Scenarios, Financing Strategy | Debt is just the starting point. / Capital structure is our ambition. | Our vision — illustrative data |
| 0:23.5–0:27 | L'entreprise (données structurées, besoin de €4.0M) → Covenn → Banks, Private Debt, Capital Markets : les connexions se construisent (aucun nom, aucun logo, aucune offre) | OUR VISION · From managing capital to accessing it. | Our vision |
| 0:27–0:30 | Aurore rose-violet, logo | Covenn — The operating system for corporate capital. — Starting with debt. | — |

### Données (une seule histoire, un seul groupe)

`src/hexa/data.ts` part du groupe de démonstration de la bêta (trois sociétés françaises, encours au 30/09/2026, Leverage calculé par le moteur, échéancier et alertes d'aperçu) : montants, dates et ratios viennent de la bêta, les libellés sont traduits (sociétés « Demo Industries SAS », « Demo Logistics SAS », « Demo Services SAS » ; prêteurs rebaptisés « Bank A/B/C » et « Lease Co. » pour qu'aucun nom ne ressemble à une vraie banque). Il y ajoute, **en projection**, trois filiales étrangères fictives (Demo Iberia S.L., Demo Germany GmbH, Demo USA Inc.), un scénario d'acquisition, une structure du capital et trois familles de financeurs. Formats anglais : `src/hexa/format.ts` (€20.0M, 3.13x, Dec 31, 2029). Documents traduits : `src/hexa/docs.tsx`. Contrôles : `scripts/verify-vision.mjs` et `scripts/audit-text.mjs`.

- encours du groupe €20.0M (France 14.0 · Spain 2.5 · Germany 2.0 · United States 1.5) ; par prêteur 11.5 / 4.6 / 2.5 / 1.4 ;
- Net leverage 3.13x = €9.4M / €3.0M (bêta) ; scénario : (9.4 + 4.0) / (3.0 + 0.8) = 3.53x, headroom −0.03x ; encours 20.0 → 24.0 ;
- capital (illustration) : Debt €20.0M + Equity €24.0M + Other capital instruments €3.5M = €47.5M ; la même acquisition financée par dette (3.53x), moitié-moitié (3.00x) ou fonds propres (2.47x).

### Temps des séquences reprises de la V4

Les scènes 2 à 7 réutilisent les animations de la V4, écrites en images V4 : `timing.warp` convertit l'image V5 en image V4 (correspondance linéaire par morceaux, calée sur les changements de séquence et sur le franchissement du seuil à 15,5 s). Les scènes 1, 8, 9 et 10 sont écrites directement en images V5.

### Musique et design sonore

`scripts/score.mjs` synthétise la musique (120 BPM : chaque changement de séquence tombe sur un temps) et les sons d'interface à partir des repères de `src/hexa/timing.ts` (`CUES`). Mêmes sons, même harmonie et même tempo que la V4, arrangement refait sur le montage V5 : 0–5 s tension et démarrage nerveux, 5–13 s groove, 13,5–20 s accélération (croches puis doubles croches, un temps suspendu avant le franchissement du seuil à 15,5 s), 20,5–27 s montée plus ample (halo aigu, arpèges à l'octave), impact final et note qui s'éteint sur le logo à 27 s, silence à 30,000 s. Sons d'interface : apparition de cartes, connexion de données, validation, variation du ratio, assemblage du dossier, extension du réseau. `npm run score:sfx` rend le design sonore seul avec le gain de la version complète (`public/audio/score-levels.json`).

### Structure

- `src/hexa/Hexa.tsx` — assemblage (calques, fond, son) ; `timing.ts` — conducteur (séquences, textes, mentions, correspondance V4, repères sonores) ; `data.ts`, `format.ts`, `docs.tsx` — données, formats et documents anglais ; `kit.tsx` — écrans dessinés avec les classes et jetons de la bêta ; `Captions.tsx`, `Mention.tsx`.
- `src/hexa/scenes/` — `Chaos`, `Ingest`, `Cockpit` (+ `cockpitLayout`), `Covenant`, `Timeline`, `Simulation`, `Dossier`, `CapitalStructure`, `Access`, `Signature`.
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
