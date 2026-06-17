import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertEmployeeVerificationSchema } from '@shared/schema';

export const employeeVerificationRouter = Router();

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

employeeVerificationRouter.get('/', companyAuth, async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const verifications = await storage.getEmployeeVerifications(company.id);
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;

    res.json({
      verifications,
      limits: {
        total: verifications.length,
        limit: isPremium ? null : 2,
        remaining: isPremium ? null : Math.max(0, 2 - verifications.length),
        canAddMore: isPremium || verifications.length < 2,
      },
    });
  } catch (error) {
    console.error('Error getting verifications:', error);
    res.status(500).json({ error: 'Failed to get verifications' });
  }
});

employeeVerificationRouter.post('/', companyAuth, async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;

    if (!isPremium) {
      const existing = await storage.getEmployeeVerifications(company.id);
      if (existing.length >= 2) {
        return res.status(403).json({
          error: 'Verification limit reached',
          message: 'Basic plan allows up to 2 employee verifications. Upgrade to Premium for unlimited.',
          limit: 2,
          current: existing.length,
        });
      }
    }

    const data = insertEmployeeVerificationSchema.parse({
      ...req.body,
      companyId: company.id,
    });

    const verification = await storage.createEmployeeVerification(data);
    res.status(201).json(verification);
  } catch (error) {
    console.error('Error creating verification:', error);
    res.status(400).json({ error: 'Invalid verification data' });
  }
});

employeeVerificationRouter.get('/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const verification = await storage.getEmployeeVerification(id);
    if (!verification) return res.status(404).json({ error: 'Not found' });
    if (verification.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(verification);
  } catch (error) {
    console.error('Error getting verification:', error);
    res.status(500).json({ error: 'Failed to get verification' });
  }
});

employeeVerificationRouter.patch('/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const verification = await storage.getEmployeeVerification(id);
    if (!verification) return res.status(404).json({ error: 'Not found' });
    if (verification.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await storage.updateEmployeeVerification(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating verification:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

employeeVerificationRouter.delete('/:id', companyAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const verification = await storage.getEmployeeVerification(id);
    if (!verification) return res.status(404).json({ error: 'Not found' });
    if (verification.companyId !== (req as any).company.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await storage.deleteEmployeeVerification(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting verification:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});
