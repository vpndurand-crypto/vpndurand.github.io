# COVENN — The Capital OS · HEXA V6 (30-second film) — delivery notes

Source of truth: `beta-capital-os/covenn-capital-os-demo-en.html` (the attached Covenn Capital OS demo, unmodified; SHA-256 in `beta-capital-os/SHA256SUMS`).
Every product screen, figure and label in the film is taken from that HTML: values are computed by its own engine and labels are read from its rendered screens (`npm run extract:capos` → `src/capos/snapshot.json`, `screens` block).

## 1. Deliverables

| File | Content |
|---|---|
| `out/Covenn_Hexa_V6_CapitalOS_English_30s.mp4` | Final film: music and sound design |
| `out/Covenn_Hexa_V6_CapitalOS_English_30s_no-music.mp4` | Same picture, sound design only (same level as in the full mix) |
| `src/v6/`, `scripts/score-v6.mjs` | Source project (Remotion composition `CovennHexaV6`, procedural score) |
| `V6_DELIVERY_NOTES.md` | This document: scene summary, changelog, product accuracy note |

Technical specification (both files, measured with ffprobe/ebur128 after export): see section 6.

## 2. Scene-by-scene summary

One thread runs through the whole film: the acquisition financing of **Project Falcon** by Lumenvale Deutschland GmbH, a case that exists end to end in the demo (scenario → financing request → indicative terms).

| # | Time | Headline | What is on screen | Status |
|---|---|---|---|---|
| 1 | 0:00–0:03 | Debt is fragmented. / Financing is disconnected. | Four legible sources from the demo, in restrained 3D: the repayment schedule (spreadsheet look, six instalments across three lenders and two currencies), the Senior Facility Agreement (page 1), the leverage covenant calculation at 30 Sep 2026 (€9,400,000 / €3,000,000 = 3.13x, ≤ 3.50x, clause 19.2 p. 47) and the Beispielbank AG lender statement (EUR 3,200,000.00). Blurred background sources (GBP group pack, other statements). A violet signal links the four sources; they straighten, align and fold into the outstanding-debt tile. | Demo documents and values |
| 2 | 0:03–0:07 | One view. Across your entire group. | Camera starts tight on **Outstanding debt €18.6m** and pulls back to the demo's **Capital overview**: the five KPI tiles (€18.6m, €4.69m liquidity, 4.26% weighted rate, €1.63m due within 12 months, 10.5% covenant headroom), *Distribution by country and entity* and *Exposure by capital provider*. Countries and their entities light up; their amounts (€14m + €3.2m + €1.39m) travel into the €18.6m total; a sweep runs through the six capital providers. One composition. | In this demo |
| 3 | 0:07–0:11 | Simulate tomorrow. Decide today. | *Explore a funding scenario* → the demo's **Project Falcon acquisition** scenario: assumptions typed in (€7,500,000 price, €1,200,000 acquired EBITDA, €1,000,000 cash, €6,500,000 new borrowing); *Today versus scenario* computes the *At 30 Sep 2027* column; **Net debt / EBITDA rolls 2.46x → 3.07x (+0.61x)**; the projected SFA leverage covenant moves from Watch (10.5%) to **Critical headroom (3.6%)** as the step-down to ≤ 3.25x applies — labelled *Illustrative forecast* and *Projected — not a covenant test*. The €6,500,000 new borrowing lights up: the funding requirement. | In this demo (illustrative forecast) |
| 4 | 0:11–0:15 | Prepare your next financing. | *Create financing request from scenario*: the request card is born from the button and becomes **Acquisition financing — Project Falcon, €6,500,000, Lumenvale Deutschland GmbH** (Acquisition finance, 6 years, target close 31 Mar 2027). Information already in Covenn flies in from the app's own sections and docks as seven clean rows (financial statements, management accounts, debt schedule, facility agreements, covenant history, forecast, transaction documents — each with the demo's *Available* / *Linked to existing data* status). The eighth item stays **Needs review** (use-of-proceeds summary): 7 of 8, nothing is shown as verified that the demo does not mark as such. The card persists into scene 5. | In this demo |
| 5 | 0:15–0:23 | From managing capital to accessing it. · One company. One financing profile. Multiple potential sources of capital. | **Future vision.** A: the request card becomes the company node (LUMENVALE GROUP · Project Falcon · €6.5m financing need) and its standardised profile (capital structure, covenants, forecast, documents) flows into Covenn. B: three pathways open — **Banks**, **Private Debt**, **Capital Markets** — with financing-profile objects moving along the connections (accent in the music at 17 s). C: each pathway resolves into an illustrative structure — Banks → Senior debt, Private Debt → Unitranche, Capital Markets → Future market-based financing (dashed, *Illustrative*); indicative terms leave the Banks and Private Debt pathways and converge into the comparison. Footnote: *Future capability · conceptual illustration — no live connections, partnerships or offers.* No crypto, tokens, wallets or trading charts; the technology layer stays invisible. | Future capability (concept) |
| 6 | 0:23–0:26.5 | Compare terms. Choose with confidence. | The demo's **Terms comparison** tab: Beispielbank AG (commercial bank), Corvane Credit Partners (private debt fund), Banque Exemple (commercial bank) — instrument, amount (with the €1m / €500k shortfalls), tenor, rate, all-in rate, amortisation, pro forma covenant check (5.6% / 31.8% / 12.3% headroom), estimated cash cost. A highlight moves across dimensions (amount → all-in rate → covenant headroom) without ranking. Corvane, the only proposal covering the full €6.5m, is **selected for negotiation**, with the demo's own confirmation: *This records a choice only. Current debt and capital structure are unchanged.* The demo's note stays visible: *No proposal is ranked "best" … Indicative terms are not offers or commitments.* | In this demo (fictional providers, indicative terms) |
| 7 | 0:26.5–0:30 | COVENN · The operating system for global corporate capital. · Starting with debt. | Violet / lilac / warm aurora opening from the negotiation badge; the Covenn mark lands on the final musical impact (26.5 s), then the wordmark and the two lines (the first is the title of the demo's *Product vision* page). Held to 30.0 s, no fade to black. | Brand |

Readability checkpoints (still frames in section 6): 5 s (frame 150), 9 s (270), 13 s (390), 19 s (570), 24 s (720), 28 s (840).

## 3. Changelog versus V5 (Capital OS edition)

**Retained**
- The demo's design system: its CSS (scoped extract), Figtree, icons, shell (sidebar, top bar), badges, tags, cards and fictional data (Lumenvale Group, fictional lenders).
- Headlines: *Debt is fragmented. / Financing is disconnected.*, *One view. Across your entire group.*, *Simulate tomorrow. Decide today.*, *Prepare your next financing.*, *From managing capital to accessing it.*, *Starting with debt.*
- The Project Falcon scenario (2.46x → 3.07x, critical headroom from the threshold step-down) and the €6.5m financing request.
- The procedural score (same instruments, harmony and 120 BPM tempo; no external samples) and the delivery chain (PNG frames → BT.709 H.264 master, separate no-music version).
- The aurora end card.

**Redesigned**
- Structure: 10 sequences → 7 scenes on the brief's timings; a single storyline (Project Falcon) from the first fragment to the brand.
- Scene 1: bursts of many small documents → four legible sources in restrained 3D, linked by a violet signal and folded into the €18.6m tile.
- Scene 2: composed cockpit tiles → the demo's real Capital overview page (its five KPI tiles and two of its cards), with country/entity amounts summing into the total.
- Scene 3: the demo's actual scenario page layout (Assumptions, Today versus scenario, Projected SFA covenants) instead of a bespoke simulation panel.
- Scene 4: an 8-row checklist animation → one clean request card that persists into scene 5.
- Scene 5 (hero): three-phase network on a capital-infrastructure backdrop (company → Covenn → three pathways → illustrative structures → convergence), 8 s instead of 3.5 s.
- New scene 6: the demo's indicative terms comparison and the *Selected for negotiation* step.
- End card tagline: *The operating system for corporate capital.* → *The operating system for global corporate capital.* (the demo's Product vision title).
- Music re-arranged for the new cut: tension (0–3 s), rhythmic build (3–11 s), momentum (11–15 s), expansion with an accent at the pathway reveal (15–23 s), resolution (23–26.5 s), brand conclusion sustained to 30.0 s (no early fade).
- Labels: one discreet state pill per product scene using the demo's roadmap vocabulary (*In this demo*), and explicit *FUTURE VISION* labelling plus a footnote in the vision scene.

**Removed**
- Assisted contract extraction (a *Preview* feature), the covenant source-clause sequence and the repayment-timeline sequence (*Every covenant. Backed by its source.*, *Anticipate. Don't react.*).
- The capital-structure pull-back (*Debt is just the starting point. / Capital structure is our ambition.*).
- The *Ready for review* stage shown at the end of the V5 request scene (the V6 does not assert any stage the demo does not record).

## 4. Product accuracy note — what the demo does vs. what is future vision

**Shown as the demo (HTML), with its real data and labels**
- Capital overview, group consolidation across 5 entities / 3 countries / 6 facilities / 6 capital providers (roadmap: *In this demo*).
- Illustrative scenarios with covenant projection — Project Falcon (*In this demo*; labelled *Illustrative forecast* and *Projected — not a covenant test*).
- Financing requests with preparation checklist and brief export (*In this demo*). The preparation status is the demo's: 7 of 8 available or linked, 1 needs review.
- Indicative terms comparison under common assumptions (*In this demo*). Providers are fictional (the demo states that all providers are fictional); terms are indicative, not offers or commitments; selection for negotiation records a working choice only.
- *Share with providers (preview)* appears only as the demo's own button label (a *Preview* capability); it is not shown as used.

**Shown as future vision (concept)**
- Scene 5 as a whole: the demo's *Open capital infrastructure* layer is a *Future capability* — connections with banks, digital lenders and private debt funds; standardised data exchange for credit processes; selected regulated market-based channels. The film shows provider *families* only (no names, no logos), illustrative structures, and states *no live connections, partnerships or offers*. Capital markets are further marked *Illustrative*.
- The demo itself claims no integration with banks, lenders, accounting systems or market-data providers, no partnership, no regulatory approval or lending, and no crypto assets, wallets or tokens; the film makes none of these claims.

**Film liberties (presentation only)**
- Text sizes are enlarged for screen legibility; layouts are condensed to one 1600 × 900 window (scene 2 brings two lower cards of the Capital overview page up under the KPI row; scene 3 shows three of the eight *Today versus scenario* rows and the leverage row of *Projected SFA covenants*; scene 6 shows nine of the comparison rows).
- Scene 1 presents the repayment schedule and the covenant calculation in a spreadsheet look to depict the pre-Covenn situation; every value is the demo's.
- Scene 3 types the saved scenario's inputs into the form, and adds a headroom gauge that draws the same numbers (3.13x against 3.50x → 3.25x).
- Scene 4's request card combines the request header with the preparation checklist (the demo shows them on the request page and its Preparation tab).
- The transition from scene 5 to scene 6 is narrative: in the demo, indicative terms are recorded in the request after the shortlisted providers are approached; nothing in the demo is received through a live network.

## 5. Rebuild

```bash
cd covenn-video
npm install
npm run extract:capos            # demo → src/capos/snapshot.json (engine values + rendered screen texts), src/capos/beta.css
npm run verify:v6                # SHA-256 of the demo, every figure and label of the film against the demo, forbidden terms
npm run audit:v6                 # every rendered text, frame by frame: English only
npm run score:v6 && npm run score:v6:sfx
npm run render:v6                # out/covenn-v6-raw.mp4 (PNG frames, CRF 8, single browser tab)
npm run master:v6                # the two delivered MP4 files
COMP=CovennHexaV6 node scripts/stills.mjs out/qa-v6 150 270 390 570 720 840
```

## 6. Verification

(Filled in after export — see below.)
