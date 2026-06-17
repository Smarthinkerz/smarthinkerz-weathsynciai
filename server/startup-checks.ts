/**
 * server/startup-checks.ts
 *
 * Boot-time hardening: validate required environment variables (fail loudly on a
 * misconfigured deploy) and initialize error tracking. Secrets are NEVER printed
 * — only their presence/absence is logged.
 */
import * as Sentry from "@sentry/node";
import type { Express } from "express";

type EnvSpec = { key: string; why: string };

// Hard requirements: the app cannot run correctly without these.
const REQUIRED: EnvSpec[] = [
  { key: "DATABASE_URL", why: "PostgreSQL connection" },
  { key: "SESSION_SECRET", why: "signs login sessions" },
];

// Recommended: the app boots, but the named capability is disabled until set.
const RECOMMENDED: EnvSpec[] = [
  { key: "TAP_PAY_API_KEY", why: "verifies Tap payments before activating subscriptions" },
  { key: "BILLING_WEBHOOK_SECRET", why: "authenticates the billing webhook" },
  { key: "SENTRY_DSN", why: "error tracking" },
];

export function validateEnv() {
  for (const e of REQUIRED) {
    console.log(`[env] ${e.key}: ${process.env[e.key] ? "present" : "MISSING"}`);
  }
  for (const e of RECOMMENDED) {
    if (!process.env[e.key]) {
      console.warn(`[env] ${e.key}: absent — ${e.why} disabled until set`);
    } else {
      console.log(`[env] ${e.key}: present`);
    }
  }

  const missingRequired = REQUIRED.filter((e) => !process.env[e.key]);
  if (missingRequired.length > 0) {
    const list = missingRequired.map((e) => `${e.key} (${e.why})`).join(", ");
    throw new Error(`Missing required environment variables: ${list}. Refusing to start.`);
  }
}

let sentryReady = false;

export function initErrorTracking(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[observability] SENTRY_DSN absent — error tracking disabled");
    return false;
  }
  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0,
    });
    sentryReady = true;
    console.log("[observability] Sentry initialized");
    return true;
  } catch (e: any) {
    console.error("[observability] Sentry init failed:", e?.message);
    return false;
  }
}

export function captureError(err: unknown) {
  if (sentryReady) {
    try {
      Sentry.captureException(err);
    } catch {
      /* never let error reporting throw */
    }
  }
}

export function setupSentryErrorHandler(app: Express) {
  if (sentryReady) {
    Sentry.setupExpressErrorHandler(app);
  }
}
