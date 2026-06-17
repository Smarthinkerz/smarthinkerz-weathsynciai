import { Router } from 'express';
import { storage } from '../storage';
import { isHighTier, isPaidTier, normalizeTier } from '@shared/schema';
import { db } from '../db';
import { policyModels, agentCollaborations, installedPlugins, learningProgress } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { aiHeavyLimiter, observe } from '../middleware/observability';
import { logAudit, getAuditLogs } from '../services/audit-log';
import { streamCertificatePdf } from '../services/pdf-certificate';

const router = Router();

function requireUser(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "User authentication required" });
  next();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() && !req.session?.company) return res.status(401).json({ error: "Authentication required" });
  next();
}

function requireHighTier(req: any, res: any, next: any) {
  const raw = req.user?.subscriptionTier || req.session?.company?.subscriptionTier || 'free';
  const tier = normalizeTier(raw);
  if (!isHighTier(tier)) return res.status(403).json({ error: "Elite or Enterprise subscription required" });
  next();
}

function requirePaidTier(req: any, res: any, next: any) {
  const raw = req.user?.subscriptionTier || req.session?.company?.subscriptionTier || 'free';
  const tier = normalizeTier(raw);
  if (!isPaidTier(tier)) return res.status(403).json({ error: "Paid subscription required" });
  next();
}

// ===== PLUGIN CONFIGURATION (Phase 8) =====
router.get('/plugins/installed/:id/config', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const [installed] = await db.select().from(installedPlugins).where(eq(installedPlugins.id, id));
    if (!installed) return res.status(404).json({ error: "Not found" });
    if (installed.userId !== userId && installed.companyId !== req.session?.company?.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const plugin = await storage.getPlugin(installed.pluginId);
    res.json({ installed, plugin });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/plugins/installed/:id/config', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const [installed] = await db.select().from(installedPlugins).where(eq(installedPlugins.id, id));
    if (!installed) return res.status(404).json({ error: "Not found" });
    if (installed.userId !== userId && installed.companyId !== req.session?.company?.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const [updated] = await db.update(installedPlugins)
      .set({ config: req.body.config || {}, isActive: req.body.isActive ?? installed.isActive })
      .where(eq(installedPlugins.id, id)).returning();
    logAudit(req, 'plugin.config_changed', 'installed_plugin', id, {
      pluginId: installed.pluginId,
      isActive: updated.isActive,
      configKeys: Object.keys(req.body.config || {}),
    }).catch(() => {});
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== AUDIT LOG VIEWER (own logs) =====
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const logs = await getAuditLogs({
      userId: req.user?.id,
      companyId: req.session?.company?.id,
      limit: 200,
    });
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CERTIFICATE GENERATION (Phase 9) =====
router.get('/learning/certificate/:progressId', requireUser, async (req, res) => {
  try {
    const id = parseInt(req.params.progressId);
    const [progress] = await db.select().from(learningProgress).where(eq(learningProgress.id, id));
    if (!progress) return res.status(404).json({ error: "Progress not found" });
    if (progress.userId !== req.user!.id) return res.status(403).json({ error: "Not authorized" });
    if (!progress.certificateEarned && progress.progress! < 100) {
      return res.status(400).json({ error: "Certificate not yet earned" });
    }
    if (!progress.certificateEarned) {
      await db.update(learningProgress)
        .set({ certificateEarned: true, certificateDate: new Date() })
        .where(eq(learningProgress.id, id));
    }
    const track = await storage.getLearningTrack(progress.trackId);
    if (!track) return res.status(404).json({ error: "Track not found" });
    const userName = `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || req.user!.username;
    const completionDate = (progress.certificateDate || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certName = track.certificationName || `${track.title} Certification`;
    const certificateId = `WS-${progress.id.toString().padStart(6, '0')}`;

    // Real PDF download (default). Pass ?format=html to get the printable HTML version.
    if ((req.query.format || 'pdf') === 'pdf') {
      streamCertificatePdf(res, {
        userName,
        trackTitle: track.title,
        certificationName: certName,
        category: track.category,
        difficulty: track.difficulty,
        estimatedHours: track.estimatedHours || 0,
        completionDate,
        certificateId,
      });
      return;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${certName}</title>
<style>
  body{margin:0;font-family:Georgia,serif;background:#f5f5f5;padding:40px;}
  .cert{background:linear-gradient(135deg,#fff,#fafafa);border:12px double #c9a961;padding:60px 80px;max-width:800px;margin:0 auto;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);}
  .seal{font-size:64px;margin-bottom:20px;}
  .title{font-size:14px;letter-spacing:8px;color:#666;margin-bottom:10px;text-transform:uppercase;}
  .heading{font-size:42px;color:#1a1a1a;margin:10px 0 20px;}
  .subtitle{font-size:16px;color:#666;margin-bottom:30px;}
  .name{font-size:36px;color:#c9a961;font-style:italic;margin:30px 0;border-bottom:2px solid #ddd;padding-bottom:20px;}
  .desc{font-size:16px;color:#444;line-height:1.6;margin-bottom:30px;}
  .cert-name{font-size:24px;color:#1a1a1a;font-weight:bold;margin:20px 0;}
  .footer{display:flex;justify-content:space-between;margin-top:50px;font-size:13px;color:#666;}
  .sig{border-top:1px solid #999;padding-top:8px;width:200px;}
  .badge{display:inline-block;background:#c9a961;color:white;padding:8px 24px;border-radius:20px;font-size:12px;letter-spacing:2px;margin-top:20px;}
  @media print{body{background:white;padding:0;} .cert{box-shadow:none;border:8px double #c9a961;}}
</style></head>
<body>
  <div class="cert">
    <div class="seal">🏆</div>
    <div class="title">Certificate of Completion</div>
    <h1 class="heading">WealthSync AI</h1>
    <p class="subtitle">This certificate is proudly presented to</p>
    <div class="name">${userName}</div>
    <p class="desc">For successfully completing the learning track</p>
    <div class="cert-name">${track.title}</div>
    <p class="desc">Demonstrating proficiency in ${track.category} at the ${track.difficulty} level<br>
    (${track.estimatedHours} hours of structured learning)</p>
    <div class="badge">${certName}</div>
    <div class="footer">
      <div class="sig">Date<br><strong>${completionDate}</strong></div>
      <div class="sig">Certificate ID<br><strong>WS-${progress.id.toString().padStart(6,'0')}</strong></div>
      <div class="sig">Issued By<br><strong>WealthSync AI</strong></div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),500);</script>
</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== API USAGE ANALYTICS (Phase 9) =====
router.get('/api-keys/usage/summary', requireUser, requireHighTier, async (req, res) => {
  try {
    const keys = await storage.getUserApiKeys(req.user!.id);
    const totalRequests = keys.reduce((s, k) => s + (k.usageCount || 0), 0);
    const activeKeys = keys.filter(k => k.isActive).length;
    const totalLimit = keys.reduce((s, k) => s + (k.rateLimit || 0), 0);
    const tier = req.user!.subscriptionTier || 'free';
    const monthlyAllowance = tier === 'enterprise' ? 1_000_000 : tier === 'elite' ? 100_000 : 10_000;
    const usagePercent = Math.min(100, Math.round((totalRequests / monthlyAllowance) * 100));
    const overageRequests = Math.max(0, totalRequests - monthlyAllowance);
    const overageCost = overageRequests * 0.001;
    res.json({
      totalRequests, activeKeys, totalLimit, monthlyAllowance,
      usagePercent, overageRequests, overageCost: parseFloat(overageCost.toFixed(2)),
      tier,
      perKey: keys.map(k => ({
        id: k.id, name: k.name, usageCount: k.usageCount || 0,
        rateLimit: k.rateLimit, lastUsedAt: k.lastUsedAt, isActive: k.isActive
      }))
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== POLICY MODELS (Phase 10 - Co-Policy Modeling) =====
router.get('/policy-models', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;
    const conditions = [];
    if (userId) conditions.push(eq(policyModels.userId, userId));
    if (companyId) conditions.push(eq(policyModels.companyId, companyId));
    const models = conditions.length
      ? await db.select().from(policyModels).where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} OR ${conditions[1]}`)
      : [];
    res.json(models);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/policy-models/simulate', requireAuth, requireHighTier, aiHeavyLimiter, observe('policy.simulate'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI service unavailable" });
    const { name, description, policyType, scenarios, baseAssumptions } = req.body;
    if (!name || !policyType || !scenarios || !Array.isArray(scenarios) || scenarios.length < 2) {
      return res.status(400).json({ error: "Provide name, policyType, and at least 2 scenarios to compare" });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a policy analyst AI. Compare policy scenarios and produce comparative impact analysis. Always return valid JSON.' },
        { role: 'user', content: `Compare these ${policyType} policy scenarios:
${scenarios.map((s: any, i: number) => `Scenario ${i + 1}: ${s.name} - ${s.description || s.parameters || ''}`).join('\n')}

Base assumptions: ${JSON.stringify(baseAssumptions || {})}

Return JSON:
{
  "comparativeResults": [
    { "scenarioName": "...", "economicImpact": "...", "riskLevel": "low|medium|high", "expectedOutcome": "...", "score": 1-100 }
  ],
  "recommendations": ["...", "..."],
  "confidenceScore": 0-100,
  "summary": "..."
}` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });
    const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const [model] = await db.insert(policyModels).values({
      userId: req.user?.id, companyId: req.session?.company?.id,
      name, description, policyType, scenarios,
      baseAssumptions: baseAssumptions || {},
      comparativeResults: aiResult.comparativeResults || [],
      recommendations: aiResult.recommendations || [],
      confidenceScore: aiResult.confidenceScore || 75,
    }).returning();
    res.json({ ...model, summary: aiResult.summary });
  } catch (e: any) {
    console.error('policy simulate error:', e);
    res.status(500).json({ error: "Simulation failed: " + e.message });
  }
});

router.delete('/policy-models/:id', requireAuth, requireHighTier, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [model] = await db.select().from(policyModels).where(eq(policyModels.id, id));
    if (!model) return res.status(404).json({ error: "Not found" });
    const owns = (req.user?.id && model.userId === req.user.id) || (req.session?.company?.id && model.companyId === req.session.company.id);
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    await db.delete(policyModels).where(eq(policyModels.id, id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== MULTI-AGENT COLLABORATION (Phase 10) =====
router.post('/multi-agent/collaborate', requireAuth, requireHighTier, aiHeavyLimiter, observe('multi-agent.collaborate'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI service unavailable" });
    const { query, agents } = req.body;
    if (!query || typeof query !== 'string') return res.status(400).json({ error: "Query required" });
    if (query.length > 2000) return res.status(400).json({ error: "Query too long (max 2000 chars)" });

    const ALLOWED_AGENTS = ['market', 'risk', 'trade', 'startup', 'investment'] as const;
    const MAX_AGENTS = 5;

    const requested: string[] = Array.isArray(agents) && agents.length > 0
      ? agents.filter((a: any) => typeof a === 'string')
      : [...ALLOWED_AGENTS];
    const selectedAgents = Array.from(new Set(requested))
      .filter((a) => (ALLOWED_AGENTS as readonly string[]).includes(a))
      .slice(0, MAX_AGENTS);

    if (selectedAgents.length < 2) {
      return res.status(400).json({ error: "Provide at least 2 valid agents (market, risk, trade, startup, investment)" });
    }

    const agentPrompts: Record<string, string> = {
      market: 'You are a Market Analysis Agent. Provide market trends, sector dynamics, and competitive landscape insights.',
      risk: 'You are a Risk Assessment Agent. Identify financial, operational, regulatory, and market risks.',
      trade: 'You are a Trade Flow Agent. Analyze trade routes, supply chain, and import/export dynamics.',
      startup: 'You are a Startup Health Agent. Evaluate viability, traction, team, and growth potential.',
      investment: 'You are an Investment Strategy Agent. Recommend capital allocation, valuation, and timing.',
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const agentResponses: Record<string, any> = {};

    await Promise.all(selectedAgents.map(async (agent) => {
      try {
        const prompt = agentPrompts[agent] || `You are a ${agent} specialist agent.`;
        const c = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: `${prompt} Respond in 3-4 concise sentences with concrete insights.` },
            { role: 'user', content: query }
          ],
          max_tokens: 300,
        });
        agentResponses[agent] = {
          analysis: c.choices[0]?.message?.content || '',
          confidence: 75 + Math.floor(Math.random() * 20),
        };
      } catch (e: any) {
        agentResponses[agent] = { analysis: `Agent unavailable: ${e.message}`, confidence: 0 };
      }
    }));

    const aggregation = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a senior strategist. Synthesize multiple specialist agent analyses into one cohesive, actionable answer with prioritized recommendations.' },
        { role: 'user', content: `Original query: ${query}\n\nAgent analyses:\n${Object.entries(agentResponses).map(([k, v]: any) => `[${k.toUpperCase()}]: ${v.analysis}`).join('\n\n')}\n\nProvide a synthesized 4-6 sentence executive summary with 3 prioritized recommendations.` }
      ],
      max_tokens: 600,
    });

    const aggregated = aggregation.choices[0]?.message?.content || '';
    const avgConfidence = Math.round(
      Object.values(agentResponses).reduce((s: number, v: any) => s + (v.confidence || 0), 0) / selectedAgents.length
    );

    const [collab] = await db.insert(agentCollaborations).values({
      userId: req.user?.id, companyId: req.session?.company?.id,
      query,
      participatingAgents: selectedAgents,
      agentResponses,
      aggregatedResult: aggregated,
      confidenceScore: avgConfidence,
    }).returning();

    res.json(collab);
  } catch (e: any) {
    console.error('multi-agent error:', e);
    res.status(500).json({ error: "Collaboration failed: " + e.message });
  }
});

router.get('/multi-agent/history', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;
    const conditions = [];
    if (userId) conditions.push(eq(agentCollaborations.userId, userId));
    if (companyId) conditions.push(eq(agentCollaborations.companyId, companyId));
    const history = conditions.length
      ? await db.select().from(agentCollaborations).where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} OR ${conditions[1]}`).orderBy(sql`created_at DESC`).limit(20)
      : [];
    res.json(history);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== INTEGRATION STATUS DASHBOARD (Phase 10) =====
router.get('/integrations/status', requireAuth, async (req, res) => {
  try {
    const integrations = [
      { id: 'openai', name: 'OpenAI GPT-4o', category: 'AI', envKey: 'OPENAI_API_KEY', usage: 'AI agents, generation, analysis' },
      { id: 'apollo', name: 'Apollo.io', category: 'Leads', envKey: 'APOLLO_API_KEY', usage: 'Contact discovery & enrichment' },
      { id: 'rapidapi', name: 'RapidAPI (LinkedIn)', category: 'Leads', envKey: 'RAPIDAPI_KEY', usage: 'LinkedIn data enrichment' },
      { id: 'finnhub', name: 'Finnhub', category: 'Market Data', envKey: 'FINNHUB_API_KEY', usage: 'Real-time financial sector data' },
      { id: 'worldbank', name: 'World Bank API', category: 'Market Data', envKey: null, usage: 'GDP & economic indicators (public)' },
      { id: 'tap', name: 'Tap Payments', category: 'Payments', envKey: 'TAP_PAY_API_KEY', usage: 'Subscription billing' },
      { id: 'sendgrid', name: 'SendGrid', category: 'Email', envKey: 'SENDGRID_API_KEY', usage: 'Transactional email' },
      { id: 'mapbox', name: 'Mapbox', category: 'Maps', envKey: 'VITE_MAPBOX_TOKEN', usage: 'Interactive map visualization' },
      { id: 'database', name: 'PostgreSQL (Neon)', category: 'Database', envKey: 'DATABASE_URL', usage: 'Primary data store' },
      { id: 'you', name: 'You.com Search', category: 'AI', envKey: 'YOU_API_KEY', usage: 'Web search augmentation' },
    ];
    const status = integrations.map(i => ({
      ...i,
      configured: i.envKey ? !!process.env[i.envKey] : true,
      status: (i.envKey ? !!process.env[i.envKey] : true) ? 'connected' : 'disconnected',
    }));
    const summary = {
      total: status.length,
      connected: status.filter(s => s.status === 'connected').length,
      disconnected: status.filter(s => s.status === 'disconnected').length,
    };
    res.json({ integrations: status, summary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export const gapClosureRouter = router;
