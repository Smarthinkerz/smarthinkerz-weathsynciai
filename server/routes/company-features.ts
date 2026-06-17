import { Router } from 'express';
import { z } from 'zod';
import { insertCompanyServiceSchema, PricingModel, ServiceType } from '@shared/schema';
import { storage } from '../storage';

export const companyFeaturesRouter = Router();

// Middleware to ensure user is authenticated as a company
export const companyAuthMiddleware = async (req, res, next) => {
  try {
    const sessionInfo = {
      hasSession: !!req.session,
      sessionID: req.session?.id,
      hasCompanyData: !!req.session?.company,
    };
    console.log('Company auth check - session info:', sessionInfo);

    if (!req.session || !req.session.company) {
      console.log('Company authentication check: Not logged in');
      return res.status(401).json({ error: 'Not authenticated as company' });
    }

    try {
      // Get the company data
      const company = await storage.getCompany(req.session.company.id);
      if (!company) {
        console.log(`Error getting company: Company with ID ${req.session.company.id} not found`);
        return res.status(401).json({ error: 'Company not found' });
      }
      req.company = company;
      next();
    } catch (error) {
      console.log('Error getting company:', error);
      console.log('Error in company auth middleware:', error);
      return res.status(500).json({ error: 'Server error fetching company data' });
    }
  } catch (error) {
    console.log('Error in company auth middleware:', error);
    return res.status(500).json({ error: 'Server error in authentication' });
  }
};

// All routes in this router require company authentication
companyFeaturesRouter.use(companyAuthMiddleware);

// Function to check if a company is within service limits
export const checkServiceLimit = async (req, res) => {
  try {
    const company = req.company;
    
    // Premium companies can add unlimited services
    if ((company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium) {
      return {
        canAddService: true,
        currentCount: 0,
        limit: null,
        remaining: null,
        unlimited: true
      };
    }

    // Get current count of services
    const services = await storage.getCompanyServices(company.id);
    const currentCount = services.length;
    const serviceLimit = company.serviceLimit || 3; // Default to 3 for basic plan
    const remaining = Math.max(0, serviceLimit - currentCount);

    return {
      canAddService: currentCount < serviceLimit,
      currentCount,
      limit: serviceLimit,
      remaining
    };
  } catch (error) {
    console.error('Error checking service limit:', error);
    throw new Error('Failed to check service limit');
  }
};

// Export additional usage tracking functions
export const getCompanyLimits = async (req, res) => {
  try {
    console.log('Getting company limits for company ID:', req.company.id);
    
    const company = req.company;
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    
    console.log('Company premium status:', isPremium);
    
    // Get current services count
    const services = await storage.getCompanyServices(company.id);
    console.log('Company services count:', services.length);
    
    // Calculate reset dates
    const getNextResetDate = (lastResetDate: Date | null, intervalDays: number) => {
      if (!lastResetDate) {
        // If no last reset date, use the current date + intervalDays
        const date = new Date();
        date.setDate(date.getDate() + intervalDays);
        return date.toISOString();
      }
      
      const resetDate = new Date(lastResetDate);
      resetDate.setDate(resetDate.getDate() + intervalDays);
      return resetDate.toISOString();
    };
    
    // Calculate days until reset
    const monthlyResetDate = getNextResetDate(company.lastReportResetDate || null, 30);
    const dailyResetDate = getNextResetDate(company.lastAIEmailResetDate || null, 1);
    const opportunityResetDate = getNextResetDate(company.lastOpportunityResetDate || null, 30);
    
    // Build limits response
    const limitsData = {
      tier: company.subscriptionTier,
      isPremium,
      services: {
        limit: isPremium ? null : (company.serviceLimit || 3),
        current: services.length,
        remaining: isPremium ? null : Math.max(0, (company.serviceLimit || 3) - services.length)
      },
      opportunities: {
        limit: isPremium ? null : (company.monthlyOpportunityLimit || 5),
        current: company.currentMonthOpportunities || 0,
        resetDate: isPremium ? null : opportunityResetDate,
        remaining: isPremium ? null : Math.max(0, (company.monthlyOpportunityLimit || 5) - (company.currentMonthOpportunities || 0))
      },
      reports: {
        limit: isPremium ? null : (company.monthlyReportLimit || 1),
        current: company.currentMonthReports || 0,
        resetDate: isPremium ? null : monthlyResetDate,
        remaining: isPremium ? null : Math.max(0, (company.monthlyReportLimit || 1) - (company.currentMonthReports || 0))
      },
      aiEmail: {
        limit: isPremium ? null : (company.dailyAIEmailLimit || 2),
        current: company.currentDayAIEmails || 0,
        resetDate: isPremium ? null : dailyResetDate,
        remaining: isPremium ? null : Math.max(0, (company.dailyAIEmailLimit || 2) - (company.currentDayAIEmails || 0))
      }
    };
    
    console.log('Returning company limits data');
    res.json(limitsData);
  } catch (error) {
    console.error('Error getting company limits:', error);
    res.status(500).json({ error: 'Failed to retrieve company plan limits' });
  }
};

export const incrementOpportunityUsage = async (companyId: number) => {
  const company = await storage.getCompany(companyId);
  
  if (!company) throw new Error('Company not found');
  
  // Premium companies have unlimited opportunities
  if ((company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium) {
    return true;
  }
  
  // Check if counter needs to be reset (new month)
  const currentOpportunities = company.currentMonthOpportunities || 0;
  const lastReset = company.lastOpportunityResetDate;
  const now = new Date();
  
  if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
    // Reset counter for new month
    await storage.updateCompany(company.id, {
      currentMonthOpportunities: 1,
      lastOpportunityResetDate: now
    });
    return true;
  } 
  
  // Check if limit reached
  if (currentOpportunities >= (company.monthlyOpportunityLimit || 5)) {
    return false;
  }
  
  // Increment counter
  await storage.updateCompany(company.id, {
    currentMonthOpportunities: currentOpportunities + 1,
    lastOpportunityResetDate: lastReset
  });
  
  return true;
};

export const incrementReportUsage = async (companyId: number) => {
  const company = await storage.getCompany(companyId);
  
  if (!company) throw new Error('Company not found');
  
  // Premium companies have unlimited reports
  if ((company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium) {
    return true;
  }
  
  // Check if counter needs to be reset (new month)
  const currentReports = company.currentMonthReports || 0;
  const lastReset = company.lastReportResetDate;
  const now = new Date();
  
  if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
    // Reset counter for new month
    await storage.updateCompany(company.id, {
      currentMonthReports: 1,
      lastReportResetDate: now
    });
    return true;
  } 
  
  // Check if limit reached
  if (currentReports >= (company.monthlyReportLimit || 1)) {
    return false;
  }
  
  // Increment counter
  await storage.updateCompany(company.id, {
    currentMonthReports: currentReports + 1,
    lastReportResetDate: lastReset
  });
  
  return true;
};

export const incrementAIEmailUsage = async (companyId: number) => {
  const company = await storage.getCompany(companyId);
  
  if (!company) throw new Error('Company not found');
  
  // Premium companies have unlimited AI emails
  if ((company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium) {
    return true;
  }
  
  // Check if counter needs to be reset (new day)
  const currentEmails = company.currentDayAIEmails || 0;
  const lastReset = company.lastAIEmailResetDate;
  const now = new Date();
  
  if (!lastReset || new Date(lastReset).getDate() !== now.getDate()) {
    // Reset counter for new day
    await storage.updateCompany(company.id, {
      currentDayAIEmails: 1,
      lastAIEmailResetDate: now
    });
    return true;
  } 
  
  // Check if limit reached
  if (currentEmails >= (company.dailyAIEmailLimit || 2)) {
    return false;
  }
  
  // Increment counter
  await storage.updateCompany(company.id, {
    currentDayAIEmails: currentEmails + 1,
    lastAIEmailResetDate: lastReset
  });
  
  return true;
};

// GET /api/company/check-service-limit
// Check if the company can add more services
companyFeaturesRouter.get('/check-service-limit', async (req, res) => {
  try {
    const company = req.company;
    
    // Premium companies can add unlimited services
    if ((company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium) {
      return res.json({
        canAddService: true,
        currentCount: 0,
        limit: null,
        remaining: null,
        unlimited: true
      });
    }

    // Get current count of services
    const services = await storage.getCompanyServices(company.id);
    const currentCount = services.length;
    const serviceLimit = company.serviceLimit || 3; // Default to 3 for basic plan
    const remaining = Math.max(0, serviceLimit - currentCount);

    return res.json({
      canAddService: currentCount < serviceLimit,
      currentCount,
      limit: serviceLimit,
      remaining
    });
  } catch (error) {
    console.error('Error checking service limit:', error);
    res.status(500).json({ error: 'Failed to check service limit' });
  }
});

// GET /api/company/limits
// Get all company plan limits
companyFeaturesRouter.get('/limits', async (req, res) => {
  try {
    const company = req.company;
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    
    // Get current services count
    const services = await storage.getCompanyServices(company.id);
    
    // Calculate reset dates
    const getNextResetDate = (lastResetDate: Date | null, intervalDays: number) => {
      if (!lastResetDate) {
        // If no last reset date, use the current date + intervalDays
        const date = new Date();
        date.setDate(date.getDate() + intervalDays);
        return date.toISOString();
      }
      
      const resetDate = new Date(lastResetDate);
      resetDate.setDate(resetDate.getDate() + intervalDays);
      return resetDate.toISOString();
    };
    
    // Calculate days until reset
    const monthlyResetDate = getNextResetDate(company.lastReportResetDate || null, 30);
    const dailyResetDate = getNextResetDate(company.lastAIEmailResetDate || null, 1);
    const opportunityResetDate = getNextResetDate(company.lastOpportunityResetDate || null, 30);
    
    // Build limits response
    const limits = {
      tier: company.subscriptionTier,
      isPremium,
      services: {
        limit: isPremium ? null : (company.serviceLimit || 3),
        current: services.length,
        remaining: isPremium ? null : Math.max(0, (company.serviceLimit || 3) - services.length)
      },
      opportunities: {
        limit: isPremium ? null : (company.monthlyOpportunityLimit || 5),
        current: company.currentMonthOpportunities || 0,
        resetDate: isPremium ? null : opportunityResetDate,
        remaining: isPremium ? null : Math.max(0, (company.monthlyOpportunityLimit || 5) - (company.currentMonthOpportunities || 0))
      },
      reports: {
        limit: isPremium ? null : (company.monthlyReportLimit || 1),
        current: company.currentMonthReports || 0,
        resetDate: isPremium ? null : monthlyResetDate,
        remaining: isPremium ? null : Math.max(0, (company.monthlyReportLimit || 1) - (company.currentMonthReports || 0))
      },
      aiEmail: {
        limit: isPremium ? null : (company.dailyAIEmailLimit || 2),
        current: company.currentDayAIEmails || 0,
        resetDate: isPremium ? null : dailyResetDate,
        remaining: isPremium ? null : Math.max(0, (company.dailyAIEmailLimit || 2) - (company.currentDayAIEmails || 0))
      }
    };
    
    res.json(limits);
  } catch (error) {
    console.error('Error getting company limits:', error);
    res.status(500).json({ error: 'Failed to get company limits' });
  }
});

// GET /api/company/services
// Get all services for the company
companyFeaturesRouter.get('/services', async (req, res) => {
  try {
    const company = req.company;
    const services = await storage.getCompanyServices(company.id);
    
    // If premium, unlimited services
    // If basic, limit to 3 services
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    const serviceLimit = isPremium ? null : (company.serviceLimit || 3);
    const remaining = serviceLimit === null ? null : Math.max(0, serviceLimit - services.length);
    
    res.json({
      services,
      limits: {
        total: services.length,
        limit: serviceLimit,
        remaining,
        canAddMore: isPremium || services.length < (serviceLimit || 3)
      }
    });
  } catch (error) {
    console.error('Error getting company services:', error);
    res.status(500).json({ error: 'Failed to get company services' });
  }
});

// POST /api/company/services
// Create a new service
companyFeaturesRouter.post('/services', async (req, res) => {
  try {
    const company = req.company;
    
    // Check if company can add more services
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    if (!isPremium) {
      const services = await storage.getCompanyServices(company.id);
      const serviceLimit = company.serviceLimit || 3;
      
      if (services.length >= serviceLimit) {
        return res.status(403).json({ 
          error: 'Service limit reached', 
          message: `You cannot add more than ${serviceLimit} services with your current plan` 
        });
      }
    }
    
    // Validate request body
    const validationResult = insertCompanyServiceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid service data', details: validationResult.error.format() });
    }
    
    // Prepare service data
    const serviceData = {
      ...validationResult.data,
      companyId: company.id
    };
    
    // Create the service
    const newService = await storage.createCompanyService(serviceData);
    
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating company service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// GET /api/company/services/:id
// Get a specific service
companyFeaturesRouter.get('/services/:id', async (req, res) => {
  try {
    const company = req.company;
    const serviceId = parseInt(req.params.id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    
    const service = await storage.getCompanyServiceById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Ensure the service belongs to the company
    if (service.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized access to service' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error getting company service:', error);
    res.status(500).json({ error: 'Failed to get service' });
  }
});

// PATCH /api/company/services/:id
// Update a service
companyFeaturesRouter.patch('/services/:id', async (req, res) => {
  try {
    const company = req.company;
    const serviceId = parseInt(req.params.id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    
    // Check if service exists and belongs to the company
    const existingService = await storage.getCompanyServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (existingService.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized access to service' });
    }
    
    // Validate request body
    const validationResult = insertCompanyServiceSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid service data', details: validationResult.error.format() });
    }
    
    // Update the service
    const updatedService = await storage.updateCompanyService(serviceId, validationResult.data);
    
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating company service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/company/services/:id
// Delete a service
companyFeaturesRouter.delete('/services/:id', async (req, res) => {
  try {
    const company = req.company;
    const serviceId = parseInt(req.params.id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    
    // Check if service exists and belongs to the company
    const existingService = await storage.getCompanyServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (existingService.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized access to service' });
    }
    
    // Delete the service
    await storage.deleteCompanyService(serviceId);
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting company service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// GET /api/company/market-reports
// Get all market reports for the company
companyFeaturesRouter.get('/market-reports', async (req, res) => {
  try {
    const company = req.company;
    const isPremium = (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') || company.isPremium;
    
    // Fetch reports from database
    const reports = await storage.getMarketReportsByCompany(company.id);
    
    res.json({
      reports: reports,
      limits: {
        total: reports.length,
        limit: isPremium ? null : (company.monthlyReportLimit || 1),
        remaining: isPremium ? null : (company.monthlyReportLimit || 1) - (company.currentMonthReports || 0),
        canAddMore: isPremium || (company.currentMonthReports || 0) < (company.monthlyReportLimit || 1)
      }
    });
  } catch (error) {
    console.error('Error getting market reports:', error);
    res.status(500).json({ error: 'Failed to get market reports' });
  }
});

// DELETE /api/company/market-report/:id
// Delete a specific market report
companyFeaturesRouter.delete('/market-report/:id', async (req, res) => {
  try {
    const company = req.company;
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    // Get the report to verify ownership
    const reports = await storage.getMarketReportsByCompany(company.id);
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }
    
    // Delete the report
    await storage.deleteMarketReport(reportId);
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting market report:', error);
    res.status(500).json({ error: 'Failed to delete market report' });
  }
});

// POST /api/company/market-report
// Create a new market report
companyFeaturesRouter.post('/market-report', async (req, res) => {
  try {
    const company = req.company;
    
    // Premium companies have unlimited reports
    if (company.subscriptionTier !== 'premium' && company.subscriptionTier !== 'elite' && company.subscriptionTier !== 'enterprise') {
      // Check if we need to reset the counter (new month)
      let currentReports = company.currentMonthReports || 0;
      const lastReset = company.lastReportResetDate;
      const now = new Date();
      
      if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
        // Reset counter for new month
        currentReports = 0;
        await storage.updateCompany(company.id, {
          currentMonthReports: 0,
          lastReportResetDate: now
        });
      } else if (currentReports >= (company.monthlyReportLimit || 1)) {
        return res.status(403).json({
          error: "Monthly report limit reached",
          limit: company.monthlyReportLimit || 1,
          current: currentReports,
          message: "You have reached your limit of 1 report per month. Upgrade to premium for unlimited reports."
        });
      }
      
      // Increment the counter
      await storage.updateCompany(company.id, {
        currentMonthReports: currentReports + 1,
        lastReportResetDate: lastReset || now
      });
    }
    
    const { title, industry, regions, timeframe } = req.body;
    
    // Import the market analysis service
    const { generateMarketAnalysis } = await import('../services/market-analysis-service');
    
    // Generate dynamic market report data
    const marketData = await generateMarketAnalysis({
      industry: industry || "Technology",
      regions: regions || ["Global"],
      timeframe: timeframe || "12months"
    });
    
    const reportData = {
      title: title || "Market Potential Report",
      industry: industry || "Technology", 
      regions: regions || ["Global"],
      timeframe: timeframe || "12months",
      data: marketData
    };
    
    // Save the report to the database
    const savedReport = await storage.createMarketReport(company.id, reportData);
    
    return res.status(201).json(savedReport);
  } catch (error) {
    console.error("Error creating market report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/company/market-reports/bulk
// Delete multiple market reports
companyFeaturesRouter.delete('/market-reports/bulk', async (req, res) => {
  try {
    const company = req.company;
    const { reportIds } = req.body;
    
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ error: 'Invalid report IDs array' });
    }
    
    // Verify all reports belong to the company
    const validReportIds = [];
    for (const reportId of reportIds) {
      const report = await storage.getMarketReport(reportId);
      if (report && report.companyId === company.id) {
        validReportIds.push(reportId);
      }
    }
    
    if (validReportIds.length === 0) {
      return res.status(404).json({ error: 'No valid reports found for deletion' });
    }
    
    // Delete all valid reports
    const deletePromises = validReportIds.map(id => storage.deleteMarketReport(id));
    await Promise.all(deletePromises);
    
    res.json({ 
      success: true, 
      message: `${validReportIds.length} report(s) deleted successfully`,
      deletedCount: validReportIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting market reports:', error);
    res.status(500).json({ error: 'Failed to delete selected reports' });
  }
});