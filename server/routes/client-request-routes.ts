import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertClientRequestSchema } from '@shared/schema';

export const clientRequestRouter = Router();

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

clientRequestRouter.get('/', companyAuth, async (req: Request, res: Response) => {
  try {
    const requests = await storage.getClientRequests((req as any).company.id);
    res.json(requests);
  } catch (error) {
    console.error('Error getting client requests:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

clientRequestRouter.get('/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const request = await storage.getClientRequest(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error getting client request:', error);
    res.status(500).json({ error: 'Failed to get request' });
  }
});

clientRequestRouter.patch('/:id/respond', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const request = await storage.getClientRequest(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { response, status } = req.body;
    if (!response) return res.status(400).json({ error: 'Response is required' });

    const updated = await storage.updateClientRequest(id, {
      companyResponse: response,
      status: status || 'responded',
      respondedAt: new Date(),
    });
    res.json(updated);
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Failed to respond' });
  }
});

clientRequestRouter.patch('/:id/status', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const request = await storage.getClientRequest(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'responded', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await storage.updateClientRequest(id, { status });
    res.json(updated);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

clientRequestRouter.post('/submit/:companyId', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

    const company = await storage.getCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const data = insertClientRequestSchema.parse({
      ...req.body,
      companyId,
      userId: req.user?.id || null,
    });

    const request = await storage.createClientRequest(data);

    await storage.createCompanyAnalytic({
      companyId,
      eventType: 'client_request',
      metadata: { serviceType: req.body.serviceType, subject: req.body.subject },
      visitorId: req.body.clientEmail || null,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});
