/**
 * server/engine/data-sources.ts
 *
 * Real-data adapters for the computation engine. These perform network I/O
 * against AUTHORITATIVE sources only:
 *   - Finnhub   : live equity/ETF quotes and daily candles
 *   - World Bank: macro series (GDP, inflation, ...)
 *   - ExchangeRate: live FX rates
 *
 * IMPORTANT (the "One Rule"): this module — and the whole server/engine
 * directory — must contain ZERO LLM/OpenAI calls. Numbers come from data
 * feeds, never from a model. Missing data => explicit null, never a guess.
 */

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const WORLD_BANK_BASE = "https://api.worldbank.org/v2";
const EXCHANGE_RATE_BASE = "https://api.exchangerate-api.com/v4/latest";

function finnhubKey(): string | null {
  return process.env.FINNHUB_API_KEY || null;
}

async function getJson(url: string, timeoutMs = 8000): Promise<any | null> {
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

/** Live quote price (USD) for a symbol from Finnhub. null if unavailable. */
export async function fetchQuote(symbol: string): Promise<number | null> {
  const key = finnhubKey();
  if (!key || !symbol) return null;
  const data = await getJson(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
  // Finnhub /quote: c = current price. 0 means unknown/closed-with-no-data.
  const c = data?.c;
  if (typeof c !== "number" || !Number.isFinite(c) || c <= 0) return null;
  return c;
}

/** Live quotes for many symbols. Returns a map symbol -> price|null. */
export async function fetchQuotes(symbols: string[]): Promise<Record<string, number | null>> {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (s) => [s, await fetchQuote(s)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Daily closing prices for a symbol over the last `days` calendar days, from
 * Finnhub candles (resolution D). Returns ascending closes, or null when the
 * feed is unavailable (the candle endpoint is premium on some Finnhub plans).
 */
export async function fetchDailyCloses(symbol: string, days = 180): Promise<number[] | null> {
  const key = finnhubKey();
  if (!key || !symbol) return null;
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;
  const data = await getJson(
    `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${key}`,
  );
  if (!data || data.s !== "ok" || !Array.isArray(data.c) || data.c.length < 2) return null;
  const closes = data.c.filter((x: any) => typeof x === "number" && Number.isFinite(x) && x > 0);
  return closes.length >= 2 ? closes : null;
}

export async function fetchDailyClosesMany(
  symbols: string[],
  days = 180,
): Promise<Record<string, number[] | null>> {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (s) => [s, await fetchDailyCloses(s, days)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Daily closes WITH their timestamps (unix seconds), so multiple symbols can be
 * date-aligned before computing cross-asset stats. Returns { t, c } or null.
 */
export async function fetchDailySeries(
  symbol: string,
  days = 180,
): Promise<{ t: number[]; c: number[] } | null> {
  const key = finnhubKey();
  if (!key || !symbol) return null;
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;
  const data = await getJson(
    `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${key}`,
  );
  if (!data || data.s !== "ok" || !Array.isArray(data.c) || !Array.isArray(data.t)) return null;
  if (data.c.length !== data.t.length || data.c.length < 2) return null;
  return { t: data.t, c: data.c };
}

export async function fetchDailySeriesMany(
  symbols: string[],
  days = 180,
): Promise<Record<string, { t: number[]; c: number[] } | null>> {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (s) => [s, await fetchDailySeries(s, days)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Latest value of a World Bank indicator for a country.
 * Returns { value, year } or null. e.g. indicator "NY.GDP.MKTP.CD".
 */
export async function fetchWorldBankLatest(
  countryCode: string,
  indicator: string,
): Promise<{ value: number; year: string } | null> {
  const data = await getJson(
    `${WORLD_BANK_BASE}/country/${encodeURIComponent(countryCode)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=12`,
  );
  // World Bank shape: [meta, [ {date, value}, ... ]]
  const rows = Array.isArray(data) ? data[1] : null;
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    if (row && typeof row.value === "number" && Number.isFinite(row.value)) {
      return { value: row.value, year: String(row.date) };
    }
  }
  return null;
}

/** Live FX rate base->quote from ExchangeRate API. null if unavailable. */
export async function fetchFxRate(base: string, quote: string): Promise<number | null> {
  if (!base || !quote) return null;
  const data = await getJson(`${EXCHANGE_RATE_BASE}/${encodeURIComponent(base.toUpperCase())}`);
  const rate = data?.rates?.[quote.toUpperCase()];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}
