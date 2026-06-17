/**
 * server/engine/historical-prices.ts
 *
 * Historical daily-price layer for the computation engine. Finnhub's free plan
 * gates historical candles, so risk metrics (volatility, drawdown, Sharpe, beta)
 * had nothing real to compute from. This module wires in a REAL historical
 * source behind a swappable interface, and caches every bar in Postgres so we
 * don't re-hit a rate-limited API on each request.
 *
 * HONESTY (same rules as the rest of the engine):
 *   - This module — and all of server/engine — contains ZERO LLM/OpenAI calls.
 *     Numbers come from data feeds, never from a model.
 *   - If real historical data is unavailable (new ticker, API down, rate-limited
 *     with nothing cached), we return null so the caller shows "insufficient
 *     data". We NEVER fabricate or silently substitute a degraded value.
 *   - Every bar carries the provider name it came from (provenance).
 *
 * SWAPPABILITY: implement HistoricalPriceProvider for any vendor (Alpha Vantage,
 * Polygon, Tiingo, Finnhub-paid) and assign it to `historicalProvider`.
 */

// ───────────────────────── Types & interface ─────────────────────────

/** One real trading day. `close` is the split/dividend ADJUSTED close. */
export interface DailyBar {
  date: string; // ISO "YYYY-MM-DD"
  open: number | null;
  high: number | null;
  low: number | null;
  close: number; // adjusted close
}

export type PriceBasis = "adjusted" | "raw_close" | "mixed";

/** A swappable historical daily-price source. */
export interface HistoricalPriceProvider {
  /** Human-readable provenance name, e.g. "Alpha Vantage". */
  readonly name: string;
  /** Whether `close` values from this provider are split/dividend adjusted. */
  readonly priceBasis: "adjusted" | "raw_close";
  /** True when the API key/config needed by this provider is present. */
  isConfigured(): boolean;
  /**
   * Fetch recent daily ADJUSTED bars for a symbol, ascending by date. Returns
   * null on any failure or rate-limit so the caller can fall back to cache or
   * report insufficient data — never a guess.
   */
  fetchDaily(symbol: string): Promise<DailyBar[] | null>;
}

// ───────────────────────── Pure helpers (no I/O) ─────────────────────────

/** Convert an ISO "YYYY-MM-DD" date to unix seconds at UTC midnight. */
export function toUnixDay(dateStr: string): number {
  return Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / 1000);
}

/** ISO date string (UTC) `days` calendar days before `now`. */
export function isoDaysAgo(days: number, now: number = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Parse an Alpha Vantage TIME_SERIES_DAILY_ADJUSTED payload into ascending
 * DailyBar[] using the ADJUSTED close. PURE and deterministic. Returns null
 * when the payload is an error/rate-limit note or has no usable series — so the
 * caller treats it as "no data", never a guess.
 */
export function parseAlphaVantageDaily(json: any): DailyBar[] | null {
  if (!json || typeof json !== "object") return null;
  // Rate-limit / error envelopes Alpha Vantage returns instead of data:
  if (json["Error Message"] || json["Note"] || json["Information"]) return null;
  const series = json["Time Series (Daily)"];
  if (!series || typeof series !== "object") return null;

  const bars: DailyBar[] = [];
  for (const [date, row] of Object.entries<any>(series)) {
    // Prefer the adjusted close so splits/dividends don't create false returns.
    const adj = row?.["5. adjusted close"] ?? row?.["4. close"];
    const close = Number(adj);
    if (!Number.isFinite(close) || close <= 0) continue;
    const numOrNull = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    bars.push({
      date,
      open: numOrNull(row?.["1. open"]),
      high: numOrNull(row?.["2. high"]),
      low: numOrNull(row?.["3. low"]),
      close,
    });
  }
  if (bars.length === 0) return null;
  bars.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return bars;
}

/**
 * Is the cache fresh enough to skip an API call? True when the most recent
 * cached trading day is within `toleranceDays` calendar days of now (covers
 * weekends/holidays). PURE.
 */
export function cacheIsFresh(
  latestCachedDate: string | null,
  toleranceDays = 4,
  now: number = Date.now(),
): boolean {
  if (!latestCachedDate) return false;
  const latest = Date.parse(`${latestCachedDate}T00:00:00Z`);
  if (!Number.isFinite(latest)) return false;
  return now - latest <= toleranceDays * 24 * 60 * 60 * 1000;
}

/** Which of `bars` are NOT already cached (by date). PURE — drives "fetch only the missing range". */
export function missingBars(bars: DailyBar[], cachedDates: Set<string>): DailyBar[] {
  return bars.filter((b) => !cachedDates.has(b.date));
}

// ───────────────────────── Alpha Vantage provider ─────────────────────────

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

async function getJson(url: string, timeoutMs = 9000): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/**
 * Module-level throttle + backoff shared across all calls in this process.
 * Free Alpha Vantage allows ~5 requests/min; on a rate-limit "Note" we back off
 * so we stop hammering and let cached data carry the response.
 */
const RATE = {
  minGapMs: Number(process.env.ALPHA_VANTAGE_MIN_GAP_MS) || 1500,
  backoffMs: 60_000,
  lastCallAt: 0,
  backoffUntil: 0,
};

export class AlphaVantageProvider implements HistoricalPriceProvider {
  readonly name = "Alpha Vantage";

  /**
   * "adjusted" only when an explicitly ADJUSTED function is configured (premium
   * key). On the free TIME_SERIES_DAILY endpoint the close is "raw_close" — we
   * report this honestly rather than claiming adjusted figures.
   */
  get priceBasis(): "adjusted" | "raw_close" {
    const fn = process.env.ALPHA_VANTAGE_FUNCTION || "TIME_SERIES_DAILY";
    return /ADJUSTED/i.test(fn) ? "adjusted" : "raw_close";
  }

  isConfigured(): boolean {
    return !!process.env.ALPHA_VANTAGE_API_KEY;
  }

  async fetchDaily(symbol: string): Promise<DailyBar[] | null> {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key || !symbol) return null;

    const now = Date.now();
    if (now < RATE.backoffUntil) return null; // currently rate-limited: don't hammer
    const wait = RATE.lastCallAt + RATE.minGapMs - now;
    if (wait > 0) await sleep(wait);
    RATE.lastCallAt = Date.now();

    // We prefer the ADJUSTED series (splits/dividends), but TIME_SERIES_DAILY_ADJUSTED
    // is a PREMIUM Alpha Vantage endpoint. On the free key we use TIME_SERIES_DAILY
    // (raw close) — still REAL market data; the parser uses adjusted close when a
    // premium key makes it available. Override with ALPHA_VANTAGE_FUNCTION.
    // outputsize=compact => last ~100 trading days in one call (no key value logged).
    const fn = process.env.ALPHA_VANTAGE_FUNCTION || "TIME_SERIES_DAILY";
    const url =
      `${ALPHA_VANTAGE_BASE}?function=${fn}` +
      `&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${key}`;
    const json = await getJson(url);
    if (!json) return null;
    if (json["Note"] || json["Information"]) {
      RATE.backoffUntil = Date.now() + RATE.backoffMs; // throttled -> back off
      return null;
    }
    return parseAlphaVantageDaily(json);
  }
}

/** Active provider. Swap this line to change vendors; interface stays the same. */
export const historicalProvider: HistoricalPriceProvider = new AlphaVantageProvider();

/** True/false only — never logs the key value. */
export function historicalProviderConfigured(): boolean {
  return historicalProvider.isConfigured();
}

// ───────────────────────── Postgres-cached access ─────────────────────────

export interface CachedSeries {
  t: number[];
  c: number[];
  source: string; // actual provider the returned bars came from
  priceBasis: PriceBasis; // actual basis of the returned closes ("mixed" if rows disagree)
}

/**
 * Idempotently ensure the cache table exists. Runs CREATE TABLE / INDEX / ADD
 * COLUMN IF NOT EXISTS once per process so fresh or staging environments boot
 * without manual SQL or an interactive drizzle-kit push. Matches shared/schema.ts.
 */
let ensureSchemaPromise: Promise<void> | null = null;
function ensureSchema(pool: any): Promise<void> {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS price_history_cache (
          id SERIAL PRIMARY KEY,
          symbol TEXT NOT NULL,
          date TEXT NOT NULL,
          open DOUBLE PRECISION,
          high DOUBLE PRECISION,
          low DOUBLE PRECISION,
          close DOUBLE PRECISION NOT NULL,
          source TEXT NOT NULL,
          price_basis TEXT NOT NULL DEFAULT 'raw_close',
          fetched_at TIMESTAMP DEFAULT NOW()
        )`);
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS price_history_symbol_date_unq ON price_history_cache (symbol, date)`,
      );
      await pool.query(
        `ALTER TABLE price_history_cache ADD COLUMN IF NOT EXISTS price_basis TEXT NOT NULL DEFAULT 'raw_close'`,
      );
    })().catch((e) => {
      ensureSchemaPromise = null; // allow retry on next call
      throw e;
    });
  }
  return ensureSchemaPromise;
}

/** Collapse a list of per-row values into one, or "mixed" when they disagree. */
function uniformOr<T extends string>(values: T[], fallback: T): T | "mixed" {
  const set = new Set(values.filter(Boolean));
  if (set.size === 0) return fallback;
  if (set.size === 1) return values[0];
  return "mixed";
}

/**
 * Daily closes for a symbol over the last `days`, cache-first:
 *   1. read cached bars from Postgres,
 *   2. if cache is stale, fetch from the provider and UPSERT only missing bars,
 *   3. return { t, c, source, priceBasis } restricted to the window — or null
 *      when there is no real data (provider failed/limited AND cache empty).
 * `source`/`priceBasis` reflect the ACTUAL rows returned, so provenance can
 * never claim a provider/method that didn't produce the numbers. Never fabricates.
 */
export async function getCachedDailySeries(
  symbol: string,
  days = 180,
): Promise<CachedSeries | null> {
  const sym = String(symbol).toUpperCase();
  // Lazy import so importing this module (e.g. in unit tests) never opens a DB pool.
  const { pool } = await import("../db");
  await ensureSchema(pool);
  const cutoff = isoDaysAgo(days);

  const readWindow = async () => {
    const r = await pool.query(
      `SELECT date, close, source, price_basis FROM price_history_cache
         WHERE symbol = $1 AND date >= $2 ORDER BY date ASC`,
      [sym, cutoff],
    );
    return r.rows as { date: string; close: number; source: string; price_basis: string }[];
  };

  let rows = await readWindow();
  const latest = rows.length ? rows[rows.length - 1].date : null;

  if (!cacheIsFresh(latest)) {
    const bars = await historicalProvider.fetchDaily(sym);
    if (bars && bars.length) {
      const cachedDates = new Set(rows.map((r) => r.date));
      const toInsert = missingBars(bars, cachedDates);
      if (toInsert.length) {
        await upsertBars(pool, sym, toInsert, historicalProvider.name, historicalProvider.priceBasis);
      }
      rows = await readWindow();
    }
  }

  if (rows.length < 2) return null;
  const t = rows.map((r) => toUnixDay(r.date));
  const c = rows.map((r) => Number(r.close));
  const source = uniformOr(
    rows.map((r) => r.source),
    historicalProvider.name,
  );
  const priceBasis = uniformOr(
    rows.map((r) => r.price_basis as PriceBasis),
    historicalProvider.priceBasis,
  ) as PriceBasis;
  return { t, c, source, priceBasis };
}

async function upsertBars(
  pool: any,
  symbol: string,
  bars: DailyBar[],
  source: string,
  priceBasis: string,
): Promise<void> {
  if (!bars.length) return;
  const cols: any[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const b of bars) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    cols.push(symbol, b.date, b.open, b.high, b.low, b.close, source, priceBasis);
  }
  await pool.query(
    `INSERT INTO price_history_cache (symbol, date, open, high, low, close, source, price_basis)
       VALUES ${placeholders.join(", ")}
     ON CONFLICT (symbol, date) DO UPDATE SET
       open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low,
       close = EXCLUDED.close, source = EXCLUDED.source,
       price_basis = EXCLUDED.price_basis, fetched_at = NOW()`,
    cols,
  );
}

/**
 * Cached daily series for many symbols. Fetched SEQUENTIALLY so the provider
 * throttle is respected (cache hits are fast; only misses hit the network).
 * Returns symbol -> CachedSeries | null, preserving each symbol's real source/basis.
 */
export async function fetchHistoricalSeriesMany(
  symbols: string[],
  days = 180,
): Promise<Record<string, CachedSeries | null>> {
  const unique = Array.from(new Set(symbols.filter(Boolean).map((s) => s.toUpperCase())));
  const out: Record<string, CachedSeries | null> = {};
  for (const sym of unique) {
    out[sym] = await getCachedDailySeries(sym, days);
  }
  return out;
}
