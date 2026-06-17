import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertChatbotPresetSchema, insertChatbotInteractionSchema, insertClientRequestSchema } from '@shared/schema';

export const chatbotRouter = Router();

const companyAuth = async (req: Request, res: Response, next: any) => {
  if (!req.session || !req.session.company) {
    return res.status(401).json({ error: 'Not authenticated as company' });
  }
  try {
    const company = await storage.getCompany(req.session.company.id);
    if (!company) return res.status(401).json({ error: 'Company not found' });
    (req as any).company = company;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

chatbotRouter.get('/presets', companyAuth, async (req: Request, res: Response) => {
  try {
    const presets = await storage.getChatbotPresets((req as any).company.id);
    res.json(presets);
  } catch (error) {
    console.error('Error getting presets:', error);
    res.status(500).json({ error: 'Failed to get presets' });
  }
});

chatbotRouter.post('/presets', companyAuth, async (req: Request, res: Response) => {
  try {
    const data = insertChatbotPresetSchema.parse({
      ...req.body,
      companyId: (req as any).company.id,
    });
    const preset = await storage.createChatbotPreset(data);
    res.status(201).json(preset);
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(400).json({ error: 'Invalid preset data' });
  }
});

chatbotRouter.patch('/presets/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    // Tenant isolation: only allow editing presets owned by this company.
    const owned = await storage.getChatbotPresets((req as any).company.id);
    if (!owned.some((p: any) => p.id === id)) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    const { companyId: _ignore, ...updates } = req.body || {};
    const updated = await storage.updateChatbotPreset(id, updates);
    res.json(updated);
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update preset' });
  }
});

chatbotRouter.delete('/presets/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    // Tenant isolation: only allow deleting presets owned by this company.
    const owned = await storage.getChatbotPresets((req as any).company.id);
    if (!owned.some((p: any) => p.id === id)) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    await storage.deleteChatbotPreset(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

chatbotRouter.get('/interactions', companyAuth, async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const interactions = await storage.getChatbotInteractions(company.id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await storage.getChatbotInteractionCount(company.id, monthStart);

    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    const limit = isPremium ? null : 50;

    res.json({
      interactions,
      usage: {
        current: monthlyCount,
        limit,
        remaining: limit ? Math.max(0, limit - monthlyCount) : null,
        isPremium,
      },
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({ error: 'Failed to get interactions' });
  }
});

chatbotRouter.post('/interact/:companyId', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

    const company = await storage.getCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await storage.getChatbotInteractionCount(companyId, monthStart);

    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || (company as any).isPremium;
    if (!isPremium && monthlyCount >= 50) {
      return res.status(429).json({
        error: 'Monthly chatbot interaction limit reached',
        limit: 50,
        current: monthlyCount,
      });
    }

    const { message, visitorName, visitorEmail } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const presets = await storage.getChatbotPresets(companyId);
    const activePresets = presets.filter((p) => p.isActive);

    let bestMatch: any = null;
    let bestScore = 0;
    const messageLower = message.toLowerCase();

    for (const preset of activePresets) {
      const questionLower = preset.question.toLowerCase();
      const questionWords = questionLower.split(/\s+/);
      const messageWords = messageLower.split(/\s+/);
      let matchCount = 0;
      for (const qWord of questionWords) {
        if (qWord.length > 2 && messageWords.some((mWord: string) => mWord.includes(qWord) || qWord.includes(mWord))) {
          matchCount++;
        }
      }
      const score = questionWords.length > 0 ? matchCount / questionWords.length : 0;
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = preset;
      }
    }

    let responseText: string;
    let matchedPresetId: number | undefined;

    if (bestMatch) {
      responseText = bestMatch.answer;
      matchedPresetId = bestMatch.id;
    } else {
      responseText = `Thank you for reaching out to ${company.name}! We've received your message and our team will get back to you shortly. For immediate assistance, you can contact us at ${company.primaryContactEmail}.`;
    }

    const interaction = await storage.createChatbotInteraction({
      companyId,
      visitorName: visitorName || null,
      visitorEmail: visitorEmail || null,
      message,
      response: responseText,
      matchedPresetId: matchedPresetId || null,
      satisfaction: null,
    });

    await storage.createCompanyAnalytic({
      companyId,
      eventType: 'chatbot_interaction',
      metadata: { visitorName, matchedPreset: !!bestMatch },
      visitorId: visitorEmail || null,
    });

    res.json({
      response: responseText,
      interactionId: interaction.id,
      matched: !!bestMatch,
    });
  } catch (error) {
    console.error('Error in chatbot interaction:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

chatbotRouter.get('/usage', companyAuth, async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await storage.getChatbotInteractionCount(company.id, monthStart);
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    
    res.json({
      current: monthlyCount,
      limit: isPremium ? null : 50,
      remaining: isPremium ? null : Math.max(0, 50 - monthlyCount),
      isPremium,
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});
