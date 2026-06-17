/**
 * server/engine/portfolio.ts
 *
 * PURE, DETERMINISTIC portfolio math. No I/O, no LLM, no randomness.
 * Every value is derived by formula from the inputs passed in. Given the same
 * inputs, these functions ALWAYS return identical output.
 *
 * Money convention: callers pass dollars (floats). Holdings stored in cents
 * are converted to dollars by the data layer before reaching this module.
 */

export interface HoldingInput {
  symbol: string;
  name?: string;
  type?: string; // ETF, Stock, Bond, REIT, Cash, etc.
  shares: number;
  averageCostPerShare: number; // dollars per share
  price: number | null; // live price per share in dollars; null = no live price
}

export interface HoldingMetrics {
  symbol: string;
  name: string;
  type: string;
  shares: number;
  averageCostPerShare: number;
  price: number;
  marketValue: number; // shares * price
  costBasis: number; // shares * averageCostPerShare
  unrealizedPnl: number; // marketValue - costBasis
  unrealizedPnlPct: number | null; // unrealizedPnl / costBasis * 100, null if costBasis 0
  weight: number | null; // marketValue / totalMarketValue * 100, filled by summary
}

export interface AllocationSlice {
  type: string;
  marketValue: number;
  weight: number; // percent of total
}

export interface PortfolioSummary {
  status: "ok" | "insufficient_data";
  reason?: string;
  holdings: HoldingMetrics[];
  skipped: { symbol: string; reason: string }[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number | null;
  allocationByType: AllocationSlice[];
}

const round = (n: number, dp: number): number => {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
};

/**
 * Compute per-holding metrics from a single holding + its live price.
 * Returns null when no live price is available (explicit insufficient data).
 */
export function computeHoldingMetrics(h: HoldingInput): HoldingMetrics | null {
  if (h.price == null || !Number.isFinite(h.price) || h.price <= 0) return null;
  if (!Number.isFinite(h.shares) || h.shares <= 0) return null;
  const marketValue = h.shares * h.price;
  const costBasis = h.shares * h.averageCostPerShare;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;
  return {
    symbol: h.symbol,
    name: h.name ?? h.symbol,
    type: (h.type ?? "Other").trim() || "Other",
    shares: h.shares,
    averageCostPerShare: round(h.averageCostPerShare, 4),
    price: round(h.price, 4),
    marketValue: round(marketValue, 2),
    costBasis: round(costBasis, 2),
    unrealizedPnl: round(unrealizedPnl, 2),
    unrealizedPnlPct: unrealizedPnlPct == null ? null : round(unrealizedPnlPct, 2),
    weight: null,
  };
}

/**
 * Compute the full portfolio summary: per-holding metrics, weights, totals,
 * and allocation by asset type. Holdings without a live price are reported in
 * `skipped` rather than guessed.
 */
export function computePortfolioSummary(holdings: HoldingInput[]): PortfolioSummary {
  const computed: HoldingMetrics[] = [];
  const skipped: { symbol: string; reason: string }[] = [];

  for (const h of holdings) {
    const m = computeHoldingMetrics(h);
    if (m == null) {
      skipped.push({
        symbol: h.symbol,
        reason: h.price == null ? "no_live_price" : "invalid_inputs",
      });
    } else {
      computed.push(m);
    }
  }

  if (computed.length === 0) {
    return {
      status: "insufficient_data",
      reason: "no_priced_holdings",
      holdings: [],
      skipped,
      totalMarketValue: 0,
      totalCostBasis: 0,
      totalUnrealizedPnl: 0,
      totalUnrealizedPnlPct: null,
      allocationByType: [],
    };
  }

  const totalMarketValue = computed.reduce((s, h) => s + h.marketValue, 0);
  const totalCostBasis = computed.reduce((s, h) => s + h.costBasis, 0);
  const totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  const totalUnrealizedPnlPct =
    totalCostBasis > 0 ? round((totalUnrealizedPnl / totalCostBasis) * 100, 2) : null;

  for (const h of computed) {
    h.weight = totalMarketValue > 0 ? round((h.marketValue / totalMarketValue) * 100, 2) : null;
  }

  const byType = new Map<string, number>();
  for (const h of computed) {
    byType.set(h.type, (byType.get(h.type) ?? 0) + h.marketValue);
  }
  const allocationByType: AllocationSlice[] = Array.from(byType.entries())
    .map(([type, marketValue]) => ({
      type,
      marketValue: round(marketValue, 2),
      weight: totalMarketValue > 0 ? round((marketValue / totalMarketValue) * 100, 2) : 0,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);

  return {
    status: "ok",
    holdings: computed,
    skipped,
    totalMarketValue: round(totalMarketValue, 2),
    totalCostBasis: round(totalCostBasis, 2),
    totalUnrealizedPnl: round(totalUnrealizedPnl, 2),
    totalUnrealizedPnlPct,
    allocationByType,
  };
}
