import { Router, Request, Response } from 'express';
import { storage } from '../storage';

export const analyticsRouter = Router();

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

analyticsRouter.get('/summary', companyAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const summary = await storage.getCompanyAnalyticsSummary(companyId);
    res.json(summary);
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

analyticsRouter.get('/events', companyAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const eventType = req.query.type as string | undefined;
    const events = await storage.getCompanyAnalytics(companyId, eventType);
    res.json(events);
  } catch (error) {
    console.error('Error getting analytics events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

analyticsRouter.get('/trend', companyAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const days = parseInt(req.query.days as string) || 30;
    const trend = await storage.getCompanyAnalyticsTrend(companyId, days);
    res.json(trend);
  } catch (error) {
    console.error('Error getting analytics trend:', error);
    res.status(500).json({ error: 'Failed to get trend data' });
  }
});

analyticsRouter.post('/track/:companyId', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

    const { eventType, metadata, visitorId } = req.body;
    if (!eventType) return res.status(400).json({ error: 'Event type is required' });

    await storage.createCompanyAnalytic({
      companyId,
      eventType,
      metadata: metadata || null,
      visitorId: visitorId || null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});
