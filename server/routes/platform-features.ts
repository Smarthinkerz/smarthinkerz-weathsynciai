import { Router } from 'express';
import { storage } from '../storage';
import { isHighTier, isPaidTier, normalizeTier } from '@shared/schema';
import { randomBytes, createHash } from 'crypto';
import { logAudit } from '../services/audit-log';
import OpenAI from 'openai';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() && !req.session?.company) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireUser(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "User authentication required" });
  }
  next();
}

function requireCompany(req: any, res: any, next: any) {
  if (!req.session?.company) {
    return res.status(401).json({ error: "Company authentication required" });
  }
  next();
}

function requireHighTier(req: any, res: any, next: any) {
  const raw = req.user?.subscriptionTier || req.session?.company?.subscriptionTier || 'free';
  const tier = normalizeTier(raw);
  if (!isHighTier(tier)) {
    return res.status(403).json({ error: "Elite or Enterprise subscription required" });
  }
  next();
}

function requirePaidTier(req: any, res: any, next: any) {
  const raw = req.user?.subscriptionTier || req.session?.company?.subscriptionTier || 'free';
  const tier = normalizeTier(raw);
  if (!isPaidTier(tier)) {
    return res.status(403).json({ error: "Paid subscription required" });
  }
  next();
}

// ===== ENDORSEMENTS =====
router.get('/endorsements', requireUser, async (req, res) => {
  try {
    const items = await storage.getUserEndorsements(req.user!.id);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/endorsements', requireUser, async (req, res) => {
  try {
    const result = await storage.createEndorsement({ ...req.body, endorserId: req.user!.id });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/endorsements/:id', requireUser, async (req, res) => {
  try {
    const endorsementsList = await storage.getUserEndorsements(req.user!.id);
    const owns = endorsementsList.some(e => e.id === parseInt(req.params.id) && e.endorserId === req.user!.id);
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    await storage.deleteEndorsement(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== PORTFOLIO ITEMS =====
router.get('/portfolio', requireUser, async (req, res) => {
  try {
    const items = await storage.getUserPortfolioItems(req.user!.id);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/portfolio', requireUser, async (req, res) => {
  try {
    const result = await storage.createPortfolioItem({ ...req.body, userId: req.user!.id });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/portfolio/:id', requireUser, async (req, res) => {
  try {
    const item = await storage.getPortfolioItem(parseInt(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ error: "Not found" });
    const result = await storage.updatePortfolioItem(parseInt(req.params.id), req.body);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/portfolio/:id', requireUser, async (req, res) => {
  try {
    const item = await storage.getPortfolioItem(parseInt(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ error: "Not found" });
    await storage.deletePortfolioItem(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CLIENT FEEDBACK =====
router.get('/client-feedback', requireUser, async (req, res) => {
  try {
    const items = await storage.getUserClientFeedback(req.user!.id);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/client-feedback', requireUser, async (req, res) => {
  try {
    const result = await storage.createClientFeedback({ ...req.body, userId: req.user!.id });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/client-feedback/:id', requireUser, async (req, res) => {
  try {
    const feedbackList = await storage.getUserClientFeedback(req.user!.id);
    const owns = feedbackList.some(f => f.id === parseInt(req.params.id));
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    await storage.deleteClientFeedback(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CONVERSATION HISTORY (Phase 4 - Smart Memory) =====
router.get('/conversation-history/:agentType', requireUser, async (req, res) => {
  try {
    const history = await storage.getConversationHistory(req.user!.id, req.params.agentType, parseInt(req.query.limit as string) || 20);
    res.json(history);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/conversation-history', requireUser, async (req, res) => {
  try {
    const result = await storage.addConversationMessage({ ...req.body, userId: req.user!.id });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/conversation-history/:agentType', requireUser, async (req, res) => {
  try {
    await storage.clearConversationHistory(req.user!.id, req.params.agentType);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== SMART AI CHAT WITH MEMORY (Phase 4) =====
router.post('/ai-chat-with-memory', requireUser, requirePaidTier, async (req, res) => {
  try {
    const { message, agentType = 'general' } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const history = await storage.getConversationHistory(req.user!.id, agentType, 10);
    const user = req.user!;

    const profile = await storage.getAdaptiveAiProfile(user.id);

    const systemPrompt = `You are a WealthSync AI assistant specializing in ${agentType} analysis. 
The user's name is ${user.fullName || user.username}. Their subscription tier is ${user.subscriptionTier}.
${profile ? `User preferences: risk tolerance is ${profile.riskPreference}, communication style is ${profile.communicationStyle}.` : ''}
${profile?.industryFocus?.length ? `Industry focus: ${profile.industryFocus.join(', ')}` : ''}
Provide detailed, actionable business intelligence insights.`;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    const reversedHistory = [...history].reverse();
    for (const h of reversedHistory) {
      messages.push({ role: h.role as any, content: h.content });
    }
    messages.push({ role: 'user', content: message });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1200,
    });

    const reply = completion.choices[0]?.message?.content || "Unable to generate response";

    await storage.addConversationMessage({ userId: user.id, agentType, role: 'user', content: message });
    await storage.addConversationMessage({ userId: user.id, agentType, role: 'assistant', content: reply });

    await storage.upsertAdaptiveAiProfile(user.id, {
      preferredAgents: profile?.preferredAgents || [agentType],
    });

    res.json({ reply, agentType, timestamp: new Date() });
  } catch (e: any) {
    console.error("AI chat with memory error:", e);
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

// ===== COMPLIANCE REPORTS (Phase 6) =====
router.get('/compliance-reports', requireCompany, requireHighTier, async (req, res) => {
  try {
    const reports = await storage.getCompanyComplianceReports(req.session.company!.id);
    res.json(reports);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/compliance-reports/:id', requireCompany, requireHighTier, async (req, res) => {
  try {
    const report = await storage.getComplianceReport(parseInt(req.params.id));
    if (!report || report.companyId !== req.session.company!.id) return res.status(404).json({ error: "Not found" });
    res.json(report);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/compliance-reports/generate', requireCompany, requireHighTier, async (req, res) => {
  try {
    const { reportType, title } = req.body;
    if (!reportType || !title) return res.status(400).json({ error: "Report type and title required" });

    const company = await storage.getCompany(req.session.company!.id);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a compliance and regulatory expert. Generate detailed compliance reports with findings, risk assessments, and recommendations. Return valid JSON.'
      }, {
        role: 'user',
        content: `Generate a ${reportType} compliance report titled "${title}" for company "${company?.name}" in the ${company?.industry || 'general'} industry. Include: summary, key findings (array of objects with title, description, severity, recommendation), overall risk level (low/medium/high/critical).
Return as JSON: { "summary": "...", "findings": [...], "riskLevel": "..." }`
      }],
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

    const report = await storage.createComplianceReport({
      companyId: req.session.company!.id,
      reportType,
      title,
      summary: aiResult.summary || 'Report generated',
      findings: aiResult.findings || [],
      riskLevel: aiResult.riskLevel || 'low',
      status: 'completed',
      generatedBy: 'ai'
    });

    res.json(report);
  } catch (e: any) {
    console.error("Compliance report generation error:", e);
    res.status(500).json({ error: "Failed to generate compliance report" });
  }
});

router.patch('/compliance-reports/:id', requireCompany, requireHighTier, async (req, res) => {
  try {
    const report = await storage.getComplianceReport(parseInt(req.params.id));
    if (!report || report.companyId !== req.session.company!.id) return res.status(404).json({ error: "Not found" });
    const result = await storage.updateComplianceReport(parseInt(req.params.id), req.body);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== STRATEGY BRIEFS (Phase 6) =====
router.get('/strategy-briefs', requireCompany, requireHighTier, async (req, res) => {
  try {
    const briefs = await storage.getCompanyStrategyBriefs(req.session.company!.id);
    res.json(briefs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/strategy-briefs/:id', requireCompany, requireHighTier, async (req, res) => {
  try {
    const brief = await storage.getStrategyBrief(parseInt(req.params.id));
    if (!brief || brief.companyId !== req.session.company!.id) return res.status(404).json({ error: "Not found" });
    res.json(brief);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/strategy-briefs/generate', requireCompany, requireHighTier, async (req, res) => {
  try {
    const { title, focus } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const company = await storage.getCompany(req.session.company!.id);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a top-tier business strategy consultant. Generate comprehensive strategy briefs. Return valid JSON.'
      }, {
        role: 'user',
        content: `Generate a strategy brief titled "${title}" for "${company?.name}" (${company?.industry || 'general'} industry). Focus area: ${focus || 'growth strategy'}.
Return JSON: { "executiveSummary": "...", "marketAnalysis": { "trends": [], "opportunities": [], "threats": [] }, "recommendations": [{ "title": "...", "description": "...", "priority": "high/medium/low", "timeline": "..." }], "riskAssessment": { "risks": [], "mitigations": [] }, "financialProjections": { "shortTerm": "...", "mediumTerm": "...", "longTerm": "..." }, "timeline": [{ "phase": "...", "duration": "...", "milestones": [] }] }`
      }],
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

    const brief = await storage.createStrategyBrief({
      companyId: req.session.company!.id,
      title,
      executiveSummary: aiResult.executiveSummary || 'Strategy brief generated',
      marketAnalysis: aiResult.marketAnalysis || {},
      recommendations: aiResult.recommendations || [],
      riskAssessment: aiResult.riskAssessment || {},
      financialProjections: aiResult.financialProjections || {},
      timeline: aiResult.timeline || [],
      status: 'completed'
    });

    res.json(brief);
  } catch (e: any) {
    console.error("Strategy brief generation error:", e);
    res.status(500).json({ error: "Failed to generate strategy brief" });
  }
});

// ===== FRAUD ALERTS (Phase 7) =====
router.get('/fraud-alerts', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;
    const alerts = await storage.getFraudAlerts(userId, companyId);
    res.json(alerts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/fraud-alerts/scan', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a fraud detection expert. Analyze business patterns and generate potential fraud alerts. Return valid JSON.'
      }, {
        role: 'user',
        content: `Analyze potential fraud indicators for a business intelligence platform user. Generate 2-3 realistic fraud alert scenarios that businesses should watch for. Return JSON: { "alerts": [{ "alertType": "...", "severity": "low/medium/high/critical", "title": "...", "description": "...", "indicators": ["..."] }] }`
      }],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{"alerts":[]}');
    const created = [];
    for (const alert of (aiResult.alerts || [])) {
      const result = await storage.createFraudAlert({
        userId, companyId,
        alertType: alert.alertType,
        severity: alert.severity || 'medium',
        title: alert.title,
        description: alert.description,
        indicators: alert.indicators || [],
        status: 'active'
      });
      created.push(result);
    }
    res.json(created);
  } catch (e: any) {
    console.error("Fraud scan error:", e);
    res.status(500).json({ error: "Fraud scan service temporarily unavailable" });
  }
});

router.patch('/fraud-alerts/:id', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;
    const alerts = await storage.getFraudAlerts(userId, companyId);
    const owns = alerts.some(a => a.id === parseInt(req.params.id));
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    const result = await storage.updateFraudAlert(parseInt(req.params.id), req.body);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== THREAT SIMULATIONS (Phase 7) =====
router.get('/threat-simulations', requireAuth, requireHighTier, async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;
    const sims = await storage.getThreatSimulations(userId, companyId);
    res.json(sims);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/threat-simulations', requireAuth, requireHighTier, async (req, res) => {
  try {
    const { scenarioName, scenarioType, parameters } = req.body;
    if (!scenarioName || !scenarioType) return res.status(400).json({ error: "Scenario name and type required" });

    const userId = req.user?.id;
    const companyId = req.session?.company?.id;

    const sim = await storage.createThreatSimulation({
      userId, companyId,
      scenarioName,
      scenarioType,
      parameters: parameters || {},
      status: 'running'
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a threat simulation expert. Run business threat scenarios and provide risk analysis. Return valid JSON.'
      }, {
        role: 'user',
        content: `Run a ${scenarioType} threat simulation called "${scenarioName}" with parameters: ${JSON.stringify(parameters || {})}.
Return JSON: { "results": { "impact": "...", "likelihood": "...", "affectedAreas": [], "cascadeEffects": [] }, "riskScore": 1-100, "recommendations": [{ "action": "...", "priority": "high/medium/low", "timeline": "..." }] }`
      }],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const updated = await storage.updateThreatSimulation(sim.id, {
      results: aiResult.results || {},
      riskScore: aiResult.riskScore || 50,
      recommendations: aiResult.recommendations || [],
      status: 'completed'
    });

    res.json(updated);
  } catch (e: any) {
    console.error("Threat simulation error:", e);
    res.status(500).json({ error: "Threat simulation service temporarily unavailable" });
  }
});

// ===== MARKETPLACE PLUGINS (Phase 8) =====
router.get('/plugins', requireAuth, async (req, res) => {
  try {
    const plugins = await storage.getAllPlugins();
    res.json(plugins);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/plugins/installed', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json([]);
    const installed = await storage.getUserInstalledPlugins(userId);
    res.json(installed);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/plugins/:id/install', requireAuth, async (req, res) => {
  try {
    const plugin = await storage.getPlugin(parseInt(req.params.id));
    if (!plugin) return res.status(404).json({ error: "Plugin not found" });

    const rawTier = req.user?.subscriptionTier || req.session?.company?.subscriptionTier || 'free';
    const tier = normalizeTier(rawTier);
    const requiredLevel = normalizeTier(plugin.requiredTier);
    const tierOrder = ['free', 'professional', 'elite', 'enterprise'];
    if (tierOrder.indexOf(tier) < tierOrder.indexOf(requiredLevel)) {
      return res.status(403).json({ error: `${plugin.requiredTier} subscription required for this plugin` });
    }

    const result = await storage.installPlugin({
      userId: req.user?.id,
      companyId: req.session?.company?.id,
      pluginId: plugin.id,
      config: req.body.config || {},
      isActive: true
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/plugins/installed/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      const installed = await storage.getUserInstalledPlugins(userId);
      const owns = installed.some(p => p.id === parseInt(req.params.id));
      if (!owns) return res.status(403).json({ error: "Not authorized" });
    }
    await storage.uninstallPlugin(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== COMMUNITY (Phase 9) =====
router.get('/community/posts', requireAuth, async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const posts = await storage.getCommunityPosts(category);
    res.json(posts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/community/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await storage.getCommunityPost(parseInt(req.params.id));
    if (!post) return res.status(404).json({ error: "Post not found" });
    const replies = await storage.getCommunityReplies(post.id);
    res.json({ ...post, replies });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/community/posts', requireUser, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) return res.status(400).json({ error: "Title, content, and category required" });
    const result = await storage.createCommunityPost({ userId: req.user!.id, title, content, category, tags: tags || [] });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/community/posts/:id/upvote', requireUser, async (req, res) => {
  try {
    await storage.upvoteCommunityPost(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/community/posts/:id', requireUser, async (req, res) => {
  try {
    const post = await storage.getCommunityPost(parseInt(req.params.id));
    if (!post || post.userId !== req.user!.id) return res.status(403).json({ error: "Not authorized" });
    await storage.deleteCommunityPost(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/community/posts/:id/replies', requireUser, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });
    const result = await storage.createCommunityReply({ postId: parseInt(req.params.id), userId: req.user!.id, content });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/community/replies/:id/upvote', requireUser, async (req, res) => {
  try {
    await storage.upvoteCommunityReply(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== API KEYS (Phase 9) =====
router.get('/api-keys', requireUser, requireHighTier, async (req, res) => {
  try {
    const keys = await storage.getUserApiKeys(req.user!.id);
    res.json(keys.map(k => ({ ...k, keyHash: undefined })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/api-keys', requireUser, requireHighTier, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ error: "Key name required" });

    const rawKey = `ws_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    const result = await storage.createApiKey({
      userId: req.user!.id,
      keyHash,
      keyPrefix,
      name,
      permissions: permissions || ['read'],
      rateLimit: 1000,
      isActive: true
    });

    logAudit(req, 'api_key.created', 'api_key', result.id, { name, permissions, keyPrefix }).catch(() => {});

    res.json({ ...result, rawKey, keyHash: undefined });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/api-keys/:id', requireUser, requireHighTier, async (req, res) => {
  try {
    const keys = await storage.getUserApiKeys(req.user!.id);
    const owns = keys.some(k => k.id === parseInt(req.params.id));
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    await storage.deleteApiKey(parseInt(req.params.id));
    logAudit(req, 'api_key.deleted', 'api_key', req.params.id, {}).catch(() => {});
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== AFFILIATE LINKS (Phase 9) =====
router.get('/affiliate-links', requireUser, requirePaidTier, async (req, res) => {
  try {
    const links = await storage.getUserAffiliateLinks(req.user!.id);
    res.json(links);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/affiliate-links', requireUser, requirePaidTier, async (req, res) => {
  try {
    const { campaignName } = req.body;
    if (!campaignName) return res.status(400).json({ error: "Campaign name required" });

    const code = `WS-${req.user!.username.toUpperCase().substring(0, 4)}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const result = await storage.createAffiliateLink({
      userId: req.user!.id,
      code,
      campaignName,
      commissionRate: 10,
      status: 'active'
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/affiliate/track/:code', async (req, res) => {
  try {
    await storage.trackAffiliateClick(req.params.code);
    res.redirect('/');
  } catch (e: any) { res.status(404).json({ error: "Invalid affiliate code" }); }
});

router.delete('/affiliate-links/:id', requireUser, requirePaidTier, async (req, res) => {
  try {
    const links = await storage.getUserAffiliateLinks(req.user!.id);
    const owns = links.some(l => l.id === parseInt(req.params.id));
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    await storage.deleteAffiliateLink(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== LEARNING TRACKS (Phase 9) =====
router.get('/learning-tracks', requireAuth, async (req, res) => {
  try {
    const tracks = await storage.getAllLearningTracks();
    res.json(tracks);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/learning-tracks/:id', requireAuth, async (req, res) => {
  try {
    const track = await storage.getLearningTrack(parseInt(req.params.id));
    if (!track) return res.status(404).json({ error: "Track not found" });
    let progress = null;
    if (req.user?.id) {
      progress = await storage.getLearningProgressForTrack(req.user.id, track.id);
    }
    res.json({ ...track, progress });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/learning-tracks/:id/enroll', requireUser, async (req, res) => {
  try {
    const track = await storage.getLearningTrack(parseInt(req.params.id));
    if (!track) return res.status(404).json({ error: "Track not found" });

    const tier = normalizeTier(req.user!.subscriptionTier || 'free');
    const requiredLevel = normalizeTier(track.requiredTier);
    const tierOrder = ['free', 'professional', 'elite', 'enterprise'];
    if (tierOrder.indexOf(tier) < tierOrder.indexOf(requiredLevel)) {
      return res.status(403).json({ error: `${track.requiredTier} subscription required` });
    }

    const existing = await storage.getLearningProgressForTrack(req.user!.id, track.id);
    if (existing) return res.json(existing);

    const result = await storage.createLearningProgress({
      userId: req.user!.id,
      trackId: track.id,
      currentModule: 0,
      completedModules: [],
      quizScores: {},
      progress: 0
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/learning/my-progress', requireUser, async (req, res) => {
  try {
    const progress = await storage.getUserLearningProgress(req.user!.id);
    res.json(progress);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/learning-progress/:id', requireUser, async (req, res) => {
  try {
    const allProgress = await storage.getUserLearningProgress(req.user!.id);
    const owns = allProgress.some(p => p.id === parseInt(req.params.id));
    if (!owns) return res.status(403).json({ error: "Not authorized" });
    const result = await storage.updateLearningProgress(parseInt(req.params.id), req.body);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== ADAPTIVE AI PROFILES (Phase 10) =====
router.get('/ai-profile', requireUser, async (req, res) => {
  try {
    const profile = await storage.getAdaptiveAiProfile(req.user!.id);
    res.json(profile || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/ai-profile', requireUser, async (req, res) => {
  try {
    const result = await storage.upsertAdaptiveAiProfile(req.user!.id, req.body);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== DATA EXPORT (Phase 6) =====
router.get('/export/:type', requireAuth, requirePaidTier, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id;
    const companyId = req.session?.company?.id;

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'opportunities':
        data = await storage.getOpportunities();
        filename = 'opportunities.csv';
        break;
      case 'bookmarks':
        if (userId) {
          data = await storage.getBookmarksByUser(userId);
          filename = 'bookmarks.csv';
        }
        break;
      case 'compliance':
        if (companyId) {
          data = await storage.getCompanyComplianceReports(companyId);
          filename = 'compliance-reports.csv';
        }
        break;
      case 'fraud-alerts':
        data = await storage.getFraudAlerts(userId, companyId);
        filename = 'fraud-alerts.csv';
        break;
      default:
        return res.status(400).json({ error: "Invalid export type" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "No data to export" });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      csvRows.push(headers.map(h => {
        const val = (row as any)[h];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export const platformFeaturesRouter = router;
