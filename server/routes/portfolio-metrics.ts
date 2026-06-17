/**
 * server/routes/portfolio-metrics.ts
 *
 * Exposes GENUINELY COMPUTED portfolio analytics. This route is pure
 * orchestration: it loads the user's real holdings, fetches real live prices
 * from Finnhub, real historical daily prices from the HistoricalPriceProvider
 * (default Alpha Vantage, Postgres-cached), and macro data from World Bank/
 * ExchangeRate, then calls the LLM-free engine (server/engine) to compute every
 * number. No value here is produced by an LLM, and missing data yields an
 * explicit "insufficient_data" state.
 */
import { Router } from "express";
import { storage } from "../storage";
import { RISK_ANALYTICS_LIVE } from "@shared/feature-flags";
import {
  computePortfolioSummary,
  macroFigure,
  fxRate,
  fetchQuotes,
  fetchHistoricalSeriesMany,
  historicalProviderConfigured,
  fetchWorldBankLatest,
  fetchFxRate,
  ENGINE_SOURCES,
  type HoldingInput,
} from "../engine";
import { isPaidTier } from "@shared/schema";
import { resolveRiskState } from "./risk-state";

const router = Router();

function requireUser(req: any, res: any, next: any) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User authentication required" });
  }
  next();
}

router.get("/portfolio/metrics", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const holdings = await storage.getPortfolioHoldings(userId);

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.json({
        status: "insufficient_data",
        reason: "no_holdings",
        message: "Add portfolio holdings to compute live, verifiable metrics.",
        sources: ENGINE_SOURCES,
      });
    }

    const symbols: string[] = holdings.map((h: any) => String(h.symbol).toUpperCase());
    const prices = await fetchQuotes(symbols);

    const inputs: HoldingInput[] = holdings.map((h: any) => {
      const symbol = String(h.symbol).toUpperCase();
      return {
        symbol,
        name: h.name,
        type: h.type,
        shares: Number(h.shares),
        // averageCost stored in cents per share -> dollars per share
        averageCostPerShare: Number(h.averageCost) / 100,
        price: prices[symbol] ?? null,
      };
    });

    const portfolio = computePortfolioSummary(inputs);

    // ---- Risk/return (computed from real historical daily prices) ----
    // History comes from a swappable HistoricalPriceProvider (default Alpha
    // Vantage), cached in Postgres so repeat requests don't re-hit the API.
    // Risk analytics (volatility, drawdown, Sharpe, beta) is a paid-tier feature.
    // Non-paid users get an explicit "premium_required" state so the panel shows a
    // clean upgrade prompt instead of a broken-looking "insufficient data" message.
    // FEATURE FLAG: while RISK_ANALYTICS_LIVE is false the data feed isn't
    // licensed/live yet, so risk analytics shows a "coming_soon" state to EVERY
    // tier (this supersedes the premium gate — upgrading wouldn't unlock working
    // data). When the flag is flipped true, the existing premium-gated computed
    // behavior below takes over unchanged.
    const isPaid = isPaidTier(req.user?.subscriptionTier);
    const risk = await resolveRiskState({
      riskLive: RISK_ANALYTICS_LIVE,
      isPaid,
      portfolioStatus: portfolio.status,
      holdings: portfolio.holdings.map((h) => ({ symbol: h.symbol, weight: h.weight ?? null })),
      providerConfigured: historicalProviderConfigured(),
      fetchHistorical: fetchHistoricalSeriesMany,
    });

    // ---- Macro (reported as fetched, with source + series id) ----
    const country = "US";
    const [gdp, inflation, fx] = await Promise.all([
      fetchWorldBankLatest(country, "NY.GDP.MKTP.CD"),
      fetchWorldBankLatest(country, "FP.CPI.TOTL.ZG"),
      fetchFxRate("USD", "EUR"),
    ]);

    const macro = {
      gdp: macroFigure({
        indicator: "GDP (current US$)",
        value: gdp?.value,
        unit: "USD",
        source: ENGINE_SOURCES.worldBank,
        seriesId: "NY.GDP.MKTP.CD",
        asOf: gdp?.year,
      }),
      inflation: macroFigure({
        indicator: "Inflation, consumer prices (annual %)",
        value: inflation?.value,
        unit: "% annual",
        source: ENGINE_SOURCES.worldBank,
        seriesId: "FP.CPI.TOTL.ZG",
        asOf: inflation?.year,
      }),
      fxUsdEur: fxRate({ base: "USD", quote: "EUR", rate: fx, source: ENGINE_SOURCES.exchangeRate }),
    };

    res.json({
      status: portfolio.status,
      portfolio,
      risk,
      macro,
      sources: ENGINE_SOURCES,
      computedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to compute portfolio metrics" });
  }
});

export const portfolioMetricsRouter = router;
