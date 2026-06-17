/**
 * server/engine/macro.ts
 *
 * PURE provenance wrappers for macro figures. Macro values (GDP, inflation,
 * unemployment, FX) are reported AS FETCHED from the authoritative source — we
 * do not transform or "predict" them. These helpers attach the source + series
 * id so the value is auditable, and normalize the insufficient-data shape.
 *
 * No I/O, no LLM here. The data layer fetches; these wrap the result.
 */

export interface MacroFigure {
  status: "ok" | "insufficient_data";
  indicator: string; // human label, e.g. "GDP (current US$)"
  value: number | null;
  unit?: string; // e.g. "USD", "% annual"
  source: string; // e.g. "World Bank"
  seriesId?: string; // e.g. "NY.GDP.MKTP.CD"
  asOf?: string; // e.g. "2023"
  reason?: string;
}

export function macroFigure(args: {
  indicator: string;
  value: number | null | undefined;
  unit?: string;
  source: string;
  seriesId?: string;
  asOf?: string;
}): MacroFigure {
  const { indicator, value, unit, source, seriesId, asOf } = args;
  if (value == null || !Number.isFinite(value)) {
    return { status: "insufficient_data", indicator, value: null, unit, source, seriesId, asOf, reason: "no_data" };
  }
  return { status: "ok", indicator, value, unit, source, seriesId, asOf };
}

export interface FxRate {
  status: "ok" | "insufficient_data";
  base: string;
  quote: string;
  rate: number | null;
  source: string;
  asOf?: string;
  reason?: string;
}

export function fxRate(args: {
  base: string;
  quote: string;
  rate: number | null | undefined;
  source: string;
  asOf?: string;
}): FxRate {
  const { base, quote, rate, source, asOf } = args;
  if (rate == null || !Number.isFinite(rate) || rate <= 0) {
    return { status: "insufficient_data", base, quote, rate: null, source, asOf, reason: "no_data" };
  }
  return { status: "ok", base, quote, rate, source, asOf };
}
