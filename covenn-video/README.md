# Covenn — films produit HEXA (30 s)

Couche de production vidéo **indépendante** des bêtas. Les sources de la première bêta sont copiées telles quelles dans `beta/` (206 fichiers, jamais modifiés) et réutilisées : composants et classes CSS (barre latérale, barre supérieure, pastilles de source, jauge, page de contrat, badges), jetons CSS, police Figtree, données de démonstration et moteur de calcul. La bêta « Capital operating system » est copiée telle quelle dans `beta-capital-os/` (un fichier HTML autonome, empreinte dans `SHA256SUMS`, jamais modifié).

- **Film HEXA V6 « The Capital OS » (anglais)** : `out/Covenn_Hexa_V6_CapitalOS_English_30s.mp4` et `out/Covenn_Hexa_V6_CapitalOS_English_30s_no-music.mp4` — nouveau film de 30 s en sept scènes sur la bêta « Capital operating system », construit autour d'un seul cas de la démonstration (le financement de l'acquisition Project Falcon) : produit crédible, extension au-delà de la gestion de la dette, vision d'une infrastructure de capital connectée. Résumé scène par scène, changelog et note d'exactitude produit (en anglais) : `V6_DELIVERY_NOTES.md`. Voir la section « Film V6 » ci-dessous.
- **Film Capital OS (anglais)** : `out/Covenn_Hexa_V5_CapitalOS_English_30s.mp4` et `out/Covenn_Hexa_V5_CapitalOS_English_30s_no-music.mp4` — le montage de la V5 (mêmes séquences, mêmes textes, même musique, mêmes formats de sortie), refait sur la bêta « Capital operating system » : ses écrans, ses classes CSS, son vocabulaire et les valeurs calculées par son moteur. Voir la section « Film Capital OS » ci-dessous.
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

# Film Capital OS
npm run extract:capos                            # bêta → src/capos/beta.css (styles limités à .capos) et src/capos/snapshot.json (valeurs du moteur)
npm run score:capos && npm run score:capos:sfx   # public/audio/capos-score.wav et capos-sfx.wav (repères de src/capos/timing.ts)
npm run render:capos                             # rendu image (out/covenn-capos-raw.mp4, images PNG, CRF 8, un seul onglet du navigateur*)
npm run master:capos                             # fichiers livrés : out/Covenn_Hexa_V5_CapitalOS_English_30s.mp4 et …_no-music.mp4
COMP=CovennCapitalOS node scripts/stills.mjs out/qa 120 300 580
npm run verify:capos                             # empreinte de la bêta, puis chaque chiffre du film contre son moteur
npm run audit:capos                              # tous les textes rendus : aucun mot ni format français (hors noms propres de la bêta)

# Film HEXA V6 « The Capital OS »
npm run extract:capos                            # valeurs du moteur et textes des écrans rendus de la bêta (snapshot.screens)
npm run verify:v6                                # empreinte de la bêta, chaque chiffre et libellé du film, mots interdits
npm run audit:v6                                 # tous les textes rendus, image par image : anglais uniquement
npm run score:v6 && npm run score:v6:sfx         # public/audio/v6-score.wav et v6-sfx.wav (repères de src/v6/timing.ts)
npm run render:v6                                # rendu image (out/covenn-v6-raw.mp4, images PNG, CRF 8, un seul onglet*)
npm run master:v6                                # fichiers livrés : out/Covenn_Hexa_V6_CapitalOS_English_30s.mp4 et …_no-music.mp4
COMP=CovennHexaV6 node scripts/stills.mjs out/qa-v6 150 270 390 570 720 840
```

\* En rendu parallèle (quatre onglets), Chromium laissait parfois, pendant quelques images, une trace d'un chiffre en mouvement (le « 3.13x » qui quitte sa tuile au début de S4) : le film Capital OS est rendu sur un seul onglet, ce qui supprime l'artefact (contrôlé image par image contre un rendu de référence).

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

## Film V6 « The Capital OS » : déroulé

Un seul fil, du premier fragment à la marque : le financement de l'acquisition Project Falcon par Lumenvale Deutschland GmbH, qui existe de bout en bout dans la démonstration (scénario → demande de financement → conditions indicatives). Détail et justification de chaque choix : `V6_DELIVERY_NOTES.md`.

| Temps | Scène | Texte | Ce qu'on voit | Statut |
|---|---|---|---|---|
| 0:00–0:03 | Fragmentation | Debt is fragmented. / Financing is disconnected. | Quatre sources lisibles en 3D retenue (échéancier, contrat SFA, calcul du covenant, relevé Beispielbank) ; un signal violet les relie ; elles se rangent et se fondent dans l'encours | Documents de la démo |
| 0:03–0:07 | Consolidation | One view. Across your entire group. | Plan serré sur €18.6m puis la page Capital overview de la bêta (cinq indicateurs, pays et sociétés, prêteurs) ; les montants des pays rejoignent le total | In this demo |
| 0:07–0:11 | Simulation | Simulate tomorrow. Decide today. | Page du scénario Project Falcon : saisie, colonne « At 30 Sep 2027 », 2.46x → 3.07x, covenant SFA projeté Watch → Critical headroom (marche de seuil) ; le nouvel emprunt de €6.5m | Prévision d'illustration |
| 0:11–0:15 | Préparation | Prepare your next financing. | La demande naît du bouton « Create financing request from scenario » ; sept pièces viennent des rubriques de Covenn ; la huitième reste « Needs review » (7/8) | In this demo |
| 0:15–0:23 | Réseau (vision) | From managing capital to accessing it. | L'entreprise → Covenn → Banks, Private Debt, Capital Markets → Senior debt, Unitranche, Future market-based financing (illustration) ; les conditions indicatives convergent vers la comparaison | Future capability |
| 0:23–0:26.5 | Comparaison | Compare terms. Choose with confidence. | Onglet « Terms comparison » : trois propositions indicatives fictives, sans classement ; Corvane retenue pour négociation (message de la bêta : un choix de travail) | In this demo |
| 0:26.5–0:30 | Marque | The operating system for global corporate capital. / Starting with debt. | Aurore, marque, tenue jusqu'à 30,0 s | — |

- Données : `src/v6/data.ts` lit les valeurs du moteur et, nouveauté de la V6, les textes des écrans rendus de la bêta (`snapshot.screens`, écrit par `scripts/extract-capos.mjs`) : indicateurs, tableaux, onglets, boutons, notes. Si un libellé attendu n'est pas affiché par la bêta, le film refuse de se construire.
- Contrôles : `scripts/verify-v6.mjs` (empreinte, chiffres, cohérences, signalement démo / vision, mots interdits : crypto, jeton, portefeuille, offre ferme, financement accordé) et `scripts/audit-text.mjs --film v6`.
- Musique : `scripts/score-v6.mjs` (mêmes sons que la V5, arrangement V6 : tension, montée rythmique, élan, expansion avec accent à l'ouverture des trois voies, résolution, conclusion tenue jusqu'à 30,0 s).
- Structure : `src/v6/Film.tsx` (assemblage), `timing.ts` (conducteur et repères sonores), `data.ts`, `Window.tsx` (fenêtre de l'application et caméra), `Captions.tsx`, `Mention.tsx` ; `src/v6/scenes/` — `Fragments`, `Pages` (vue groupe, scénario, demande, comparaison), `FalconCard` (la demande, de S3 à S5), `Network`, `EndCard`.

## Film Capital OS : déroulé

Même fil narratif, mêmes temps, mêmes textes que la V5 ; le produit montré est la bêta « Capital operating system » (groupe fictif Lumenvale Group, cinq sociétés en France, en Allemagne et au Royaume-Uni, six financements, données au 30 Sep 2026). Mention en bas à gauche : « Interactive demo · Fictional data » (l'étiquette de la bêta), « Covenn demo — real calculation on fictional data » sur le covenant, « Our vision · Future capability » sur l'accès au capital.

| Temps | Séquence | Ce qu'on voit (écrans et chiffres de la bêta) |
|---|---|---|
| 0:00–0:02.5 | Fragmentation | Balances (plan comptable français et liasses de groupe allemande et britannique, dont une en GBP), contrats de six prêteurs, relevés, rapport de gestion, offre Project Falcon ; étiquettes de prêteurs, sociétés, pays, devises |
| 0:02.5–0:05 | Intelligence | Extraction assistée du contrat SFA, page source à l'appui, avec la mention « Preview » de la bêta et les statuts « Validated » / « Corrected by reviewer » ; registre des six financements ; les encours rejoignent €18.6m |
| 0:05–0:08.5 | Vue groupe | Capital overview : €18.6m, 5 sociétés, 3 pays (EUR · GBP), covenant le plus tendu 3.13x Watch ; répartition par pays et société, par prêteur, par instrument et par devise ; Group › France › Lumenvale Industrie SAS |
| 0:08.5–0:11 | Contrôle | Page Covenants : 3.13x, seuil ≤ 3.50x, marge 10.5 %, €1,100,000 de dette nette et €314,286 d'EBITDA absorbables, clause 19.2 page 47 surlignée et reliée au seuil |
| 0:11–0:13.5 | Anticipation | Repayment schedule : test de covenant, échéance, maturité de la ligne renouvelable, marche de seuil à 3.25x le 1 Jul 2027 (« Projected: critical headroom », marge 10.5 % → 3.6 %), maturité du SFA |
| 0:13.5–0:17 | Décision | Scénario Project Falcon : prix €7,500,000, EBITDA acquis €1,200,000, emprunt €6,500,000 ; à l'horizon du 30 Sep 2027, dette nette / EBITDA 2.46x → 3.07x, encours €18.6m → €23.5m, liquidité €4.69m → €558k ; covenant SFA projeté « Critical headroom » (marche de seuil) ; « Create financing request from scenario » |
| 0:17–0:20.5 | Préparation | Demande « Acquisition financing — Project Falcon » : la liste de préparation de la bêta se remplit (7/8, une pièce à relire), le scénario lié, « Ready for review », « Generate financing brief » |
| 0:20.5–0:23.5 | Pilotage du capital | Capital overview : barre de financement (dette par instrument, puis fonds propres €19.8m, engagements non tirés €1.5m ; total financé €38.4m), quatre scénarios, €12.6m de financements en préparation, indicateurs de la page Capital structure |
| 0:23.5–0:27 | Accès au capital (vision) | Lumenvale Group et son besoin de €6.5m → Covenn → Banks, Private Debt, Capital Markets, marqués « Future capability » (aucun nom, aucun logo, aucune offre) |
| 0:27–0:30 | Signature | Identique à la V5 |

### Données et fidélité à la bêta

- `scripts/extract-capos.mjs` vérifie l'empreinte du fichier, ouvre la bêta dans Chromium sans accès réseau, appelle son propre moteur (positions, covenant, échéancier, scénarios, demandes de financement, priorités) et écrit `src/capos/snapshot.json` ; il extrait aussi sa feuille de style, limitée au film (`.capos`), dans `src/capos/beta.css`. Le film ne recalcule rien : `src/capos/data.ts` choisit et met en forme ces valeurs (règles de `Fmt` de la bêta, `src/capos/format.ts`).
- Les noms fictifs de la bêta sont conservés (Lumenvale, Banque Exemple, Beispielbank AG, Kingsmere Bank plc, Banque Aurore, Finance Bail Exemple, Banque Méridienne) : la bêta précise que tous ses financeurs sont fictifs.
- Choix de mise en scène, assumés et signalés : l'extraction de contrats est un aperçu simulé dans la bêta (pas d'OCR ni d'IA), le film la montre avec la mention « Preview » ; aucun scénario de la bêta ne mène à un dépassement de covenant, le moment fort de S6 est donc la marge critique à l'horizon, due à la marche de seuil (« Projected — not a covenant test ») ; à la fin de S7, la demande Project Falcon est montrée à l'étape « Ready for review », alors que la démonstration la place à « Indicative terms received » (propositions indicatives fictives) : le film ne montre aucune proposition ni offre ; les tuiles « Entities », « Countries » et « Tightest covenant » de S3 sont composées à partir des données de la bêta.
- Contrôles : `scripts/verify-capos.mjs` (empreinte, puis chaque chiffre contre le moteur et leur cohérence) et `scripts/audit-text.mjs --film capos` (tous les textes rendus, image par image).

### Structure

- `src/capos/CapitalOS.tsx` — assemblage ; `timing.ts` — conducteur (celui de la V5, repères de la scène 7 adaptés : le scénario, puis huit pièces en croches) ; `data.ts`, `format.ts`, `docs.tsx`, `kit.tsx` — données, formats, documents et composants de la bêta ; `Captions.tsx`, `Mention.tsx`.
- `src/capos/scenes/` — `Chaos`, `Ingest`, `Cockpit` (+ `cockpitLayout`), `Covenant`, `Timeline`, `Simulation`, `Request`, `CapitalOverview`, `Access`, `Signature`.
- `scripts/score.mjs --film capos` et `scripts/master.mjs --film capos` : même musique, même chaîne d'export que la V5.

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
