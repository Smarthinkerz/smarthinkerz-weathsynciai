---
name: WealthSync finance-AI integrity
description: Which "scores" are real vs AI-generated, and the honesty rules for disclaimers/badges/verification in WealthSync.
---

# WealthSync finance-AI integrity layer

**Ground truth on numbers:** Nearly ALL displayed scores (risk, confidence, portfolio %, health, match, scenario probability, severity/10, GDP/inflation/market impacts) are GPT-4o free-text output, NOT deterministic computations. Only market-size sizing is genuinely computed. Treat any AI-produced number as an estimate and label it with `<AIEstimateBadge>` (from `client/src/components/integrity/disclaimers.tsx`). Reserve `<ComputedBadge>` for truly deterministic values.

**Why:** Presenting model guesses as computed analysis on a finance/BI product is a trust + liability problem. The spec's centerpiece is honest provenance.

**How to apply:** Any new screen that surfaces an AI number needs (1) `<FinancialDisclaimer>` before results on guidance/score screens, `<LegalDisclaimer>` on legal surfaces, and (2) `<AIEstimateBadge>` next to each AI number.

**Disclaimer components use i18next fallback defaults** (English text passed as the 2nd `t()` arg), so they render correctly in every locale without translation keys. Full per-locale translation is deferred, not required for them to work.

**Verification honesty rules:**
- Experience/work/certificate/project verification has NO real external check — these are set to `'pending'` (manual review), never auto-`'verified'` (`server/services/experience-verification.ts`).
- LinkedIn "verification" is only a URL-format check; UI says "URL validated · pending review", not "Verified".
- Apollo-backed lead verification IS genuinely real — keep it labeled verified.
- Company badge requests are honest already ("submitted for review").

**Other honesty fixes:** Landing footer must NOT claim "SOC 2 Compliant" (not certified) — use "Enterprise-Grade Security" describing real Helmet/rate-limit/CORS. Admin tier-override/suspend require a human-readable reason (prompted in UI, logged to audit metadata).

**RBAC is solid:** server-side `requireAdmin` (`server/routes/admin.ts`) + `companyAuthMiddleware` with companyId tenant-isolation checks. Don't rebuild it.

**Constraints:** `npx tsc --noEmit` times out (>30s, ~435 pre-existing non-blocking errors). Forbidden edits: vite.config.ts, package.json, drizzle.config.ts. Use installLanguagePackages, not npm.
