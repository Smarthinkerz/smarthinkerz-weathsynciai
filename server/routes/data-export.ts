import type { Express } from "express";
import { storage } from "../storage";
import { Parser } from 'json2csv';

export function registerDataExportRoutes(app: Express) {
  
  // Export market reports as CSV
  app.get("/api/company/market-reports/export", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.companyId) {
      return res.status(401).json({ error: "Company authentication required" });
    }

    try {
      const reports = await storage.getMarketReportsByCompany(req.user.companyId);
      
      if (!reports || reports.length === 0) {
        return res.status(404).json({ error: "No market reports found" });
      }

      const csvData = reports.map(report => ({
        id: report.id,
        country: report.country,
        industry: report.industry,
        marketSize: report.marketSize,
        growthRate: report.growthRate,
        riskLevel: report.riskLevel,
        investmentActivity: report.investmentActivity,
        competitorDensity: report.competitorDensity,
        createdAt: report.createdAt
      }));

      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="market-reports.csv"');
      res.send(csv);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Export lead generation data as CSV
  app.get("/api/company/leads/export", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.companyId) {
      return res.status(401).json({ error: "Company authentication required" });
    }

    try {
      // Get recent lead generation data
      const leads = await storage.getCompanyLeads(req.user.companyId);
      
      if (!leads || leads.length === 0) {
        return res.status(404).json({ error: "No leads found" });
      }

      const csvData = leads.map(lead => ({
        id: lead.id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        position: lead.position,
        industry: lead.industry,
        country: lead.country,
        city: lead.city,
        generatedAt: lead.generatedAt
      }));

      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
      res.send(csv);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Failed to export leads" });
    }
  });

  // Export business intelligence dashboard data
  app.get("/api/premium/dashboard/export", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const isPremium = (req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise') && 
                     req.user?.subscriptionStartDate && 
                     req.user?.subscriptionEndDate && 
                     new Date(req.user.subscriptionEndDate) > new Date();

    if (!isPremium) {
      return res.status(403).json({ error: "Premium subscription required" });
    }

    try {
      // Gather comprehensive dashboard data
      const dashboardData = {
        user: {
          id: req.user.id,
          username: req.user.username,
          subscriptionTier: req.user.subscriptionTier,
          subscriptionStartDate: req.user.subscriptionStartDate,
          subscriptionEndDate: req.user.subscriptionEndDate
        },
        marketAnalysis: await storage.getUserMarketAnalysis(req.user.id),
        investmentProfile: await storage.getUserInvestmentProfile(req.user.id),
        portfolioMetrics: await storage.getUserPortfolioMetrics(req.user.id),
        riskAssessment: await storage.getUserRiskAssessment(req.user.id),
        exportTimestamp: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="dashboard-export.json"');
      res.json(dashboardData);

    } catch (error) {
      console.error('Dashboard export error:', error);
      res.status(500).json({ error: "Failed to export dashboard data" });
    }
  });
}