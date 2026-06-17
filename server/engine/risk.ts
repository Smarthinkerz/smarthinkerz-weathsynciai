/**
 * server/engine/risk.ts
 *
 * PURE, DETERMINISTIC risk/return statistics computed from a price series.
 * No I/O, no LLM, no randomness. Standard textbook formulas only.
 *
 * Conventions:
 *  - A "price series" is an ascending-by-time array of closing prices.
 *  - Returns are simple (arithmetic) period-over-period returns.
 *  - Annualization uses TRADING_DAYS = 252 for daily data by default.
 *  - Functions return null when there is insufficient data — never a guess.
 */

export const TRADING_DAYS = 252;

const round = (n: number, dp = 6): number => {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Simple period-over-period returns: r_t = p_t / p_(t-1) - 1. */
export function dailyReturns(prices: number[]): number[] {
  if (!Array.isArray(prices) || prices.length < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(prices[i])) continue;
    out.push(prices[i] / prev - 1);
  }
  return out;
}

export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/**
 * Sample standard deviation (Bessel's correction, n-1). Returns null when
 * fewer than 2 observations.
 */
export function stdDev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  const variance = xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/**
 * Volatility = std dev of returns. Annualized = daily * sqrt(periodsPerYear).
 * Returned as a fraction (0.20 = 20%). null if insufficient data.
 */
export function volatility(
  returns: number[],
  opts: { annualize?: boolean; periodsPerYear?: number } = {},
): number | null {
  const sd = stdDev(returns);
  if (sd == null) return null;
  const { annualize = true, periodsPerYear = TRADING_DAYS } = opts;
  return round(annualize ? sd * Math.sqrt(periodsPerYear) : sd, 6);
}

/**
 * Annualized return (CAGR) from a price series:
 *   (lastPrice / firstPrice) ^ (periodsPerYear / numReturns) - 1
 * Returned as a fraction. null if insufficient data.
 */
export function annualizedReturn(
  prices: number[],
  periodsPerYear: number = TRADING_DAYS,
): number | null {
  if (!Array.isArray(prices) || prices.length < 2) return null;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (!Number.isFinite(first) || first <= 0 || !Number.isFinite(last) || last <= 0) return null;
  const periods = prices.length - 1;
  const total = last / first;
  return round(Math.pow(total, periodsPerYear / periods) - 1, 6);
}

/**
 * Maximum drawdown: the largest peak-to-trough decline as a NEGATIVE fraction
 * (e.g. -0.35 = a 35% drawdown). 0 if prices only rise. null if insufficient.
 */
export function maxDrawdown(prices: number[]): number | null {
  if (!Array.isArray(prices) || prices.length < 2) return null;
  let peak = prices[0];
  let maxDD = 0;
  for (const p of prices) {
    if (!Number.isFinite(p) || p <= 0) continue;
    if (p > peak) peak = p;
    const dd = p / peak - 1;
    if (dd < maxDD) maxDD = dd;
  }
  return round(maxDD, 6);
}

/**
 * Beta of an asset vs a benchmark: cov(asset, bench) / var(bench).
 * Both inputs are aligned return arrays of equal length (>= 2). null otherwise.
 */
export function beta(assetReturns: number[], benchReturns: number[]): number | null {
  const n = Math.min(assetReturns.length, benchReturns.length);
  if (n < 2) return null;
  const a = assetReturns.slice(0, n);
  const b = benchReturns.slice(0, n);
  const ma = mean(a)!;
  const mb = mean(b)!;
  let cov = 0;
  let varb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    varb += (b[i] - mb) * (b[i] - mb);
  }
  cov /= n - 1;
  varb /= n - 1;
  if (varb === 0) return null;
  return round(cov / varb, 6);
}

/**
 * Annualized Sharpe ratio:
 *   (annualizedMeanReturn - riskFreeRate) / annualizedVolatility
 * riskFreeRate is an annual fraction (default 0). null if insufficient data
 * or zero volatility.
 */
export function sharpe(
  returns: number[],
  opts: { riskFreeRate?: number; periodsPerYear?: number } = {},
): number | null {
  if (returns.length < 2) return null;
  const { riskFreeRate = 0, periodsPerYear = TRADING_DAYS } = opts;
  const m = mean(returns);
  const vol = volatility(returns, { annualize: true, periodsPerYear });
  if (m == null || vol == null || vol === 0) return null;
  const annualMean = m * periodsPerYear;
  return round((annualMean - riskFreeRate) / vol, 6);
}

// ─────────────────── Corporate-action / data-quality guard ───────────────────

/**
 * Single-day simple-return magnitude above which a move is almost certainly the
 * artifact of an UNADJUSTED corporate action (a stock split or a large special
 * dividend) rather than real market movement:
 *   - a 2-for-1 split shows as ~ -50%, a 4-for-1 as ~ -75%, a 1-for-10 reverse
 *     split as ~ +900% — all far beyond normal trading;
 *   - even the most violent single-session equity crashes very rarely exceed
 *     ~ -30% (e.g. Black Monday 1987 ≈ -22%).
 * 35% sits in the gap: normal volatility never trips it, split/dividend
 * artifacts always do. Used ONLY to FLAG raw-price metrics as unreliable — we
 * never delete the day (a genuine crash is legitimate) nor fabricate a clean
 * number.
 *
 * KNOWN LIMITATION: a large SPECIAL dividend below this threshold (e.g. a one-off
 * cash dividend worth ~5–30% of the share price) still nudges the raw-basis
 * return down on the ex-date without tripping the flag, so raw-basis metrics can
 * be MODESTLY distorted by sub-threshold dividends. We deliberately do NOT try to
 * detect special dividends on the free key (lowering the threshold would start
 * flagging real crashes); the correct fix is split/dividend-ADJUSTED (premium)
 * price data, where the artifact never appears.
 */
export const SPLIT_JUMP_THRESHOLD = 0.35;

/** Honest note attached to raw-price metrics when a split/dividend artifact is suspected. */
export const UNRELIABLE_RAW_SPLIT_NOTE =
  "unreliable — possible unadjusted split/dividend in window; upgrade to adjusted prices for accurate stats";

/**
 * Indices + values of single-day returns whose magnitude exceeds `threshold`
 * (the split/dividend signature). PURE & deterministic. An empty array means no
 * suspicious jump was found.
 */
export function detectCorporateActionJumps(
  returns: number[],
  threshold: number = SPLIT_JUMP_THRESHOLD,
): { index: number; value: number }[] {
  if (!Array.isArray(returns)) return [];
  const out: { index: number; value: number }[] = [];
  for (let i = 0; i < returns.length; i++) {
    const r = returns[i];
    if (Number.isFinite(r) && Math.abs(r) > threshold) out.push({ index: i, value: r });
  }
  return out;
}

export interface ReliabilityAssessment {
  reliable: boolean;
  flaggedSymbols: string[];
  note: string | null;
}

/**
 * Decide whether risk metrics can be trusted given each contributing series and
 * its PRICE BASIS. A suspicious single-day jump only matters on the "raw_close"
 * basis — split/dividend ADJUSTED series have no such artifacts, so jumps there
 * are treated as genuine and never flagged. PURE & deterministic: the basis
 * drives the warning automatically, with no LLM and no fabricated numbers.
 */
export function assessRiskReliability(
  perSymbol: { symbol: string; returns: number[]; basis: string }[],
  threshold: number = SPLIT_JUMP_THRESHOLD,
): ReliabilityAssessment {
  const flaggedSymbols: string[] = [];
  for (const s of perSymbol) {
    if (s.basis !== "raw_close") continue; // adjusted/unknown-adjusted: no split artifacts
    if (detectCorporateActionJumps(s.returns, threshold).length > 0) flaggedSymbols.push(s.symbol);
  }
  if (flaggedSymbols.length === 0) return { reliable: true, flaggedSymbols: [], note: null };
  return { reliable: false, flaggedSymbols, note: UNRELIABLE_RAW_SPLIT_NOTE };
}

/**
 * Align multiple price series by their TIMESTAMPS so cross-asset statistics
 * (beta, weighted returns) compare the same calendar days. Each input is
 * { t: unix-seconds[], c: closes[] } of equal length. Returns a map of
 * symbol -> closes restricted to the dates COMMON to every symbol, ascending
 * by date. Pure & deterministic. Empty map if no common dates.
 */
export function alignedClosesByDate(
  series: Record<string, { t: number[]; c: number[] }>,
): Record<string, number[]> {
  const symbols = Object.keys(series).filter((s) => {
    const v = series[s];
    return v && Array.isArray(v.t) && Array.isArray(v.c) && v.t.length === v.c.length && v.t.length > 0;
  });
  if (symbols.length === 0) return {};

  const maps: Record<string, Map<number, number>> = {};
  for (const s of symbols) {
    const m = new Map<number, number>();
    const { t, c } = series[s];
    for (let i = 0; i < t.length; i++) {
      if (Number.isFinite(t[i]) && Number.isFinite(c[i]) && c[i] > 0) m.set(t[i], c[i]);
    }
    maps[s] = m;
  }

  let common: number[] | null = null;
  for (const s of symbols) {
    const keys = Array.from(maps[s].keys());
    common = common == null ? keys : common.filter((k) => maps[s].has(k));
  }
  const sorted = (common ?? []).sort((a, b) => a - b);

  const out: Record<string, number[]> = {};
  for (const s of symbols) out[s] = sorted.map((k) => maps[s].get(k)!);
  return out;
}

/**
 * Build a portfolio-level daily return series from weighted constituent
 * returns. `series` maps symbol -> aligned daily return array; `weights` maps
 * symbol -> fraction (should sum to ~1). Only symbols present in BOTH are used,
 * truncated to the shortest common length. null if nothing usable.
 */
export function weightedPortfolioReturns(
  series: Record<string, number[]>,
  weights: Record<string, number>,
): number[] | null {
  const symbols = Object.keys(weights).filter((s) => Array.isArray(series[s]) && series[s].length > 0);
  if (symbols.length === 0) return null;
  const len = Math.min(...symbols.map((s) => series[s].length));
  if (len < 2) return null;
  const totalW = symbols.reduce((s, sym) => s + weights[sym], 0);
  if (totalW <= 0) return null;
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    let r = 0;
    for (const sym of symbols) r += (weights[sym] / totalW) * series[sym][i];
    out.push(r);
  }
  return out;
}
