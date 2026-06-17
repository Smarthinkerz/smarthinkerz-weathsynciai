/**
 * server/routes/risk-state.ts
 *
 * Pure, dependency-injected resolver for the portfolio risk-analytics state.
 * Extracted from the /api/portfolio/metrics route so the RISK_ANALYTICS_LIVE
 * feature-flag behavior can be PROVEN by tests across both flag states and every
 * tier — instead of being inferred from "it's the same code path".
 *
 * The flag (`riskLive`), the paid-tier check (`isPaid`), the provider-configured
 * check, and the historical-price fetcher are all injected, so a test can drive
 * every branch without touching the committed constant or hitting the network.
 *
 * Behavior contract (DO NOT regress):
 *   - riskLive=false            -> "coming_soon" for EVERY tier (supersedes the gate)
 *   - riskLive=true, !isPaid    -> "premium_required"
 *   - riskLive=true, isPaid, data present -> "ok" with computed metrics
 *   - riskLive=true, isPaid, no usable data -> "insufficient_data" (never a guess)
 */
import {
  dailyReturns,
  volatility,
  annualizedReturn,
  maxDrawdown,
  beta,
  sharpe,
  weightedPortfolioReturns,
  assessRiskReliability,
  alignedClosesByDate,
} from "../engine";

export const RISK_BENCHMARK = "SPY"; // S&P 500 ETF used as market proxy for beta

export interface RiskHistSeries {
  t: number[];
  c: number[];
  source: string;
  priceBasis: string;
}

export interface RiskHolding {
  symbol: string;
  weight: number | null;
}

export interface ResolveRiskStateDeps {
  /** RISK_ANALYTICS_LIVE — injected so tests don't depend on the committed const. */
  riskLive: boolean;
  isPaid: boolean;
  portfolioStatus: string;
  holdings: RiskHolding[];
  providerConfigured: boolean;
  fetchHistorical: (
    symbols: string[],
    days: number,
  ) => Promise<Record<string, RiskHistSeries | null>>;
}

/** Build a synthetic price index (base 100) from a return series. */
function indexFromReturns(returns: number[]): number[] {
  const idx = [100];
  for (const r of returns) idx.push(idx[idx.length - 1] * (1 + r));
  return idx;
}

export async function resolveRiskState(deps: ResolveRiskStateDeps): Promise<any> {
  const { riskLive, isPaid, portfolioStatus, holdings, providerConfigured, fetchHistorical } = deps;

  // FEATURE FLAG: while riskLive is false the data feed isn't licensed/live yet,
  // so risk analytics shows "coming_soon" to EVERY tier (this supersedes the
  // premium gate — upgrading wouldn't unlock working data). When flipped true,
  // the existing premium-gated computed behavior below takes over unchanged.
  let risk: any = !riskLive
    ? {
        status: "coming_soon",
        message:
          "Computed risk analytics (volatility, Sharpe, beta, max drawdown) is coming soon.",
      }
    : isPaid
    ? {
        status: "insufficient_data",
        reason: providerConfigured ? "no_history" : "provider_not_configured",
      }
    : {
        status: "premium_required",
        message: "Risk analytics is available on paid plans.",
      };

  if (riskLive && isPaid && portfolioStatus === "ok") {
    const histSymbols = Array.from(new Set([...holdings.map((h) => h.symbol), RISK_BENCHMARK]));
    const rawSeries = await fetchHistorical(histSymbols, 180);

    // Keep only symbols that returned candles, then align them by DATE so
    // every return series compares the same calendar days (correct beta).
    const usable: Record<string, { t: number[]; c: number[] }> = {};
    for (const [sym, s] of Object.entries(rawSeries)) if (s) usable[sym] = { t: s.t, c: s.c };
    const aligned = alignedClosesByDate(usable);

    const returnsBySymbol: Record<string, number[]> = {};
    for (const sym of holdings.map((h) => h.symbol)) {
      const series = aligned[sym];
      if (series && series.length >= 2) returnsBySymbol[sym] = dailyReturns(series);
    }

    const weights: Record<string, number> = {};
    for (const h of holdings) if (h.weight != null) weights[h.symbol] = h.weight / 100;

    const portReturns = weightedPortfolioReturns(returnsBySymbol, weights);
    const benchAligned = aligned[RISK_BENCHMARK];
    const benchReturns = benchAligned && benchAligned.length >= 2 ? dailyReturns(benchAligned) : null;

    if (portReturns && portReturns.length >= 2) {
      const portIndex = indexFromReturns(portReturns);
      // Provenance reflects the symbols ACTUALLY used in the computation
      // (holdings that contributed returns + the benchmark when beta is set),
      // never just the configured provider — so a label can't claim a source
      // or method that didn't produce these numbers.
      const usedSymbols = Object.keys(returnsBySymbol);
      if (benchReturns) usedSymbols.push(RISK_BENCHMARK);
      const usedSeries = usedSymbols.map((s) => rawSeries[s]).filter(Boolean) as RiskHistSeries[];
      const sourceSet = Array.from(new Set(usedSeries.map((s) => s.source)));
      const basisSet = Array.from(new Set(usedSeries.map((s) => s.priceBasis)));

      // Corporate-action guard: on the RAW-close basis a split/dividend shows
      // as a huge phantom single-day return that silently corrupts every risk
      // stat. Scan each contributing series at its own basis; if a raw series
      // has a split-sized jump, flag the metrics as unreliable (with an honest
      // upgrade note) rather than presenting a corrupted number as fact.
      const reliability = assessRiskReliability([
        ...Object.entries(returnsBySymbol).map(([symbol, returns]) => ({
          symbol,
          returns,
          basis: rawSeries[symbol]?.priceBasis ?? "raw_close",
        })),
        ...(benchReturns
          ? [
              {
                symbol: RISK_BENCHMARK,
                returns: benchReturns,
                basis: rawSeries[RISK_BENCHMARK]?.priceBasis ?? "raw_close",
              },
            ]
          : []),
      ]);

      risk = {
        status: "ok",
        observations: portReturns.length,
        windowDays: 180,
        volatilityAnnualized: volatility(portReturns, { annualize: true }),
        annualizedReturn: annualizedReturn(portIndex),
        maxDrawdown: maxDrawdown(portIndex),
        sharpe: sharpe(portReturns, { riskFreeRate: 0 }),
        beta: benchReturns ? beta(portReturns, benchReturns) : null,
        benchmark: RISK_BENCHMARK,
        source: sourceSet.length === 1 ? sourceSet[0] : sourceSet.join(", "),
        priceBasis: basisSet.length === 1 ? basisSet[0] : "mixed",
        reliability: reliability.reliable ? "ok" : "unreliable",
        reliabilityNote: reliability.note,
        flaggedSymbols: reliability.flaggedSymbols,
      };
    }
  }

  return risk;
}
