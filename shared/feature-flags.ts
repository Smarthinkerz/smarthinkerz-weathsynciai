/**
 * shared/feature-flags.ts
 *
 * Single source of truth for cross-cutting feature flags. Imported by both the
 * server and the client (via the @shared alias) so the two can never drift.
 *
 * RISK_ANALYTICS_LIVE:
 *   FALSE  (now)   — the computed risk-analytics panel (volatility, Sharpe, beta,
 *                    max drawdown) is shown as "Coming soon" to EVERY tier, and is
 *                    listed as "Coming soon" in pricing rather than as a delivered
 *                    paid benefit. The coming-soon state supersedes the premium gate
 *                    while the historical-data feed is not yet licensed/live.
 *   TRUE   (later) — flip to true once the data feed is licensed and live. The
 *                    existing behavior takes over unchanged: non-premium users see
 *                    the premium upgrade prompt; premium users see computed metrics
 *                    with the methodology/limitations note (or an honest
 *                    "insufficient data" per symbol), and pricing lists it as a
 *                    delivered Professional/Elite benefit.
 */
export const RISK_ANALYTICS_LIVE = false;
