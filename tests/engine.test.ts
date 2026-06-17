/**
 * WealthSync Computation Engine — Unit Tests
 *
 * Verifies that every (A) number produced by server/engine is:
 *   1. COMPUTED correctly (checked against hand-calculated expected values),
 *   2. DETERMINISTIC (same input -> identical output),
 *   3. HONEST about insufficient data (returns null/insufficient, never a guess),
 *   4. LLM-FREE (the "One Rule": no file under server/engine imports an LLM client).
 *
 * Run with: npx tsx tests/engine.test.ts
 * (Substitutes for vitest/jest since the testing tool is disabled in this env.)
 */
import fs from "fs";
import path from "path";
import {
  computeHoldingMetrics,
  computePortfolioSummary,
  dailyReturns,
  stdDev,
  volatility,
  annualizedReturn,
  maxDrawdown,
  beta,
  sharpe,
  weightedPortfolioReturns,
  alignedClosesByDate,
  macroFigure,
  fxRate,
  parseAlphaVantageDaily,
  cacheIsFresh,
  missingBars,
  toUnixDay,
  AlphaVantageProvider,
  detectCorporateActionJumps,
  assessRiskReliability,
  SPLIT_JUMP_THRESHOLD,
  type HoldingInput,
  type DailyBar,
} from "../server/engine";

let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.error(`❌ ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

function approx(a: number | null, b: number, tol = 1e-6): boolean {
  return a != null && Math.abs(a - b) <= tol;
}

// ───────────────────────── Portfolio math ─────────────────────────
(() => {
  // Hand-computed: 10 shares @ $150 live, avg cost $100 -> MV 1500, basis 1000,
  // pnl 500, pnl% 50.
  const m = computeHoldingMetrics({
    symbol: "AAA",
    shares: 10,
    averageCostPerShare: 100,
    price: 150,
  })!;
  ok("holding market value", m.marketValue === 1500, `got ${m?.marketValue}`);
  ok("holding cost basis", m.costBasis === 1000, `got ${m?.costBasis}`);
  ok("holding unrealized pnl", m.unrealizedPnl === 500, `got ${m?.unrealizedPnl}`);
  ok("holding unrealized pnl%", m.unrealizedPnlPct === 50, `got ${m?.unrealizedPnlPct}`);

  // No live price -> null (explicit insufficient data, never guessed)
  const none = computeHoldingMetrics({ symbol: "BBB", shares: 5, averageCostPerShare: 10, price: null });
  ok("holding null when no price", none === null);

  // Portfolio: AAA MV 1500 (60%), CCC 5*200=1000 (40%); total 2500.
  const inputs: HoldingInput[] = [
    { symbol: "AAA", type: "Stock", shares: 10, averageCostPerShare: 100, price: 150 },
    { symbol: "CCC", type: "ETF", shares: 5, averageCostPerShare: 250, price: 200 },
  ];
  const p = computePortfolioSummary(inputs);
  ok("portfolio total MV", p.totalMarketValue === 2500, `got ${p.totalMarketValue}`);
  ok("portfolio total basis", p.totalCostBasis === 2250, `got ${p.totalCostBasis}`);
  ok("portfolio total pnl", p.totalUnrealizedPnl === 250, `got ${p.totalUnrealizedPnl}`);
  ok("portfolio weight AAA = 60%", p.holdings.find((h) => h.symbol === "AAA")!.weight === 60);
  ok("portfolio weight CCC = 40%", p.holdings.find((h) => h.symbol === "CCC")!.weight === 40);
  ok("allocation slices sum ~100", Math.abs(p.allocationByType.reduce((s, a) => s + a.weight, 0) - 100) < 0.01);

  // All unpriced -> insufficient_data, skipped recorded
  const empty = computePortfolioSummary([
    { symbol: "XXX", shares: 1, averageCostPerShare: 1, price: null },
  ]);
  ok("portfolio insufficient when unpriced", empty.status === "insufficient_data" && empty.skipped.length === 1);

  // Determinism
  const a1 = JSON.stringify(computePortfolioSummary(inputs));
  const a2 = JSON.stringify(computePortfolioSummary(inputs));
  ok("portfolio deterministic", a1 === a2);
})();

// ───────────────────────── Risk / return math ─────────────────────────
(() => {
  // dailyReturns: [100,110,99] -> [0.1, -0.1]
  const r = dailyReturns([100, 110, 99]);
  ok("dailyReturns length", r.length === 2);
  ok("dailyReturns[0] = 0.1", approx(r[0], 0.1));
  ok("dailyReturns[1] = -0.1", approx(r[1], -0.1));

  // stdDev sample of [0.1, -0.1]: mean 0, var = (0.01+0.01)/1 = 0.02, sd = 0.141421356
  ok("stdDev sample", approx(stdDev([0.1, -0.1]), Math.sqrt(0.02)));

  // volatility annualized = sd * sqrt(252)
  ok("volatility annualized", approx(volatility([0.1, -0.1], { annualize: true }), Math.sqrt(0.02) * Math.sqrt(252), 1e-6));
  ok("volatility non-annualized", approx(volatility([0.1, -0.1], { annualize: false }), Math.sqrt(0.02)));

  // annualizedReturn: prices [100, 121], periods=1, default 252 -> (1.21)^252 - 1 (huge);
  // use a controlled periodsPerYear=2 -> (121/100)^(2/1) - 1 = 1.21^2 - 1 = 0.4641
  ok("annualizedReturn CAGR", approx(annualizedReturn([100, 121], 2), 1.21 * 1.21 - 1, 1e-6));

  // maxDrawdown: [100, 120, 60, 80] -> trough 60 vs peak 120 -> -0.5
  ok("maxDrawdown", approx(maxDrawdown([100, 120, 60, 80]), -0.5));
  ok("maxDrawdown monotonic up = 0", maxDrawdown([100, 110, 120]) === 0);

  // beta: asset perfectly = 2x benchmark -> beta 2
  const benchR = [0.01, -0.02, 0.03, -0.01];
  const assetR = benchR.map((x) => 2 * x);
  ok("beta = 2 when asset is 2x bench", approx(beta(assetR, benchR), 2, 1e-9));

  // sharpe: positive when mean return positive, rf 0
  const s = sharpe([0.01, 0.02, 0.015, 0.005], { riskFreeRate: 0 });
  ok("sharpe positive for positive returns", s != null && s > 0);

  // insufficient data
  ok("volatility null on <2 obs", volatility([0.1]) === null);
  ok("annualizedReturn null on <2 prices", annualizedReturn([100]) === null);
  ok("maxDrawdown null on <2 prices", maxDrawdown([100]) === null);
  ok("beta null on mismatch/short", beta([0.1], [0.1]) === null);

  // weightedPortfolioReturns: equal weights of identical series returns same series
  const wpr = weightedPortfolioReturns({ A: [0.1, -0.1], B: [0.1, -0.1] }, { A: 0.5, B: 0.5 });
  ok("weightedPortfolioReturns equal series", wpr != null && approx(wpr[0], 0.1) && approx(wpr[1], -0.1));

  // determinism
  ok("risk deterministic", volatility([0.1, -0.1])! === volatility([0.1, -0.1])!);

  // date alignment: A has days 1,2,3; B has days 2,3,4 -> common days 2,3.
  // Returns must compare the SAME calendar days, not be naively truncated.
  const aligned = alignedClosesByDate({
    A: { t: [1, 2, 3], c: [10, 11, 12] },
    B: { t: [2, 3, 4], c: [20, 22, 24] },
  });
  ok("alignment keeps only common dates", aligned.A.length === 2 && aligned.B.length === 2);
  ok("alignment A on common days", aligned.A[0] === 11 && aligned.A[1] === 12);
  ok("alignment B on common days", aligned.B[0] === 20 && aligned.B[1] === 22);
  ok("alignment ascending by date", aligned.A[0] === 11 && aligned.A[1] === 12);

  // Misaligned series with NO overlap -> empty (insufficient), never guessed.
  const noOverlap = alignedClosesByDate({
    A: { t: [1, 2], c: [10, 11] },
    B: { t: [5, 6], c: [20, 21] },
  });
  ok("alignment empty when no common dates", (noOverlap.A?.length ?? 0) === 0);
})();

// ───────────────────────── Historical price provider ─────────────────────────
(() => {
  // Recorded Alpha Vantage TIME_SERIES_DAILY_ADJUSTED fixture (2 days).
  // Uses the ADJUSTED close ("5. adjusted close"), NOT the raw close, so that
  // splits/dividends don't create false returns.
  const fixture = {
    "Meta Data": { "2. Symbol": "TEST" },
    "Time Series (Daily)": {
      "2024-01-03": {
        "1. open": "102.0",
        "2. high": "103.0",
        "3. low": "101.0",
        "4. close": "200.0", // raw close (split-affected) — must be ignored
        "5. adjusted close": "101.5", // adjusted — must be used
        "6. volume": "1000",
      },
      "2024-01-02": {
        "1. open": "100.0",
        "2. high": "101.0",
        "3. low": "99.5",
        "4. close": "199.0",
        "5. adjusted close": "100.0",
        "6. volume": "900",
      },
    },
  };
  const bars = parseAlphaVantageDaily(fixture)!;
  ok("AV parse returns bars", Array.isArray(bars) && bars.length === 2);
  ok("AV parse ascending by date", bars[0].date === "2024-01-02" && bars[1].date === "2024-01-03");
  ok("AV parse uses ADJUSTED close", bars[0].close === 100.0 && bars[1].close === 101.5);

  // Hand-verified determinism check: vol/drawdown computed from the fixture's
  // adjusted closes match the textbook formulas on [100.0, 101.5].
  const closes = bars.map((b) => b.close);
  const rets = dailyReturns(closes); // [0.015]
  ok("AV-derived daily return", approx(rets[0], 0.015, 1e-9));
  ok("AV-derived max drawdown (rising) = 0", maxDrawdown(closes) === 0);

  // Rate-limit / error envelopes => null (insufficient data), NEVER a number.
  ok("AV note => null", parseAlphaVantageDaily({ Note: "Thank you... 5 calls/min" }) === null);
  ok("AV information => null", parseAlphaVantageDaily({ Information: "rate limit" }) === null);
  ok("AV error => null", parseAlphaVantageDaily({ "Error Message": "Invalid API call" }) === null);
  ok("AV empty => null", parseAlphaVantageDaily({}) === null);

  // Cache freshness: a recent day is fresh; an old day is stale (forces refetch).
  const now = Date.parse("2024-06-10T12:00:00Z");
  ok("cache fresh when recent", cacheIsFresh("2024-06-07", 4, now) === true);
  ok("cache stale when old", cacheIsFresh("2024-05-01", 4, now) === false);
  ok("cache stale when empty", cacheIsFresh(null, 4, now) === false);

  // "Fetch only the missing range": only bars whose date isn't cached are kept.
  const cached = new Set(["2024-01-02"]);
  const fresh = missingBars(bars, cached);
  ok("missingBars keeps only uncached dates", fresh.length === 1 && fresh[0].date === "2024-01-03");
  ok("missingBars none when all cached", missingBars(bars, new Set(["2024-01-02", "2024-01-03"])).length === 0);

  // toUnixDay is stable & comparable across symbols for date alignment.
  ok("toUnixDay deterministic", toUnixDay("2024-01-02") === toUnixDay("2024-01-02"));
  ok("toUnixDay ordered", toUnixDay("2024-01-02") < toUnixDay("2024-01-03"));

  // Parser falls back to raw "4. close" when no adjusted close is present
  // (free TIME_SERIES_DAILY) — still real data, never skipped/guessed.
  const rawOnly = parseAlphaVantageDaily({
    "Time Series (Daily)": { "2024-02-01": { "4. close": "50.0" }, "2024-02-02": { "4. close": "55.0" } },
  })!;
  ok("AV parse falls back to raw close", rawOnly.length === 2 && rawOnly[0].close === 50.0 && rawOnly[1].close === 55.0);

  // Honesty: the provider must REPORT its basis truthfully from the configured
  // function — "raw_close" by default (free), "adjusted" only when ADJUSTED is set.
  const prov = new AlphaVantageProvider();
  const savedFn = process.env.ALPHA_VANTAGE_FUNCTION;
  delete process.env.ALPHA_VANTAGE_FUNCTION;
  ok("provider basis defaults to raw_close", prov.priceBasis === "raw_close");
  process.env.ALPHA_VANTAGE_FUNCTION = "TIME_SERIES_DAILY_ADJUSTED";
  ok("provider basis is adjusted when ADJUSTED fn set", prov.priceBasis === "adjusted");
  if (savedFn === undefined) delete process.env.ALPHA_VANTAGE_FUNCTION;
  else process.env.ALPHA_VANTAGE_FUNCTION = savedFn;
})();

// ───────────── Corporate-action (split/dividend) jump guard ─────────────
(() => {
  // Normal market noise: nothing exceeds the threshold -> no jumps detected.
  const normal = [0.012, -0.008, 0.021, -0.015, 0.006, -0.03, 0.018];
  ok("no jumps in normal returns", detectCorporateActionJumps(normal).length === 0);

  // A 4-for-1 split on RAW prices shows as a ~-75% single-day "return".
  const withSplit = [0.012, -0.75, 0.02, -0.01];
  const jumps = detectCorporateActionJumps(withSplit);
  ok("split-sized jump is detected", jumps.length === 1 && jumps[0].index === 1);
  ok("threshold constant is 35%", SPLIT_JUMP_THRESHOLD === 0.35);
  ok("a -30% crash does NOT trip the guard", detectCorporateActionJumps([-0.3, 0.01]).length === 0);

  // Detection is on |return|, so a REVERSE split (a huge POSITIVE jump) is caught
  // too. A 1-for-10 reverse split shows as ~ +900% (+9.0) on raw prices.
  const reverse = [0.01, 9.0, -0.02];
  const revJumps = detectCorporateActionJumps(reverse);
  ok("reverse-split (+900%) jump is detected", revJumps.length === 1 && revJumps[0].index === 1 && revJumps[0].value > 0);
  ok(
    "reverse-split on raw basis => unreliable",
    assessRiskReliability([{ symbol: "RVRS", returns: reverse, basis: "raw_close" }]).reliable === false,
  );

  // RAW basis + split jump => metrics flagged unreliable (NOT silently computed).
  const rawFlag = assessRiskReliability([
    { symbol: "AAA", returns: withSplit, basis: "raw_close" },
    { symbol: "SPY", returns: normal, basis: "raw_close" },
  ]);
  ok("raw basis + split => unreliable", rawFlag.reliable === false);
  ok("flag names the affected symbol", rawFlag.flaggedSymbols.length === 1 && rawFlag.flaggedSymbols[0] === "AAA");
  ok("unreliable carries an honest upgrade note", typeof rawFlag.note === "string" && /adjusted/.test(rawFlag.note!));

  // Normal series on raw basis => reliable, no note.
  const rawOk = assessRiskReliability([{ symbol: "AAA", returns: normal, basis: "raw_close" }]);
  ok("raw basis + normal => reliable", rawOk.reliable === true && rawOk.note === null && rawOk.flaggedSymbols.length === 0);

  // ADJUSTED basis: even an identical split-date jump is treated as genuine and
  // never flagged (adjusted series have no split artifacts).
  const adjOk = assessRiskReliability([{ symbol: "AAA", returns: withSplit, basis: "adjusted" }]);
  ok("adjusted basis suppresses the warning", adjOk.reliable === true && adjOk.flaggedSymbols.length === 0);
})();

// ───── Real-ticker sanity check: NVDA 10-for-1 split (effective 2024-06-10) ─────
// Deterministic fixture of REAL NVDA closes (Yahoo Finance), committed under
// tests/fixtures so the test never hits a rate-limited live endpoint. The
// adjustedClose series is fetched DIRECTLY; the reconstructedRawClose series is
// the genuine as-traded price, deterministically rebuilt from the real adjusted
// closes × the real 10:1 split factor (free unadjusted-history feeds are
// premium-gated). See the fixture's _meta for full provenance.
(() => {
  const fxPath = path.join(import.meta.dirname, "fixtures", "nvda-split-2024.json");
  const fixture = JSON.parse(fs.readFileSync(fxPath, "utf8"));
  const rawReturns = dailyReturns(fixture.reconstructedRawClose);
  const adjReturns = dailyReturns(fixture.adjustedClose);

  // Sanity: the fixture really spans the split — raw shows the ~ -90% artifact,
  // adjusted does not.
  ok("fixture is the real 10:1 NVDA split", fixture._meta?.splitEvent?.ratio === "10:1");
  ok(
    "real raw NVDA series contains the split jump",
    detectCorporateActionJumps(rawReturns).length === 1,
  );
  ok(
    "real adjusted NVDA series has NO jump",
    detectCorporateActionJumps(adjReturns).length === 0,
  );

  // Guard verdict on the real data.
  const rawVerdict = assessRiskReliability([{ symbol: "NVDA", returns: rawReturns, basis: "raw_close" }]);
  ok("real NVDA raw over split => unreliable", rawVerdict.reliable === false);
  ok("real NVDA flagged by name", rawVerdict.flaggedSymbols.length === 1 && rawVerdict.flaggedSymbols[0] === "NVDA");

  const adjVerdict = assessRiskReliability([{ symbol: "NVDA", returns: adjReturns, basis: "adjusted" }]);
  ok("real NVDA adjusted over split => clean", adjVerdict.reliable === true && adjVerdict.flaggedSymbols.length === 0);
})();

// ───────────────────────── Macro provenance ─────────────────────────
(() => {
  const g = macroFigure({ indicator: "GDP", value: 21000, source: "World Bank", seriesId: "NY.GDP.MKTP.CD", asOf: "2023" });
  ok("macro ok carries source + series", g.status === "ok" && g.source === "World Bank" && g.seriesId === "NY.GDP.MKTP.CD");
  const gn = macroFigure({ indicator: "GDP", value: null, source: "World Bank" });
  ok("macro insufficient on null", gn.status === "insufficient_data" && gn.value === null);

  const fx = fxRate({ base: "USD", quote: "EUR", rate: 0.92, source: "ExchangeRate" });
  ok("fx ok", fx.status === "ok" && fx.rate === 0.92);
  ok("fx insufficient on bad rate", fxRate({ base: "USD", quote: "EUR", rate: 0, source: "ExchangeRate" }).status === "insufficient_data");
})();

// ───────── The One Rule: engine must be LLM-FREE ─────────
(() => {
  const dir = path.join(process.cwd(), "server", "engine");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
  const llmPattern = /\b(openai|anthropic|@ai-sdk|cohere|gpt-4|chatcompletion)\b/i;
  let offenders: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    // strip line/block comments so doc references to "OpenAI" don't trip the guard
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    if (llmPattern.test(code)) offenders.push(f);
  }
  ok("engine has no LLM imports/calls", offenders.length === 0, `offenders: ${offenders.join(", ")}`);
  ok("engine has expected files", files.includes("portfolio.ts") && files.includes("risk.ts") && files.includes("data-sources.ts"));
})();

console.log(`\n────────────────────────────────────`);
console.log(`Engine Tests: ${passed}/${passed + failed} passed`);
console.log(`────────────────────────────────────\n`);
process.exit(failed === 0 ? 0 : 1);
