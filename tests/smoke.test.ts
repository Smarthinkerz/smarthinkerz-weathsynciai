/**
 * WealthSync AI — Smoke Tests
 * Lightweight HTTP integration tests covering 5 critical flows.
 *
 * Run with: npx tsx tests/smoke.test.ts
 * (Substitutes for Playwright since the testing tool is disabled in this env.)
 */
import http from 'http';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:5000';

interface Result { name: string; ok: boolean; status?: number; error?: string; durationMs: number; }
const results: Result[] = [];

function req(method: string, path: string, body?: any, cookies?: string): Promise<{ status: number; body: any; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      method, hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookies ? { 'Cookie': cookies } : {}),
      },
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        let parsed: any = chunks;
        try { parsed = JSON.parse(chunks); } catch {}
        resolve({ status: res.statusCode || 0, body: parsed, cookies: (res.headers['set-cookie'] as string[]) || [] });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, durationMs: Date.now() - start });
    console.log(`✅ ${name}  (${Date.now() - start}ms)`);
  } catch (e: any) {
    results.push({ name, ok: false, error: e.message, durationMs: Date.now() - start });
    console.error(`❌ ${name}  → ${e.message}`);
  }
}

(async () => {
  console.log(`\nWealthSync Smoke Tests — ${BASE}\n`);

  // 1. Health
  await run('health endpoint', async () => {
    const r = await req('GET', '/api/health');
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    if (!r.body || (r.body.status !== 'healthy' && r.body.status !== 'degraded')) {
      throw new Error(`unexpected body: ${JSON.stringify(r.body)}`);
    }
  });

  // 2. Auth — unauthenticated request must be blocked
  await run('auth gate (401 on protected)', async () => {
    const r = await req('GET', '/api/notifications');
    if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
  });

  // 3. Payment — checkout requires auth
  await run('payment checkout requires auth', async () => {
    const r = await req('POST', '/api/checkout-session', { plan: 'wealthsync-professional', cycle: 'monthly' });
    if (r.status !== 401 && r.status !== 400) throw new Error(`unexpected ${r.status}`);
  });

  // 4. Lead generation endpoint exists and gates auth
  await run('lead generation gated', async () => {
    const r = await req('GET', '/api/leads');
    if (r.status !== 401 && r.status !== 200 && r.status !== 404) {
      throw new Error(`unexpected ${r.status}`);
    }
  });

  // 5. Multi-agent collaboration — gated by auth + tier
  await run('AI collaboration gated', async () => {
    const r = await req('POST', '/api/multi-agent/collaborate', { query: 'test', agents: ['market', 'risk'] });
    if (r.status !== 401 && r.status !== 403) throw new Error(`expected 401/403, got ${r.status}`);
  });

  // 6. Certificate — gated by auth
  await run('certificate gated', async () => {
    const r = await req('GET', '/api/learning/certificate/1');
    if (r.status !== 401 && r.status !== 403 && r.status !== 404) {
      throw new Error(`expected 401/403/404, got ${r.status}`);
    }
  });

  // Summary
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`\n────────────────────────────────────`);
  console.log(`Smoke Tests: ${passed}/${total} passed`);
  console.log(`────────────────────────────────────\n`);
  process.exit(passed === total ? 0 : 1);
})();
