---
name: WealthSync computation engine
description: The LLM-free engine that turns decision-driving "(A)" numbers into computed, auditable values — its boundary rules and the cross-asset alignment gotcha.
---

# WealthSync LLM-free computation engine

`server/engine/` holds the deterministic, LLM-free number engine. Numbers that drive
decisions ("(A)") are computed here from real feeds (Finnhub, World Bank, ExchangeRate);
judgmental/LLM numbers ("(B)") stay AI-generated and keep the AI-estimate label.

## The One Rule (enforced by test)
`server/engine/` must import NO LLM client. `tests/engine.test.ts` scans the dir for
`/openai|anthropic|@ai-sdk|cohere|gpt-4|chatcompletion/` (comments stripped first) and fails
if found.
**Why:** the whole value proposition is "these numbers are facts from data, not model output."
**How to apply:** keep all OpenAI usage out of `server/engine/`; orchestrate fetch+compute in
routes (`server/routes/portfolio-metrics.ts`), never call a model for an (A) number.

## Honesty rules baked in
- Missing data => explicit `insufficient_data` / null. NEVER fall back to a fake/estimated value.
- (A) numbers in the UI get `ComputedBadge` with `label="Computed · source: X"`; (B) numbers get
  `AIEstimateBadge`. Mislabeling either way is the core failure mode — verify the data source of a
  number before tagging it. (e.g. personal-finance budget numbers come from the LLM service
  `personalFinanceAI`, so they are AI-estimate, NOT computed, despite a deterministic 50/30/20
  service also existing.)
- No predictive-accuracy / "guaranteed" copy. Numbers report what the data gives, not forecasts.

## Cross-asset alignment gotcha (cost a review cycle)
Beta / weighted-portfolio returns MUST compare the SAME calendar days. Finnhub `/stock/candle`
returns per-symbol arrays that are not naturally aligned across symbols; naively truncating to the
shortest length compares different dates and yields a wrong beta.
**Fix:** fetch candles WITH timestamps (`fetchDailySeries` → `{t,c}`) and intersect by date via
`alignedClosesByDate` before computing returns/beta.
**How to apply:** any new cross-asset stat must run through `alignedClosesByDate` first.

## Finnhub plan caveat
`/quote` (field `c`) works on the free key, but `/stock/candle` is premium-gated on some plans.
When candles are unavailable the risk section returns `insufficient_data` (vol/drawdown/Sharpe/beta
shown as an honest empty state) while portfolio value/P&L from live quotes still compute.

## Historical prices: provider + Postgres cache (replaced Finnhub candles for risk)
Risk-history now comes from a swappable `HistoricalPriceProvider` (`server/engine/historical-prices.ts`),
default `AlphaVantageProvider`, cached in Postgres table `price_history_cache`. Flow: read cache window →
if stale (`cacheIsFresh`, 4-day tolerance) fetch provider → upsert only `missingBars` → return `{t,c,source,priceBasis}`.
- **Alpha Vantage free-key reality:** `TIME_SERIES_DAILY_ADJUSTED` is PREMIUM-gated (returns an
  "Information" envelope, no data). Free key works only with `TIME_SERIES_DAILY` (RAW close, no
  adjusted), limited to ~1 req/sec and 25 req/day. Override via `ALPHA_VANTAGE_FUNCTION`.
  **Why it matters:** raw close ≠ adjusted close (splits/dividends), so the basis must be disclosed.
- **Provenance must reflect data actually used, not the configured provider.** `risk.source`/`risk.priceBasis`
  are derived from the series that actually fed the math (contributing holdings + benchmark), and from the
  real cached rows (`priceBasis` per row; "mixed" if rows disagree) — a label can never claim a source/method
  that didn't produce the number. `priceBasis: "raw_close"` triggers a UI disclosure line.
- **Self-bootstrapping schema:** `drizzle-kit push` needs a TTY (fails here); `ensureSchema(pool)` runs
  `CREATE TABLE/INDEX/ADD COLUMN IF NOT EXISTS` once per process (memoized, resets on error) at the top of
  `getCachedDailySeries`, so fresh/staging envs work without manual SQL. `shared/schema.ts` stays the typed source of truth.
- **Throttle/backoff** is module-level shared state in the provider (`minGapMs` default 1500, 60s backoff on
  any AV "Note"/"Information"). DB access is behind a lazy `await import("../db")` so importing the engine in
  tests opens no pool.
- **Live smoke gotcha:** write temp scripts in the workspace ROOT (not /tmp) so `@`/relative imports resolve;
  fetch symbols one at a time (respect 1 req/sec); delete the script after.

## Corporate-action (split/dividend) guard on the raw-price path
Raw (unadjusted) closes turn a split/large dividend into a phantom single-day return (4:1 split ≈ -75%)
that silently corrupts vol/maxDD/Sharpe/beta. Guard (pure, in `risk.ts`): `detectCorporateActionJumps`
flags any |daily return| > `SPLIT_JUMP_THRESHOLD` (0.35); `assessRiskReliability(perSymbol)` flags a metric
**only when that symbol's basis is `raw_close`** — `adjusted` series are never flagged (no artifacts).
**Why 35%:** worst real one-day equity crashes ≈ -22% to -30%; splits are ≥50% — 35% is the clean gap.
**Honest move:** FLAG (`risk.reliability="unreliable"` + upgrade note + `flaggedSymbols`), never delete the
day (a genuine crash is real) and never fabricate a clean number. Basis DRIVES labeling+warning automatically:
set `ALPHA_VANTAGE_FUNCTION=TIME_SERIES_DAILY_ADJUSTED` (premium key) → basis becomes `adjusted`, warning self-clears.

Detection is on `Math.abs(return)`, so REVERSE splits (huge POSITIVE jump, 1-for-10 ≈ +900%) are caught too.
**Sub-threshold special dividends** (one-off cash div ~5–30% of price) can still modestly distort raw-basis
metrics WITHOUT tripping the flag — documented as a known limitation (threshold comment + UI raw-close caveat);
NOT detected on the free key (lowering the threshold would flag real crashes); adjusted premium data is the fix.

## Real split-data fixtures (free-key constraint)
No free source gives truly UNADJUSTED historical closes for old splits: Alpha Vantage `outputsize=full` is
premium; Yahoo v8 chart `close` is split-ADJUSTED (back-adjusted, no artifact); Stooq CSV sits behind a JS
proof-of-work wall. So a "raw split" fixture must be RECONSTRUCTED: directly-fetch Yahoo adjusted closes +
the real split event (`events=split`), then as-traded raw = adjusted × split factor for bars before the
effective date. **Honesty rule (architect insisted):** name the field `reconstructedRawClose` (NOT `rawClose`)
and document in `_meta` that it's reconstructed, not a direct download — over-claiming a reconstruction as a
direct raw feed fails review even with correct numbers. Fixture: `tests/fixtures/nvda-split-2024.json` (NVDA
10:1, 2024-06-10; raw split-day return ≈ -89.9%, adjusted ≈ +0.75%).

## Test runner
No vitest/jest in this repo. `tests/engine.test.ts` runs via `npx tsx tests/engine.test.ts`
(custom ✅/❌ harness, `process.exit(failed===0?0:1)`), same pattern as `tests/smoke.test.ts`.
Fixtures load via `path.join(import.meta.dirname, "fixtures", ...)`.
