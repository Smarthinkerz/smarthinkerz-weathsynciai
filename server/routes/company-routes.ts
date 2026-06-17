import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  companyAuthMiddleware, 
  checkServiceLimit, 
  incrementOpportunityUsage, 
  incrementReportUsage, 
  incrementAIEmailUsage 
} from './company-features';
import { companyServices, insertCompanyServiceSchema } from '@shared/schema';
import OpenAI from 'openai';
import { generateLiveMarketAnalysis } from '../services/live-market-data';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate live market analysis using real-time API data
async function generateMarketAnalysis(params: { industry: string; regions: string[]; timeframe: string }) {
  console.log('Generating live market analysis for:', params);
  
  try {
    // Use the live market data service with real-time API calls
    const marketData = await generateLiveMarketAnalysis(params);
    console.log('Live market data generated successfully:', marketData);
    return marketData;
  } catch (error) {
    console.error('Error generating live market analysis:', error);
    // Return error structure indicating data unavailability instead of synthetic data
    const errorData = {
      marketSize: {},
      investmentActivity: {},
      competitorDensity: {}
    };
    
    params.regions.forEach(region => {
      errorData.marketSize[region] = { size: "Data unavailable", growth: "N/A" };
      errorData.investmentActivity[region] = { deals: 0, amount: "$0" };
      errorData.competitorDensity[region] = "Unknown";
    });
    
    return errorData;
  }
}



// Add a company service with limit enforcement
export const addCompanyService = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    
    // Check service limit
    const serviceResult = await checkServiceLimit(req, res);
    if (!serviceResult.canAddService) {
      return res.status(403).json({
        error: "Service limit reached",
        limit: company.serviceLimit || 3,
        message: "You have reached your limit of 3 services. Upgrade to premium for unlimited services."
      });
    }
    
    // Validate service data
    try {
      console.log("Service data received:", JSON.stringify(req.body, null, 2));
      
      // Handle both serviceType and type fields properly
      const requestData = {
        ...req.body,
        companyId: company.id,
        // Ensure both fields are set correctly for compatibility
        serviceType: req.body.serviceType || req.body.type,
        type: req.body.serviceType || req.body.type  // Set the required 'type' field for database compatibility
      };
      
      console.log("Processed service data for validation:", JSON.stringify(requestData, null, 2));
      
      const validatedData = insertCompanyServiceSchema.parse(requestData);
      
      console.log("Validated service data:", JSON.stringify(validatedData, null, 2));
      
      // Add the service
      const newService = await storage.createCompanyService(validatedData);
      
      console.log("Service created successfully:", JSON.stringify(newService, null, 2));
      
      return res.status(201).json(newService);
    } catch (validationError) {
      console.error("Service validation error:", validationError);
      return res.status(400).json({
        error: "Invalid service data",
        details: validationError
      });
    }
  } catch (error) {
    console.error("Error adding company service:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get company services
export const getCompanyServices = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    
    // Get company services
    const services = await storage.getCompanyServices(company.id);
    
    // Return services with limit information
    const isPremium = company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise';
    return res.json({
      services,
      limits: {
        total: services.length,
        limit: isPremium ? null : (company.serviceLimit || 3),
        remaining: isPremium ? null : Math.max(0, (company.serviceLimit || 3) - services.length),
        canAddMore: isPremium ? true : services.length < (company.serviceLimit || 3)
      }
    });
  } catch (error) {
    console.error("Error getting company services:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update company service
export const updateCompanyService = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    const serviceId = parseInt(req.params.id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: "Invalid service ID" });
    }
    
    // Check if the service belongs to the company
    const existingService = await storage.getCompanyServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    if (existingService.companyId !== company.id) {
      return res.status(403).json({ error: "You don't have permission to update this service" });
    }
    
    // Prepare data for update - handle both serviceType and type fields for compatibility
    const updateData = {
      ...req.body
    };
    
    // If serviceType is being updated, also update type to match
    if (updateData.serviceType && !updateData.type) {
      updateData.type = updateData.serviceType;
    }
    
    // If type is being updated, also update serviceType to match
    if (updateData.type && !updateData.serviceType) {
      updateData.serviceType = updateData.type;
    }
    
    // Update the service
    const updatedService = await storage.updateCompanyService(serviceId, updateData);
    
    return res.json(updatedService);
  } catch (error) {
    console.error("Error updating company service:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete company service
export const deleteCompanyService = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    const serviceId = parseInt(req.params.id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: "Invalid service ID" });
    }
    
    // Check if the service belongs to the company
    const existingService = await storage.getCompanyServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    if (existingService.companyId !== company.id) {
      return res.status(403).json({ error: "You don't have permission to delete this service" });
    }
    
    // Delete the service
    await storage.deleteCompanyService(serviceId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting company service:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create market potential report with limit enforcement
export const createMarketReport = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    
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
    
    // Generate dynamic market report data
    const { title, industry, regions, timeframe } = req.body;
    
    // Generate realistic market data based on actual parameters
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
};

// Generate AI email draft with daily limit enforcement
export const generateAIEmail = async (req: Request, res: Response) => {
  try {
    if (!(req as any).company) {
      return res.status(401).json({ error: "Company not authenticated" });
    }
    
    const company = (req as any).company;
    
    // Premium companies have unlimited AI email drafts
    if (company.subscriptionTier !== 'premium' && company.subscriptionTier !== 'elite' && company.subscriptionTier !== 'enterprise') {
      // Check if we need to reset the counter (new day)
      let currentEmails = company.currentDayAIEmails || 0;
      const lastReset = company.lastAIEmailResetDate;
      const now = new Date();
      
      if (!lastReset || new Date(lastReset).getDate() !== now.getDate()) {
        // Reset counter for new day
        currentEmails = 0;
        await storage.updateCompany(company.id, {
          currentDayAIEmails: 0,
          lastAIEmailResetDate: now
        });
      } else if (currentEmails >= (company.dailyAIEmailLimit || 2)) {
        return res.status(403).json({
          error: "Daily AI email limit reached",
          limit: company.dailyAIEmailLimit || 2,
          current: currentEmails,
          message: "You have reached your limit of 2 AI-generated emails per day. Upgrade to premium for unlimited AI assistance."
        });
      }
      
      // Increment the counter
      await storage.updateCompany(company.id, {
        currentDayAIEmails: currentEmails + 1,
        lastAIEmailResetDate: lastReset || now
      });
    }
    
    // Generate the AI email draft
    // In a real implementation, we would call an actual AI service
    const { purpose, recipient, points } = req.body;
    
    // Generate a simple email based on the inputs
    const emailDraft = {
      subject: `${purpose} - ${company.name}`,
      body: `Dear ${recipient},

I hope this email finds you well. I am writing on behalf of ${company.name} regarding ${purpose}.

${points.map((point: string) => `- ${point}`).join('\n')}

Please let me know if you would like to discuss this further. I am available at your convenience.

Best regards,
${company.primaryContact}
${company.name}
${company.primaryContactEmail}
${company.primaryContactPhone || ''}
`
    };
    
    return res.json({
      emailDraft,
      remaining: (company.subscriptionTier === 'premium' || company.subscriptionTier === 'elite' || company.subscriptionTier === 'enterprise') ? 
        'unlimited' : 
        (company.dailyAIEmailLimit || 2) - ((company.currentDayAIEmails || 0) + 1)
    });
  } catch (error) {
    console.error("Error generating AI email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};