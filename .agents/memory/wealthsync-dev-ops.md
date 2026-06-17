---
name: WealthSync dev/ops gotchas
description: Non-obvious operational facts for the WealthSync repl — dev server reload behavior, tenant-isolation model, secret-exposure pitfalls.
---

# Dev server does NOT hot-reload server code
The "Start application" workflow runs `tsx server/index.ts` (NOT `tsx watch`). Vite HMR
only reloads the **client**. Any change under `server/` requires a **workflow restart**
to take effect.
**Why:** verifying a server-side fix with curl/smoke after editing — but before restarting —
silently tests the OLD code and gives false confidence (got burned by exactly this).
**How to apply:** after editing anything in `server/`, restart the workflow before
curling endpoints or trusting smoke results.

# business_locations has no first-class owner column
Ownership of a map pin is only inferable as `type === "company" && entityId === company.id`.
Opportunity/funding pins have no company owner. The POST create route historically trusted
client-supplied `type`/`entityId`, so tenant-isolation must be enforced in the route:
- POST: when `type === "company"`, force `entityId = session.company.id` (don't trust client).
- PUT: gate on ownership AND strip `id/type/entityId/createdAt` from the update body so an
  owner can't reassign a pin's identity/ownership.
- DELETE: same ownership gate.
**Why:** premium-gated ≠ owner-gated; any premium tenant could otherwise edit/impersonate
another tenant's pins.
**How to apply:** treat any business-map write as needing an explicit owner check, not just
the premium check.

# Secrets must never be returned to the browser
`GET /api/business-map/api-config` used to return the raw `ALPHA_VANTAGE_API_KEY` to clients
(the old design had the browser call Alpha Vantage directly). Return only a capability flag
(`!!process.env.X`), never the key. If browser-side Alpha Vantage is ever re-enabled, proxy
the call server-side instead of shipping the key.

# Cross-cutting feature flags live in shared/feature-flags.ts
Flags consumed by BOTH client and server (e.g. RISK_ANALYTICS_LIVE) belong in
`shared/feature-flags.ts` (imported via the `@shared` alias) so the two can't drift —
the risk-analytics panel state is server-driven while pricing copy is client-driven, and
both must agree. A plain exported const (flip false→true in one place) is the chosen
mechanism, NOT two env vars.
**Why:** a server flag + a separate VITE_ client flag would silently desync (panel says
"coming soon" while pricing advertises it as delivered, or vice-versa).
**How to apply:** when a flag must be truthful on both the API and the marketing/pricing
surface, put it in shared and import it on both sides; don't duplicate it per side.

# RISK_ANALYTICS_LIVE gating shape (don't regress)
While false: `/api/portfolio/metrics` returns `risk.status = "coming_soon"` for EVERY tier
(supersedes the premium gate), and pricing lists risk analytics as "Coming soon". The
coming-soon branch sits IN FRONT of the premium/insufficient-data branches, and the heavy
compute block is additionally guarded by the flag. Flipping the const to true restores the
pre-existing premium-gated computed behavior unchanged — verify that path if you touch this.

# Make flag-gated route logic injectable to actually TEST the flag-ON path
The risk-analytics decision lives in `server/routes/risk-state.ts` (`resolveRiskState`),
extracted from the metrics route so the flag, the paid check, the provider-configured
check, AND the historical-price fetcher are all PARAMETERS. The route passes
`RISK_ANALYTICS_LIVE` + the real fetcher in; tests pass `riskLive:true/false` + a stub
fetcher to prove every branch without the committed const or the network.
**Why:** "it's the same code path so it must work" is not proof; a flag committed false is
never exercised live unless the logic is injectable. Standalone tsx tests (no vitest) can
then drive all flag/tier/data combos.
**How to apply:** when you gate behavior behind a committed-false flag, don't read the const
deep inside the handler — thread it (and any I/O) through a pure resolver so a test can flip it.
