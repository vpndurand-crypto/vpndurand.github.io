// Film « Capital OS » : lit la bêta Covenn — Capital OS demo (fichier HTML autonome, jamais modifié) et en extrait
//   1. src/capos/beta.css      — sa feuille de style d'origine, limitée au conteneur .capos (la V5 n'en est pas affectée) ;
//   2. src/capos/snapshot.json — les valeurs calculées par son propre moteur (positions, covenant, scénarios, financements,
//                                fournisseurs de capital, feuille de route), ses icônes et le balisage de sa coque (menu, barre).
// La page est ouverte hors ligne dans le navigateur sans interface préinstallé (aucune requête réseau autorisée).
// Usage : node scripts/extract-capos.mjs   (Playwright : installation globale, ou chemin dans PLAYWRIGHT_PATH)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const betaDir = join(root, 'beta-capital-os');
const file = 'covenn-capital-os-demo-en.html';
const html = readFileSync(join(betaDir, file), 'utf8');

// 1. Intégrité : le fichier est celui qui a été livré.
const expected = readFileSync(join(betaDir, 'SHA256SUMS'), 'utf8').split(/\s+/)[0];
const actual = createHash('sha256').update(readFileSync(join(betaDir, file))).digest('hex');
if (expected !== actual) throw new Error(`La bêta Capital OS a changé (${actual} ≠ ${expected}).`);

// 2. Feuille de style : le premier bloc <style> de l'en-tête, sans la police embarquée (Figtree est déjà chargée par le film).
const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1];
if (!css) throw new Error('Feuille de style introuvable');
function scope(text, sel) {
  let out = '';
  let i = 0;
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '');
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) break;
    const prelude = src.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < src.length && depth > 0) { if (src[j] === '{') depth += 1; else if (src[j] === '}') depth -= 1; j += 1; }
    const body = src.slice(open + 1, j - 1);
    if (prelude.startsWith('@font-face')) { /* police déjà fournie par le film */ }
    else if (prelude.startsWith('@media') || prelude.startsWith('@supports')) out += `${prelude}{${scope(body, sel)}}\n`;
    else if (prelude.startsWith('@')) out += `${prelude}{${body}}\n`;
    else {
      const sels = prelude.split(',').map((s) => s.trim()).filter(Boolean).flatMap((s) => {
        if (s === ':root' || s === 'html' || s === 'body') return [sel];
        if (s === '*') return [sel, `${sel} *`];
        return [`${sel} ${s}`];
      });
      out += `${[...new Set(sels)].join(',')}{${body}}\n`;
    }
    i = j;
  }
  return out;
}
mkdirSync(join(root, 'src/capos'), { recursive: true });
writeFileSync(join(root, 'src/capos/beta.css'),
  `/* Extrait automatiquement de beta-capital-os/${file} (sha256 ${actual.slice(0, 12)}…) par scripts/extract-capos.mjs — ne pas modifier à la main. */\n${scope(css, '.capos')}`);

// 3. Moteur de la bêta, exécuté dans la page.
const pwPath = process.env.PLAYWRIGHT_PATH ?? join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright');
const { chromium } = createRequire(import.meta.url)(pwPath);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
const page = await ctx.newPage();
await page.goto(`file://${join(betaDir, file)}`);
await page.waitForTimeout(300);

// Coque de l'application : menu latéral (une version par section active) et barre supérieure.
const shell = { side: {}, top: '' };
for (const [section, route] of [['overview', '#/'], ['capital', '#/capital'], ['debt', '#/debt'], ['covenants', '#/covenants/cov-lev'], ['scenarios', '#/scenarios/sc-acq'], ['financing', '#/financing/req-acq'], ['providers', '#/providers'], ['data', '#/data'], ['vision', '#/vision']]) {
  await page.evaluate((h) => { location.hash = h; }, route);
  await page.waitForTimeout(150);
  shell.side[section] = await page.evaluate(() => document.querySelector('.side')?.outerHTML ?? '');
  if (!shell.top) shell.top = await page.evaluate(() => document.querySelector('.top')?.outerHTML ?? '');
}

const data = await page.evaluate(() => {
  /* global initialState, dataset, ENTITIES, positions, Fmt, COUNTRIES, INSTRUMENTS, rateText, capitalRows, groupRows, maturityProfile,
     runCovenant, covenantHistory, definitionAt, thresholdAt, DEMO, tightestCovenant, runScenario, priorities, completeness, STAGES,
     stageIndex, CHECKLIST_TEMPLATE, CHECK_STATUSES, PURPOSES, PROVIDERS, PROVIDER_CATEGORIES, matchProvider, requestAmountEur, ROADMAP,
     DOCUMENTS, DOC_PAGES, EXTRACTION, PCG_LABELS, TB_PCG, TB_GRC, GRC_LABELS, ORGANIZATION, USERS, CURRENT_USER, FX, LENDERS, ICONS, SCENARIO_TYPES, IMPORT_JOBS, scheduleRows */
  const st = initialState(false);
  const ds = dataset(st);
  const all = ENTITIES.map((e) => e.id);
  const pos = positions(ds, all);
  const F = Fmt;
  const val = (n) => (n ? n.value : null);
  const facilities = pos.facilities.map((v) => ({
    id: v.f.id, label: v.f.label, ref: v.f.external_reference, entityId: v.entity.id, entity: v.entity.name, entityShort: v.entity.short_name,
    country: v.entity.country, countryName: COUNTRIES[v.entity.country], lender: v.lender.name, instrument: INSTRUMENTS[v.f.instrument], instrumentClass: v.instrumentClass,
    currency: v.f.currency, local: v.local, eur: v.eur, committedEur: v.committedEur, undrawnEur: v.undrawnEur, rateBp: v.rate, rateText: rateText(v.f),
    maturity: v.f.maturity_date, months: v.monthsToMaturity, amortization: v.f.amortization.text, documentIds: v.f.document_ids,
    fmt: { eur: F.money(v.eur), compact: F.compact(v.eur), local: F.money(v.local, v.f.currency), localCompact: F.compact(v.local, v.f.currency), rate: F.bp(v.rate), maturity: F.date(v.f.maturity_date), committed: F.money(v.committedEur) },
  }));
  const rows = capitalRows(pos);
  const groups = Object.fromEntries(['country', 'entity', 'provider', 'instrument', 'currency', 'maturity'].map((d) => [d, groupRows(rows, d).map((g) => ({
    key: g.key, outstanding: g.outstanding, committed: g.committed, undrawn: g.undrawn, count: g.count, share: g.share,
    fmt: { outstanding: F.compact(g.outstanding), share0: F.pct(g.share, 0), share1: F.pct(g.share, 1) },
  }))]));
  const profile = maturityProfile(pos.facilities.map((v) => ({ maturity: v.f.maturity_date, eur: v.eur || 0 }))).map((y) => ({ ...y, fmt: F.compact(y.eur) }));
  const k = (n, compact = true) => ({ value: val(n), fmt: compact ? F.compact(val(n)) : F.money(val(n)) });
  const kpis = {
    outstanding: k(pos.outstanding), cash: k(pos.cash), undrawn: k(pos.undrawn), liquidity: k(pos.liquidity), netDebt: k(pos.netDebt), ebitda: k(pos.ebitda),
    equity: k(pos.equity), interest: k(pos.interest), due12: k(pos.due12), committed: { value: rows.reduce((s, r) => s + r.committed, 0), fmt: F.compact(rows.reduce((s, r) => s + r.committed, 0)) },
    war: { value: pos.warBp, fmt: F.bp(pos.warBp) }, netLeverage: { value: pos.netLeverage, fmt: F.ratio(pos.netLeverage) },
    netDebtToEquity: { value: val(pos.netDebt) / val(pos.equity), fmt: F.ratio(val(pos.netDebt) / val(pos.equity)) },
    exact: { outstanding: F.money(val(pos.outstanding)), cash: F.money(val(pos.cash)), undrawn: F.money(val(pos.undrawn)), equity: F.money(val(pos.equity)), committed: F.money(rows.reduce((s, r) => s + r.committed, 0)) },
  };
  const equityByEntity = ENTITIES.map((e) => ({ id: e.id, name: e.name, eur: pos.equityByEntity[e.id], fmt: F.money(pos.equityByEntity[e.id]) }));
  const ebitdaByEntity = ENTITIES.map((e) => ({ id: e.id, name: e.name, eur: pos.ebitdaByEntity[e.id], fmt: F.compact(pos.ebitdaByEntity[e.id]) }));

  // Covenant de levier (contrat SFA, périmètre Lumenvale Industrie)
  const lev = runCovenant(ds, 'cov-lev', DEMO.asOf);
  const def = definitionAt(ds, 'cov-lev', DEMO.asOf);
  const steps = thresholdAt(def, DEMO.asOf);
  const r = lev.result;
  const tight = tightestCovenant(pos);
  const covenant = {
    id: 'cov-lev', label: lev.covenant.label, short: lev.covenant.short_label, sourceNote: lev.covenant.source_note,
    value: r.value, threshold: r.threshold, headroom: r.headroom, headroomPct: r.headroomPct, status: r.status, numerator: r.numerator, denominator: r.denominator,
    deltaNumerator: r.deltaNumerator, deltaDenominator: r.deltaDenominator, comparison: def.comparison,
    nextStep: steps.next ? { threshold: steps.next.threshold, from: steps.next.from_date, fmtFrom: F.date(steps.next.from_date) } : null,
    thresholds: [...def.threshold_steps].sort((a, b) => a.from_date.localeCompare(b.from_date)).map((x) => ({ from: x.from_date, fmtFrom: F.date(x.from_date), threshold: x.threshold, fmt: `${F.cmp(def.comparison)} ${F.ratio(x.threshold)}`, current: steps.current ? steps.current.id === x.id : false })),
    numeratorLabel: def.numerator_label, denominatorLabel: def.denominator_label, deltaLabels: def.delta_labels,
    components: def.components.map((c) => ({ id: c.id, label: c.label, side: c.side, sign: c.sign, clause: c.clause ? { article: c.clause.article, page: c.clause.page } : null })),
    fmt: { value: F.ratio(r.value), value4: F.ratio(r.value, 4), threshold: `${F.cmp(def.comparison)} ${F.ratio(r.threshold)}`, headroomPct: F.pct(r.headroomPct), numerator: F.money(r.numerator), denominator: F.money(r.denominator),
      deltaNumerator: F.money(r.deltaNumerator), deltaDenominator: F.money(r.deltaDenominator) },
    history: covenantHistory(ds, 'cov-lev').map((h) => ({ date: h.date, fmtDate: F.date(h.date), future: h.future, value: h.view.displayed ? h.view.displayed.value : null, status: h.view.displayed ? h.view.displayed.status : null,
      headroomPct: h.view.displayed ? h.view.displayed.headroomPct : null, saved: h.view.lifecycle === 'SAVED', fmt: h.view.displayed ? { value: F.ratio(h.view.displayed.value, 4), headroom: F.pct(h.view.displayed.headroomPct) } : null })),
    tightest: tight ? { label: tight.covenant.short_label, entity: tight.entity.name, status: tight.result.status, headroomPct: tight.result.headroomPct, fmt: F.pct(tight.result.headroomPct) } : null,
  };

  // Scénarios
  const scen = (sc) => {
    const x = runScenario(ds, sc);
    const m = (s) => ({ debt: s.debt, cash: s.cash, undrawn: s.undrawn, liquidity: s.liquidity, interest: s.interest, ebitda: s.ebitda, netDebt: s.netDebt, leverage: s.leverage,
      fmt: { debt: F.money(s.debt), debtCompact: F.compact(s.debt), cash: F.money(s.cash), liquidity: F.money(s.liquidity), liquidityCompact: F.compact(s.liquidity), interest: F.money(s.interest), ebitda: F.money(s.ebitda), netDebt: F.money(s.netDebt), leverage: F.ratio(s.leverage) } });
    return {
      id: sc.id, name: sc.name, type: sc.type, typeLabel: SCENARIO_TYPES[sc.type], description: sc.description, entity: x.actor ? x.actor.name : null, horizon: x.horizonDate, fmtHorizon: F.date(x.horizonDate),
      inputs: { deal: sc.deal_amount, incremental_ebitda: sc.incremental_ebitda, new_borrowing: sc.new_borrowing, cash_contribution: sc.cash_contribution, new_rate_bp: sc.new_rate_bp, new_tenor_years: sc.new_tenor_years, new_rate_type: sc.new_rate_type },
      start: m(x.start), end: m(x.end), sources: x.sources, uses: x.uses,
      covenants: x.covenants.map((c) => ({ id: c.id, label: c.label, value: c.value, currentValue: c.currentValue, currentThreshold: c.currentThreshold, threshold: c.threshold, comparison: c.comparison, status: c.status, statusText: c.statusText, headroomPct: c.headroomPct,
        fmt: { value: F.ratio(c.value), current: F.ratio(c.currentValue), currentThreshold: `${F.cmp(c.comparison)} ${F.ratio(c.currentThreshold)}`, threshold: `${F.cmp(c.comparison)} ${F.ratio(c.threshold)}`, headroom: F.pct(c.headroomPct) } })),
      flags: x.flags.map((f) => ({ level: f.level, text: f.text })), events: x.events.map((e) => ({ date: e.date, fmtDate: F.date(e.date), label: e.label })),
      profileStart: x.profileStart.map((y) => ({ ...y, fmt: F.compact(y.eur) })), profileEnd: x.profileEnd.map((y) => ({ ...y, fmt: F.compact(y.eur) })),
    };
  };
  const scenarios = st.scenarios.map(scen);

  // Financements en préparation
  const requests = st.requests.map((q) => {
    const c = completeness(q);
    return { id: q.id, title: q.title, entity: ENTITIES.find((e) => e.id === q.entity_id).name, purpose: PURPOSES[q.purpose], amount: q.amount, currency: q.currency, amountEur: requestAmountEur(q),
      fmt: { amount: F.money(Number(q.amount.replace('.', '')), q.currency), compact: F.compact(Number(q.amount.replace('.', '')), q.currency), targetDate: F.date(q.target_date) },
      instrument: INSTRUMENTS[q.instrument], tenor: q.tenor_years, stage: q.stage, stageLabel: STAGES[stageIndex(q.stage)].label, stageIndex: stageIndex(q.stage), nextAction: q.next_action, rationale: q.rationale,
      scenarioId: q.scenario_id, prep: { done: c.done, total: c.total, review: c.review, missing: c.missing, pct: Math.round(c.pct * 100) },
      checklist: CHECKLIST_TEMPLATE.map((t) => ({ key: t.key, label: t.label, hint: t.hint, status: q.checklist[t.key] || 'MISSING', statusLabel: CHECK_STATUSES[q.checklist[t.key] || 'MISSING'] })),
      shortlist: q.shortlist };
  });
  const pipelineTotal = st.requests.reduce((s, q) => s + requestAmountEur(q), 0);

  // Échéancier des 18 prochains mois (onglet « Repayment schedule » de la page Debt & facilities)
  const schedule = scheduleRows(ds, pos).map((x) => ({
    date: x.date, fmtDate: F.date(x.date), kind: x.kind, text: x.text || null,
    facility: x.v ? x.v.f.label : null, ref: x.v ? x.v.f.external_reference : null, entity: x.v ? x.v.entity.short_name : null, lender: x.v ? x.v.lender.name : null,
    principal: x.v ? x.principal : null, fmtPrincipal: x.v ? F.money(x.principal, x.currency) : null, currency: x.v ? x.currency : null,
  }));

  const acq = st.requests.find((q) => q.id === 'req-acq');
  const providers = PROVIDERS.map((p) => {
    const mt = matchProvider(ds, p, acq);
    return { id: p.id, name: p.name, category: p.category, categoryLabel: PROVIDER_CATEGORIES[p.category], instruments: p.instruments.map((i) => INSTRUMENTS[i]), countries: p.countries, tenor: p.tenor, existing: mt.existing, matchAcq: mt.met };
  });

  return {
    organization: ORGANIZATION.name, asOf: DEMO.asOf, today: DEMO.today, fmtAsOf: F.date(DEMO.asOf), fx: FX.rates, user: (() => { const u = USERS.find((x) => x.id === CURRENT_USER); return { name: `${u.first_name} ${u.last_name}`, role: u.job_title }; })(),
    entities: ENTITIES.map((e) => ({ id: e.id, name: e.name, short: e.short_name, country: e.country, countryName: COUNTRIES[e.country], city: e.city, currency: e.currency, activity: e.activity })),
    countries: COUNTRIES, facilities, groups, profile, kpis, equityByEntity, ebitdaByEntity, covenant, scenarios, requests, pipelineTotal: { value: pipelineTotal, fmt: F.compact(pipelineTotal) }, schedule,
    stages: STAGES.map((s) => s.label), providers, providerCategories: PROVIDER_CATEGORIES, roadmap: ROADMAP,
    priorities: priorities(ds, st).map((p) => ({ id: p.id, level: p.level, kind: p.kind, tag: p.tag || null, title: p.title, text: p.text })),
    lenders: LENDERS.map((l) => l.name), extraction: EXTRACTION, documents: DOCUMENTS, pages: DOC_PAGES, importJobs: IMPORT_JOBS.map((j) => ({ id: j.id, entity: j.entity_id, balance: j.balance_id, file: j.file_name })),
    pcgLabels: PCG_LABELS, grcLabels: GRC_LABELS, tbPcg: TB_PCG, tbGrc: TB_GRC, icons: ICONS,
  };
});
await browser.close();
data.source = { file: `beta-capital-os/${file}`, sha256: actual };
data.shell = shell;
writeFileSync(join(root, 'src/capos/snapshot.json'), `${JSON.stringify(data, null, 1)}\n`);
console.log(`Bêta Capital OS (${actual.slice(0, 12)}…) : ${data.facilities.length} financements, ${data.entities.length} sociétés, dette ${data.kpis.outstanding.fmt}, covenant ${data.covenant.fmt.value} (${data.covenant.status}), ${data.scenarios.length} scénarios, ${data.requests.length} demandes de financement.`);
console.log('Écrit : src/capos/beta.css, src/capos/snapshot.json');
