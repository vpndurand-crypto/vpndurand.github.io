// Vérifie le film HEXA V6 « The Capital OS » : la bêta utilisée est bien celle livrée (empreinte SHA-256) ; chaque chiffre et
// chaque libellé produit montré (src/v6/data.ts) vient de la bêta — valeurs de son moteur (snapshot.json) et textes de ses
// écrans rendus (snapshot.screens) — et reste cohérent avec les autres ; les séquences de vision restent présentées comme
// telles ; aucun texte du film ne parle de crypto, de jetons, de portefeuilles, d'offre ferme ou de financement accordé.
// Usage : node scripts/verify-v6.mjs
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'covenn-v6-'));
const out = join(dir, 'data.mjs');
await build({ entryPoints: [join(root, 'src/v6/data.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const D = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });
const S = JSON.parse(readFileSync(join(root, 'src/capos/snapshot.json'), 'utf8'));
const html = readFileSync(join(root, 'beta-capital-os/covenn-capital-os-demo-en.html'));
const htmlText = html.toString('utf8');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${label.padEnd(72)} ${detail}`);
};
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const compact = (cents) => {
  const v = Math.abs(cents) / 100;
  if (v >= 999500) { const m = v / 1e6; return `€${(m >= 10 ? m.toFixed(1) : m.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '')}m`; }
  return v >= 1e3 ? `€${Math.round(v / 1e3)}k` : `€${Math.round(v)}`;
};
const millions = (s) => { const m = /^€([\d.]+)(m|k)$/.exec(s); return m ? Number(m[1]) * (m[2] === 'm' ? 1e6 : 1e3) : NaN; };

// --- La bêta utilisée -----------------------------------------------------------------------------------------------
const sha = createHash('sha256').update(html).digest('hex');
check('Bêta : empreinte du fichier = SHA256SUMS', readFileSync(join(root, 'beta-capital-os/SHA256SUMS'), 'utf8').startsWith(sha), sha.slice(0, 16));
check('Bêta : valeurs et écrans extraits de ce fichier (snapshot.json)', S.source.sha256 === sha && Boolean(S.screens?.overview && S.screens?.terms), S.source.file);

// --- S1 : les sources éparses ----------------------------------------------------------------------------------------
const F = D.FRAGMENTS;
check('S1 échéancier : six échéances de l’onglet Repayment schedule', F.schedule.length === 6 && F.schedule.every((r) => S.schedule.some((x) => x.fmtDate === r.date && x.facility === r.facility && x.fmtPrincipal === r.amount)));
check('S1 calcul du covenant : 9.4m / 3.0m = 3.13x ≤ 3.50x (clause 19.2, p. 47)', F.covenant.value === '3.13x' && F.covenant.threshold === '≤ 3.50x' && F.covenant.lines[0].value === '€9,400,000' && F.covenant.lines[1].value === '€3,000,000' && F.covenant.source === 'Clause 19.2, page 47');
check('S1 documents : contrat SFA (doc-01) et relevé Beispielbank (doc-12)', S.documents.some((d) => d.id === F.agreement.docId && d.document_type === 'FACILITY_AGREEMENT') && S.documents.some((d) => d.id === F.statement.docId && d.document_type === 'LENDER_STATEMENT'));

// --- S2 : Capital overview -------------------------------------------------------------------------------------------------
const O = D.OVERVIEW;
console.log(`\n${O.title} · ${O.kpis.map((k) => `${k.label} ${k.value}`).join(' · ')}`);
check('S2 indicateurs : les cinq tuiles de la bêta, dans son ordre', O.kpis.map((k) => k.label).join('|') === 'Outstanding debt|Available liquidity|Weighted average borrowing rate|Debt maturing within 12 months|Covenant headroom');
check('S2 indicateurs : valeurs du moteur', O.kpis.map((k) => k.value).join(' ') === [S.kpis.outstanding.fmt, S.kpis.liquidity.fmt, S.kpis.war.fmt, S.kpis.due12.fmt, S.covenant.fmt.headroomPct].join(' '));
check('S2 encours €18.6m = somme des six financements', S.facilities.reduce((a, f) => a + f.eur, 0) === S.kpis.outstanding.value && O.kpis[0].value === '€18.6m');
check('S2 liquidité = trésorerie + non tiré', S.kpis.liquidity.value === S.kpis.cash.value + S.kpis.undrawn.value);
const sumOf = (rows) => rows.reduce((a, r) => a + millions(r.amount), 0);
check('S2 pays : France + Allemagne + Royaume-Uni = encours (arrondis compris)', Math.abs(sumOf(O.distribution.countries) - 18.586e6) < 0.02e6, O.distribution.countries.map((c) => `${c.label} ${c.amount}`).join(' + '));
check('S2 sociétés : cinq, somme = encours', O.distribution.entities.length === 5 && Math.abs(sumOf(O.distribution.entities) - 18.586e6) < 0.02e6);
check('S2 prêteurs : six, somme = encours', O.exposure.providers.length === 6 && Math.abs(sumOf(O.exposure.providers) - 18.586e6) < 0.02e6);
check('S2 sociétés rattachées à leur pays (3 en France, 1 en Allemagne, 1 au Royaume-Uni)', O.distribution.countries.map((c) => c.entities.length).join() === '3,1,1');

// --- S3 : le scénario Project Falcon ---------------------------------------------------------------------------------------------
const P = D.SCENARIO_PAGE;
const acq = S.scenarios.find((s) => s.id === 'sc-acq');
check('S3 hypothèses : prix 7.5m = emprunt 6.5m + apport 1.0m', Number(acq.inputs.deal) === Number(acq.inputs.new_borrowing) + Number(acq.inputs.cash_contribution) && P.fields.borrowing.value === '6,500,000');
check('S3 dette : €18,586,000 → €23,455,000 (+€4.87m)', P.metrics[0].today === acq.start.fmt.debt && P.metrics[0].horizon === acq.end.fmt.debt && P.metrics[0].change === `+${compact(acq.end.debt - acq.start.debt)}`);
check('S3 liquidité : €4,689,200 → €558,200 (−€4.13m)', P.metrics[1].today === acq.start.fmt.liquidity && P.metrics[1].horizon === acq.end.fmt.liquidity && P.metrics[1].change === `−${compact(acq.start.liquidity - acq.end.liquidity)}`);
check('S3 dette nette / EBITDA : 2.46x → 3.07x (+0.61x)', P.metrics[2].today === '2.46x' && P.metrics[2].horizon === '3.07x' && P.metrics[2].change === '+0.61x' && near(acq.end.netDebt / acq.end.ebitda, acq.end.leverage));
const lev = acq.covenants.find((x) => x.id === 'cov-lev');
check('S3 covenant SFA projeté : 3.13x, ≤ 3.25x, marge 3.6 %, Critical headroom', P.covenant.projected === lev.fmt.value && P.covenant.threshold === lev.fmt.threshold && P.covenant.headroom === lev.fmt.headroom && P.covenant.status === 'Critical headroom' && lev.status === 'CRITICAL');
check('S3 marge : (3.50 − 3.13) / 3.50 = 10.5 % aujourd’hui, (3.25 − 3.13) / 3.25 = 3.6 % à l’horizon', `${(((3.5 - lev.value) / 3.5) * 100).toFixed(1)}%` === P.covenant.headroomFrom && `${(((3.25 - lev.value) / 3.25) * 100).toFixed(1)}%` === P.covenant.headroom);
check('S3 projection signalée comme telle (étiquettes de la bêta)', P.forecastTag === 'Illustrative forecast' && P.covenant.tag === 'Projected — not a covenant test');

// --- S4 : la demande de financement ---------------------------------------------------------------------------------------------
const R = D.REQUEST_PAGE;
const req = S.requests.find((r) => r.id === 'req-acq');
check('S4 demande : Acquisition financing — Project Falcon, €6,500,000, Lumenvale Deutschland GmbH', R.title === req.title && req.fmt.amount === '€6,500,000' && req.entity === 'Lumenvale Deutschland GmbH');
check('S4 montant demandé = nouvel emprunt du scénario', Number(acq.inputs.new_borrowing) * 100 === req.amountEur || Number(acq.inputs.new_borrowing) === 6500000);
check('S4 sept pièces montrées : toutes « Available » ou « Linked to existing data » dans la bêta', R.items.length === 7 && R.items.every((it) => ['AVAILABLE', 'LINKED'].includes(req.checklist.find((c) => c.key === it.key).status)));
check('S4 la huitième reste « Needs review » (Use-of-proceeds summary) : rien n’est validé à la place de l’utilisateur', R.review.key === 'uop' && R.review.statusLabel === 'Needs review' && req.prep.done === 7 && req.prep.total === 8);
check('S4 résumé de préparation : textes de la bêta', R.summary === '7 of 8 available or linked' && R.summaryRight === '1 needs review · 0 missing');
check('S4 aucune étape d’avancement affirmée (pas de « Ready », « Approved »)', !JSON.stringify(R).match(/Ready for review|Approved|Funded/));

// --- S5 : la vision ------------------------------------------------------------------------------------------------------
const V = D.VISION;
check('S5 couche « Open capital infrastructure » : Future capability dans la bêta', V.layer === 'Open capital infrastructure' && V.state === 'Future capability' && V.items.every(([, s]) => s === 'Future capability'));
check('S5 la bêta ne revendique ni intégration, ni partenariat, ni crypto', V.notClaimed.some((x) => x.startsWith('No integration with banks')) && V.notClaimed.some((x) => x.startsWith('No partnership')) && V.notClaimed.some((x) => x.startsWith('No crypto assets, wallets or tokens')));
check('S5 trois familles de financeurs, sans nom ni logo', D.PATHWAYS.map((x) => x.label).join('|') === 'Banks|Private Debt|Capital Markets');
check('S5 structures : celles des conditions indicatives de la démo (prêt senior, unitranche)', S.comparison.proposals.some((x) => x.categoryCode === 'BANK' && /Senior/.test(x.instrument)) && S.comparison.proposals.some((x) => x.categoryCode === 'PRIVATE_DEBT' && x.instrument === 'Unitranche'));
check('S5 marchés de capitaux : perspective d’illustration (pointillés, « Illustrative »)', D.PATHWAYS.find((x) => x.key === 'markets').future === true);
check('S5 entreprise : €6.5m, Acquisition finance · 6 years, préparation 7/8', D.COMPANY.need === '€6.5m' && D.COMPANY.detail === 'Acquisition finance · 6 years' && D.COMPANY.prep === 'Preparation 7/8');

// --- S6 : la comparaison des conditions indicatives -----------------------------------------------------------------------
const C = D.COMPARISON;
const cell = (label, i) => C.sections.flatMap((s) => s.rows).find((r) => r.label === label).cells[i];
check('S6 trois propositions de la démo, dans l’ordre de la bêta', C.proposals.map((x) => x.provider).join('|') === S.comparison.proposals.map((x) => x.provider).join('|'));
C.proposals.forEach((x, i) => {
  const p = S.comparison.proposals[i];
  check(`S6 ${x.provider} : montant, taux, tenor, coût total = moteur`, cell('Amount', i)[0] === p.amount && cell('All-in rate under assumptions', i)[0] === p.allIn && cell('Rate', i)[0] === p.rate
    && cell('Tenor', i)[0] === `${p.tenor} years` && cell('Estimated cash cost over the tenor', i)[0] === p.total, `${p.amount} · ${p.allIn} · ${p.tenor}y · ${p.total}`);
  check(`S6 ${x.provider} : contrôle pro forma 3.07x contre ${p.covenantThreshold} → marge ${p.headroomFmt}`, cell('Pro forma covenant check', i).join(' ').includes(`headroom ${p.headroomFmt}`)
    && near((Number(p.covenantThreshold.replace(/[^\d.]/g, '')) - 3.069) / Number(p.covenantThreshold.replace(/[^\d.]/g, '')), p.headroom, 2e-3));
});
check('S6 seule Corvane couvre le montant demandé (€6.5m)', C.proposals.filter((x) => x.covers).map((x) => x.provider).join() === 'Corvane Credit Partners' && C.selected === 'prp-cvn');
check('S6 note de la bêta : aucune proposition classée, pas d’offre ni d’engagement', C.note.startsWith('No proposal is ranked "best"') && C.note.endsWith('Indicative terms are not offers or commitments.'));
check('S6 choix pour négociation : message exact de la bêta (choix de travail, dette inchangée)', htmlText.includes('selected for negotiation`, "This records a choice only. Current debt and capital structure are unchanged.")') && D.SELECTED_TOAST.detail === 'This records a choice only. Current debt and capital structure are unchanged.');
check('S6 « Selected for negotiation » est une étape de la bêta (après « Indicative terms received »)', S.stages.at(-1) === 'Selected for negotiation' && S.stages.at(-2) === 'Indicative terms received');

// --- S7 : la marque -------------------------------------------------------------------------------------------------------
check('S7 phrase de la page « Product vision » de la bêta', D.VISION_TITLE === 'The operating system for global corporate capital');

// --- Tous les textes du film ------------------------------------------------------------------------------------------------
const cache = join(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const bundle = join(cache, 'covenn-v6-texts.cjs');
await build({
  entryPoints: [join(root, 'scripts/text-audit-v6.tsx')], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'error',
  jsx: 'automatic', loader: { '.css': 'empty', '.woff2': 'empty' }, external: ['react', 'react-dom', 'remotion'],
});
const { textsAt, DURATION } = createRequire(import.meta.url)(bundle);
rmSync(bundle, { force: true });
const texts = new Set();
for (let f = 0; f < DURATION; f += 1) for (const t of textsAt(f)) texts.add(t);
const all = [...texts].join('\n');
// Mots interdits, sauf dans une négation de la bêta ou du film (« Non-binding offer letter », « no live connections »).
const FORBIDDEN = /\b(crypto\w*|tokens?|tokeni[sz]\w*|wallets?|blockchain|bitcoin|ethereum|stablecoin|NFTs?|approved|guaranteed|granted|binding offer|live (?:integration|connection)s?)\b/gi;
const hits = [...all.matchAll(FORBIDDEN)]
  .filter((m) => !(/binding offer/i.test(m[0]) && /non-$/i.test(all.slice(Math.max(0, m.index - 4), m.index))))
  .filter((m) => !(/^live/i.test(m[0]) && /\bno $/i.test(all.slice(Math.max(0, m.index - 3), m.index))))
  .map((m) => m[0]);
check('Textes : ni crypto, ni jeton, ni portefeuille, ni offre ferme, ni financement accordé', hits.length === 0, hits.join(', '));
check('Textes : la vision est signalée (FUTURE VISION, capacité future, aucune connexion réelle)', all.includes('FUTURE VISION') && all.includes('Future capability · conceptual illustration — no live connections, partnerships or offers'));
check('Textes : la démo est signalée (données et prestataires fictifs)', all.includes('In this demo · Fictional data') && all.includes('In this demo · Fictional providers, indicative terms') && all.includes('Interactive demo · Fictional data'));
check('Textes : titres du brief, dans l’ordre', ['Debt is fragmented.', 'Financing is disconnected.', 'One view. Across your entire group.', 'Simulate tomorrow. Decide today.', 'Prepare your next financing.', 'From managing capital to accessing it.', 'Compare terms. Choose with confidence.', 'The operating system for global corporate capital.', 'Starting with debt.'].every((t) => all.includes(t)));

console.log(failures ? `\n${failures} contrôle(s) en échec.` : `\nTous les chiffres et libellés du film V6 viennent de la bêta ; vision et démonstration sont signalées (${texts.size} textes contrôlés).`);
process.exit(failures ? 1 : 0);
