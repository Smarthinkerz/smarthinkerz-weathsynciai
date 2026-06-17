import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2, Info, Lock, Clock } from "lucide-react";
import { ComputedBadge, SourceBadge } from "@/components/integrity/disclaimers";

/**
 * ComputedPortfolio — renders GENUINELY COMPUTED portfolio analytics from
 * /api/portfolio/metrics. Every number here is calculated by the LLM-free
 * engine (server/engine) from real Finnhub prices and World Bank / ExchangeRate
 * data — never produced by the AI model. Missing data shows an explicit
 * "insufficient data" state instead of a guess.
 */

type Holding = {
  symbol: string;
  name: string;
  type: string;
  shares: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number | null;
  weight: number | null;
};

type Metrics = {
  status: "ok" | "insufficient_data";
  reason?: string;
  message?: string;
  portfolio?: {
    status: string;
    holdings: Holding[];
    skipped: { symbol: string; reason: string }[];
    totalMarketValue: number;
    totalCostBasis: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPct: number | null;
    allocationByType: { type: string; marketValue: number; weight: number }[];
  };
  risk?: any;
  macro?: any;
  computedAt?: string;
};

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const pct = (n: number | null | undefined, dp = 2) =>
  n == null ? "—" : `${n >= 0 ? "" : ""}${n.toFixed(dp)}%`;
const num = (n: number | null | undefined, dp = 2) => (n == null ? "—" : n.toFixed(dp));

function Stat({
  label,
  value,
  source,
  positive,
  kind = "computed",
}: {
  label: string;
  value: string;
  source: string;
  positive?: boolean | null;
  kind?: "computed" | "source";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {kind === "source" ? (
          <SourceBadge label={`Source: ${source}`} />
        ) : (
          <ComputedBadge label={`Computed · ${source}`} />
        )}
      </div>
      <div
        className={`font-semibold tabular-nums ${
          positive == null ? "" : positive ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InsufficientData({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-600">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <p className="text-xs leading-relaxed">{message}</p>
    </div>
  );
}

function RiskPremiumGate() {
  return (
    <div
      data-testid="risk-premium-gate"
      className="flex flex-col items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40"
    >
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm font-semibold">Risk analytics is a premium feature</span>
      </div>
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Volatility, max drawdown, Sharpe ratio and beta are available on paid plans. Upgrade to
        unlock split/dividend-adjusted risk metrics for your portfolio.
      </p>
      <Button asChild size="sm" className="mt-1" data-testid="button-upgrade-risk">
        <Link href="/billing">Upgrade to unlock</Link>
      </Button>
    </div>
  );
}

function RiskComingSoon() {
  return (
    <div
      data-testid="risk-coming-soon"
      className="flex flex-col items-start gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Clock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm font-semibold">Risk analytics — coming soon</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Volatility, max drawdown, Sharpe ratio and beta are on the way. We're finishing the
        licensed historical-data feed that powers these numbers, so they aren't available on any
        plan yet — and we won't show estimates in their place.
      </p>
    </div>
  );
}

export function ComputedPortfolio() {
  const { data, isLoading } = useQuery<Metrics>({ queryKey: ["/api/portfolio/metrics"] });

  return (
    <Card data-testid="card-computed-portfolio">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-emerald-600" />
          Computed Portfolio Analytics
        </CardTitle>
        <CardDescription>
          Calculated in code from live market data (Finnhub) and official macro data (World Bank,
          ExchangeRate). These are facts from the data, not AI estimates and not predictions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data || data.status === "insufficient_data" || !data.portfolio || data.portfolio.status !== "ok" ? (
          <InsufficientData
            message={
              data?.message ||
              "Add holdings with valid symbols to compute live portfolio value, profit/loss, and risk. We never guess these numbers — they require real market data."
            }
          />
        ) : (
          <>
            {/* Portfolio value & P&L */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Market Value" value={usd(data.portfolio.totalMarketValue)} source="Finnhub" />
              <Stat label="Cost Basis" value={usd(data.portfolio.totalCostBasis)} source="your inputs" />
              <Stat
                label="Unrealized P&L"
                value={usd(data.portfolio.totalUnrealizedPnl)}
                source="Finnhub"
                positive={data.portfolio.totalUnrealizedPnl >= 0}
              />
              <Stat
                label="Unrealized P&L %"
                value={pct(data.portfolio.totalUnrealizedPnlPct)}
                source="Finnhub"
                positive={(data.portfolio.totalUnrealizedPnlPct ?? 0) >= 0}
              />
            </div>

            {/* Holdings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Symbol</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 text-right font-medium">Shares</th>
                    <th className="py-2 px-3 text-right font-medium">Price</th>
                    <th className="py-2 px-3 text-right font-medium">Market Value</th>
                    <th className="py-2 px-3 text-right font-medium">P&L</th>
                    <th className="py-2 px-3 text-right font-medium">P&L %</th>
                    <th className="py-2 pl-3 text-right font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {data.portfolio.holdings.map((h) => (
                    <tr key={h.symbol} className="border-b last:border-0" data-testid={`row-holding-${h.symbol}`}>
                      <td className="py-2 pr-3 font-medium">{h.symbol}</td>
                      <td className="py-2 px-3 text-muted-foreground">{h.type}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{h.shares}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{usd(h.price)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{usd(h.marketValue)}</td>
                      <td className={`py-2 px-3 text-right tabular-nums ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {usd(h.unrealizedPnl)}
                      </td>
                      <td className={`py-2 px-3 text-right tabular-nums ${(h.unrealizedPnlPct ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {pct(h.unrealizedPnlPct)}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums">{pct(h.weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-1 flex justify-end">
                <ComputedBadge
                  label="Computed · source: Finnhub"
                  tooltip="Live prices from Finnhub; market value = shares × price; P&L = market value − cost basis."
                />
              </div>
            </div>

            {data.portfolio.skipped?.length > 0 && (
              <InsufficientData
                message={`No live price available for: ${data.portfolio.skipped
                  .map((s) => s.symbol)
                  .join(", ")}. These are excluded from totals rather than estimated.`}
              />
            )}

            {/* Risk / return */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Risk & Return (180-day window)</h4>
              {data.risk?.status === "ok" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat label="Volatility (ann.)" value={pct((data.risk.volatilityAnnualized ?? 0) * 100)} source={data.risk.source} />
                  <Stat label="Annualized Return" value={pct((data.risk.annualizedReturn ?? 0) * 100)} source={data.risk.source} positive={(data.risk.annualizedReturn ?? 0) >= 0} />
                  <Stat label="Max Drawdown" value={pct((data.risk.maxDrawdown ?? 0) * 100)} source={data.risk.source} positive={false} />
                  <Stat label="Sharpe (rf=0)" value={num(data.risk.sharpe)} source={data.risk.source} />
                  <Stat label={`Beta vs ${data.risk.benchmark}`} value={num(data.risk.beta)} source={data.risk.source} />
                </div>
              ) : null}
              {data.risk?.status === "ok" && data.risk.reliability === "unreliable" && (
                <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  <span className="font-semibold">⚠ These risk metrics may be unreliable.</span>{" "}
                  A likely unadjusted stock split or large dividend was detected
                  {Array.isArray(data.risk.flaggedSymbols) && data.risk.flaggedSymbols.length > 0
                    ? ` in: ${data.risk.flaggedSymbols.join(", ")}`
                    : " in the window"}
                  . On raw closing prices a split looks like a huge one-day move, which distorts volatility, drawdown, Sharpe and beta. Upgrade to split/dividend-adjusted prices for accurate stats.
                </div>
              )}
              {data.risk?.status === "ok" && data.risk.priceBasis === "adjusted" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Prices are split/dividend adjusted.
                </p>
              )}
              {data.risk?.status === "ok" && data.risk.priceBasis === "raw_close" && data.risk.reliability !== "unreliable" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on raw daily closing prices (not split/dividend adjusted). Returns over the window may differ slightly from total-return figures, and a large special dividend (smaller than an obvious split) can modestly affect these metrics without triggering the warning above. Split/dividend-adjusted (premium) price data is the fix.
                </p>
              )}
              {data.risk?.status === "coming_soon" && <RiskComingSoon />}
              {data.risk?.status === "premium_required" && <RiskPremiumGate />}
              {data.risk?.status !== "ok" &&
                data.risk?.status !== "premium_required" &&
                data.risk?.status !== "coming_soon" && (
                <InsufficientData message="Historical daily prices aren't available for these symbols yet (a new ticker, or the data provider is temporarily rate-limited), so volatility, drawdown, Sharpe and beta can't be computed. We don't estimate them." />
              )}
            </div>

            {/* Macro */}
            {data.macro && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Macro Context</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Stat
                    label={`US Inflation${data.macro.inflation?.asOf ? ` (${data.macro.inflation.asOf})` : ""}`}
                    value={data.macro.inflation?.status === "ok" ? pct(data.macro.inflation.value) : "—"}
                    source="World Bank"
                    kind="source"
                  />
                  <Stat
                    label={`US GDP${data.macro.gdp?.asOf ? ` (${data.macro.gdp.asOf})` : ""}`}
                    value={data.macro.gdp?.status === "ok" ? usd(data.macro.gdp.value) : "—"}
                    source="World Bank"
                    kind="source"
                  />
                  <Stat
                    label="USD → EUR"
                    value={data.macro.fxUsdEur?.status === "ok" ? num(data.macro.fxUsdEur.rate, 4) : "—"}
                    source="ExchangeRate"
                    kind="source"
                  />
                </div>
              </div>
            )}

            {data.computedAt && (
              <p className="text-right text-[11px] text-muted-foreground">
                Computed {new Date(data.computedAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
