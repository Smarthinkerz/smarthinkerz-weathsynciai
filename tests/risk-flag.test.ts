/**
 * WealthSync — RISK_ANALYTICS_LIVE flag-state Tests
 *
 * PROVES the risk-analytics gate behavior across BOTH flag states and every
 * relevant tier/data combination — instead of inferring it from "it's the same
 * code path". The flag is INJECTED into resolveRiskState (the extracted resolver
 * the /api/portfolio/metrics route delegates to), so these tests never depend on
 * the committed RISK_ANALYTICS_LIVE constant and never hit the network.
 *
 * Cases:
 *   1. flag=false                       -> "coming_soon" for EVERY tier (no data fetch)
 *   2. flag=true,  non-paid             -> "premium_required" (no data fetch)
 *   3. flag=true,  paid, data present   -> computed metrics ("ok")
 *   4. flag=true,  paid, no symbol data -> honest "insufficient_data"
 * Plus: the client (computed-portfolio.tsx) maps those exact statuses to the
 *       RiskComingSoon / RiskPremiumGate / computed / insufficient-data states.
 *
 * Run with: npx tsx tests/risk-flag.test.ts
 */
import fs from "fs";
import path from "path";
import {
  resolveRiskState,
  RISK_BENCHMARK,
  type RiskHistSeries,
  type ResolveRiskStateDeps,
} from "../server/routes/risk-state";

let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? `  — ${detail}` : ""}`);
  }
}

/** Build a deterministic OHLC-ish series with matching date keys. */
function series(closes: number[], source = "AlphaVantage", priceBasis = "adjusted"): RiskHistSeries {
  const t = closes.map((_, i) => i + 1); // shared date keys so symbols align by DATE
  return { t, c: closes, source, priceBasis };
}

const AAPL = series([100, 101, 102, 101, 103, 104, 103, 105, 106, 105, 107, 108]);
const SPY = series([400, 402, 401, 403, 404, 403, 405, 406, 405, 407, 408, 409]);

/** A historical fetcher that returns the given map and counts invocations. */
function stubFetch(map: Record<string, RiskHistSeries | null>) {
  const calls: string[][] = [];
  const fn: ResolveRiskStateDeps["fetchHistorical"] = async (symbols) => {
    calls.push(symbols);
    const out: Record<string, RiskHistSeries | null> = {};
    for (const s of symbols) out[s] = map[s] ?? null;
    return out;
  };
  return { fn, calls };
}

/** A fetcher that MUST NOT be called (proves the flag/gate short-circuits). */
function forbiddenFetch(): ResolveRiskStateDeps["fetchHistorical"] {
  return async () => {
    throw new Error("fetchHistorical should NOT be called in this branch");
  };
}

(async () => {
  console.log("\nRISK_ANALYTICS_LIVE flag-state tests\n");

  // ── Case 1: flag=false → coming_soon for EVERY tier, no data fetch ──
  for (const isPaid of [false, true]) {
    const risk = await resolveRiskState({
      riskLive: false,
      isPaid,
      portfolioStatus: "ok",
      holdings: [{ symbol: "AAPL", weight: 100 }],
      providerConfigured: true,
      fetchHistorical: forbiddenFetch(),
    });
    ok(
      `flag=false + ${isPaid ? "paid" : "non-paid"} → coming_soon`,
      risk.status === "coming_soon",
      `got ${risk.status}`,
    );
  }

  // ── Case 2: flag=true + non-paid → premium_required, no data fetch ──
  {
    const risk = await resolveRiskState({
      riskLive: true,
      isPaid: false,
      portfolioStatus: "ok",
      holdings: [{ symbol: "AAPL", weight: 100 }],
      providerConfigured: true,
      fetchHistorical: forbiddenFetch(),
    });
    ok("flag=true + non-paid → premium_required", risk.status === "premium_required", `got ${risk.status}`);
  }

  // ── Case 3: flag=true + paid + data present → computed "ok" ──
  {
    const { fn, calls } = stubFetch({ AAPL, [RISK_BENCHMARK]: SPY });
    const risk = await resolveRiskState({
      riskLive: true,
      isPaid: true,
      portfolioStatus: "ok",
      holdings: [{ symbol: "AAPL", weight: 100 }],
      providerConfigured: true,
      fetchHistorical: fn,
    });
    ok("flag=true + paid + data → status ok", risk.status === "ok", `got ${risk.status}`);
    ok("computed: volatilityAnnualized is a number", typeof risk.volatilityAnnualized === "number" && isFinite(risk.volatilityAnnualized));
    ok("computed: sharpe is a number", typeof risk.sharpe === "number" && isFinite(risk.sharpe));
    ok("computed: maxDrawdown is a number", typeof risk.maxDrawdown === "number" && isFinite(risk.maxDrawdown));
    ok("computed: beta is a number (benchmark aligned)", typeof risk.beta === "number" && isFinite(risk.beta));
    ok("computed: benchmark is SPY", risk.benchmark === RISK_BENCHMARK);
    ok("computed: provenance reflects used source", risk.source === "AlphaVantage", `got ${risk.source}`);
    ok("computed: priceBasis reported (adjusted)", risk.priceBasis === "adjusted", `got ${risk.priceBasis}`);
    ok("computed: data WAS fetched (gate open)", calls.length === 1);
    ok("computed: benchmark included in fetch", calls[0]?.includes(RISK_BENCHMARK) === true);
  }

  // ── Case 4: flag=true + paid + no data for symbol → insufficient_data ──
  {
    const { fn } = stubFetch({ AAPL: null, [RISK_BENCHMARK]: SPY });
    const risk = await resolveRiskState({
      riskLive: true,
      isPaid: true,
      portfolioStatus: "ok",
      holdings: [{ symbol: "AAPL", weight: 100 }],
      providerConfigured: true,
      fetchHistorical: fn,
    });
    ok("flag=true + paid + no symbol data → insufficient_data", risk.status === "insufficient_data", `got ${risk.status}`);
    ok("insufficient_data: honest reason (no_history)", risk.reason === "no_history", `got ${risk.reason}`);
    ok("insufficient_data: no fabricated metrics", risk.volatilityAnnualized === undefined && risk.sharpe === undefined);
  }

  // ── Client mapping: computed-portfolio.tsx switches on these exact statuses ──
  {
    const src = fs.readFileSync(
      path.join(process.cwd(), "client", "src", "components", "portfolio", "computed-portfolio.tsx"),
      "utf8",
    );
    ok(
      "client maps coming_soon → RiskComingSoon",
      /status === "coming_soon"/.test(src) && /<RiskComingSoon/.test(src),
    );
    ok(
      "client maps premium_required → RiskPremiumGate",
      /status === "premium_required"/.test(src) && /<RiskPremiumGate/.test(src),
    );
    ok('client maps ok → computed metrics grid', /status === "ok"/.test(src));
    ok(
      "client shows insufficient state only when NOT premium/coming_soon",
      /status !== "premium_required"/.test(src) && /status !== "coming_soon"/.test(src),
    );
  }

  // ── Guard: the committed flag must stay FALSE ──
  {
    const flagSrc = fs.readFileSync(path.join(process.cwd(), "shared", "feature-flags.ts"), "utf8");
    ok(
      "RISK_ANALYTICS_LIVE committed as false",
      /RISK_ANALYTICS_LIVE\s*(:\s*boolean)?\s*=\s*false/.test(flagSrc),
    );
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`Risk-Flag Tests: ${passed}/${passed + failed} passed`);
  console.log(`────────────────────────────────────\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
