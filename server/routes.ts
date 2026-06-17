import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { randomBytes } from 'crypto';
import nodemailer from "nodemailer";
import express from 'express';
import passport from 'passport';
import OpenAI from 'openai';
import { createCheckoutSession, verifySubscription, createCompanyCheckoutSession, verifyCompanySubscription, confirmPayment, confirmCompanyPayment } from './routes/payments';
import { getDirectoryListing, saveDirectoryListing, getAllDirectoryListings, recordDirectoryView, recordDirectoryClick, deleteDirectoryListing } from './routes/directory';
import { registerBusinessMapRoutes } from './routes/business-map';
import { registerAdminRoutes } from './routes/admin';
import { registerBillingRoutes } from './routes/billing';
import { registerSeoRoutes } from './routes/seo';
import { 
  companyAuthMiddleware, 
  getCompanyLimits, 
  incrementOpportunityUsage, 
  incrementReportUsage, 
  incrementAIEmailUsage,
  checkServiceLimit,
  companyFeaturesRouter
} from './routes/company-features';
import { 
  addCompanyService, 
  getCompanyServices, 
  updateCompanyService, 
  deleteCompanyService, 
  createMarketReport, 
  generateAIEmail
} from './routes/company-routes';
import { chatbotRouter } from './routes/chatbot-routes';
import { clientRequestRouter } from './routes/client-request-routes';
import { analyticsRouter } from './routes/analytics-routes';
import { employeeVerificationRouter } from './routes/employee-verification-routes';
import { insertWorkHistorySchema } from '@shared/schema';
import { multiAgentSystem } from './services/multi-agent-system';
import { db } from './db';
import { 
  companyBadges, 
  companyCaseStudies, 
  companyCredentials, 
  verificationRequests 
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getJobRecommendations } from './services/embeddings';
import { knowledgeGraphService } from "./services/knowledge-graph";
import { premiumMarketDataService } from "./services/premium-market-data";
import { youApiService } from "./services/you-api-service";
import { comprehensiveAIService } from "./services/comprehensive-ai-service.js";
import { VerifiedFundingService } from "./services/verified-funding-service";
import { AuthenticOnlyRecommendations } from "./services/authentic-only-recommendations";
import { generateBusinessPlan, generateGrowthRoadmap, generateEmailDraft, generateMeetingSchedule, getAssistantResponse } from "./services/virtual-assistant";
import { smartContractService } from "./services/smart-contracts";
import { smartContractRoutes } from "./routes/smart-contracts";
import { platformFeaturesRouter } from "./routes/platform-features";
import { portfolioMetricsRouter } from "./routes/portfolio-metrics";
import { gapClosureRouter } from "./routes/gap-closure";
import { seedPlatformData } from "./seed-data";
import { leadGenerationService } from "./services/lead-generation-service";
import { enhancedLeadGenerationService } from "./services/enhanced-lead-generation-service";
import { ExperienceVerificationService } from "./services/experience-verification";
import { aiContractGenerator } from "./services/ai-contract-generator";
import { deepResearchService } from "./services/deep-research-service";
import { getCountrySpecificLegalRequirements } from "./services/legal-guidance-service";
import rateLimit from 'express-rate-limit';
import { personalFinanceAI } from "./services/personal-finance-ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { users, companies, insertCompanySchema, SubscriptionTier, isHighTier, TIER_DISPLAY_NAMES } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

let uniqueIdCounter = 0;

// Declare multer types
declare global {
  namespace Express {
    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }

    interface Request {
      file?: Multer['File'];
    }
  }

  namespace Express.Session {
    interface SessionData {
      company?: {
        id: number;
        name: string;
        email?: string;  // Optional field that may be derived from primaryContactEmail
        primaryContactEmail: string;
        verificationStatus: string | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        password: string;
        description?: string;
        industry?: string;
        size?: string;
        foundedYear?: number;
        website?: string | null;
        logo?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        postalCode?: string | null;
        country?: string | null;
        phoneNumber?: string | null;
        socialMedia?: Record<string, string> | null;
        [key: string]: any;  // Allow any other properties
      }
    }
  }

  // Global direct auth token type
  interface DirectAuthToken {
    companyId: number;
    expires: number;
  }

  var directAuthTokens: Map<string, DirectAuthToken>;
}

import { getCustomRecommendations } from './routes/ai-recommendations';
import { handleAdvancedChatbot } from './routes/advanced-chatbot';
import { verifiedLeadsRouter } from './routes/verified-leads-routes';


const experienceVerificationService = new ExperienceVerificationService();

let testMailer: nodemailer.Transporter;

// Initialize test email account - will be done asynchronously
async function initializeMailer() {
  try {
    console.log("Starting mailer initialization...");
    const testAccount = await nodemailer.createTestAccount();
    testMailer = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Mailer initialization completed");
  } catch (error) {
    console.error("Failed to initialize mailer:", error);
  }
}


// Simple country code mapping for regions
const countryCodeMap: { [key: string]: string } = {
  'United States': 'USA',
  'Canada': 'CAN',
  'United Kingdom': 'GBR',
  'Germany': 'DEU',
  'France': 'FRA',
  'Italy': 'ITA',
  'Spain': 'ESP',
  'Japan': 'JPN',
  'China': 'CHN',
  'India': 'IND'
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase limit to 1000 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    if (!global.directAuthTokens) {
      global.directAuthTokens = new Map();
    }

    app.get("/api/env/config", (req, res) => {
      res.json({
        MAPBOX_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || null,
      });
    });

    // Initialize mailer in background
    initializeMailer().catch(error => {
      console.error("Background mailer initialization failed:", error);
    });

    // Register the verified lead generation routes
    app.use('/api', verifiedLeadsRouter);
    app.use('/api', platformFeaturesRouter);
    app.use('/api', portfolioMetricsRouter);
    app.use('/api', gapClosureRouter);
    console.log("Verified lead generation routes registered");
    seedPlatformData().catch(e => console.error("Seed error:", e));

    // AI recommendations route
    app.post("/api/ai-recommendations", getCustomRecommendations);

    // Lead generation API endpoint with real external data sources
    // AI-powered lead negotiation strategy
    app.post("/api/leads/negotiate", async (req, res) => {
      try {
        if (!req.isAuthenticated() && !req.session.company) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const { leadName, company: leadCompany, challenges, budget, timeline, interests } = req.body;
        if (!leadName) return res.status(400).json({ error: "Lead name is required" });

        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "You are an expert B2B sales negotiation coach. Provide specific, actionable negotiation insights."
          }, {
            role: "user",
            content: `Provide a detailed negotiation strategy for the following lead:
Lead: ${leadName} at ${leadCompany || "their company"}
Challenges they face: ${challenges || "not specified"}
Budget range: ${budget || "not specified"}
Timeline: ${timeline || "not specified"}
Interests: ${interests || "not specified"}

Provide: 1) Opening strategy, 2) Key value propositions, 3) Objection handling, 4) Closing approach, 5) Specific talking points.`
          }],
          max_tokens: 800,
        });
        const insights = completion.choices[0]?.message?.content || "Unable to generate insights";
        res.json({ insights, leadName, timestamp: new Date() });
      } catch (error: any) {
        console.error("Error generating negotiation insights:", error);
        res.status(500).json({ error: "Failed to generate negotiation insights" });
      }
    });

    app.post("/api/lead-generation", async (req, res) => {
      try {
        console.log("Lead generation request:", req.body);

        // Check if user is authenticated
        if (!req.isAuthenticated() && !req.session.company) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Check if company has premium subscription (if applicable)
        if (req.session.company) {
          const company = await storage.getCompany(req.session.company.id);
          if (!company || (company.subscriptionTier !== SubscriptionTier.PREMIUM && company.subscriptionTier !== SubscriptionTier.ELITE && company.subscriptionTier !== SubscriptionTier.ENTERPRISE)) {
            return res.status(403).json({ 
              error: "Elite subscription required to use lead generation" 
            });
          }
        } else {
          const user = await storage.getUser(req.user.id);
          
          const isPremium = (user?.subscriptionTier === SubscriptionTier.PREMIUM || user?.subscriptionTier === SubscriptionTier.ELITE || user?.subscriptionTier === SubscriptionTier.ENTERPRISE) && 
                          user?.subscriptionStartDate && 
                          user?.subscriptionEndDate && 
                          new Date(user.subscriptionEndDate) > new Date();
          
          if (!isPremium) {
            return res.status(403).json({ 
              error: "Premium subscription required to use lead generation" 
            });
          }
        }

        // Validate that required API keys are available
        const missingKeys = [];
        if (!process.env.RAPID_API_KEY) missingKeys.push('RAPID_API_KEY');
        if (!process.env.APIFY_API_TOKEN) missingKeys.push('APIFY_API_TOKEN');
        if (!process.env.CRAWLBASE_TOKEN) missingKeys.push('CRAWLBASE_TOKEN');
        
        if (missingKeys.length > 0) {
          console.warn(`Lead generation missing API keys: ${missingKeys.join(', ')}`);
          // Continue with whatever keys are available
        }

        // Generate leads using the enhanced lead generation service with multiple API sources
        // Only uses verified API sources - no fallback to synthetic data
        console.log("Using enhanced lead generation service with verified sources only");
        try {
          const leads = await enhancedLeadGenerationService.generateLeads(req.body);
          console.log(`Generated ${leads.length} leads for ${req.body.country} (${req.body.industry})`);

          if (leads.length === 0) {
            console.log("No leads found from verified sources for this country/industry combination");
            // Return empty array with 204 status to indicate successful processing but no content
            return res.status(200).json([]);
          }

          // Return verified leads found from API sources
          return res.json(leads);
        } catch (leadGenError) {
          console.error("Lead generation error:", leadGenError);
          // No fallback to synthetic data - return an empty array if there's an error
          return res.status(200).json([]);
        }
      } catch (error) {
        console.error("Lead generation error:", error);
        return res.status(500).json({ 
          error: "Failed to generate leads", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    // Advanced AI Chatbot endpoint with premium features
    app.post("/api/virtual-assistant/advanced-chat", handleAdvancedChatbot);

    // Work history management routes
    app.get("/api/work-history", async (req, res) => {
      console.log("Work history GET request - User authenticated:", req.isAuthenticated());
      console.log("Work history GET request - User ID:", req.user?.id);
      
      if (!req.isAuthenticated()) {
        console.log("Work history GET - Authentication failed");
        return res.sendStatus(401);
      }

      try {
        console.log("Fetching work history for user:", req.user.id);
        const workHistory = await storage.getWorkHistoryByUser(req.user.id);
        console.log("Work history found:", workHistory?.length || 0, "entries");
        res.json(workHistory || []);
      } catch (error) {
        console.error("Failed to get work history:", error);
        res.status(500).json({
          error: "Failed to get work history", 
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.post("/api/work-history", async (req, res) => {
      console.log("Work history POST request - User authenticated:", req.isAuthenticated());
      console.log("Work history POST request - User ID:", req.user?.id);
      console.log("Work history POST request - Body:", req.body);
      
      if (!req.isAuthenticated()) {
        console.log("Work history POST - Authentication failed");
        return res.sendStatus(401);
      }

      try {
        const workHistoryData = {
          ...req.body,
          userId: req.user.id,
        };
        console.log("Creating work history with data:", workHistoryData);
        
        const workHistory = await storage.createWorkHistory(workHistoryData);
        console.log("Work history created successfully:", workHistory);

        // Trigger verification process asynchronously
        experienceVerificationService.verifyWorkHistory(workHistory.id)
          .catch((error: Error) => {
            console.error("Background verification failed:", error);
          });

        res.status(201).json(workHistory);
      } catch (error) {
        console.error("Failed to create work history:", error);
        res.status(500).json({
          error: "Failed to create work history",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Update work history
    app.put("/api/work-history/:id", async (req, res) => {
      console.log("🔄 PUT /api/work-history/:id endpoint hit");
      console.log("Request params:", req.params);
      console.log("Request body:", req.body);
      console.log("User authenticated:", req.isAuthenticated());
      
      if (!req.isAuthenticated()) {
        console.log("❌ Authentication failed");
        return res.sendStatus(401);
      }

      try {
        const workHistoryId = parseInt(req.params.id);
        const userId = req.user.id;

        console.log(`✅ Updating work history ${workHistoryId} for user ${userId}`);
        console.log("Update data:", req.body);

        // Verify ownership
        const existingEntry = await storage.getWorkHistoryById(workHistoryId);
        if (!existingEntry || existingEntry.userId !== userId) {
          return res.status(404).json({ error: "Work history entry not found" });
        }

        // Validate request body
        const validationResult = insertWorkHistorySchema.safeParse(req.body);
        if (!validationResult.success) {
          console.error("Validation failed:", validationResult.error);
          return res.status(400).json({
            error: "Invalid request data",
            details: validationResult.error.errors
          });
        }

        const { startDate, endDate, ...restData } = validationResult.data;
        
        const workHistoryData: any = {
          ...restData,
          userId,
          verificationStatus: 'pending', // Reset verification status on edit
        };
        
        if (startDate) {
          workHistoryData.startDate = new Date(startDate);
        }
        
        if (endDate) {
          workHistoryData.endDate = new Date(endDate);
        }

        console.log("About to update work history with data:", workHistoryData);
        const updatedWorkHistory = await storage.updateWorkHistory(workHistoryId, workHistoryData);
        console.log("Work history updated successfully:", updatedWorkHistory);

        res.json(updatedWorkHistory);
      } catch (error) {
        console.error("Failed to update work history:", error);
        res.status(500).json({
          error: "Failed to update work history",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Delete work history
    app.delete("/api/work-history/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const workHistoryId = parseInt(req.params.id);
        const userId = req.user.id;

        console.log(`Deleting work history ${workHistoryId} for user ${userId}`);

        // Verify ownership
        const existingEntry = await storage.getWorkHistoryById(workHistoryId);
        if (!existingEntry || existingEntry.userId !== userId) {
          return res.status(404).json({ error: "Work history entry not found" });
        }

        await storage.deleteWorkHistory(workHistoryId);
        console.log("Work history deleted successfully");

        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete work history:", error);
        res.status(500).json({
          error: "Failed to delete work history",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // References API endpoints
    app.get("/api/references", async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const userId = req.user.id;
        console.log("References GET request - User authenticated:", req.isAuthenticated());
        console.log("References GET request - User ID:", userId);

        const references = await storage.getReferenceChecksByUser(userId);
        console.log("References found:", references?.length || 0, "entries");
        res.json(references || []);
      } catch (error) {
        console.error("Failed to get references:", error);
        res.status(500).json({ 
          error: "Failed to get references",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.post("/api/references", async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const userId = req.user.id;
        const referenceData = {
          ...req.body,
          userId,
          verificationStatus: "pending"
        };

        console.log("Creating reference for user:", userId);
        console.log("Reference data:", referenceData);

        const reference = await storage.createReferenceCheck(referenceData);
        console.log("Reference created successfully:", reference);
        
        res.status(201).json(reference);
      } catch (error) {
        console.error("Failed to create reference:", error);
        res.status(500).json({ 
          error: "Failed to create reference",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.put("/api/references/:id", async (req, res) => {
      try {
        console.log("🔄 PUT /api/references/:id endpoint hit");
        console.log("Request params:", req.params);
        console.log("Request body:", req.body);

        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const referenceId = parseInt(req.params.id);
        const userId = req.user.id;
        
        console.log("User authenticated:", req.isAuthenticated());
        console.log("✅ Updating reference", referenceId, "for user", userId);

        // Verify ownership
        const existingReference = await storage.getReferenceCheck(referenceId);
        if (!existingReference || existingReference.userId !== userId) {
          return res.status(404).json({ error: "Reference not found" });
        }

        const updateData = {
          ...req.body,
          userId,
          verificationStatus: existingReference.verificationStatus // Keep existing verification status
        };

        console.log("Update data:", updateData);

        const updatedReference = await storage.updateReferenceCheck(referenceId, updateData);
        console.log("Reference updated successfully:", updatedReference);
        
        res.json(updatedReference);
      } catch (error) {
        console.error("Failed to update reference:", error);
        res.status(500).json({ 
          error: "Failed to update reference",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.delete("/api/references/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const referenceId = parseInt(req.params.id);
        const userId = req.user.id;

        // Verify ownership
        const existingReference = await storage.getReferenceCheck(referenceId);
        if (!existingReference || existingReference.userId !== userId) {
          return res.status(404).json({ error: "Reference not found" });
        }

        await storage.deleteReferenceCheck(referenceId);
        console.log("Reference deleted successfully:", referenceId);
        
        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete reference:", error);
        res.status(500).json({ 
          error: "Failed to delete reference",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add experience verification endpoint
    app.get("/api/user/:userId/verified-experience", async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        console.log("Fetching verified experience for user:", userId);

        // Fetch all verified experience data
        const [workHistory, certificates, projects] = await Promise.all([
          storage.getWorkHistoryByUser(userId).catch(err => {
            console.error("Failed to fetch work history:", err);
            return [];
          }),
          storage.getUserCertificates(userId).catch(err => {
            console.error("Failed to fetch certificates:", err);
            return [];
          }),
          storage.getUserProjects(userId).catch(err => {
            console.error("Failed to fetch projects:", err);
            return [];
          })
        ]);

        console.log("Raw data:", {
          workHistory,
          certificates,
          projects
        });

        // Filter for verified items only 
        const verifiedExperience = {
          workHistory: workHistory.filter(h => h.verificationStatus === "verified"),
          certificates: certificates.filter(c => c.verificationStatus === "verified"), 
          projects: projects.filter(p => p.verificationStatus === "verified"),
        };

        console.log("Sending verified experience data:", verifiedExperience);
        res.json(verifiedExperience);
      } catch (error) {
        console.error("Failed to get verified experience:", error);
        res.status(500).json({
          error: "Failed to get verified experience",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    const httpServer = createServer(app);

    // Basic routes
    // Phase 7: structured system-health endpoint with metrics for observability dashboards
    app.get("/api/system-health", async (req, res) => {
      const t0 = Date.now();
      const checks: Record<string, any> = {};

      try {
        const start = Date.now();
        const { db } = await import('./db');
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`SELECT 1`);
        checks.database = { ok: true, latencyMs: Date.now() - start };
      } catch (e: any) {
        checks.database = { ok: false, error: e.message };
      }

      const requiredSecrets = ['DATABASE_URL', 'OPENAI_API_KEY', 'SENDGRID_API_KEY', 'STRIPE_SECRET_KEY', 'TAP_PAY_API_KEY', 'FINNHUB_API_KEY', 'RAPIDAPI_KEY'];
      const missingSecrets = requiredSecrets.filter(s => !process.env[s]);
      checks.environment = { ok: missingSecrets.length === 0, missing: missingSecrets };

      const mem = process.memoryUsage();
      checks.memory = {
        ok: mem.heapUsed < mem.heapTotal * 0.95,
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
      };

      checks.process = {
        ok: true,
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid,
      };

      const allOk = Object.values(checks).every((c: any) => c.ok);
      res.status(allOk ? 200 : 503).json({
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - t0,
        checks,
      });
    });

    app.get("/api/health", async (req, res) => {
      const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
      const t0 = Date.now();

      // DB check
      try {
        const start = Date.now();
        const { db } = await import('./db');
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`SELECT 1`);
        checks.database = { ok: true, latencyMs: Date.now() - start };
      } catch (e: any) {
        checks.database = { ok: false, error: e.message };
      }

      // Integrations (configured = key present)
      checks.openai = { ok: !!process.env.OPENAI_API_KEY };
      checks.sendgrid = { ok: !!process.env.SENDGRID_API_KEY };
      checks.stripe = { ok: !!process.env.STRIPE_SECRET_KEY };
      checks.tap = { ok: !!process.env.TAP_PAY_API_KEY };
      checks.finnhub = { ok: !!process.env.FINNHUB_API_KEY };
      checks.rapidapi = { ok: !!process.env.RAPIDAPI_KEY };

      const allOk = Object.values(checks).every(c => c.ok);
      const status = checks.database.ok ? (allOk ? 'healthy' : 'degraded') : 'unhealthy';
      const httpStatus = checks.database.ok ? 200 : 503;

      res.status(httpStatus).json({
        status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - t0,
        checks,
      });
    });

    // Payment routes
    app.post("/api/checkout-session", createCheckoutSession);
    app.post("/api/company-checkout-session", createCompanyCheckoutSession);

    app.get("/api/verify-company-subscription", verifyCompanySubscription);
    app.get("/api/verify-subscription", verifySubscription);
    app.post("/api/confirm-payment", confirmPayment);
    app.post("/api/confirm-company-payment", confirmCompanyPayment);

    app.post("/api/tap-webhook", async (req, res) => {
      try {
        const { id } = req.body;
        if (!id) {
          return res.json({ received: true });
        }

        console.log('Tap Pay webhook received, verifying charge:', id);

        const tapKey = process.env.TAP_PAY_API_KEY;
        if (!tapKey) {
          console.error('TAP_PAY_API_KEY not configured for webhook verification');
          return res.json({ received: true });
        }

        const verifyResponse = await fetch(`https://api.tap.company/v2/charges/${id}`, {
          headers: { Authorization: `Bearer ${tapKey}` },
        });
        const charge = await verifyResponse.json() as any;

        if (charge.status !== 'CAPTURED') {
          console.log('Webhook charge not captured:', { id, status: charge.status });
          return res.json({ received: true });
        }

        // Replay protection: skip if this tap charge has already activated a subscription
        try {
          const { invoices } = await import('@shared/schema');
          const { db: webhookDb } = await import('./db');
          const { eq: webhookEq } = await import('drizzle-orm');
          const existing = await (webhookDb as any).select().from(invoices).where(webhookEq((invoices as any).externalId, id)).limit(1);
          if (existing && existing.length > 0) {
            console.log('Webhook: tap_id already consumed, ignoring:', { id });
            return res.json({ received: true });
          }
        } catch (e) {
          console.error('Webhook replay-check error:', e);
        }

        const chargeEmail = charge.receipt?.email || charge.customer?.email || '';
        const chargePlan = charge.description || charge.metadata?.plan || '';
        console.log('Webhook verified CAPTURED charge:', { id, email: chargeEmail, plan: chargePlan });

        if (!chargeEmail) {
          console.log('No email on charge, cannot match to user/company');
          return res.json({ received: true });
        }

        const isCompanyPlan = chargePlan.includes('biz-');
        const recordWebhookInvoice = async (opts: { userId?: number; companyId?: number; tier: string; cycle: string }) => {
          const { invoices } = await import('@shared/schema');
          const { db: webhookDb } = await import('./db');
          await (webhookDb as any).insert(invoices).values({
            userId: opts.userId ?? null,
            companyId: opts.companyId ?? null,
            externalId: id,
            tier: opts.tier,
            cycle: opts.cycle,
            amountCents: Number(charge.amount ? Math.round(Number(charge.amount) * 100) : 0),
            currency: (charge.currency || 'USD').toString(),
            status: 'paid',
            paidAt: new Date(),
          });
        };

        const { chargeMatchesPendingPlan: webhookPlanCheck } = await import('./routes/payments');

        if (isCompanyPlan) {
          const company = await storage.getCompanyByEmail(chargeEmail);
          if (company && company.pendingSubscriptionTier) {
            const pendingId = company.pendingSubscriptionId || '';
            const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
            const durationDays = cycle === 'yearly' ? 365 : 30;
            if (!webhookPlanCheck(charge, 'company', company.pendingSubscriptionTier, cycle)) {
              console.warn('Webhook: company plan mismatch, ignoring:', { id, companyId: company.id });
              return res.json({ received: true });
            }
            try {
              await recordWebhookInvoice({ companyId: company.id, tier: company.pendingSubscriptionTier, cycle });
            } catch (e) {
              console.warn('Webhook: refusing to activate company, consume failed:', { id, companyId: company.id });
              return res.json({ received: true });
            }
            await storage.updateCompany(company.id, {
              subscriptionTier: company.pendingSubscriptionTier,
              subscriptionStartDate: new Date(),
              subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
              pendingSubscriptionTier: null,
              pendingSubscriptionId: null,
            });
            console.log('Webhook activated company subscription:', { companyId: company.id, tier: company.pendingSubscriptionTier });
          }
        } else {
          const user = await storage.getUserByEmail(chargeEmail);
          if (user && user.pendingSubscriptionTier) {
            const newTier = user.pendingSubscriptionTier;
            const pendingId = user.pendingSubscriptionId || '';
            const cycle = pendingId.endsWith('_yearly') || pendingId.endsWith('_annual') ? 'yearly' : 'monthly';
            const durationDays = cycle === 'yearly' ? 365 : 30;
            if (!webhookPlanCheck(charge, 'user', newTier, cycle)) {
              console.warn('Webhook: user plan mismatch, ignoring:', { id, userId: user.id });
              return res.json({ received: true });
            }
            try {
              await recordWebhookInvoice({ userId: user.id, tier: newTier, cycle });
            } catch (e) {
              console.warn('Webhook: refusing to activate user, consume failed:', { id, userId: user.id });
              return res.json({ received: true });
            }
            await storage.updateUser(user.id, {
              subscriptionTier: newTier,
              subscriptionStartDate: new Date(),
              subscriptionEndDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
              isPremium: isHighTier(newTier),
              pendingSubscriptionTier: null,
              pendingSubscriptionId: null,
            });
            const displayName = TIER_DISPLAY_NAMES[newTier] || newTier;
            storage.createNotification({
              userId: user.id,
              type: 'system',
              title: `Upgraded to ${displayName}!`,
              message: isHighTier(newTier)
                ? 'You now have full access to AI agents, deep research, lead generation, predictive modeling, and smart contracts.'
                : 'You now have access to multi-agent insights, interactive opportunity maps, and personalized tracking.',
              link: '/dashboard',
            }).catch(e => console.error('Webhook notification error:', e));
            console.log('Webhook activated user subscription:', { userId: user.id, tier: newTier });
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Tap webhook error:', error);
        res.json({ received: true });
      }
    });

    // Job and opportunity routes
    app.get("/api/opportunities", async (req, res) => {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    });

    // Get recommended opportunities based on user skills (with path parameters for frontend compatibility)
    app.get("/api/opportunities/recommended/:skills/:country", async (req, res) => {
        console.log("🎯 AI RECOMMENDATIONS ENDPOINT (PATH PARAMS) HIT - User:", req.user?.id);
        
        if (!req.isAuthenticated()) {
            console.log("❌ User not authenticated");
            return res.sendStatus(401);
        }

        try {
            const userSkills = req.user?.skills || [];
            // Get country from path parameter
            const userCountry = req.params.country || 'Romania';
            console.log("🔍 PATH PARAMS RECOMMENDATIONS REQUEST:", {
                userId: req.user.id,
                skills: userSkills,
                country: userCountry,
                pathSkills: req.params.skills,
                timestamp: new Date().toISOString()
            });

            // Use ONLY authentic verified funding opportunities
            const fundingOpportunities = await storage.getMatchingFundingOpportunities(req.user, userCountry);
            console.log(`Found ${fundingOpportunities.length} verified funding opportunities for ${userCountry}`);
            
            // For countries without verified funding, return clear message
            if (fundingOpportunities.length === 0) {
                console.log(`🏛️ No verified funding data for ${userCountry} - returning authentic-only message`);
                return res.json([{
                    id: 0,
                    name: `No Verified Funding Available - ${userCountry}`,
                    description: `We only display authentic, government-verified funding opportunities. No verified funding programs are currently available for ${userCountry} in our database. We recommend checking official government websites for local funding opportunities.`,
                    location: userCountry,
                    company: 'WealthSync - Authentic Data Only',
                    matchScore: 0,
                    type: 'authentic_notice',
                    source: 'Verified funding database',
                    verified: true
                }]);
            }
            
            // Only show verified funding opportunities
            let opportunitiesToMatch = fundingOpportunities;
            console.log(`🏛️ AUTHENTIC FUNDING ONLY: ${fundingOpportunities.length} verified programs for ${userCountry}`);
            
            // Enhanced skill matching with synonyms and related terms
            const getSkillSynonyms = (skill: string) => {
                const skillLower = skill.toLowerCase();
                const synonymMap: { [key: string]: string[] } = {
                    'vr': [
                        'virtual reality', 'immersive', 'mixed reality', 'metaverse', 'gaming', 
                        'simulation', '3d', 'augmented reality', 'ar', 'tech', 'technology',
                        'innovation', 'digital', 'development', 'startup', 'entertainment'
                    ],
                    'software': [
                        'programming', 'development', 'coding', 'app', 'application', 'tech',
                        'technology', 'digital', 'saas', 'platform', 'system', 'solution',
                        'startup', 'innovation', 'web', 'mobile', 'enterprise'
                    ],
                    'other': [
                        'general', 'business', 'entrepreneurship', 'startup', 'innovation',
                        'technology', 'development', 'digital', 'consulting', 'services'
                    ],
                    'technology': ['tech', 'digital', 'innovation', 'development', 'business', 'solutions']
                };
                
                return synonymMap[skillLower] || [];
            };

            // Apply skill matching to verified funding opportunities
            const recommendations = opportunitiesToMatch.map((opportunity: any) => ({
                ...opportunity,
                matchScore: 85, // High match score for verified funding
                type: 'verified_funding',
                verified: true
            }));

            console.log(`✅ Returning ${recommendations.length} recommendations for ${userCountry}`);
            if (recommendations.length > 0) {
                console.log("🏆 Top recommendation:", {
                    name: recommendations[0].name,
                    score: recommendations[0].matchScore,
                    matchedSkills: recommendations[0].matchedSkills?.slice(0, 2),
                    country: userCountry
                });
            }

            res.json(recommendations);
        } catch (error) {
            console.error("Failed to get recommendations:", error);
            res.status(500).json({ 
                error: "Failed to get recommendations",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });

    // Get recommended opportunities based on user skills (query parameters version for compatibility)
    app.get("/api/opportunities/recommended", async (req, res) => {
        console.log("🎯 AI RECOMMENDATIONS ENDPOINT (QUERY PARAMS) HIT - User:", req.user?.id);
        
        if (!req.isAuthenticated()) {
            console.log("❌ User not authenticated");
            return res.sendStatus(401);
        }

        try {
            const userSkills = req.user?.skills || [];
            // Get country from query parameter or default to Romania
            const userCountry = req.query.country || 'Romania';
            console.log("🔍 QUERY PARAMS RECOMMENDATIONS REQUEST:", {
                userId: req.user.id,
                skills: userSkills,
                country: userCountry,
                timestamp: new Date().toISOString()
            });

            // Use ONLY authentic verified funding opportunities
            const fundingOpportunities = await storage.getMatchingFundingOpportunities(req.user, userCountry);
            console.log(`Found ${fundingOpportunities.length} verified funding opportunities for ${userCountry}`);
            
            // For countries without verified funding, return clear message
            if (fundingOpportunities.length === 0) {
                console.log(`🏛️ No verified funding data for ${userCountry} - returning authentic-only message`);
                return res.json([{
                    id: 0,
                    name: `No Verified Funding Available - ${userCountry}`,
                    description: `We only display authentic, government-verified funding opportunities. No verified funding programs are currently available for ${userCountry} in our database. We recommend checking official government websites for local funding opportunities.`,
                    location: userCountry,
                    company: 'WealthSync - Authentic Data Only',
                    matchScore: 0,
                    type: 'authentic_notice',
                    source: 'Verified funding database',
                    verified: true
                }]);
            }
            
            // Only show verified funding opportunities
            let opportunitiesToMatch = fundingOpportunities;
            console.log(`🏛️ AUTHENTIC FUNDING ONLY: ${fundingOpportunities.length} verified programs for ${userCountry}`);
            
            // Enhanced skill matching
            const getSkillSynonyms = (skill: string) => {
                const skillLower = skill.toLowerCase();
                const synonymMap: { [key: string]: string[] } = {
                    'vr': ['virtual reality', 'immersive', 'mixed reality', 'metaverse', 'gaming', 'simulation', '3d', 'augmented reality', 'ar', 'tech', 'technology', 'innovation', 'digital', 'development', 'startup', 'entertainment'],
                    'software': ['programming', 'development', 'coding', 'app', 'application', 'tech', 'technology', 'digital', 'saas', 'platform', 'system', 'solution', 'startup', 'innovation', 'web', 'mobile', 'enterprise'],
                    'other': ['general', 'business', 'entrepreneurship', 'startup', 'innovation', 'technology', 'development', 'digital', 'consulting', 'services'],
                    'technology': ['tech', 'digital', 'innovation', 'development', 'business', 'solutions']
                };
                return synonymMap[skillLower] || [];
            };

            const recommendations = opportunitiesToMatch.map((job: any) => {
                const jobText = `${job.name} ${job.description} ${job.sector || ''}`.toLowerCase();
                let matchedSkills: any[] = [];
                let totalScore = 0;
                let bestMatchScore = 0;

                userSkills.forEach(skill => {
                    const skillLower = skill.toLowerCase();
                    let skillScore = 0;
                    
                    // Direct match
                    if (jobText.includes(skillLower)) {
                        skillScore += 100;
                        matchedSkills.push({ skill, confidence: 100, matchType: 'direct' });
                    } else {
                        // Check synonyms
                        const synonyms = getSkillSynonyms(skill);
                        let foundSynonym = false;
                        
                        for (const synonym of synonyms) {
                            if (jobText.includes(synonym.toLowerCase())) {
                                let synonymScore = 60;
                                if (['technology', 'innovation', 'development', 'business', 'solutions'].includes(synonym.toLowerCase())) {
                                    synonymScore = 75;
                                }
                                
                                skillScore += synonymScore;
                                matchedSkills.push({ skill, confidence: synonymScore, matchType: 'synonym', matchedTerm: synonym });
                                foundSynonym = true;
                                break;
                            }
                        }
                        
                        // Enhanced partial matching
                        if (!foundSynonym) {
                            if (skillLower.includes('vr') || skillLower.includes('virtual') || skillLower.includes('ar')) {
                                if (jobText.includes('gaming') || jobText.includes('entertainment') || 
                                    jobText.includes('immersive') || jobText.includes('3d') ||
                                    jobText.includes('simulation') || jobText.includes('digital') ||
                                    jobText.includes('technology')) {
                                    skillScore += 65;
                                    matchedSkills.push({ skill, confidence: 65, matchType: 'contextual', matchedTerm: 'VR/AR technology context' });
                                }
                            }
                            else if (skillLower.includes('software') || skillLower.includes('programming')) {
                                if (jobText.includes('app') || jobText.includes('platform') || 
                                    jobText.includes('saas') || jobText.includes('development') ||
                                    jobText.includes('coding') || jobText.includes('system') ||
                                    jobText.includes('technology')) {
                                    skillScore += 70;
                                    matchedSkills.push({ skill, confidence: 70, matchType: 'contextual', matchedTerm: 'software development context' });
                                }
                            }
                            else {
                                if (jobText.includes('technology') || jobText.includes('innovation') || 
                                    jobText.includes('business') || jobText.includes('startup') ||
                                    jobText.includes('digital') || jobText.includes('development')) {
                                    skillScore += 50;
                                    matchedSkills.push({ skill, confidence: 50, matchType: 'contextual', matchedTerm: 'business/tech context' });
                                }
                            }
                        }
                    }
                    
                    totalScore += skillScore;
                    bestMatchScore = Math.max(bestMatchScore, skillScore);
                });

                const finalScore = Math.max(bestMatchScore, Math.round(totalScore / Math.max(userSkills.length, 1)));

                if (matchedSkills.length > 0 || finalScore > 0) {
                    return {
                        ...job,
                        matchScore: Math.min(100, finalScore),
                        matchedSkills
                    };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 15);

            console.log(`✅ Returning ${recommendations.length} recommendations for ${userCountry}`);
            if (recommendations.length > 0) {
                console.log("🏆 Top recommendation:", {
                    name: recommendations[0].name,
                    score: recommendations[0].matchScore,
                    matchedSkills: recommendations[0].matchedSkills?.slice(0, 2),
                    country: userCountry
                });
            }

            res.json(recommendations);
        } catch (error) {
            console.error("Failed to get recommendations:", error);
            res.status(500).json({ 
                error: "Failed to get recommendations",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });

    // Enhanced funding opportunities with You.com API
    app.get("/api/funding/enhanced/:country/:sector", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { country, sector } = req.params;
            console.log(`🌐 YOU.COM API: Searching enhanced funding for ${sector} in ${country}`);
            
            const fundingOpportunities = await youApiService.getFundingOpportunities(country, sector);
            
            console.log(`✅ Found ${fundingOpportunities.length} enhanced funding opportunities`);
            res.json(fundingOpportunities);
        } catch (error) {
            console.error('Enhanced funding search error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch enhanced funding opportunities',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // ===== COMPREHENSIVE AI-POWERED FEATURES =====
    
    // 1. Personalized Business Opportunities
    app.get('/api/ai/opportunities/personalized', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const user = req.user;
            const { region } = req.query;
            
            const opportunities = await comprehensiveAIService.generatePersonalizedOpportunities(
                user.skills || [],
                user.assets || [],
                (region as string) || 'Global'
            );
            
            res.json(opportunities);
        } catch (error) {
            console.error('AI Personalized Opportunities error:', error);
            res.status(500).json({ 
                error: 'Failed to generate personalized opportunities',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 2. Real-Time Competitive Intelligence
    app.get('/api/ai/competitive-intelligence/:industry/:region', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { industry, region } = req.params;
            const analysis = await comprehensiveAIService.generateCompetitiveIntelligence(industry, region);
            res.json(analysis);
        } catch (error) {
            console.error('Competitive Intelligence error:', error);
            res.status(500).json({ 
                error: 'Failed to generate competitive intelligence',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 3. Investment Opportunity Scanner
    app.get('/api/ai/investment-opportunities/:sector', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { sector } = req.params;
            const { riskTolerance = 'medium' } = req.query;
            
            const opportunities = await comprehensiveAIService.generateInvestmentOpportunities(
                sector,
                riskTolerance as 'low' | 'medium' | 'high'
            );
            
            res.json(opportunities);
        } catch (error) {
            console.error('Investment Opportunities error:', error);
            res.status(500).json({ 
                error: 'Failed to generate investment opportunities',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 4. Market Trend Analysis
    app.get('/api/ai/trend-analysis/:industry', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { industry } = req.params;
            const analysis = await comprehensiveAIService.generateTrendAnalysis(industry);
            res.json(analysis);
        } catch (error) {
            console.error('Trend Analysis error:', error);
            res.status(500).json({ 
                error: 'Failed to generate trend analysis',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 5. Smart Business News Feed
    app.get('/api/ai/smart-news-feed', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const user = req.user;
            const { industries } = req.query;
            
            const userIndustries = typeof industries === 'string' ? 
                industries.split(',') : 
                ['Technology', 'Business']; // Default industries
            
            const newsFeed = await comprehensiveAIService.generateSmartNewsFeed(
                user.skills || [],
                userIndustries
            );
            
            res.json(newsFeed);
        } catch (error) {
            console.error('Smart News Feed error:', error);
            res.status(500).json({ 
                error: 'Failed to generate smart news feed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 6. Company Intelligence (for businesses)
    app.get('/api/ai/company-intelligence/:companyName/:industry', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { companyName, industry } = req.params;
            const intelligence = await comprehensiveAIService.generateCompanyIntelligence(companyName, industry);
            res.json(intelligence);
        } catch (error) {
            console.error('Company Intelligence error:', error);
            res.status(500).json({ 
                error: 'Failed to generate company intelligence',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Market intelligence with You.com API
    app.get("/api/market-intelligence/:country/:sector", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const { country, sector } = req.params;
            console.log(`🧠 YOU.COM API: Getting market intelligence for ${sector} in ${country}`);
            
            const marketIntelligence = await youApiService.getMarketIntelligence(country, sector);
            
            console.log(`✅ Market intelligence retrieved for ${sector} in ${country}`);
            res.json(marketIntelligence);
        } catch (error) {
            console.error('Market intelligence error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch market intelligence',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Submit new opportunity
    app.post("/api/opportunities/submit", async (req, res) => {
      try {
        const opportunity = await storage.createOpportunity({
          ...req.body,
          clientSubmitted: true,
          source: "client",
          status: "available"
        });

        // Notify admin
        if (testMailer) {
          await testMailer.sendMail({
            from: "noreply@wealthsync.ai",
            to: "admin@wealthsync.ai",
            subject: `New Opportunity Submitted: ${opportunity.name}`,
            text: `A new opportunity has been submitted:\n\nTitle: ${opportunity.name}\nDescription: ${opportunity.description}\nEarnings: $${opportunity.earnings}\nContact: ${opportunity.clientEmail}`,
          });
        }

        res.status(201).json(opportunity);
      } catch (error) {
        console.error("Failed to submit opportunity:", error);
        res.status(500).json({ error: "Failed to submit opportunity" });
      }
    });
    // Personal Finance AI Agent routes
    app.post("/api/personal-finance/analyze", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            const { income, expenses } = req.body;
            
            if (!income || !expenses || typeof income !== 'number') {
                return res.status(400).json({ error: "Valid income and expenses data required" });
            }

            const { personalFinanceService } = await import("./services/personal-finance-service");
            const analysis = await personalFinanceService.generateBudgetAnalysis(
                income,
                expenses,
                req.user.id
            );

            res.json(analysis);
        } catch (error) {
            console.error("Personal finance analysis error:", error);
            res.status(500).json({ error: "Failed to generate financial analysis" });
        }
    });

    // ===== INVESTMENT STRATEGIST AI ROUTES (PREMIUM ONLY) =====

  // Create or update investment profile
  app.post("/api/investment/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      const { investmentStrategistService } = await import("./services/investment-strategist-service");
      const profileData = req.body;
      
      // Add user ID to profile
      profileData.userId = req.user.id;

      // Store profile in database (simplified for now)
      const profile = await storage.createInvestmentProfile(profileData);
      
      res.json({ message: "Investment profile created successfully", profile });
    } catch (error) {
      console.error("Investment profile creation error:", error);
      res.status(500).json({ error: "Failed to create investment profile" });
    }
  });

  // Generate comprehensive investment analysis
  app.post("/api/investment/analyze", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      console.log('=== INVESTMENT ANALYSIS REQUEST ===');
      console.log('User ID:', req.user.id);
      console.log('Request body:', req.body);
      
      const { investmentStrategistService } = await import("./services/investment-strategist-service");
      const profileData = req.body;
      
      console.log('Starting investment analysis for user:', req.user.id, 'with profile age:', profileData.currentAge);
      
      // Generate comprehensive investment analysis
      const analysis = await investmentStrategistService.generateInvestmentAnalysis(profileData);
      
      console.log('=== ANALYSIS GENERATED ===');
      console.log('Generated analysis summary:', {
        hasRecommendedPortfolio: !!analysis.recommendedPortfolio,
        portfolioStocks: analysis.recommendedPortfolio?.stocks,
        specificInvestmentCount: analysis.specificInvestments?.length || 0,
        firstInvestment: analysis.specificInvestments?.[0]?.symbol,
        hasMonthlyPlan: !!analysis.monthlyInvestmentPlan,
        analysisKeys: Object.keys(analysis)
      });
      
      console.log('Full analysis object keys:', Object.keys(analysis));
      console.log('First specific investment:', analysis.specificInvestments?.[0]);
      
      // Store analysis in database for future reference
      console.log('About to save analysis to database...');
      const savedAnalysis = await storage.saveInvestmentAnalysis(req.user.id, analysis);
      console.log('Analysis saved successfully with ID:', savedAnalysis.id);
      
      res.json(analysis);
    } catch (error) {
      console.error("=== INVESTMENT ANALYSIS ERROR ===", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to generate investment analysis" });
    }
  });

  // Get user's investment profile
  app.get("/api/investment/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      const profile = await storage.getInvestmentProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      console.error("Get investment profile error:", error);
      res.status(500).json({ error: "Failed to retrieve investment profile" });
    }
  });

  // Get user's investment analysis history
  app.get("/api/investment/analyses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      const analyses = await storage.getInvestmentAnalyses(req.user.id);
      res.json(analyses);
    } catch (error) {
      console.error("Get investment analyses error:", error);
      res.status(500).json({ error: "Failed to retrieve investment analyses" });
    }
  });

  // Add portfolio holding
  app.post("/api/investment/portfolio/holdings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      const holdingData = {
        ...req.body,
        userId: req.user.id
      };
      
      const holding = await storage.addPortfolioHolding(holdingData);
      res.json({ message: "Portfolio holding added successfully", holding });
    } catch (error) {
      console.error("Add portfolio holding error:", error);
      res.status(500).json({ error: "Failed to add portfolio holding" });
    }
  });

  // Get user's portfolio holdings
  app.get("/api/investment/portfolio/holdings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has premium subscription
    if (!req.user.subscriptionTier || req.user.subscriptionTier === 'free') {
      return res.status(403).json({ error: "Premium subscription required for Investment Strategist features" });
    }

    try {
      const holdings = await storage.getPortfolioHoldings(req.user.id);
      res.json(holdings);
    } catch (error) {
      console.error("Get portfolio holdings error:", error);
      res.status(500).json({ error: "Failed to retrieve portfolio holdings" });
    }
  });

  app.get("/api/personal-finance/goals", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            const goals = await storage.getFinancialGoals(req.user.id);
            res.json(goals || []);
        } catch (error) {
            console.error("Error fetching financial goals:", error);
            res.status(500).json({ error: "Failed to fetch financial goals" });
        }
    });

    // Enhanced pursue opportunity endpoint with country-aware actionable guidance
    app.post("/api/opportunities/:id/pursue", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }

        try {
            const opportunityId = parseInt(req.params.id);
            const { country } = req.body; // Get country from request body
            
            if (isNaN(opportunityId)) {
                return res.status(400).json({
                    error: "Invalid opportunity ID"
                });
            }

            console.log(`🎯 PURSUE REQUEST: User ${req.user.id} pursuing opportunity ${opportunityId} for country: ${country || 'not specified'}`);

            // Special handling for country-specific funding exploration (ID 999999)
            if (opportunityId === 999999) {
                console.log(`🌍 LIVE COUNTRY FUNDING EXPLORATION: User ${req.user.id} exploring funding for: ${country}`);
                
                if (!country || country === 'not specified') {
                    return res.status(400).json({
                        error: "Country must be specified for funding exploration"
                    });
                }

                console.log(`🔍 MAKING LIVE API CALL: Fetching real-time funding data for ${country}`);
                
                // Make live API call to You.com for real-time funding opportunities
                try {
                    const liveFundingData = await youApiService.getFundingOpportunities(country, 'Technology');
                    console.log(`📡 LIVE API RESPONSE: Found ${liveFundingData.length} real-time opportunities from You.com API`);
                    
                    if (liveFundingData.length > 0) {
                        // Convert You.com API response to our format
                        const liveOpportunities = liveFundingData.map((funding: any) => ({
                            id: Date.now() + (++uniqueIdCounter),
                            name: funding.title || `Live Funding Program - ${country}`,
                            description: funding.description || `Real-time funding opportunity discovered for ${country}`,
                            amount: funding.amount || 0,
                            provider: funding.provider || `${country} Government`,
                            type: funding.type || 'Government Grant',
                            country: country,
                            deadline: funding.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                            eligibility: funding.eligibility || [`${country} businesses`, 'Technology sector'],
                            applicationUrl: funding.url || `https://gov.${country.toLowerCase()}.com/funding`,
                            lastUpdated: new Date().toISOString(),
                            isLiveData: true
                        }));
                        
                        const topFunding = liveOpportunities[0];
                        
                        return res.json({
                            type: "live_country_funding_exploration",
                            message: `Discovered ${liveOpportunities.length} LIVE funding programs in ${country} (Real-time API data)`,
                            opportunity: topFunding,
                            countryContext: {
                                selectedCountry: country,
                                totalOpportunities: liveOpportunities.length,
                                availableFunding: liveOpportunities.reduce((sum: number, f: any) => sum + (f.amount || 0), 0),
                                allPrograms: liveOpportunities.map((f: any) => ({
                                    name: f.name,
                                    amount: f.amount,
                                    provider: f.provider,
                                    type: f.type,
                                    isLiveData: true,
                                    apiSource: 'You.com Real-time API'
                                }))
                            },
                            dataSource: {
                                type: 'live_api',
                                provider: 'You.com API', 
                                timestamp: new Date().toISOString(),
                                isRealTime: true
                            }
                        });
                    }
                } catch (liveApiError) {
                    console.error(`❌ LIVE API ERROR for ${country}:`, liveApiError);
                }
                
                // Fallback to database if live API fails or returns no results
                console.log(`💰 Fallback: Using database for ${country}`);
                const countryFunding = await storage.getFundingOpportunitiesByCountry(country);
                
                if (countryFunding.length > 0) {
                    const topFunding = countryFunding[0];
                    
                    return res.json({
                        type: "country_funding_exploration",
                        message: `Discovered ${countryFunding.length} authentic funding programs in ${country}`,
                        opportunity: topFunding,
                        countryContext: {
                            selectedCountry: country,
                            totalOpportunities: countryFunding.length,
                            availableFunding: countryFunding.reduce((sum, f) => sum + (f.amount || 0), 0),
                            allPrograms: countryFunding.map(f => ({
                                name: f.name,
                                amount: f.amount,
                                provider: f.provider,
                                type: f.type
                            }))
                        },
                        nextSteps: {
                            title: `${countryFunding.length} Authentic Funding Programs in ${country}`,
                            steps: [
                                {
                                    step: 1,
                                    title: "Review All Programs",
                                    description: `${countryFunding.length} verified government programs available`,
                                    action: "review"
                                },
                                {
                                    step: 2,
                                    title: "Check Eligibility", 
                                    description: `Review requirements: ${topFunding.eligibilityCriteria?.requirements?.join(', ') || 'See official websites'}`,
                                    action: "required"
                                },
                                {
                                    step: 3,
                                    title: "Official Applications",
                                    description: `Apply through ${country} government websites`,
                                    url: topFunding.applicationUrl || topFunding.eligibilityCriteria?.website,
                                    action: "external_link"
                                },
                                {
                                    step: 4,
                                    title: "Submit Applications",
                                    description: `Multiple deadlines available - act quickly`,
                                    action: "time_sensitive"
                                }
                            ],
                            additionalInfo: {
                                totalFunding: `$${countryFunding.reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString()}`,
                                topProgram: topFunding.name,
                                topAmount: `$${topFunding.amount?.toLocaleString() || 'Amount varies'}`,
                                country: country,
                                programs: countryFunding.length
                            }
                        }
                    });
                } else {
                    return res.json({
                        type: "no_country_funding_exploration",
                        message: `No verified funding programs available in ${country}`,
                        opportunity: {
                            name: `Funding Exploration - ${country}`,
                            description: `No verified funding opportunities available for ${country}.`,
                            country: country
                        },
                        countryContext: {
                            selectedCountry: country,
                            totalOpportunities: 0,
                            availableFunding: 0,
                            allPrograms: []
                        },
                        nextSteps: {
                            title: `Research Options for ${country}`,
                            steps: [
                                {
                                    step: 1,
                                    title: "Government Websites",
                                    description: `Visit official ${country} government business development websites`,
                                    action: "research"
                                },
                                {
                                    step: 2,
                                    title: "Local Agencies", 
                                    description: `Contact business incubators and development agencies in ${country}`,
                                    action: "networking"
                                },
                                {
                                    step: 3,
                                    title: "Regional Programs",
                                    description: "Explore international and regional funding opportunities",
                                    action: "research"
                                },
                                {
                                    step: 4,
                                    title: "Private Funding",
                                    description: "Research venture capital and private investors in the region",
                                    action: "networking"
                                }
                            ],
                            additionalInfo: {
                                country: country,
                                message: "Authentic data only - no synthetic opportunities",
                                suggestion: "Try exploring countries with verified programs like Germany, Canada, or Australia"
                            }
                        }
                    });
                }
            }

            // If pursuing a funding opportunity from map, find relevant funding for the selected country
            if (country && country !== 'not specified') {
                console.log(`🌍 Country-specific pursue request for: ${country}`);
                
                // Get authentic funding opportunities for the selected country
                const countryFunding = await storage.getFundingOpportunitiesByCountry(country);
                console.log(`💰 Found ${countryFunding.length} funding opportunities for ${country}`);
                
                if (countryFunding.length > 0) {
                    const topFunding = countryFunding[0]; // Get the best funding opportunity
                    
                    return res.json({
                        type: "country_funding_opportunity",
                        message: `Found authentic funding opportunities in ${country}`,
                        opportunity: topFunding,
                        countryContext: {
                            selectedCountry: country,
                            totalOpportunities: countryFunding.length,
                            availableFunding: countryFunding.reduce((sum, f) => sum + (f.amount || 0), 0)
                        },
                        nextSteps: {
                            title: `How to Apply for Funding in ${country}`,
                            steps: [
                                {
                                    step: 1,
                                    title: "Review Requirements",
                                    description: `Check eligibility criteria: ${topFunding.eligibilityCriteria?.requirements?.join(', ') || 'See official website'}`,
                                    action: "required"
                                },
                                {
                                    step: 2,
                                    title: "Visit Official Application",
                                    description: `Apply directly through the ${country} government website`,
                                    url: topFunding.applicationUrl || topFunding.eligibilityCriteria?.website,
                                    action: "external_link"
                                },
                                {
                                    step: 3,
                                    title: "Prepare Documents",
                                    description: `Business plan, financial statements, project proposal (${country} specific requirements)`,
                                    action: "user_preparation"
                                },
                                {
                                    step: 4,
                                    title: "Submit Application",
                                    description: `Deadline: ${new Date(topFunding.applicationDeadline).toLocaleDateString()}`,
                                    action: "time_sensitive"
                                }
                            ],
                            additionalInfo: {
                                amount: `${topFunding.amount ? '$' + topFunding.amount.toLocaleString() : 'Amount varies'}`,
                                provider: topFunding.provider,
                                type: topFunding.type,
                                sector: topFunding.sector,
                                country: country
                            }
                        }
                    });
                } else {
                    // No funding available for this country
                    return res.json({
                        type: "no_country_funding",
                        message: `No verified funding programs available in ${country}`,
                        opportunity: {
                            name: `No Verified Funding Available - ${country}`,
                            description: `We only display authentic, government-verified funding opportunities. No verified funding programs are currently available for ${country} in our database.`,
                            country: country
                        },
                        countryContext: {
                            selectedCountry: country,
                            totalOpportunities: 0,
                            availableFunding: 0
                        },
                        nextSteps: {
                            title: `Alternative Options for ${country}`,
                            steps: [
                                {
                                    step: 1,
                                    title: "Check Government Websites",
                                    description: `Visit official ${country} government websites for local funding programs`,
                                    action: "research"
                                },
                                {
                                    step: 2,
                                    title: "Contact Local Agencies",
                                    description: `Reach out to business development agencies in ${country}`,
                                    action: "networking"
                                },
                                {
                                    step: 3,
                                    title: "Consider Regional Programs",
                                    description: "Look for regional or international funding opportunities",
                                    action: "research"
                                },
                                {
                                    step: 4,
                                    title: "Private Funding",
                                    description: "Explore private investors and venture capital in the region",
                                    action: "networking"
                                }
                            ],
                            additionalInfo: {
                                country: country,
                                message: "We maintain authentic data only - no fake opportunities"
                            }
                        }
                    });
                }
            }

            // Check for regular opportunities or funding opportunities by ID
            const opportunity = await storage.getOpportunityById(opportunityId);
            if (!opportunity) {
                // Check if it's a funding opportunity instead
                const fundingOpportunity = await storage.getFundingOpportunityById(opportunityId);
                if (fundingOpportunity) {
                    return res.json({
                        type: "funding_opportunity",
                        message: "Ready to apply for this funding program",
                        opportunity: fundingOpportunity,
                        nextSteps: {
                            title: "How to Apply for This Funding",
                            steps: [
                                {
                                    step: 1,
                                    title: "Review Requirements",
                                    description: `Check eligibility criteria: ${fundingOpportunity.eligibilityCriteria?.requirements?.join(', ') || 'See official website'}`,
                                    action: "required"
                                },
                                {
                                    step: 2,
                                    title: "Visit Official Application",
                                    description: `Apply directly through the official government website`,
                                    url: fundingOpportunity.applicationUrl || fundingOpportunity.eligibilityCriteria?.website,
                                    action: "external_link"
                                },
                                {
                                    step: 3,
                                    title: "Prepare Documents",
                                    description: "Business plan, financial statements, project proposal",
                                    action: "user_preparation"
                                },
                                {
                                    step: 4,
                                    title: "Submit Application",
                                    description: `Deadline: ${new Date(fundingOpportunity.applicationDeadline).toLocaleDateString()}`,
                                    action: "time_sensitive"
                                }
                            ],
                            additionalInfo: {
                                amount: `${fundingOpportunity.amount ? '$' + fundingOpportunity.amount.toLocaleString() : 'Amount varies'}`,
                                provider: fundingOpportunity.provider,
                                type: fundingOpportunity.type,
                                sector: fundingOpportunity.sector
                            }
                        }
                    });
                }
                
                return res.status(404).json({
                    error: "Opportunity not found"
                });
            }

            // For regular opportunities - update status and provide guidance
            const updatedOpportunity = await storage.updateOpportunity(opportunityId, {
                ...opportunity,
                status: "pursued",
                userId: req.user.id
            });

            // Provide actionable next steps based on opportunity type
            const nextSteps = {
                title: "Your Next Steps",
                steps: [
                    {
                        step: 1,
                        title: "Prepare Your Approach",
                        description: "Review the opportunity details and tailor your skills/experience to match",
                        action: "user_preparation"
                    },
                    {
                        step: 2,
                        title: "Research the Company",
                        description: `Learn more about ${opportunity.company || 'the organization'} and their business`,
                        action: "research"
                    },
                    {
                        step: 3,
                        title: "Make Contact",
                        description: opportunity.url ? "Visit the opportunity link to apply" : "Reach out through professional networks",
                        url: opportunity.url,
                        action: opportunity.url ? "external_link" : "networking"
                    },
                    {
                        step: 4,
                        title: "Follow Up",
                        description: "Track your application and follow up professionally",
                        action: "user_tracking"
                    }
                ],
                additionalInfo: {
                    earnings: opportunity.earnings ? `$${opportunity.earnings.toLocaleString()}` : 'Earnings vary',
                    location: opportunity.location || 'Location flexible',
                    company: opportunity.company || 'Company details in opportunity link'
                }
            };

            res.json({
                type: "regular_opportunity",
                message: "Opportunity marked as pursued - here's what to do next",
                opportunity: updatedOpportunity,
                nextSteps
            });

        } catch (error) {
            console.error("Failed to pursue opportunity:", error);
            res.status(500).json({
                error: "Failed to pursue opportunity",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });

    // Add the application route handler for funding opportunities
    app.get("/api/funding-opportunities/:id/apply", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const opportunityId = parseInt(req.params.id);
        const opportunity = await storage.getFundingOpportunityById(opportunityId);

        if (!opportunity) {
          return res.status(404).json({ error: "Funding opportunity not found" });
        }

        // Return the opportunity details needed for application
        res.json({
          id: opportunity.id,
          name: opportunity.name,
          provider: opportunity.provider,
          applicationUrl: opportunity.applicationUrl,
          amount: opportunity.amount,
          description: opportunity.description,
          applicationDeadline: opportunity.applicationDeadline
        });
      } catch (error) {
        console.error("Failed to get funding opportunity application:", error);
        res.status(500).json({ 
          error: "Failed to get funding opportunity application",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Company authentication routes
    app.get("/api/company", (req, res) => {
      if (!req.session) {
        console.log("No session available");
        return res.status(401).json({ error: "No session available" });
      }

      console.log("Company auth check - session info:", {
        hasSession: true,
        sessionID: req.sessionID,
        hasCompanyData: !!req.session.company
      });

      if (req.session.company) {
        // Refresh session to extend expiration
        req.session.touch();

        console.log("Company authentication check: Logged in as", req.session.company.name);
        // Return company data without the password
        const { password, ...companyData } = req.session.company;
        res.json(companyData);
      } else {
        console.log("Company authentication check: Not logged in");
        res.status(401).json({ error: "Not authenticated as a company" });
      }
    });

    // Company registration and authentication routes
    app.post("/api/company/register", async (req, res) => {
      try {
        console.log("Attempting company registration, received data:", { ...req.body, password: '[REDACTED]' });

        // Validate input using schema
        const validationResult = insertCompanySchema.safeParse(req.body);
        if (!validationResult.success) {
          console.error("Validation failed:", validationResult.error);
          return res.status(400).json({
            error: "Invalid input", 
            message: "Please check all required fields",
            details: validationResult.error.errors
          });
        }

        // Check for existing company by name and email 
        const [existingCompanyByName, existingCompanyByEmail] = await Promise.all([
          storage.getCompanyByName(req.body.name),
          storage.getCompanyByEmail(req.body.primaryContactEmail)
        ]);

        if (existingCompanyByName) {
          return res.status(400).json({
            error: "Company already exists",
            message: "A company with this name is already registered"
          });
        }

        if (existingCompanyByEmail) {
          return res.status(400).json({
            error: "Email already registered", 
            message: "This email address is already associated with a company"
          });
        }

        // Hash the password before storing
        const hashedPassword = await hashPassword(req.body.password);

        // Create the company record with validated data
        const company = await storage.createCompany({
          ...validationResult.data,
          password: hashedPassword,
          verificationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Set the company in the session if it exists
        if (req.session) {
          const companyWithEmail = {
            ...company,
            email: company.email || company.primaryContactEmail // Ensure we have email set
          };
          req.session.company = companyWithEmail;

          // Explicitly save the session
          req.session.save((err) => {
            if (err) {
              console.error("Error saving company session during registration:", err);
              return res.status(500).json({
                error: "Registration succeeded but session failed",
                message: "Your account was created but you may need to log in again"
              });
            }

            console.log("Company registered successfully:", { ...company, password: '[REDACTED]' });
            storage.createNotification({
              companyId: company.id,
              type: 'system',
              title: 'Welcome to WealthSync AI!',
              message: 'Your company account is ready. Set up your profile, add services, and start connecting with clients.',
              link: '/company/dashboard',
            }).catch(e => console.error('Company welcome notification error:', e));
            // Return company data without the password
            const { password: _, ...companyData } = companyWithEmail;
            res.status(201).json(companyData);
          });
        } else {
          console.log("Company registered but no session available");
          const { password: _, ...companyData } = company;
          res.status(201).json(companyData);
        }
      } catch (error) {
        console.error("Company registration failed:", error);
        res.status(500).json({
          error: "Registration failed",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
    });

    // Authentication endpoints
    app.post("/api/register", async (req, res, next) => {
      console.log("Register attempt received:", { 
        username: req.body.username,
        hasPassword: !!req.body.password,
        hasEmail: !!req.body.email
      });

      if (!req.body.username || !req.body.password) {
        return res.status(400).json({
          error: "Missing credentials",
          message: "Username and password are required"
        });
      }

      try {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({
            error: "Username already exists",
            message: "Please choose a different username"
          });
        }

        const hashedPassword = await hashPassword(req.body.password);
        const user = await storage.createUser({
          ...req.body,
          password: hashedPassword
        });

        console.log("User registered successfully:", {
          id: user.id,
          username: user.username,
          hasPassword: !!user.password
        });

        req.login(user, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return next(err);
          }
          storage.createNotification({
            userId: user.id,
            type: 'system',
            title: 'Welcome to WealthSync AI!',
            message: 'Your account is ready. Explore AI agents, funding opportunities, and market insights from your dashboard.',
            link: '/dashboard',
          }).catch(e => console.error('Welcome notification error:', e));
          res.status(201).json(user);
        });
      } catch (error) {
        console.error("Registration failed:", error);
        res.status(500).json({
          error: "Registration failed",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
    });

    // Login route with better logging and support for email login
    app.post("/api/login", (req, res, next) => {
      console.log("Login attempt received:", { 
        identifier: req.body.username || req.body.email,
        hasPassword: !!req.body.password,
        emailProvided: !!req.body.email 
      });

      // Use username for consistency in passport strategy while allowing email or username field for client flexibility
      const username = req.body.username || req.body.email;
      const password = req.body.password;

      if (!username || !password) {
        return res.status(400).json({
          error: "Missing credentials",
          message: "Username/email and password are required"
        });
      }
      
      // Override the username in the body for passport to handle
      req.body.username = username;

      passport.authenticate("local", (err: Error | null, user: Express.User | false | null, info: {message: string} | undefined) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ 
            error: "Internal server error",
            message: "An unexpected error occurred" 
          });
        }

        if (!user) {
          console.log("Authentication failed:", info);
          return res.status(401).json({ 
            error: "Authentication failed",
            message: info?.message || "Invalid username or password" 
          });
        }

        req.login(user, (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ 
              error: "Session error", 
              message: "Failed to create session"
            });
          }

          // Explicitly save the session to ensure persistence
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ 
                error: "Session error", 
                message: "Failed to save session"
              });
            }

            console.log("Login successful for user:", user.username, "Session ID:", req.sessionID);
            storage.createNotification({
              userId: user.id,
              type: 'system',
              title: 'New sign-in detected',
              message: `You signed in on ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
            }).catch(e => console.error('Login notification error:', e));
            res.json(user);
          });
        });
      })(req, res, next);
    });

    // Update company login with better logging and explicit session save
    app.post("/api/company/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        console.log("Company login attempt for email:", email);

        if (!email || !password) {
          console.log("Missing credentials in company login");
          return res.status(400).json({
            error: "Missing credentials",
            message: "Email and password are required"
          });
        }

        const company = await storage.getCompanyByEmail(email.toLowerCase().trim());
        console.log("Company lookup result:", company ? "Found" : "Not found");

        if (!company) {
          console.log("Company not found for email:", email);
          return res.status(401).json({
            error: "Authentication failed",
            message: "Invalid email or password"
          });
        }

        if (!company.password) {
          console.log("Company has no password set:", email);
          return res.status(401).json({
            error: "Authentication failed", 
            message: "Account not properly configured"
          });
        }

        // Verify password
        const isValidPassword = await comparePasswords(password, company.password);
        console.log("Password verification result:", isValidPassword ? "Valid" : "Invalid");

        if (!isValidPassword) {
          console.log("Invalid password attempt for company:", email);
          return res.status(401).json({
            error: "Authentication failed",
            message: "Invalid email or password"
          });
        }

        // Set the company in the session and explicitly save it
        if (req.session) {
          // Make sure the company object has all required fields for the frontend
          const companyWithEmail = {
            ...company,
            email: company.email || company.primaryContactEmail // Ensure we have email set
          };

          // Log session details before setting company
          console.log("Session before setting company:", {
            sessionID: req.sessionID,
            hasCompanyData: !!req.session.company,
            cookieMaxAge: req.session.cookie.maxAge,
            cookieHttpOnly: req.session.cookie.httpOnly,
            cookieSecure: req.session.cookie.secure
          });

          // Ensure session cookie settings are optimized for our use case
          req.session.cookie.sameSite = 'lax';
          req.session.cookie.maxAge = 86400000; // 24 hours

          // Set the company in the session
          req.session.company = companyWithEmail;

          // Explicitly save the session
          req.session.save((err) => {
            if (err) {
              console.error("Error saving company session:", err);
              return res.status(500).json({
                error: "Login failed",
                message: "Failed to save session"
              });
            }

            // Log session after save
            console.log("Company login successful, session saved:", { 
              id: company.id, 
              name: company.name,
              sessionID: req.sessionID,
              companyInSession: !!req.session.company,
              companyId: req.session.company?.id
            });

            // Return company data without the password
            const { password: _, ...companyData } = companyWithEmail;
            res.json(companyData);
          });
        } else {
          console.error("No session available for company login");
          res.status(500).json({
            error: "Login failed",
            message: "Session not available"
          });
        }
      } catch (error) {
        console.error("Company login failed:", error);
        res.status(500).json({
          error: "Login failed",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
    });



    // Company logout route
    app.post("/api/company/logout", (req, res) => {
      console.log("Company logout request received, session info:", {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        hasCompanyData: req.session && !!req.session.company
      });

      if (req.session && req.session.company) {
        console.log("Logging out company:", req.session.company.name);
        req.session.company = undefined;

        // Use regenerate instead of save to fully reset the session
        req.session.regenerate((err) => {
          if (err) {
            console.error("Error regenerating session after company logout:", err);
            return res.status(500).json({ error: "Logout failed" });
          }
          console.log("Session successfully regenerated after company logout");
          res.sendStatus(200);
        });
      } else {
        console.log("No company session found to logout");
        res.sendStatus(200); // Already logged out
      }
    });

    // Direct authentication endpoint for company video upload
    app.post("/api/company/direct-auth", async (req, res) => {
      try {
        // Ensure directAuthTokens map is initialized at the top of the handler
        if (typeof global.directAuthTokens === 'undefined') {
          console.log("Initializing global auth token map in direct-auth endpoint");
          global.directAuthTokens = new Map();
        }

        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: "Email and password required" });
        }

        console.log("Direct authentication request for company email:", email);

        // Find company by email
        const company = await storage.getCompanyByEmail(email);
        if (!company) {
          console.log("Direct auth failed: Company not found");
          return res.status(401).json({ error: "Authentication failed" });
        }

        console.log("Company found:", company.id, company.name);

        // Verify password
        const passwordValid = await comparePasswords(password, company.password);
        if (!passwordValid) {
          console.log("Direct auth failed: Invalid password");
          return res.status(401).json({ error: "Authentication failed" });
        }

        // Check premium status
        if (company.subscriptionTier !== SubscriptionTier.PREMIUM && company.subscriptionTier !== SubscriptionTier.ELITE && company.subscriptionTier !== SubscriptionTier.ENTERPRISE) {
          console.log(`Direct auth failed: Company subscription tier ${company.subscriptionTier} is not elite+`);
          return res.status(403).json({ 
            error: "Elite feature", 
            details: "Video uploads are only available for Elite and Enterprise accounts" 
          });
        }

        // Generate temporary auth token (good for 10 minutes)
        const tempAuthToken = randomBytes(32).toString('hex');

        // Store token in global map
        const tokenData = {
          companyId: company.id,
          expires: Date.now() + (10 * 60 * 1000) // 10 minutes
        };

        global.directAuthTokens.set(tempAuthToken, tokenData);

        console.log(`Direct auth successful for company ${company.id}, token created: ${tempAuthToken.substring(0, 10)}...`);
        console.log(`Current token count in map: ${global.directAuthTokens.size}`);

        // Return success with token and company details
        return res.json({
          success: true,
          token: tempAuthToken,
          companyId: company.id,
          name: company.name,
          isPremium: true
        });
      } catch (error) {
        console.error("Error in direct company authentication:", error);
        return res.status(500).json({ error: "Authentication failed" });
      }
    });

    // Configure multer for video uploads
    const videoStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'public/uploads/videos');
        // Create videos directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `company-video-${uniqueId}${ext}`);
      }
    });

    const videoUpload = multer({
      storage: videoStorage,
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
      },
      fileFilter: function (req, file, cb) {
        // Accept only video formats
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only MP4, QuickTime, and WebM videos are allowed.'));
        }
      }
    });

    // Ensure the uploads directory exists for company videos
    const videoUploadsDir = path.join(process.cwd(), 'public/uploads/videos');
    if (!fs.existsSync(videoUploadsDir)) {
      fs.mkdirSync(videoUploadsDir, { recursive: true });
    }

    // Serve video files from the uploads directory
    // Serve video uploads from a consistent location
    app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

    // Public company directory (no auth needed)
    app.get("/api/companies/directory", async (req, res) => {
      try {
        const { industry, country, search, tier } = req.query;
        // Pull all verified companies from DB
        const allCompanies = await storage.getAllCompanies?.() || [];
        let filtered = allCompanies.filter((c: any) =>
          c.verificationStatus === 'verified' || c.verificationStatus === 'pending'
        );
        if (industry) filtered = filtered.filter((c: any) =>
          c.industries?.some((i: string) => i.toLowerCase().includes((industry as string).toLowerCase()))
        );
        if (country) filtered = filtered.filter((c: any) =>
          c.headquarters?.toLowerCase().includes((country as string).toLowerCase())
        );
        if (search) {
          const q = (search as string).toLowerCase();
          filtered = filtered.filter((c: any) =>
            c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
          );
        }
        if (tier) filtered = filtered.filter((c: any) => c.subscriptionTier === tier);
        const publicList = filtered.map((c: any) => ({
          id: c.id, name: c.name, description: c.description, website: c.website,
          logo: c.logo, headquarters: c.headquarters, industries: c.industries,
          foundedYear: c.foundedYear, employeeCount: c.employeeCount,
          verificationStatus: c.verificationStatus, subscriptionTier: c.subscriptionTier,
          profileVideo: c.profileVideo,
        }));
        res.json(publicList);
      } catch (error: any) {
        console.error("Error fetching company directory:", error);
        res.status(500).json({ error: "Failed to fetch companies" });
      }
    });

    // Public company profile by id (no auth needed)
    app.get("/api/companies/:id/public", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid company ID" });
        const company = await storage.getCompany(id);
        if (!company) return res.status(404).json({ error: "Company not found" });
        const services = await storage.getCompanyServices(id);
        const reviews = await storage.getCompanyReviews(id);
        // Strip sensitive fields
        const { passwordHash, ...rest } = company as any;
        res.json({ ...rest, services, reviews });
      } catch (error: any) {
        console.error("Error fetching public company profile:", error);
        res.status(500).json({ error: "Failed to fetch company profile" });
      }
    });

    // Update company profile details
    app.put("/api/company/profile", companyAuthMiddleware, async (req, res) => {
      try {
        const companyId = (req as any).company?.id || req.session.company?.id;
        if (!companyId) return res.status(401).json({ error: "Not authenticated" });

        const allowed = ['name', 'description', 'website', 'headquarters', 'primaryContact',
          'primaryContactEmail', 'primaryContactPhone', 'industries', 'foundedYear', 'employeeCount'];
        const updates: Record<string, any> = {};
        for (const field of allowed) {
          if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

        const updated = await storage.updateCompany(companyId, updates);
        // Refresh session data
        if (req.session.company) {
          Object.assign(req.session.company, updates);
        }
        res.json(updated);
      } catch (error: any) {
        console.error("Error updating company profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    });

    // Company Profile Video Upload (Premium feature)
    app.post("/api/company/profile-video", videoUpload.single('video'), async (req, res) => {
      try {
        console.log("Profile video upload request received");

        // Log request info
        console.log("Request info:", {
          headers: {
            'x-company-id': req.headers['x-company-id'],
            'x-company-auth': req.headers['x-company-auth'],
            'x-auth-token': req.headers['x-auth-token'] ? '(token present)' : '(no token)',
            'content-type': req.headers['content-type'],
          },
          query: req.query,
          body: Object.keys(req.body || {}),
          filePresent: !!req.file,
          cookies: req.cookies ? Object.keys(req.cookies) : [],
        });

        console.log("Session info:", {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          cookieMaxAge: req.session?.cookie?.maxAge,
          cookiePath: req.session?.cookie?.path,
          cookieDomain: req.session?.cookie?.domain,
          cookieSecure: req.session?.cookie?.secure,
          cookieHttpOnly: req.session?.cookie?.httpOnly,
          cookieSameSite: req.session?.cookie?.sameSite,
          hasCompanyData: req.session && !!req.session.company
        });

        // Check custom headers for company info
        const companyIdHeader = req.headers['x-company-id'];
        const companyAuthHeader = req.headers['x-company-auth'];
        const authTokenHeader = req.headers['x-auth-token'];
        let useDirectAuth = false;
        let directCompanyId: number | null = null;

        // Check for direct auth token
        if (authTokenHeader && typeof authTokenHeader === 'string') {
          console.log("Direct auth token detected:", authTokenHeader.substring(0, 10) + "...");

          // Ensure global token map exists
          if (!global.directAuthTokens) {
            global.directAuthTokens = new Map();
            console.log("Initialized direct auth token map during request");
          }

          // Check if the token exists and is valid
          if (global.directAuthTokens.has(authTokenHeader)) {
            const tokenData = global.directAuthTokens.get(authTokenHeader);

            if (tokenData && Date.now() < tokenData.expires) {
              directCompanyId = tokenData.companyId;
              console.log(`Valid auth token found for company ID: ${directCompanyId}`);
              useDirectAuth = true;
            } else {
              console.log("Auth token expired or invalid");
              global.directAuthTokens.delete(authTokenHeader); // Remove expired token
            }
          } else {
            console.log("Auth token not found in token map");
            console.log("Current tokens in map:", Array.from(global.directAuthTokens.keys()).map(key => key.substring(0, 10) + "..."));
          }
        }

        // Fallback to header-based direct auth
        if (!useDirectAuth && companyIdHeader && companyAuthHeader === 'true') {
          console.log("Direct company authentication via headers detected");
          directCompanyId = parseInt(companyIdHeader as string, 10);
          if (!isNaN(directCompanyId)) {
            console.log(`Using direct company ID: ${directCompanyId}`);
            useDirectAuth = true;
          }
        }

        // Check if company is authenticated in session
        if (!useDirectAuth && (!req.session || !req.session.company)) {
          // Try to recover company session from the database by session ID
          if (req.sessionID) {
            console.log("Attempting to recover company session using sessionID:", req.sessionID);

            try {
              // Get session from database using session store
              const sessionFromStore = await new Promise<any>((resolve, reject) => {
                storage.sessionStore.get(req.sessionID, (err, session) => {
                  if (err) reject(err);
                  else resolve(session);
                });
              });

              if (sessionFromStore && sessionFromStore.company) {
                console.log("Recovered company session:", sessionFromStore.company.id);
                // Set the company data in the current session
                if (!req.session) {
                  req.session = {} as any;
                }
                req.session.company = sessionFromStore.company;

                // Save the restored session
                await new Promise<void>((resolve, reject) => {
                  req.session.save((err) => {
                    if (err) reject(err);
                    else resolve();
                  });
                });

                console.log("Restored company session successfully");
              } else {
                console.log("No company found in stored session");
              }
            } catch (error) {
              console.error("Error recovering session:", error);
            }
          }

          // Check again after recovery attempt
          if (!useDirectAuth && (!req.session || !req.session.company)) {
            console.log("Video upload auth failed - No company in session after recovery attempt");
            return res.status(401).json({ 
              error: "Authentication required", 
              details: "You must be logged in as a company to upload a profile video" 
            });
          }
        }

        // Ensure session cookie has optimal settings
        if (req.session) {
          req.session.cookie.sameSite = 'lax';
          req.session.cookie.maxAge = 86400000; // 24 hours
        }

        // Determine company ID from multiple sources with priority
        let companyId = 0;

        // Check query parameters first (most explicit)
        const queryCompanyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 0;
        if (queryCompanyId && !isNaN(queryCompanyId)) {
          companyId = queryCompanyId;
          console.log(`Using company ID from query parameters: ${companyId}`);
        } 
        // Check form data second (from multipart form)
        else if (req.body && req.body.companyId) {
          const formCompanyId = parseInt(req.body.companyId, 10);
          if (!isNaN(formCompanyId)) {
            companyId = formCompanyId;
            console.log(`Using company ID from form data: ${companyId}`);
          }
        }
        // Check headers third
        else if (useDirectAuth && directCompanyId) {
          companyId = directCompanyId;
          console.log(`Using company ID from headers: ${companyId}`);
        } 
        // Fall back to session
        else if (req.session && req.session.company) {
          companyId = req.session.company.id;
          console.log(`Using company ID from session: ${companyId}`);
        } 
        // No company ID could be determined
        else {
          console.log('No valid company ID found in query params, form data, headers or session');
          console.log('Query params:', req.query);
          console.log('Form data:', req.body);
          console.log('Headers:', req.headers['x-company-id']);
          return res.status(401).json({
            error: "Authentication required",
            details: "Unable to determine company identity"
          });
        }

        console.log(`Video upload for company ID: ${companyId}`);
        if (req.session && req.session.company) {
          console.log("Company session data:", JSON.stringify(req.session.company, null, 2));
        }

        // Verify company exists
        const company = await storage.getCompany(companyId);
        if (!company) {
          console.log(`Company not found for ID: ${companyId}`);
          return res.status(404).json({ 
            error: "Company not found", 
            details: "Unable to locate company account" 
          });
        }

        // Verify premium status
        console.log(`Company subscription tier: ${company.subscriptionTier}`);
        if (company.subscriptionTier !== SubscriptionTier.PREMIUM && company.subscriptionTier !== SubscriptionTier.ELITE && company.subscriptionTier !== SubscriptionTier.ENTERPRISE) {
          console.log(`Elite check failed: ${company.subscriptionTier} is not elite+`);
          return res.status(403).json({ 
            error: "Elite feature", 
            details: "Video uploads are only available for Elite and Enterprise accounts" 
          });
        }

        // Ensure file was uploaded
        console.log("Upload file check:", req.file ? "File present" : "No file");
        if (!req.file) {
          return res.status(400).json({ 
            error: "No file uploaded", 
            details: "No video file was provided" 
          });
        }

        console.log("File uploaded successfully:", req.file.filename);

        // File path relative to public directory for URLs
        const videoRelativePath = `/uploads/videos/${req.file.filename}`;
        const videoUrl = videoRelativePath;
        console.log("Video URL set to:", videoUrl);

        // Update company with video URL
        try {
          await storage.updateCompany(companyId, {
            profileVideo: videoUrl
          });
          console.log("Company profile updated with video URL");
        } catch (updateError) {
          console.error("Error updating company with video URL:", updateError);
          return res.status(500).json({
            error: "Database update failed",
            details: updateError instanceof Error ? updateError.message : "Failed to update company record"
          });
        }

        // Update session with new video URL
        if (req.session && req.session.company) {
          req.session.company.profileVideo = videoUrl;
          console.log("Updating session with profileVideo:", videoUrl);
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error("Error saving session after video upload:", err);
                reject(err);
              } else {
                console.log("Session updated successfully");
                resolve();
              }
            });
          });
        }

        // Return success with video URL
        console.log("Sending success response with videoUrl:", videoUrl);
        res.status(200).json({ 
          success: true, 
          videoUrl: videoUrl,
          message: "Company profile video uploaded successfully"
        });

      } catch (error) {
        console.error("Error uploading company profile video:", error);
        res.status(500).json({ 
          error: "Upload failed", 
          details: error instanceof Error ? error.message : "An unknown error occurred"
        });
      }
    });

    // User settings
    app.patch("/api/user/settings", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const updatedUser = await storage.updateUser(req.user.id, {
          preferredLanguage: req.body.preferredLanguage,
          preferredCurrency: req.body.preferredCurrency,
          preferredRegion: req.body.preferredRegion,
          latitude: req.body.latitude,
          longitude: req.body.longitude
        });

        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session error during user settings update:", err);
            return res.status(500).json({ error: "Session error" });
          }

          // Explicitly save session after login to ensure persistence
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Error saving session after settings update:", saveErr);
              return res.status(500).json({ error: "Session save error" });
            }

            console.log("User settings updated successfully:", updatedUser.id);
            res.json(updatedUser);
          });
        });
      } catch (error) {
        console.error("Failed to update user settings:", error);
        res.status(500).json({ error: "Failed to update user settings" });
      }
    });

    // Get current authenticated user
    app.get("/api/user", (req, res) => {
      console.log("GET /api/user request received, isAuthenticated:", req.isAuthenticated());

      if (!req.isAuthenticated()) {
        console.log("User not authenticated, returning 401");
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("Returning authenticated user:", req.user.id);
      res.json(req.user);
    });

    // User logout route
    app.post("/api/logout", (req, res) => {
      console.log("Logout request received, user:", req.user?.id);

      if (!req.isAuthenticated()) {
        console.log("No authenticated user to logout");
        return res.sendStatus(200); // Already logged out
      }

      const userId = req.user.id;

      // Use req.logout() with callback (Express 4.x.x style)
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }

        // Additionally regenerate the session for security
        req.session.regenerate((regErr) => {
          if (regErr) {
            console.error("Session regeneration error:", regErr);
            return res.status(500).json({ error: "Logout failed" });
          }

          console.log("User successfully logged out:", userId);
          res.sendStatus(200);
        });
      });
    });

    // Free trial upgrade endpoint
    app.post("/api/upgrade-to-premium", async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Authentication required" });
        }
        
        const userId = req.user.id;
        console.log(`Starting 14-day free trial for user ID: ${userId}`);
        
        // Use the storage service to upgrade the user
        const updatedUser = await storage.upgradeToPremium(userId);
        
        return res.status(200).json(updatedUser);
      } catch (error) {
        console.error("Error upgrading to premium:", error);
        return res.status(500).json({ 
          error: "Failed to upgrade account", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    // ── Password Reset ─────────────────────────────────────────────────────
    app.post("/api/auth/forgot-password", async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });
        const user = await storage.getUserByEmail(email);
        if (!user) return res.json({ message: "If this email exists, a reset link was sent." });
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour
        await storage.setPasswordResetToken(user.id, token, expiry);
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
        if (process.env.SENDGRID_API_KEY) {
          const sgMail = (await import('@sendgrid/mail')).default;
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@wealthsync.ai',
            subject: 'Reset your WealthSync password',
            html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
                   <p><a href="${resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
                   <p>Or copy: ${resetUrl}</p>
                   <p>If you didn't request this, ignore this email.</p>`,
          });
        }
        res.json({ message: "If this email exists, a reset link was sent." });
      } catch (error: any) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process request" });
      }
    });

    app.post("/api/auth/reset-password", async (req, res) => {
      try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: "Token and password are required" });
        if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
        const user = await storage.getUserByResetToken(token);
        if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });
        if (user.passwordResetExpiry && new Date(user.passwordResetExpiry) < new Date()) {
          return res.status(400).json({ error: "Reset token has expired" });
        }
        const bcrypt = await import('bcrypt');
        const hashed = await bcrypt.hash(password, 12);
        await storage.updateUser(user.id, { password: hashed });
        await storage.clearPasswordResetToken(user.id);
        storage.createNotification({
          userId: user.id,
          type: 'system',
          title: 'Password was reset',
          message: 'Your password was reset via email link. If this wasn\'t you, contact support immediately.',
        }).catch(e => console.error('Password reset notification error:', e));
        res.json({ message: "Password reset successfully" });
      } catch (error: any) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
      }
    });

    // ── User Profile Update ────────────────────────────────────────────────
    app.patch("/api/user/profile", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      try {
        const allowed = ['name', 'email', 'bio', 'phone', 'avatarUrl', 'preferredLanguage', 'preferredCurrency', 'preferredRegion'];
        const updates: Record<string, any> = {};
        for (const field of allowed) {
          if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        // Handle password change
        if (req.body.newPassword) {
          if (!req.body.currentPassword) return res.status(400).json({ error: "Current password is required" });
          const bcrypt = await import('bcrypt');
          const valid = await bcrypt.compare(req.body.currentPassword, req.user.password);
          if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
          updates.password = await bcrypt.hash(req.body.newPassword, 12);
        }
        const updated = await storage.updateUser(req.user.id, updates);
        if (req.body.newPassword) {
          storage.createNotification({
            userId: req.user.id,
            type: 'system',
            title: 'Password changed',
            message: 'Your password was updated successfully. If this wasn\'t you, contact support immediately.',
          }).catch(e => console.error('Password change notification error:', e));
        }
        req.login(updated, (err) => {
          if (err) return res.status(500).json({ error: "Session error" });
          res.json(updated);
        });
      } catch (error: any) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    });

    // ── Notifications ──────────────────────────────────────────────────────
    app.get("/api/notifications", async (req, res) => {
      const userId = req.isAuthenticated() ? req.user?.id : undefined;
      const companyId = req.session.company?.id;
      if (!userId && !companyId) return res.sendStatus(401);
      const list = await storage.getNotifications(userId, companyId);
      res.json(list);
    });

    app.get("/api/notifications/unread-count", async (req, res) => {
      const userId = req.isAuthenticated() ? req.user?.id : undefined;
      const companyId = req.session.company?.id;
      if (!userId && !companyId) return res.json({ count: 0 });
      const count = await storage.getUnreadCount(userId, companyId);
      res.json({ count });
    });

    app.patch("/api/notifications/read-all", async (req, res) => {
      const userId = req.isAuthenticated() ? req.user?.id : undefined;
      const companyId = req.session.company?.id;
      if (!userId && !companyId) return res.sendStatus(401);
      await storage.markAllNotificationsRead(userId, companyId);
      res.json({ success: true });
    });

    app.patch("/api/notifications/:id/read", async (req, res) => {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ success: true });
    });

    app.delete("/api/notifications/:id", async (req, res) => {
      await storage.deleteNotification(parseInt(req.params.id));
      res.json({ success: true });
    });

    // ── Global Search ──────────────────────────────────────────────────────
    app.get("/api/search", async (req, res) => {
      const q = (req.query.q as string || '').trim().toLowerCase();
      if (!q || q.length < 2) return res.json({ opportunities: [], companies: [], results: [] });
      try {
        const results: any[] = [];
        // Search opportunities
        try {
          const opps = await storage.getOpportunities();
          const matchedOpps = opps.filter((o: any) =>
            o.title?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q) ||
            o.country?.toLowerCase().includes(q) || o.sector?.toLowerCase().includes(q)
          ).slice(0, 5).map((o: any) => ({ type: 'opportunity', id: o.id, title: o.title, subtitle: o.country || o.sector, link: '/dashboard' }));
          results.push(...matchedOpps);
        } catch (e) {}
        // Search companies
        try {
          const cos = await storage.getAllCompanies();
          const matchedCos = cos.filter((c: any) =>
            c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) ||
            c.headquarters?.toLowerCase().includes(q) || c.industries?.some((i: string) => i.toLowerCase().includes(q))
          ).slice(0, 5).map((c: any) => ({ type: 'company', id: c.id, title: c.name, subtitle: c.headquarters || (c.industries || []).join(', '), link: `/companies/${c.id}` }));
          results.push(...matchedCos);
        } catch (e) {}
        // Search funding opportunities
        try {
          const funding = await storage.getFundingOpportunities?.() || [];
          const matchedFunding = funding.filter((f: any) =>
            f.title?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q) ||
            f.country?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q)
          ).slice(0, 5).map((f: any) => ({ type: 'funding', id: f.id, title: f.title, subtitle: f.country || f.category, link: '/dashboard' }));
          results.push(...matchedFunding);
        } catch (e) {}
        res.json({ results });
      } catch (error: any) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Search failed" });
      }
    });

    // User skills and profile
    app.patch("/api/user", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const updatedUser = await storage.updateUser(req.user.id, {
          skills: req.body.skills,
          assets: req.body.assets
        });

        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session error during profile update:", err);
            return res.status(500).json({ error: "Session error" });
          }

          // Explicitly save session after login to ensure persistence
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Error saving session after profile update:", saveErr);
              return res.status(500).json({ error: "Session save error" });
            }

            console.log("User profile updated successfully:", updatedUser.id);
            res.json(updatedUser);
          });
        });
      } catch (error) {
        console.error("Failed to update user:", error);
        res.status(500).json({ error: "Failed to update user profile" });
      }
    });


    const headers = {
      'Attribution-Reporting-Eligible': '{"trigger": true}',
      'Attribution-Reporting-Support': '{"os": true}',
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' https://api.worldbank.org; script-src 'self' https://api.worldbank.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.worldbank.org"
    };
    app.get("/api/region-data/:country", async (req, res) => {
      try {
        const country = decodeURIComponent(req.params.country).trim();
        console.log("Fetching economic data for:", country);

        const countryCode = countryCodeMap[country] || country;
        console.log("Using country code:", countryCode);

        const countryResponse = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}?format=json`,
          { headers }
        );

        if (!countryResponse.ok) {
          console.error(`Country API error: ${countryResponse.status}`);
          return res.status(400).json({
            error: "Failed to fetch country data",
            details: `World Bank API returned ${countryResponse.status}`
          });
        }

        const countryData = await countryResponse.json();
        if (!countryData[1] || countryData[1].length === 0) {
          console.error("No country data found for:", country);
          return res.status(404).json({
            error: "Country not found",
            details: `No data found for country: ${country}`
          });
        }

        const actualCountry = countryData[1][0];
        console.log("Found country data:", actualCountry);

        const gdpGrowthResponse = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2023:2024`,
          { headers }
        );

        if (!gdpGrowthResponse.ok) {
          console.error(`GDP growth API error: ${gdpGrowthResponse.status}`);
          return res.status(400).json({
            error: "Failed to fetch GDP growth data",
            details: `World Bank API returned ${gdpGrowthResponse.status}`
          });
        }

        const gdpGrowthData = await gdpGrowthResponse.json();
        const latestGrowthData = gdpGrowthData[1]?.[0] || { value: 0 };

        const gdpResponse = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&date=2023:2024`,
          { headers }
        );

        if (!gdpResponse.ok) {
          console.error(`GDP API error: ${gdpResponse.status}`);
          return res.status(400).json({
            error: "Failed to fetch GDP data",
            details: `World Bank API returned ${gdpResponse.status}`
          });
        }

        const gdpData = await gdpResponse.json();
        const latestGdpData = gdpData[1]?.[0] || { value: 0 };

        const economicData = {
          economicGrowth: Number(latestGrowthData.value || 0).toLocaleString('en-US', { 
            maximumFractionDigits: 2 
          }),
          marketSize: Number(latestGdpData.value || 0).toLocaleString('en-US', { 
            maximumFractionDigits: 0 
          }),
          regulatoryScore: actualCountry.incomeLevel.value,
          riskAssessment: actualCountry.lendingType.value,
          predictiveAnalytics: {
            growthSectors: [
              'Digital Technology',
              'Renewable Energy',
              'Smart Infrastructure'
            ],
            investmentOpportunities: [
              'Technology Innovation Hubs',
              'Sustainable Development Projects',
              'Digital Infrastructure'
            ],
            riskFactors: [
              'Market Volatility',
              'Regional Economic Changes',
              'Global Trade Impacts'
            ],
            timeframe: '2024-2026',
            confidenceScore: 0.85
          },
          countryName: actualCountry.name,
          countryRegion: actualCountry.region.value,
          recommendations: [
            'Focus on digital transformation',
            'Invest in sustainable projects',
            'Build strategic partnerships'
          ]
        };

        console.log("Sending economic data:", economicData);
        res.json(economicData);
      } catch (error) {
        console.error("Error fetching economic data:", error);
        res.status(500).json({
          error: "Failed to fetch economic data",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.get("/api/region/:region/countries", async (req, res) => {
      try {
        const region = decodeURIComponent(req.params.region).trim();
        const countries = knowledgeGraphService.getAvailableCountries(region);
        res.json({ countries });
      } catch (error) {
        console.error("Error getting available countries:", error);
        res.status(500).json({
          error: "Failed to get available countries",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add the market data endpoint
    app.get("/api/market-data", async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const { country, industry } = req.query;

        if (!isHighTier(req.user?.subscriptionTier)) {
          return res.status(403).json({ error: 'Elite subscription required' });
        }

        if (!country || !industry) {
          return res.status(400).json({ error: 'Country and industry are required' });
        }

        // Log the data request
        console.log(`[MarketData] Request for ${country}, ${industry} data from user ${req.user.id}`);

        // Get region for the country
        let region = 'Global';
        if (['Oman', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain'].includes(country as string)) {
          region = 'Middle East';
        } else if (['USA', 'Canada', 'Mexico'].includes(country as string)) {
          region = 'North America';
        } else if (['UK', 'Germany', 'France', 'Italy', 'Spain'].includes(country as string)) {
          region = 'Europe';
        }

        // Get real business intelligence from DBnomics through the premium market data service
        const businessMetrics = await premiumMarketDataService.getBusinessIntelligence(
          country as string,
          industry as string,
          region
        );

        // Format data for the frontend
        const marketData = {
          marketSize: businessMetrics.marketSize,
          marketShare: businessMetrics.marketShare,
          growthRate: businessMetrics.growthRate,
          aiConfidence: 0.98, // High confidence due to authoritative data source
          competitors: businessMetrics.competitors,
          trends: businessMetrics.detailedAnalytics?.quarterlyGrowth.map((growth, i) => ({
            period: `2024/${(i + 1).toString().padStart(2, '0')}`,
            value: businessMetrics.marketSize * (1 + (growth / 100) * (i / 12)),
            growth
          })) || [],
          lastUpdate: businessMetrics.realTimeMetrics?.lastUpdate || new Date().toISOString(),
          dataSource: 'DBnomics (IMF, World Bank, OECD)', // Show data source for transparency
          riskAssessment: businessMetrics.detailedAnalytics?.riskAssessment || 'Medium'
        };

        console.log(`[MarketData] Successfully generated market data for ${country}, ${industry}`);
        
        res.json(marketData);
      } catch (error) {
        console.error("Error fetching market data:", error);
        res.status(500).json({
          error: "Failed to fetch market data",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get("/api/legal-guidance/:country", async (req, res) => {
      try {
        const country = req.params.country;
        console.log("Fetching authentic legal guidance for:", country);

        // Get authentic, country-specific legal requirements from comprehensive database
        const legalGuidance = await getCountrySpecificLegalRequirements(country);
        
        console.log(`Returning authentic legal data for ${country}: ${Object.keys(legalGuidance).length} data points`);
        res.json(legalGuidance);
      } catch (error) {
        console.error("Error fetching legal guidance:", error);
        res.status(500).json({
          error: "Failed to fetch legal guidance",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Update the knowledge-graph endpoint to handle premium market data access
    app.get("/api/knowledge-graph/:industry/:region", async (req, res) => {
      try {
        const { industry, region } = req.params;
        const { country } = req.query;
        // Enhanced premium check for individual users and companies
        const isPremium = req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise' || 
                          req.user?.isPremium === true ||
                          (req.session.company && (req.session.company.subscriptionTier === 'premium' || req.session.company.subscriptionTier === 'elite' || req.session.company.subscriptionTier === 'enterprise'));

        console.log("[KnowledgeGraph Route] Request parameters:", {
          industry,
          region,
          country,
          isPremium,
          userAuthenticated: !!req.user,
          userSubscriptionTier: req.user?.subscriptionTier,
          userIsPremium: req.user?.isPremium,
          sessionId: req.sessionID,
          hasSession: !!req.session
        });

        const decodedRegion = decodeURIComponent(region).trim();
        const decodedIndustry = decodeURIComponent(industry).trim();

        if (!decodedRegion || !decodedIndustry) {
          return res.status(400).json({
            error: "Invalid request",
            details: "Industry and region are required"
          });
        }

        let insights;
        
        // Use premium data service for premium users with real-time Alpha Vantage data
        if (isPremium && country) {
          console.log(`[KnowledgeGraph] Using premium market data service for ${country}`);
          try {
            insights = await premiumMarketDataService.getBusinessIntelligence(
              country as string,
              decodedIndustry,
              decodedRegion
            );
            console.log(`[KnowledgeGraph] Premium data retrieved for ${country} with market size: ${insights.marketSize}`);
          } catch (premiumError) {
            console.error("[KnowledgeGraph] Error using premium service:", premiumError);
            // Fall back to regular service if premium service fails
            insights = await knowledgeGraphService.getBusinessIntelligence(
              decodedIndustry,
              decodedRegion,
              country as string,
              isPremium
            );
          }
        } else {
          // Use regular knowledge graph service for non-premium users
          insights = await knowledgeGraphService.getBusinessIntelligence(
            decodedIndustry,
            decodedRegion,
            country as string,
            isPremium
          );
        }

        // For non-premium users, limit the data
        if (!isPremium) {
          delete insights.detailedAnalytics;
          delete insights.realTimeMetrics;
        }

        console.log("[KnowledgeGraph Route] Successfully retrieved insights");
        res.json(insights);
      } catch (error) {
        console.error("[KnowledgeGraph Route] Failed to get business intelligence:", error);
        res.status(500).json({
          error: "Failed to get business intelligence",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get("/api/users/available", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        console.log("Fetching available users for user:", req.user.id);
        const users = await storage.getAllUsers(req.user.id);
        console.log("Found users:", users);

        const filteredUsers = users.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username
        }));

        console.log("Sending filtered users:", filteredUsers);
        res.json(filteredUsers);
      } catch (error) {
        console.error("Failed to get available users:", error);
        res.status(500).json({ error: "Failed to get available users" });
      }
    });

    app.post("/api/smart-contracts", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        console.log("Creating smart contract with data:", JSON.stringify(req.body, null, 2));

        const contract = await smartContractService.createContract({
          ...req.body,
          creator_id: req.user.id,
        });

        console.log("Contract created successfully:", JSON.stringify(contract, null, 2));
        res.status(201).json(contract);
      } catch (error) {
        console.error("Failed to create smart contract:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/smart-contracts/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const contract = await storage.getSmartContract(parseInt(req.params.id));
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        if (contract.creatorId !== req.user.id && contract.counterpartyId !== req.user.id) {
          return res.sendStatus(403);
        }

        res.json(contract);
      } catch (error) {        console.error("Failed to get smart contract:", error);
        res.status(500).json({ error: "Failed to get smart contract" });
      }
    });

    app.get("/api/smart-contracts", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const contracts = await storage.getSmartContractsByUser(req.user.id);
        res.json(contracts);
      } catch (error) {
        console.error("Failed to get user's smart contracts:", error);
        res.status(500).json({ error: "Failed to get user's smart contracts" });
      }
    });

    app.post("/api/smart-contracts/:id/activate", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const contract = await storage.getSmartContract(parseInt(req.params.id));
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        if (contract.creatorId !== req.user.id) {
          return res.status(403).json({ error: "Only the creator can activate the contract" });
        }

        const activatedContract = await smartContractService.activateContract(contract.id);
        res.json(activatedContract);
      } catch (error) {
        console.error("Failed to activate smart contract:", error);
        res.status(500).json({ error: "Failed to activate smart contract" });
      }
    });

    app.delete("/api/smart-contracts/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const contractId = parseInt(req.params.id);
        if (isNaN(contractId)) {
          return res.status(400).json({ error: "Invalid contract ID" });
        }

        const contract = await storage.getSmartContract(contractId);
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        if (contract.creator_id !== req.user.id) {
          return res.status(403).json({ error: "Only the creator can delete the contract" });
        }

        await storage.deleteSmartContract(contractId);
        console.log(`Successfully deleted contract ${contractId}`);
        res.sendStatus(200);
      } catch (error) {
        console.error("Failed to delete smart contract:", error);
        res.status(500).json({
          error: "Failed to delete smart contract",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Consolidated recommendations endpoint
    app.get("/api/opportunities/recommended-embeddings", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const userSkills = req.user?.skills || [];
            const { country } = req.query;

            console.log("Processing recommendations for user:", {
                userId: req.user.id,
                skills: userSkills,
                countryFilter: country
            });

            // Get all opportunities first
            const opportunities = await storage.getOpportunities();
            console.log(`Found ${opportunities.length} total opportunities to match`);

            // Match skills against opportunities and enrich with contact info
            let recommendations = opportunities
                .map(opportunity => {
                    const opportunityText = `${opportunity.name} ${opportunity.description}`.toLowerCase();

                    // Calculate match score based on skills
                    const matchedSkills = userSkills.filter(skill => 
                        opportunityText.includes(skill.toLowerCase())
                    );

                    const matchScore = matchedSkills.length > 0 ? 
                        Math.round((matchedSkills.length / userSkills.length) * 100) : 0;

                    // Enhance with provider details and keep actual URLs
                    return {
                        ...opportunity,
                        matchScore,
                        matchedSkills,
                        provider: opportunity.provider || null,
                        clientEmail: opportunity.clientEmail || null,
                        url: opportunity.url || null,
                        phone: opportunity.phone || null,
                        earnings: opportunity.earnings,
                        country: opportunity.country || 'Global'
                    };
                })
                .filter(opp => opp.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore);

            // Filter by country if specified
            if (country) {
                console.log(`Filtering opportunities for country: ${country}`);
                recommendations = recommendations.filter(opp => opp.country === country);
                console.log(`Found ${recommendations.length} opportunities for ${country}`);
            }

            res.json(recommendations);
        } catch (error) {
            console.error("Error in recommendations:", error);
            res.status(500).json({ error: "Failed to get recommendations" });
        }
    });

    app.post("/api/bookmarks", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const bookmark = await storage.createBookmark({
          ...req.body,
          user_id: req.user.id
        });
        res.status(201).json(bookmark);
      } catch (error) {
        console.error("Failed to create bookmark:", error);
        res.status(500).json({ error: "Failed to create bookmark" });
      }
    });

    app.get("/api/bookmarks", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const bookmarks = await storage.getBookmarksByUser(req.user.id);
        res.json(bookmarks);
      } catch (error) {
        console.error("Failed to get bookmarks:", error);
        res.status(500).json({ error: "Failed to get bookmarks" });
      }
    });

    app.post("/api/bookmarks", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const bookmarkData = {
          ...req.body,
          user_id: req.user.id
        };

        const bookmark = await storage.createBookmark(bookmarkData);
        res.status(201).json(bookmark);
      } catch (error) {
        console.error("Failed to create bookmark:", error);
        res.status(500).json({ error: "Failed to create bookmark" });
      }
    });

    app.delete("/api/bookmarks/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const bookmark = await storage.getBookmark(parseInt(req.params.id));
        if (!bookmark || bookmark.user_id !== req.user.id) {
          return res.status(404).json({ error: "Bookmark not found" });
        }

        await storage.deleteBookmark(parseInt(req.params.id));
        res.sendStatus(200);
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
        res.status(500).json({ error: "Failed to delete bookmark" });
      }
    });

    // Update the funding opportunities endpoint
    app.get("/api/funding-opportunities", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { country } = req.query;
        console.log("Fetching funding opportunities:", {
          userId: req.user.id,
          requestedCountry: country,
          userSkills: req.user.skills
        });

        // Use the enhanced matching system that includes skill-based filtering and worldwide opportunities
        let opportunities = await storage.getMatchingFundingOpportunities(req.user, country as string);

        // Log what we're sending back
        console.log(`Found ${opportunities.length} opportunities${country ? ` for ${country}` : ''}`);
        if (opportunities.length > 0) {
          console.log("Top opportunities:", opportunities.slice(0, 3).map(opp => ({
            name: opp.name,
            provider: opp.provider,
            country: opp.country,
            region: opp.region,
            sector: opp.sector,
            matchScore: opp.matchScore
          })));
        }

        res.json(opportunities);
      } catch (error) {
        console.error("Failed to get funding opportunities:", error);
        res.status(500).json({ 
          error: "Failed to get funding opportunities",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.post("/api/virtual-assistant/generate-business-plan", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        console.log("Generating business plan with data:", req.body);
        const businessPlan = await generateBusinessPlan(req.body);
        console.log("Business plan generated successfully");
        res.json({ plan: businessPlan });
      } catch (error) {
        console.error("Failed to generate business plan:", error);
        res.status(500).json({
          error: "Failed to generate business plan",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.post("/api/virtual-assistant/generate-roadmap", async (req, res) => {
      if (!req.isAuthenticated()){
        return res.sendStatus(401);
      }

      try {
        console.log("Generating growth roadmapwith data:", req.body);
        const roadmap = await generateGrowthRoadmap(req.body);
        console.log("Growth roadmap generated successfully");
        res.json({ response: roadmap });
      } catch (error) {
        console.error("Failed to generate growth roadmap:", error);
        res.status(500).json({
          error: "Failed to generate growth roadmap",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }    });

    app.post("/api/virtual-assistant/generate-email", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        console.log("Generating email draft with data:", req.body);
        const emailDraft = await generateEmailDraft(req.body);
        console.log("Email draft generated successfully");
        res.json({ response: emailDraft });
      } catch (error) {
        console.error("Failed to generate email draft:", error);
        res.status(500).json({
          error: "Failed to generate email draft",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.post("/api/virtual-assistant/generate-meeting", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        console.log("Generating meeting schedule with data:", req.body);
        const meetingSchedule = await generateMeetingSchedule(req.body);
        console.log("Meeting schedule generated successfully");
        res.json({ response: meetingSchedule });
      } catch (error) {
        console.error("Failed to generate meeting schedule:", error);
        res.status(500).json({
          error: "Failed to generate meeting schedule",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.post("/api/virtual-assistant/chat", async(req, res) => {
      if(!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const response = await getAssistantResponse(req.body);
        res.json({ response });
      } catch (error) {
        console.error("Failed to get assistant response:", error);
        res.status(500).json({
          error: "Failed to get assistant response",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Ghost-call stubs registered to match frontend call sites
    app.get("/api/business-metrics", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      res.json({ gdp: null, inflation: null, gdpGrowth: null, industry: null, message: "Use /api/world-bank or /api/finnhub for live metrics" });
    });

    app.get("/api/business-intelligence", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const { country, industry } = req.query as Record<string, string>;
      try {
        const { worldBankService } = await import('./services/world-bank');
        const data = await worldBankService.getCountryData(country || 'US');
        res.json({ country, industry, ...data });
      } catch {
        res.json({ country, industry, gdp: null, inflation: null, note: "Live data unavailable" });
      }
    });

    app.post("/api/virtual-assistant/schedule-meeting", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      try {
        const { generateMeetingSchedule } = await import('./services/virtual-assistant');
        const details = await generateMeetingSchedule(req.body);
        res.json({ success: true, details });
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Failed to schedule meeting" });
      }
    });

    app.post("/api/sync-jobs", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (!(req.user as any)?.isAdmin) return res.status(403).json({ error: "Admin access required" });
      try {
        const { storage } = await import('./storage');
        const opportunities = await (storage as any).getAllOpportunities?.() ?? [];
        res.json({ synced: opportunities.length, timestamp: new Date().toISOString() });
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Sync failed" });
      }
    });

    // Add updated templates list endpoint
    app.get("/api/legal-templates", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const isPremium = req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise';
        if (!isPremium) {
          return res.status(403).json({
            error: "Premium subscription required"
          });
        }

        const templates = [
          {
            id: 1,
            name: "Investment Agreement Template",
            description: "Comprehensive investment agreement template with standard terms and conditions",
            type: "Legal",
            fields: ["Investor Name", "Company Name", "Investment Amount", "Equity Percentage"]
          },
          {
            id: 2,
            name: "Partnership Agreement",
            description: "Detailed partnership agreement template with profit sharing and responsibilities",
            type: "Legal",
            fields: ["Partner Names", "Profit Share", "Responsibilities", "Term Length"]
          },
          {
            id: 3,
            name: "Service Level Agreement (SLA)",
            description: "Professional SLA template for business services and commitments",
            type: "Business",
            fields: ["Service Provider", "Client", "Service Levels", "Response Times"]
          }
        ];

        res.json(templates);
      } catch (error) {
        console.error("Failed to fetch legal templates:", error);
        res.status(500).json({
          error: "Failed to fetch legal templates",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add individual template download endpoint with numeric IDs
    app.get("/api/legal-templates/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const isPremium = req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise';
        if (!isPremium) {
          return res.status(403).json({
            error: "Premium subscription required"
          });
        }

        const templateId = parseInt(req.params.id);
        console.log("Requested template ID:", templateId);

        if (isNaN(templateId)) {
          return res.status(400).json({
            error: "Invalid template ID format"
          });
        }

        const templates = {
          1: {
            filename: "investment-agreement.txt",
            content: `INVESTMENT AGREEMENT
This Investment Agreement (the "Agreement") is made on [DATE]

BETWEEN:
[INVESTOR NAME] ("Investor")
AND
[COMPANY NAME] ("Company")

1. Investment Amount
   The Investor agrees to invest [AMOUNT] in the Company.

2. Equity Stake
   In exchange for the Investment Amount, the Company agrees to issue [NUMBER] shares to the Investor.

3. Terms and Conditions
   [Insert specific terms]

4. Signatures

_________________
Investor

_________________
Company Representative`
          },
          2: {
            filename: "partnership-agreement.txt",
            content: `PARTNERSHIP AGREEMENT

This Partnership Agreement (the "Agreement") is made on [DATE]

BETWEEN:
[PARTNER 1 NAME] ("Partner 1")
AND
[PARTNER 2 NAME] ("Partner 2")

1. Partnership Structure
   [Details of partnership structure]

2. Profit Sharing
   [Profit sharing arrangements]

3. Responsibilities
   [Partner responsibilities]

4. Signatures

_________________
Partner 1

_________________
Partner 2`
          },
          3: {
            filename: "service-level-agreement.txt",
            content: `SERVICE LEVEL AGREEMENT

This Service Level Agreement (SLA) is made between:
[SERVICE PROVIDER]
and
[CLIENT]

1. Service Levels
   [Define service levels]

2. Response Times
   [Response time commitments]

3. Performance Metrics
   [Key performance indicators]

4. Signatures

_________________
Service Provider

_________________
Client`
          }
        };

        console.log("Looking for template with ID:", templateId);
        const template = templates[templateId];

        if (!template) {
          console.error("Template not found for ID:", templateId);
          return res.status(404).json({
            error: "Template not found",
            requestedId: templateId,
            availableIds: Object.keys(templates)
          });
        }

        console.log("Found template:", template.filename);

        // Set proper headers for text file download
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
        res.setHeader('Content-Length', template.content.length);
        res.setHeader('Cache-Control', 'no-cache');

        // Send the content with proper line endings
        res.send(template.content.replace(/\n/g, '\r\n'));

      } catch (error) {
        console.error("Failed to download template:", error);
        res.status(500).json({
          error: "Failed to download template",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add market data endpoint
    app.get("/api/market-data", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const isPremium = req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise';
        if (!isPremium) {
          return res.status(403).json({
            error: "Premium subscription required"
          });
        }

        const { country, industry } = req.query;
        if (!country || !industry) {
          return res.status(400).json({
            error: "Country and industry parameters are required"
          });
        }

        // Get detailed market data for premium users
        const marketData = {
          marketSize: 5000000,
          growthRate: 12.5,
          marketShare: 25,
          competitors: [
            "Company A",
            "Company B",
            "Company C"
          ],
          trends: [
            { period: "2023 Q1", value: 4200000 },
            { period: "2023 Q2", value: 4500000 },
            { period: "2023 Q3", value: 4800000 },
            { period: "2023 Q4", value: 5000000 }
          ]
        };

        res.json(marketData);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        res.status(500).json({
          error: "Failed to fetch market data",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add revised support ticket endpoint with priority handling
    app.post("/api/support/ticket", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const isPremium = req.user?.subscriptionTier === 'premium' || req.user?.subscriptionTier === 'elite' || req.user?.subscriptionTier === 'enterprise';
        const ticket = {
          ...req.body,
          userId: req.user.id,
          priority: isPremium ? 'high' : 'normal',
          responseTime: isPremium ? '2 hours' : '24 hours',
          status: 'open',
          createdAt: new Date()
        };

        // Store the ticket in the database
        const storedTicket = await storage.createSupportTicket(ticket);

        // Send confirmation email
        if (testMailer) {
          await testMailer.sendMail({
            from: "support@wealthsync.ai",
            to: req.user.email,
            subject: `Support Ticket Created - ${isPremium ? 'Priority' : 'Standard'} Support`,
            text: `Your support ticket has been created.\nExpected response time: ${ticket.responseTime}\n\nTicket details:\n${ticket.description}`
          });
        }

        res.status(201).json({
          message: "Support ticket created successfully",
          ticket: storedTicket
        });
      } catch (error) {
        console.error("Failed to create support ticket:", error);
        res.status(500).json({
          error: "Failed to create support ticket",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Configure multer for handling file uploads
    const diskStorage = multer.diskStorage({
      destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const uniqueSuffix = Date.now() + '-' + (++uniqueIdCounter);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

    const upload = multer({
      storage: diskStorage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
      }
    });

    // Get certificates for authenticated user
    app.get("/api/certificates", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const certificates = await storage.getUserCertificates(req.user.id);
        res.json(certificates);
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        res.status(500).json({ error: "Failed to fetch certificates" });
      }
    });

    // Add file upload handling to the certificates endpoint
    app.post("/api/certificates", upload.single('certificateFile'), async (req, res) => {
      console.log('Certificate POST request received');
      console.log('Is authenticated:', req.isAuthenticated());
      console.log('Request body:', req.body);
      console.log('File uploaded:', req.file);
      
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        // Handle both FormData and JSON requests
        const bodyData = req.file ? req.body : req.body;
        
        if (!bodyData.name || !bodyData.issuingAuthority || !bodyData.issueDate) {
          return res.status(400).json({ 
            error: "Missing required fields: name, issuingAuthority, issueDate" 
          });
        }

        const certificateData: any = {
          name: bodyData.name,
          issuingAuthority: bodyData.issuingAuthority,
          userId: req.user.id,
          issueDate: bodyData.issueDate,
          expiryDate: bodyData.expiryDate && bodyData.expiryDate !== "" ? bodyData.expiryDate : undefined,
          verificationId: bodyData.verificationId || undefined,
          certificateUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        };

        console.log('Certificate data to create:', certificateData);
        const certificate = await storage.createCertificate(certificateData);
        console.log('Certificate created successfully:', certificate);

        res.status(201).json(certificate);
      } catch (error) {
        console.error("Failed to create certificate:", error);
        res.status(500).json({
          error: "Failed to create certificate",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Update certificate
    app.put("/api/certificates/:id", upload.single('certificateFile'), async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const certificateId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if certificate belongs to user
        const existingCertificate = await storage.getCertificateById(certificateId);
        if (!existingCertificate || existingCertificate.userId !== userId) {
          return res.status(404).json({ error: "Certificate not found" });
        }

        // Filter out undefined/null values and preserve existing data
        const updateData: any = {};
        
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.issuingAuthority !== undefined) updateData.issuingAuthority = req.body.issuingAuthority;
        if (req.body.issueDate !== undefined) updateData.issueDate = req.body.issueDate;
        if (req.body.expiryDate !== undefined) updateData.expiryDate = req.body.expiryDate;
        if (req.body.verificationId !== undefined && req.body.verificationId !== '') updateData.verificationId = req.body.verificationId;
        if (req.file) updateData.certificateUrl = `/uploads/${req.file.filename}`;

        console.log("Update data for certificate:", updateData);

        // Only proceed if there's something to update
        if (Object.keys(updateData).length === 0) {
          // If no updates, just return the existing certificate
          return res.json(existingCertificate);
        }

        const updatedCertificate = await storage.updateCertificate(certificateId, updateData);
        res.json(updatedCertificate);
      } catch (error) {
        console.error("Failed to update certificate:", error);
        res.status(500).json({ error: "Failed to update certificate" });
      }
    });

    // Delete certificate
    app.delete("/api/certificates/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const certificateId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if certificate belongs to user
        const existingCertificate = await storage.getCertificateById(certificateId);
        if (!existingCertificate || existingCertificate.userId !== userId) {
          return res.status(404).json({ error: "Certificate not found" });
        }

        await storage.deleteCertificate(certificateId);
        res.json({ message: "Certificate deleted successfully" });
      } catch (error) {
        console.error("Failed to delete certificate:", error);
        res.status(500).json({ error: "Failed to delete certificate" });
      }
    });

    // Projects API endpoints
    app.get("/api/projects", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        console.log("Fetching projects for user:", userId);
        const projects = await storage.getUserProjects(userId);
        res.json(projects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
      }
    });

    app.post("/api/projects", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        const projectData = {
          ...req.body,
          userId,
        };

        console.log("Creating project with data:", projectData);
        const project = await storage.createProject(projectData);
        console.log("Project created successfully:", project);
        res.status(201).json(project);
      } catch (error) {
        console.error("Failed to create project:", error);
        res.status(500).json({ 
          error: "Failed to create project",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.put("/api/projects/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const projectId = parseInt(req.params.id);
        const userId = req.user.id;

        // Verify ownership
        const existingProject = await storage.getProjectById(projectId);
        if (!existingProject || existingProject.userId !== userId) {
          return res.status(404).json({ error: "Project not found" });
        }

        console.log("Updating project:", projectId, "with data:", req.body);
        const updatedProject = await storage.updateProject(projectId, req.body);
        console.log("Project updated successfully:", updatedProject);
        res.json(updatedProject);
      } catch (error) {
        console.error("Failed to update project:", error);
        res.status(500).json({ 
          error: "Failed to update project",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.delete("/api/projects/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const projectId = parseInt(req.params.id);
        const userId = req.user.id;

        // Verify ownership
        const existingProject = await storage.getProjectById(projectId);
        if (!existingProject || existingProject.userId !== userId) {
          return res.status(404).json({ error: "Project not found" });
        }

        console.log("Deleting project:", projectId);
        await storage.deleteProject(projectId);
        console.log("Project deleted successfully");
        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete project:", error);
        res.status(500).json({ 
          error: "Failed to delete project",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // File upload endpoint for work experience verification
    app.post("/api/work-experience/upload-proof", upload.single('proofFile'), async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { workExperienceId } = req.body;
        
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        if (!workExperienceId) {
          return res.status(400).json({ error: "Work experience ID is required" });
        }

        // Update the work experience record with the file path
        const experienceVerificationService = new ExperienceVerificationService();
        const updatedExperience = await experienceVerificationService.updateWorkExperienceProof(
          parseInt(workExperienceId),
          req.user.id,
          `/uploads/${req.file.filename}`
        );

        res.status(200).json({
          message: "Verification proof uploaded successfully",
          filePath: `/uploads/${req.file.filename}`,
          workExperience: updatedExperience
        });
      } catch (error) {
        console.error("Failed to upload work experience proof:", error);
        res.status(500).json({
          error: "Failed to upload verification proof",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // No need for additional static file serving since we've already set this up earlier
    // app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

    // Company plan & feature limit routes
    app.get("/api/company/limits", companyAuthMiddleware, getCompanyLimits);
    app.post("/api/company/increment-opportunity", companyAuthMiddleware, incrementOpportunityUsage);
    app.post("/api/company/increment-report", companyAuthMiddleware, incrementReportUsage);
    app.post("/api/company/increment-ai-email", companyAuthMiddleware, incrementAIEmailUsage);
    app.get("/api/company/check-service-limit", companyAuthMiddleware, checkServiceLimit);
    
    // Company service management routes
    app.get("/api/company/services", companyAuthMiddleware, getCompanyServices);
    app.post("/api/company/services", companyAuthMiddleware, addCompanyService);
    app.put("/api/company/services/:id", companyAuthMiddleware, updateCompanyService);
    app.delete("/api/company/services/:id", companyAuthMiddleware, deleteCompanyService);
    
    // Company feature routes
    app.post("/api/company/market-report", companyAuthMiddleware, createMarketReport);
    app.post("/api/company/ai-email", companyAuthMiddleware, generateAIEmail);

    // ===== COMPANY VERIFICATION SYSTEM ROUTES =====

    // Get company badges
    app.get("/api/company/badges", async (req, res) => {
      if (!req.session.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const badges = await db.select().from(companyBadges)
          .where(eq(companyBadges.companyId, req.session.company.id))
          .orderBy(desc(companyBadges.awardedDate));
        
        res.json(badges);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
        res.status(500).json({ error: "Failed to fetch badges" });
      }
    });

    // Request a verification badge
    app.post("/api/company/request-badge", async (req, res) => {
      if (!req.session.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const { badgeType } = req.body;
        
        // Check if badge already exists
        const existingBadge = await db.select().from(companyBadges)
          .where(and(
            eq(companyBadges.companyId, req.session.company.id),
            eq(companyBadges.badgeType, badgeType)
          ))
          .limit(1);

        if (existingBadge.length > 0) {
          return res.status(400).json({ error: "Badge already requested or awarded" });
        }

        // Create verification request
        const [verificationRequest] = await db.insert(verificationRequests).values({
          companyId: req.session.company.id,
          requestType: 'badge',
          targetId: 0,
          submittedBy: req.session.company.id,
          status: 'pending'
        }).returning();

        res.json({ 
          message: "Badge request submitted successfully",
          requestId: verificationRequest.id 
        });
      } catch (error) {
        console.error("Failed to request badge:", error);
        res.status(500).json({ error: "Failed to request badge" });
      }
    });

    // Get company case studies
    app.get("/api/company/case-studies", async (req, res) => {
      if (!req.session.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const caseStudies = await db.select().from(companyCaseStudies)
          .where(eq(companyCaseStudies.companyId, req.session.company.id))
          .orderBy(desc(companyCaseStudies.submittedAt));
        
        res.json(caseStudies);
      } catch (error) {
        console.error("Failed to fetch case studies:", error);
        res.status(500).json({ error: "Failed to fetch case studies" });
      }
    });

    // Handle case study deletion via POST with action parameter
    app.post("/api/company/case-studies/action", async (req, res) => {
      console.log("🔍 DELETE ACTION - Session Debug:", {
        hasSession: !!req.session,
        sessionID: req.session?.id,
        hasCompany: !!req.session?.company,
        companyId: req.session?.company?.id,
        companyName: req.session?.company?.name,
        sessionKeys: Object.keys(req.session || {})
      });

      if (!req.session?.company?.id) {
        console.log("❌ DELETE AUTH FAILED - No company session");
        return res.status(401).json({ error: "Company authentication required" });
      }

      const { action, caseStudyId } = req.body;
      
      if (action === 'delete') {
        console.log("🗑️ DELETE ACTION - Case Study ID:", caseStudyId, "Company:", req.session.company.name);
        
        try {
          const caseStudyIdNum = parseInt(caseStudyId);
          
          // Check if the case study exists and belongs to this company
          const [existingStudy] = await db.select()
            .from(companyCaseStudies)
            .where(and(
              eq(companyCaseStudies.id, caseStudyIdNum),
              eq(companyCaseStudies.companyId, req.session.company.id)
            ));

          if (!existingStudy) {
            return res.status(404).json({ error: "Case study not found" });
          }

          // Only allow deletion if status is pending or pending_review
          if (existingStudy.status !== 'pending' && existingStudy.status !== 'pending_review') {
            return res.status(400).json({ error: "Can only delete pending case studies" });
          }

          // Delete the case study and any related verification requests
          await db.transaction(async (tx) => {
            // Delete verification requests
            await tx.delete(verificationRequests)
              .where(and(
                eq(verificationRequests.requestType, 'case_study'),
                eq(verificationRequests.targetId, caseStudyIdNum)
              ));

            // Delete the case study
            await tx.delete(companyCaseStudies)
              .where(eq(companyCaseStudies.id, caseStudyIdNum));
          });

          console.log("✅ DELETE SUCCESS - Case study deleted:", caseStudyIdNum);
          return res.json({ message: "Case study deleted successfully" });
        } catch (error) {
          console.error("❌ DELETE ERROR:", error);
          return res.status(500).json({ error: "Failed to delete case study" });
        }
      }

      return res.status(400).json({ error: "Invalid action" });
    });



    // Submit case study
    app.post("/api/company/case-studies", async (req, res) => {
      if (!req.session.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const caseStudyData = {
          ...req.body,
          companyId: req.session.company.id,
          status: 'pending_review'
        };

        const [caseStudy] = await db.insert(companyCaseStudies)
          .values(caseStudyData)
          .returning();

        // Create verification request
        await db.insert(verificationRequests).values({
          companyId: req.session.company.id,
          requestType: 'case_study',
          targetId: caseStudy.id,
          submittedBy: req.session.company.id,
          status: 'pending'
        });

        res.json({ 
          message: "Case study submitted successfully",
          caseStudy 
        });
      } catch (error) {
        console.error("Failed to submit case study:", error);
        res.status(500).json({ error: "Failed to submit case study" });
      }
    });

    // Get company credentials
    app.get("/api/company/credentials", async (req, res) => {
      if (!req.session.company) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const credentials = await db.select().from(companyCredentials)
          .where(eq(companyCredentials.companyId, req.session.company.id))
          .orderBy(desc(companyCredentials.issueDate));
        
        res.json(credentials);
      } catch (error) {
        console.error("Failed to fetch credentials:", error);
        res.status(500).json({ error: "Failed to fetch credentials" });
      }
    });

    // Delete case study - integrated with existing company routes pattern
    app.delete("/api/company/case-studies/:id", async (req, res) => {
      console.log("🗑️ DELETE CASE STUDY - Request received for ID:", req.params.id);
      
      // Use same authentication pattern as other company endpoints
      if (!req.session.company) {
        console.log("❌ DELETE AUTH FAILED - No company session");
        return res.status(401).json({ error: "Company authentication required" });
      }

      console.log("✅ DELETE AUTH SUCCESS - Company:", req.session.company.name);
      const companyId = req.session.company.id;

      try {
        const caseStudyId = parseInt(req.params.id);
        
        // First check if the case study exists and belongs to this company
        const [existingStudy] = await db.select()
          .from(companyCaseStudies)
          .where(and(
            eq(companyCaseStudies.id, caseStudyId),
            eq(companyCaseStudies.companyId, companyId)
          ));

        if (!existingStudy) {
          return res.status(404).json({ error: "Case study not found" });
        }

        // Only allow deletion if status is pending or pending_review
        if (existingStudy.status !== 'pending' && existingStudy.status !== 'pending_review') {
          return res.status(400).json({ error: "Can only delete pending case studies" });
        }

        // Delete the case study and any related verification requests
        await db.transaction(async (tx) => {
          // Delete verification requests
          await tx.delete(verificationRequests)
            .where(and(
              eq(verificationRequests.requestType, 'case_study'),
              eq(verificationRequests.targetId, caseStudyId)
            ));

          // Delete the case study
          await tx.delete(companyCaseStudies)
            .where(eq(companyCaseStudies.id, caseStudyId));
        });

        res.json({ message: "Case study deleted successfully" });
      } catch (error) {
        console.error("Failed to delete case study:", error);
        res.status(500).json({ error: "Failed to delete case study" });
      }
    });

    // Submit credential
    app.post("/api/company/credentials", async (req, res) => {
      console.log("🔍 CREDENTIAL ENDPOINT HIT");
      console.log("🔍 Request body exists:", !!req.body);
      console.log("🔍 Request body keys:", Object.keys(req.body || {}));
      console.log("🔍 Raw request body:", JSON.stringify(req.body, null, 2));

      if (!req.session.company) {
        console.log("❌ CREDENTIAL AUTH FAILED - No company session");
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        // Validate required fields
        if (!req.body.credentialType || !req.body.title || !req.body.issuingOrganization || !req.body.issueDate) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Handle date conversion more safely
        console.log("🔍 Processing dates - issueDate:", req.body.issueDate, "expiryDate:", req.body.expiryDate);
        
        let issueDate, expiryDate = null;
        
        // Convert issue date
        if (req.body.issueDate) {
          const issueDateStr = req.body.issueDate.toString();
          issueDate = new Date(issueDateStr);
          console.log("🔍 Converted issueDate:", issueDate, "isValid:", !isNaN(issueDate.getTime()));
          
          if (isNaN(issueDate.getTime())) {
            console.log("❌ Invalid issue date:", issueDateStr);
            return res.status(400).json({ error: "Invalid issue date format" });
          }
        }

        // Convert expiry date if provided
        if (req.body.expiryDate && req.body.expiryDate.trim() !== '') {
          const expiryDateStr = req.body.expiryDate.toString();
          expiryDate = new Date(expiryDateStr);
          console.log("🔍 Converted expiryDate:", expiryDate, "isValid:", !isNaN(expiryDate.getTime()));
          
          if (isNaN(expiryDate.getTime())) {
            console.log("❌ Invalid expiry date:", expiryDateStr);
            return res.status(400).json({ error: "Invalid expiry date format" });
          }
        }

        console.log("🔍 Using direct Drizzle insert (same as working edit/delete)");
        
        // Use direct Drizzle insert like the working edit/delete operations
        const [credential] = await db.insert(companyCredentials)
          .values({
            companyId: req.session.company.id,
            credentialType: req.body.credentialType,
            title: req.body.title,
            issuingOrganization: req.body.issuingOrganization,
            issueDate: issueDate,
            expiryDate: expiryDate,
            credentialId: req.body.credentialId || null,
            verificationUrl: req.body.verificationUrl || null,
            description: req.body.description || null,
            status: 'pending',
            submittedAt: new Date()
          })
          .returning();

        console.log("✅ Credential inserted successfully:", credential);

        res.json({ 
          message: "Credential submitted successfully",
          credential 
        });
      } catch (error) {
        console.error("Failed to submit credential:", error);
        res.status(500).json({ error: "Failed to submit credential" });
      }
    });

    // Handle credential actions (edit/delete) via POST with action parameter
    app.post("/api/company/credentials/action", async (req, res) => {
      if (!req.session?.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      const { action, credentialId, ...updateData } = req.body;
      const companyId = req.session.company.id;

      try {
        if (action === 'delete') {
          // First check if the credential exists and belongs to this company
          const [existingCredential] = await db.select()
            .from(companyCredentials)
            .where(and(
              eq(companyCredentials.id, credentialId),
              eq(companyCredentials.companyId, companyId)
            ));

          if (!existingCredential) {
            return res.status(404).json({ error: "Credential not found" });
          }

          // Only allow deletion if status is pending
          if (existingCredential.status !== 'pending') {
            return res.status(400).json({ error: "Can only delete pending credentials" });
          }

          // Delete the credential and any related verification requests
          await db.transaction(async (tx) => {
            // Delete verification requests
            await tx.delete(verificationRequests)
              .where(and(
                eq(verificationRequests.requestType, 'credential'),
                eq(verificationRequests.targetId, credentialId)
              ));

            // Delete the credential
            await tx.delete(companyCredentials)
              .where(eq(companyCredentials.id, credentialId));
          });

          res.json({ message: "Credential deleted successfully" });

        } else if (action === 'edit') {
          // First check if the credential exists and belongs to this company
          const [existingCredential] = await db.select()
            .from(companyCredentials)
            .where(and(
              eq(companyCredentials.id, credentialId),
              eq(companyCredentials.companyId, companyId)
            ));

          if (!existingCredential) {
            return res.status(404).json({ error: "Credential not found" });
          }

          // Only allow editing if status is pending
          if (existingCredential.status !== 'pending') {
            return res.status(400).json({ error: "Can only edit pending credentials" });
          }

          // Update the credential
          const [updatedCredential] = await db.update(companyCredentials)
            .set({
              ...updateData,
              submittedAt: new Date() // Update submission time
            })
            .where(eq(companyCredentials.id, credentialId))
            .returning();

          res.json({ 
            message: "Credential updated successfully",
            credential: updatedCredential 
          });

        } else {
          return res.status(400).json({ error: "Invalid action" });
        }
      } catch (error) {
        console.error("Failed to process credential action:", error);
        res.status(500).json({ error: "Failed to process credential action" });
      }
    });

    // Get company verification overview
    app.get("/api/company/verification-overview", async (req, res) => {
      if (!req.session.company?.id) {
        return res.status(401).json({ error: "Company authentication required" });
      }

      try {
        const [badges, caseStudies, credentials] = await Promise.all([
          db.select().from(companyBadges)
            .where(and(
              eq(companyBadges.companyId, req.session.company.id),
              eq(companyBadges.isActive, true)
            )),
          db.select().from(companyCaseStudies)
            .where(eq(companyCaseStudies.companyId, req.session.company.id)),
          db.select().from(companyCredentials)
            .where(eq(companyCredentials.companyId, req.session.company.id))
        ]);

        const verificationScore = Math.min(100, 
          badges.length * 30 + 
          caseStudies.filter(cs => cs.status === 'approved').length * 25 + 
          credentials.filter(cr => cr.status === 'verified').length * 20
        );

        res.json({
          badges: badges.length,
          caseStudies: caseStudies.length,
          credentials: credentials.length,
          verificationScore,
          approvedCaseStudies: caseStudies.filter(cs => cs.status === 'approved').length,
          verifiedCredentials: credentials.filter(cr => cr.status === 'verified').length
        });
      } catch (error) {
        console.error("Failed to fetch verification overview:", error);
        res.status(500).json({ error: "Failed to fetch verification overview" });
      }
    });
    
    // Premium Directory routes - GET directory listing with robust authentication
    app.get("/api/company/directory-listing", async (req, res) => {
      try {
        // Enhanced session debugging
        console.log("Directory listing - comprehensive session debug:", {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          cookieHeader: req.headers.cookie,
          sessionData: req.session ? Object.keys(req.session) : [],
          hasCompany: !!req.session?.company,
          companyId: req.session?.company?.id,
          companyName: req.session?.company?.name,
          sessionStore: typeof req.sessionStore
        });

        // Check multiple authentication sources
        let companyId: number | undefined;
        let companyName: string | undefined;

        // Primary: Check session
        if (req.session?.company?.id) {
          companyId = req.session.company.id;
          companyName = req.session.company.name;
          console.log("Directory listing - authenticated via session:", { companyId, companyName });
        }

        // Fallback: Check if session exists but company data needs refresh
        if (!companyId && req.session) {
          // Try to reload session explicitly
          req.session.reload((err) => {
            if (!err && req.session?.company?.id) {
              companyId = req.session.company.id;
              companyName = req.session.company.name;
              console.log("Directory listing - authenticated via session reload:", { companyId, companyName });
            }
          });
        }

        if (!companyId) {
          console.log("Directory listing - authentication failed, no valid company session");
          return res.status(401).json({ error: "Not authenticated as a company" });
        }

        console.log(`Directory listing - proceeding for company: ${companyName} (ID: ${companyId})`);
        
        const directoryListing = await storage.getDirectoryListing(companyId);

        if (!directoryListing) {
          return res.status(404).json({ message: "Directory listing not found" });
        }

        res.status(200).json(directoryListing);
      } catch (error) {
        console.error("Error in directory listing endpoint:", error);
        res.status(500).json({ message: "Failed to fetch directory listing" });
      }
    });
    
    app.post("/api/company/directory-listing", saveDirectoryListing);
    app.delete("/api/company/directory-listing", deleteDirectoryListing);

    // Public directory routes
    app.get("/api/directory", getAllDirectoryListings);
    app.post("/api/directory/:id/view", recordDirectoryView);
    app.post("/api/directory/:id/click", recordDirectoryClick);

    // Register Business Map routes
    registerBusinessMapRoutes(app);

    // Register Admin Console routes
    registerAdminRoutes(app);

    // Register Billing routes
    registerBillingRoutes(app);

    // Register SEO routes (sitemap, robots)
    registerSeoRoutes(app);
    
    // Register Smart Contract routes
    app.use("/api/smart-contracts", smartContractRoutes);
    app.use("/api/company/chatbot", chatbotRouter);
    app.use("/api/company/client-requests", clientRequestRouter);
    app.use("/api/company/analytics", analyticsRouter);
    app.use("/api/company/employee-verifications", employeeVerificationRouter);
    app.use("/api/company", companyFeaturesRouter);

    // Personal Finance AI Agent routes (Phase 2 Core Features)
    app.post("/api/personal-finance/budget-recommendations", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      try {
        const { profile } = req.body;
        const recommendations = await personalFinanceAI.generateBudgetRecommendations(profile);
        res.json(recommendations);
      } catch (error) {
        console.error("Budget recommendations error:", error);
        res.status(500).json({ error: "Failed to generate budget recommendations" });
      }
    });

    app.post("/api/personal-finance/spending-analysis", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      try {
        const { transactions, currentBudget } = req.body;
        const analysis = await personalFinanceAI.analyzeSpendingPatterns(transactions, currentBudget);
        res.json(analysis);
      } catch (error) {
        console.error("Spending analysis error:", error);
        res.status(500).json({ error: "Failed to analyze spending patterns" });
      }
    });

    app.post("/api/personal-finance/savings-strategy", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      try {
        const { profile, goals } = req.body;
        const strategy = await personalFinanceAI.generateSavingsStrategy(profile, goals);
        res.json(strategy);
      } catch (error) {
        console.error("Savings strategy error:", error);
        res.status(500).json({ error: "Failed to generate savings strategy" });
      }
    });

    app.get("/api/personal-finance/insights", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      try {
        const userId = req.user.id;
        const recentActivity = {
          userId,
          lastLogin: new Date(),
          recentTransactions: [],
          budgetStatus: "active"
        };
        
        const insights = await personalFinanceAI.generateFinancialInsights(userId, recentActivity);
        res.json(insights);
      } catch (error) {
        console.error("Financial insights error:", error);
        res.status(500).json({ error: "Failed to generate financial insights" });
      }
    });

    // Team Financial Health endpoints
    app.get("/api/teams/health-report", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const report = await storage.getTeamHealthReport(req.user.id);
        if (!report) {
          return res.json({
            overallScore: 0,
            financialHealth: 'not_assessed',
            summary: 'No financial data available yet. Add team members and transactions to generate a health report.',
            keyMetrics: { totalIncome: 0, totalExpenses: 0, totalSavings: 0, burnRate: 0, cashRunway: 0 },
            insights: [],
            recommendations: ['Add team members to start tracking financial health', 'Connect financial accounts for automated tracking'],
            trends: { income: 'neutral', expenses: 'neutral', savings: 'neutral' }
          });
        }
        res.json(report);
      } catch (error) {
        console.error('Error generating team health report:', error);
        res.status(500).json({ error: 'Failed to generate health report' });
      }
    });

    app.get("/api/teams", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        const teams = await storage.getUserFinancialTeams(userId);
        
        // Add member count and role for each team
        const teamsWithDetails = await Promise.all(teams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          const userMember = members.find(m => m.userId === userId);
          
          return {
            ...team,
            memberCount: members.length,
            role: userMember?.role || 'member',
            goals: team.goals || []
          };
        }));
        
        res.json(teamsWithDetails);
      } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
      }
    });

    app.get("/api/teams/financial", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        const teams = await storage.getUserFinancialTeams(userId);
        
        // Add member count and role for each team
        const teamsWithDetails = await Promise.all(teams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          const userMember = members.find(m => m.userId === userId);
          
          return {
            ...team,
            memberCount: members.length,
            role: userMember?.role || 'member',
            goals: team.goals || []
          };
        }));
        
        res.json(teamsWithDetails);
      } catch (error) {
        console.error('Error fetching financial teams:', error);
        res.status(500).json({ error: 'Failed to fetch financial teams' });
      }
    });

    app.post("/api/teams/financial", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        const { monthlyBudget, ...teamData } = req.body;
        
        // Convert monthlyBudget to cents if provided
        const processedData = {
          ...teamData,
          ownerId: userId,
          monthlyBudget: monthlyBudget ? Math.round(parseFloat(monthlyBudget) * 100) : null,
          goals: teamData.goals || []
        };
        
        // Create team in database
        const team = await storage.createFinancialTeam(processedData);
        
        // Add the creator as owner
        await storage.createTeamMember({
          teamId: team.id,
          userId: userId,
          role: 'owner',
          permissions: ['all']
        });
        
        console.log(`Team created for user ${userId}:`, team.name);
        
        // Return team with additional details
        const teamWithDetails = {
          ...team,
          memberCount: 1,
          role: 'owner',
          monthlyBudget: team.monthlyBudget ? team.monthlyBudget / 100 : null,
          goals: team.goals || []
        };
        
        res.status(201).json(teamWithDetails);
      } catch (error) {
        console.error('Error creating financial team:', error);
        res.status(500).json({ error: 'Failed to create financial team' });
      }
    });

    // Update team endpoint
    app.put("/api/teams/financial/:teamId", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;
        const { monthlyBudget, ...updateData } = req.body;
        
        // Check if user has permission to update this team
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
          return res.status(403).json({ error: 'Insufficient permissions to update team' });
        }
        
        // Convert monthlyBudget to cents if provided
        const processedData = {
          ...updateData,
          monthlyBudget: monthlyBudget ? Math.round(parseFloat(monthlyBudget) * 100) : null,
          updatedAt: new Date()
        };
        
        const updatedTeam = await storage.updateFinancialTeam(teamId, processedData);
        
        // Return team with additional details
        const teamWithDetails = {
          ...updatedTeam,
          memberCount: members.length,
          role: userMember.role,
          monthlyBudget: updatedTeam.monthlyBudget ? updatedTeam.monthlyBudget / 100 : null,
          goals: updatedTeam.goals || []
        };
        
        res.json(teamWithDetails);
      } catch (error) {
        console.error('Error updating financial team:', error);
        res.status(500).json({ error: 'Failed to update financial team' });
      }
    });

    // Get all users for adding members
    app.get("/api/users", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const users = await storage.getAllUsers();
        // Return only basic user info for privacy
        const publicUsers = users.map(user => ({
          id: user.id,
          username: user.username
        }));
        res.json(publicUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    });

    // Add team member endpoint
    app.post("/api/teams/financial/:teamId/members", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;
        const { userId: newMemberId, role = 'member' } = req.body;
        
        // Check if user has permission to add members
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
          return res.status(403).json({ error: 'Insufficient permissions to add members' });
        }
        
        // Check if user is already a member
        const existingMember = members.find(m => m.userId === newMemberId);
        if (existingMember) {
          return res.status(400).json({ error: 'User is already a team member' });
        }
        
        const newMember = await storage.createTeamMember({
          teamId: teamId,
          userId: newMemberId,
          role: role,
          permissions: role === 'owner' ? ['all'] : []
        });
        
        res.status(201).json(newMember);
      } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add team member' });
      }
    });

    // Remove team member endpoint
    app.delete("/api/teams/financial/:teamId/members/:memberId", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const memberId = parseInt(req.params.memberId);
        const userId = req.user.id;
        
        // Check if user has permission to remove members
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        const targetMember = members.find(m => m.id === memberId);
        
        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
          return res.status(403).json({ error: 'Insufficient permissions to remove members' });
        }
        
        if (!targetMember) {
          return res.status(404).json({ error: 'Team member not found' });
        }
        
        // Prevent removing the team owner
        if (targetMember.role === 'owner') {
          return res.status(400).json({ error: 'Cannot remove team owner' });
        }
        
        await storage.removeTeamMember(memberId);
        res.json({ message: 'Team member removed successfully' });
      } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
      }
    });

    // Email invitation endpoint
    app.post("/api/teams/:teamId/invite-email", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;
        const { email, role = 'member' } = req.body;
        
        if (!email) {
          return res.status(400).json({ error: 'Email address is required' });
        }
        
        // Check if user has permission to invite members
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
          return res.status(403).json({ error: 'Insufficient permissions to invite members' });
        }

        // Get team details for the invitation
        const team = await storage.getFinancialTeam(teamId);
        if (!team) {
          return res.status(404).json({ error: 'Team not found' });
        }

        // Check if SENDGRID_API_KEY is available
        if (!process.env.SENDGRID_API_KEY) {
          return res.status(500).json({ 
            error: 'Email service not configured. SENDGRID_API_KEY is required.' 
          });
        }

        // Import SendGrid dynamically
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        // Create invitation token
        const inviteToken = randomBytes(32).toString('hex');
        const inviteUrl = `${req.protocol}://${req.get('host')}/join-team?token=${inviteToken}&team=${teamId}`;

        // Send invitation email
        const msg = {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@replit.com', // Use verified sender
          subject: `Invitation to join ${team.name} team on WealthSync AI`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're invited to join a financial team!</h2>
              <p>Hello,</p>
              <p>${req.user.username} has invited you to join the <strong>${team.name}</strong> team on WealthSync AI.</p>
              <p>As a team ${role}, you'll be able to collaborate on financial planning and access shared insights.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Join Team
                </a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${inviteUrl}</p>
              <p>This invitation will expire in 7 days.</p>
              <hr style="margin: 30px 0; border: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This email was sent from WealthSync AI. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `
        };

        console.log('Attempting to send email invitation:', {
          to: email,
          from: msg.from,
          subject: msg.subject
        });

        const result = await sgMail.default.send(msg);
        console.log('SendGrid response:', result);

        // Store invitation in database (you may want to create a table for this)
        // For now, we'll just return success
        res.json({ 
          message: 'Invitation sent successfully',
          email: email,
          role: role,
          messageId: result[0]?.headers?.['x-message-id'] || 'unknown'
        });

      } catch (error) {
        console.error('Error sending email invitation:', error);
        res.status(500).json({ 
          error: error.message || 'Failed to send invitation email' 
        });
      }
    });

    // Delete team endpoint
    app.delete("/api/teams/financial/:teamId", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;
        
        console.log(`[DELETE TEAM] User ${userId} attempting to delete team ${teamId}`);
        
        // Check if user is the team owner
        const members = await storage.getTeamMembers(teamId);
        console.log(`[DELETE TEAM] Found ${members.length} members:`, members);
        
        const userMember = members.find(m => m.userId === userId);
        console.log(`[DELETE TEAM] User member:`, userMember);
        
        if (!userMember || userMember.role !== 'owner') {
          console.log(`[DELETE TEAM] Access denied - user is not owner`);
          return res.status(403).json({ error: 'Only team owner can delete the team' });
        }
        
        console.log(`[DELETE TEAM] Removing ${members.length} team members`);
        // First remove all team members, then delete the team
        for (const member of members) {
          await storage.removeTeamMember(member.id);
          console.log(`[DELETE TEAM] Removed member ${member.id}`);
        }
        
        console.log(`[DELETE TEAM] Deleting team ${teamId}`);
        // Now delete the team
        await storage.deleteFinancialTeam(teamId);
        console.log(`[DELETE TEAM] Team ${teamId} deleted successfully`);
        
        res.json({ message: 'Team deleted successfully' });
      } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
      }
    });

    // Get team members endpoint
    app.get("/api/teams/financial/:teamId/members", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const members = await storage.getTeamMembers(teamId);
        
        // Get user details for each member
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = await storage.getUser(member.userId);
            return {
              ...member,
              username: user?.username || 'Unknown User'
            };
          })
        );
        
        res.json(membersWithDetails);
      } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
      }
    });

    // Get team members endpoint (simplified route)
    app.get("/api/teams/:teamId/members", async (req, res) => {
      console.log('[TEAM MEMBERS ROUTE] Hit /api/teams/:teamId/members', req.params);
      
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        console.log('[TEAM MEMBERS ROUTE] Getting members for team ID:', teamId);
        
        const members = await storage.getTeamMembers(teamId);
        console.log('[TEAM MEMBERS ROUTE] Found members:', members);
        
        // Get user details for each member
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = await storage.getUser(member.userId);
            return {
              ...member,
              username: user?.username || 'Unknown User'
            };
          })
        );
        
        console.log('[TEAM MEMBERS ROUTE] Returning members with details:', membersWithDetails);
        res.json(membersWithDetails);
      } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
      }
    });

    // Add financial metric endpoint
    app.post("/api/teams/financial/:teamId/metrics", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;
        const { type, amount, description, periodStart, periodEnd } = req.body;
        
        console.log('Received metric data:', { type, amount, description, periodStart, periodEnd });
        console.log('Date objects:', { 
          periodStartDate: new Date(periodStart), 
          periodEndDate: new Date(periodEnd),
          isValidStart: !isNaN(new Date(periodStart).getTime()),
          isValidEnd: !isNaN(new Date(periodEnd).getTime())
        });

        // Check if user has permission to add metrics to this team
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember) {
          return res.status(403).json({ error: 'User is not a member of this team' });
        }

        // Create financial metric - convert date strings to Date objects for database
        const metricData = {
          teamId: teamId,
          userId: userId,
          metricType: type,
          amount: Math.round(amount * 100), // Convert to cents
          description: description,
          periodStart: new Date(periodStart + 'T00:00:00.000Z'),
          periodEnd: new Date(periodEnd + 'T23:59:59.999Z'),
          currency: 'USD'
        };

        const metric = await storage.createTeamFinancialMetric(metricData);
        
        res.status(201).json(metric);
      } catch (error) {
        console.error('Error adding financial metric:', error);
        res.status(500).json({ error: 'Failed to add financial metric' });
      }
    });

    // Get financial metrics for a team
    app.get("/api/teams/:teamId/metrics", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;

        // Check if user has access to this team
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember) {
          return res.status(403).json({ error: 'User is not a member of this team' });
        }

        // Get team financial metrics
        const metrics = await storage.getTeamFinancialMetrics(teamId);
        
        res.json(metrics);
      } catch (error) {
        console.error('Error fetching team financial metrics:', error);
        res.status(500).json({ error: 'Failed to fetch financial metrics' });
      }
    });

    app.get("/api/teams/:teamId/health-report", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const userId = req.user.id;

        // Check if user has access to this team
        const members = await storage.getTeamMembers(teamId);
        const userMember = members.find(m => m.userId === userId);
        
        if (!userMember) {
          return res.status(403).json({ error: 'User is not a member of this team' });
        }

        // Get team details
        const teams = await storage.getUserFinancialTeams(userId);
        const team = teams.find(t => t.id === teamId);
        
        if (!team) {
          return res.status(404).json({ error: 'Team not found' });
        }

        // Get team financial metrics
        const metrics = await storage.getTeamFinancialMetrics(teamId);

        // Calculate real financial health based on team data
        const monthlyBudget = team.monthlyBudget || 0; // Budget is already in cents
        
        // Calculate totals from metrics
        const totalIncome = metrics
          .filter(m => m.metricType === 'income')
          .reduce((sum, m) => sum + m.amount, 0);
        
        const totalExpenses = metrics
          .filter(m => m.metricType === 'expenses')
          .reduce((sum, m) => sum + m.amount, 0);
        
        const totalSavings = metrics
          .filter(m => m.metricType === 'savings')
          .reduce((sum, m) => sum + m.amount, 0);

        // Calculate derived metrics
        const netIncome = totalIncome - totalExpenses;
        const burnRate = totalExpenses;
        const cashRunway = burnRate > 0 ? Math.floor(totalSavings / burnRate) : 999;

        // Calculate budget utilization
        const budgetUtilization = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

        // Determine financial health score and status
        let overallScore = 50; // Base score
        let financialHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';

        // Scoring logic
        if (netIncome > 0) overallScore += 20;
        if (budgetUtilization < 80) overallScore += 15;
        if (cashRunway > 3) overallScore += 15;
        if (totalSavings > monthlyBudget) overallScore += 10;

        if (overallScore >= 85) financialHealth = 'excellent';
        else if (overallScore >= 70) financialHealth = 'good';
        else if (overallScore >= 50) financialHealth = 'fair';
        else financialHealth = 'poor';

        // Generate dynamic summary
        const budgetInDollars = Math.floor(monthlyBudget / 100);
        const incomeInDollars = Math.floor(totalIncome / 100);
        const expensesInDollars = Math.floor(totalExpenses / 100);

        let summary = `Team budget: $${budgetInDollars.toLocaleString()}. `;
        if (metrics.length === 0) {
          summary += 'No financial metrics recorded yet. Add income and expense data to get detailed insights.';
        } else {
          summary += `Recorded income: $${incomeInDollars.toLocaleString()}, expenses: $${expensesInDollars.toLocaleString()}. `;
          if (netIncome > 0) {
            summary += 'Positive cash flow indicates good financial management.';
          } else if (netIncome < 0) {
            summary += 'Expenses exceed income - consider cost reduction strategies.';
          } else {
            summary += 'Breaking even on income vs expenses.';
          }
        }

        // Generate dynamic recommendations
        const recommendations = [];
        if (budgetUtilization > 90) {
          recommendations.push('Budget utilization is high - consider increasing budget or reducing expenses');
        }
        if (cashRunway < 3) {
          recommendations.push('Build emergency fund to cover at least 3 months of expenses');
        }
        if (totalSavings < monthlyBudget) {
          recommendations.push('Increase savings to at least one month of budget');
        }
        if (metrics.length < 3) {
          recommendations.push('Add more financial metrics to get better insights and recommendations');
        }
        if (recommendations.length === 0) {
          recommendations.push('Financial health is good - maintain current spending patterns');
        }

        const healthReport = {
          overallScore,
          financialHealth,
          summary,
          keyMetrics: {
            totalIncome,
            totalExpenses,
            totalSavings,
            burnRate,
            cashRunway
          },
          insights: [],
          recommendations,
          trends: {
            income: 'stable',
            expenses: 'stable',
            savings: 'stable'
          }
        };
        
        res.json(healthReport);
      } catch (error) {
        console.error('Error generating team health report:', error);
        res.status(500).json({ error: 'Failed to generate health report' });
      }
    });

    app.get("/api/teams/:teamId/insights", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const teamId = parseInt(req.params.teamId);
        const insights = await storage.getTeamInsights(teamId, req.user.id);
        res.json(insights || []);
      } catch (error) {
        console.error('Error generating team insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
      }
    });

    // You.com Research API status check
    app.get("/api/research/status", async (req, res) => {
      const { youResearchService } = await import('./services/you-research-api');
      res.json({ available: youResearchService.isAvailable(), keyConfigured: !!process.env.YOU_API_KEY });
    });

    // You.com Research API endpoints
    app.get("/api/research/market-news", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { symbol, timeframe = 'week' } = req.query;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.getMarketNews(
          symbol as string, 
          timeframe as 'day' | 'week' | 'month'
        );
        
        res.json(results);
      } catch (error) {
        console.error('Market news research error:', error);
        res.status(500).json({ error: 'Failed to fetch market news' });
      }
    });

    app.get("/api/research/investment", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { type, riskLevel, sector } = req.query;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.researchInvestment(
          type as string,
          riskLevel as string,
          sector as string
        );
        
        res.json(results);
      } catch (error) {
        console.error('Investment research error:', error);
        res.status(500).json({ error: 'Failed to research investments' });
      }
    });

    app.get("/api/research/economic-insights", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { country = 'US' } = req.query;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.getEconomicInsights(country as string);
        
        res.json(results);
      } catch (error) {
        console.error('Economic insights research error:', error);
        res.status(500).json({ error: 'Failed to fetch economic insights' });
      }
    });

    app.get("/api/research/company/:companyName", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { companyName } = req.params;
        const { includeCompetitors = 'false' } = req.query;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.researchCompany(
          companyName,
          includeCompetitors === 'true'
        );
        
        res.json(results);
      } catch (error) {
        console.error('Company research error:', error);
        res.status(500).json({ error: 'Failed to research company' });
      }
    });

    app.get("/api/research/education/:topic", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { topic } = req.params;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.getFinancialEducation(topic);
        
        res.json(results);
      } catch (error) {
        console.error('Financial education research error:', error);
        res.status(500).json({ error: 'Failed to fetch educational content' });
      }
    });

    app.get("/api/research/funding", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { businessType, country = 'US' } = req.query;
        const { youResearchService } = await import('./services/you-research-api');
        
        const results = await youResearchService.searchFundingOpportunities(
          businessType as string,
          country as string
        );
        
        res.json(results);
      } catch (error) {
        console.error('Funding research error:', error);
        res.status(500).json({ error: 'Failed to search funding opportunities' });
      }
    });

    // Basic Tier Economic Data API - World Bank Integration for Multiple Countries
    app.get("/api/economic-data", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const countryCode = req.query.country as string || 'US';
        console.log(`[BasicTier] Fetching real economic data for ${countryCode} from World Bank API`);

        // Comprehensive country mapping for World Bank API (195+ countries)
        const countryMapping: Record<string, { name: string, flag: string, worldBankCode: string, currency: string }> = {
          // Major economies
          'US': { name: 'United States', flag: '🇺🇸', worldBankCode: 'USA', currency: 'USD' },
          'CN': { name: 'China', flag: '🇨🇳', worldBankCode: 'CHN', currency: 'CNY' },
          'JP': { name: 'Japan', flag: '🇯🇵', worldBankCode: 'JPN', currency: 'JPY' },
          'DE': { name: 'Germany', flag: '🇩🇪', worldBankCode: 'DEU', currency: 'EUR' },
          'IN': { name: 'India', flag: '🇮🇳', worldBankCode: 'IND', currency: 'INR' },
          'GB': { name: 'United Kingdom', flag: '🇬🇧', worldBankCode: 'GBR', currency: 'GBP' },
          'FR': { name: 'France', flag: '🇫🇷', worldBankCode: 'FRA', currency: 'EUR' },
          'IT': { name: 'Italy', flag: '🇮🇹', worldBankCode: 'ITA', currency: 'EUR' },
          'BR': { name: 'Brazil', flag: '🇧🇷', worldBankCode: 'BRA', currency: 'BRL' },
          'CA': { name: 'Canada', flag: '🇨🇦', worldBankCode: 'CAN', currency: 'CAD' },
          'KR': { name: 'South Korea', flag: '🇰🇷', worldBankCode: 'KOR', currency: 'KRW' },
          'ES': { name: 'Spain', flag: '🇪🇸', worldBankCode: 'ESP', currency: 'EUR' },
          'AU': { name: 'Australia', flag: '🇦🇺', worldBankCode: 'AUS', currency: 'AUD' },
          'MX': { name: 'Mexico', flag: '🇲🇽', worldBankCode: 'MEX', currency: 'MXN' },
          'ID': { name: 'Indonesia', flag: '🇮🇩', worldBankCode: 'IDN', currency: 'IDR' },
          'NL': { name: 'Netherlands', flag: '🇳🇱', worldBankCode: 'NLD', currency: 'EUR' },
          'SA': { name: 'Saudi Arabia', flag: '🇸🇦', worldBankCode: 'SAU', currency: 'SAR' },
          'TR': { name: 'Turkey', flag: '🇹🇷', worldBankCode: 'TUR', currency: 'TRY' },
          'TW': { name: 'Taiwan', flag: '🇹🇼', worldBankCode: 'TWN', currency: 'TWD' },
          'BE': { name: 'Belgium', flag: '🇧🇪', worldBankCode: 'BEL', currency: 'EUR' },
          
          // Middle East & North Africa
          'AE': { name: 'United Arab Emirates', flag: '🇦🇪', worldBankCode: 'ARE', currency: 'AED' },
          'OM': { name: 'Oman', flag: '🇴🇲', worldBankCode: 'OMN', currency: 'OMR' },
          'QA': { name: 'Qatar', flag: '🇶🇦', worldBankCode: 'QAT', currency: 'QAR' },
          'KW': { name: 'Kuwait', flag: '🇰🇼', worldBankCode: 'KWT', currency: 'KWD' },
          'BH': { name: 'Bahrain', flag: '🇧🇭', worldBankCode: 'BHR', currency: 'BHD' },
          'JO': { name: 'Jordan', flag: '🇯🇴', worldBankCode: 'JOR', currency: 'JOD' },
          'LB': { name: 'Lebanon', flag: '🇱🇧', worldBankCode: 'LBN', currency: 'LBP' },
          'IL': { name: 'Israel', flag: '🇮🇱', worldBankCode: 'ISR', currency: 'ILS' },
          'EG': { name: 'Egypt', flag: '🇪🇬', worldBankCode: 'EGY', currency: 'EGP' },
          'MA': { name: 'Morocco', flag: '🇲🇦', worldBankCode: 'MAR', currency: 'MAD' },
          'DZ': { name: 'Algeria', flag: '🇩🇿', worldBankCode: 'DZA', currency: 'DZD' },
          'TN': { name: 'Tunisia', flag: '🇹🇳', worldBankCode: 'TUN', currency: 'TND' },
          'IR': { name: 'Iran', flag: '🇮🇷', worldBankCode: 'IRN', currency: 'IRR' },
          'IQ': { name: 'Iraq', flag: '🇮🇶', worldBankCode: 'IRQ', currency: 'IQD' },
          
          // Europe
          'RU': { name: 'Russia', flag: '🇷🇺', worldBankCode: 'RUS', currency: 'RUB' },
          'CH': { name: 'Switzerland', flag: '🇨🇭', worldBankCode: 'CHE', currency: 'CHF' },
          'AT': { name: 'Austria', flag: '🇦🇹', worldBankCode: 'AUT', currency: 'EUR' },
          'SE': { name: 'Sweden', flag: '🇸🇪', worldBankCode: 'SWE', currency: 'SEK' },
          'NO': { name: 'Norway', flag: '🇳🇴', worldBankCode: 'NOR', currency: 'NOK' },
          'DK': { name: 'Denmark', flag: '🇩🇰', worldBankCode: 'DNK', currency: 'DKK' },
          'FI': { name: 'Finland', flag: '🇫🇮', worldBankCode: 'FIN', currency: 'EUR' },
          'PL': { name: 'Poland', flag: '🇵🇱', worldBankCode: 'POL', currency: 'PLN' },
          'CZ': { name: 'Czech Republic', flag: '🇨🇿', worldBankCode: 'CZE', currency: 'CZK' },
          'HU': { name: 'Hungary', flag: '🇭🇺', worldBankCode: 'HUN', currency: 'HUF' },
          'PT': { name: 'Portugal', flag: '🇵🇹', worldBankCode: 'PRT', currency: 'EUR' },
          'GR': { name: 'Greece', flag: '🇬🇷', worldBankCode: 'GRC', currency: 'EUR' },
          'IE': { name: 'Ireland', flag: '🇮🇪', worldBankCode: 'IRL', currency: 'EUR' },
          'RO': { name: 'Romania', flag: '🇷🇴', worldBankCode: 'ROU', currency: 'RON' },
          'BG': { name: 'Bulgaria', flag: '🇧🇬', worldBankCode: 'BGR', currency: 'BGN' },
          'HR': { name: 'Croatia', flag: '🇭🇷', worldBankCode: 'HRV', currency: 'EUR' },
          'SI': { name: 'Slovenia', flag: '🇸🇮', worldBankCode: 'SVN', currency: 'EUR' },
          'SK': { name: 'Slovakia', flag: '🇸🇰', worldBankCode: 'SVK', currency: 'EUR' },
          'LT': { name: 'Lithuania', flag: '🇱🇹', worldBankCode: 'LTU', currency: 'EUR' },
          'LV': { name: 'Latvia', flag: '🇱🇻', worldBankCode: 'LVA', currency: 'EUR' },
          'EE': { name: 'Estonia', flag: '🇪🇪', worldBankCode: 'EST', currency: 'EUR' },
          'LU': { name: 'Luxembourg', flag: '🇱🇺', worldBankCode: 'LUX', currency: 'EUR' },
          'MT': { name: 'Malta', flag: '🇲🇹', worldBankCode: 'MLT', currency: 'EUR' },
          'CY': { name: 'Cyprus', flag: '🇨🇾', worldBankCode: 'CYP', currency: 'EUR' },
          'IS': { name: 'Iceland', flag: '🇮🇸', worldBankCode: 'ISL', currency: 'ISK' },
          'UA': { name: 'Ukraine', flag: '🇺🇦', worldBankCode: 'UKR', currency: 'UAH' },
          'BY': { name: 'Belarus', flag: '🇧🇾', worldBankCode: 'BLR', currency: 'BYN' },
          'MD': { name: 'Moldova', flag: '🇲🇩', worldBankCode: 'MDA', currency: 'MDL' },
          'AD': { name: 'Andorra', flag: '🇦🇩', worldBankCode: 'AND', currency: 'EUR' },
          'MC': { name: 'Monaco', flag: '🇲🇨', worldBankCode: 'MCO', currency: 'EUR' },
          'SM': { name: 'San Marino', flag: '🇸🇲', worldBankCode: 'SMR', currency: 'EUR' },
          'VA': { name: 'Vatican City', flag: '🇻🇦', worldBankCode: 'VAT', currency: 'EUR' },
          'LI': { name: 'Liechtenstein', flag: '🇱🇮', worldBankCode: 'LIE', currency: 'CHF' },
          
          // Asia-Pacific
          'SG': { name: 'Singapore', flag: '🇸🇬', worldBankCode: 'SGP', currency: 'SGD' },
          'HK': { name: 'Hong Kong', flag: '🇭🇰', worldBankCode: 'HKG', currency: 'HKD' },
          'MY': { name: 'Malaysia', flag: '🇲🇾', worldBankCode: 'MYS', currency: 'MYR' },
          'TH': { name: 'Thailand', flag: '🇹🇭', worldBankCode: 'THA', currency: 'THB' },
          'VN': { name: 'Vietnam', flag: '🇻🇳', worldBankCode: 'VNM', currency: 'VND' },
          'PH': { name: 'Philippines', flag: '🇵🇭', worldBankCode: 'PHL', currency: 'PHP' },
          'NZ': { name: 'New Zealand', flag: '🇳🇿', worldBankCode: 'NZL', currency: 'NZD' },
          'BD': { name: 'Bangladesh', flag: '🇧🇩', worldBankCode: 'BGD', currency: 'BDT' },
          'PK': { name: 'Pakistan', flag: '🇵🇰', worldBankCode: 'PAK', currency: 'PKR' },
          'LK': { name: 'Sri Lanka', flag: '🇱🇰', worldBankCode: 'LKA', currency: 'LKR' },
          'MM': { name: 'Myanmar', flag: '🇲🇲', worldBankCode: 'MMR', currency: 'MMK' },
          'KH': { name: 'Cambodia', flag: '🇰🇭', worldBankCode: 'KHM', currency: 'KHR' },
          'LA': { name: 'Laos', flag: '🇱🇦', worldBankCode: 'LAO', currency: 'LAK' },
          'BN': { name: 'Brunei', flag: '🇧🇳', worldBankCode: 'BRN', currency: 'BND' },
          'MV': { name: 'Maldives', flag: '🇲🇻', worldBankCode: 'MDV', currency: 'MVR' },
          'NP': { name: 'Nepal', flag: '🇳🇵', worldBankCode: 'NPL', currency: 'NPR' },
          'BT': { name: 'Bhutan', flag: '🇧🇹', worldBankCode: 'BTN', currency: 'BTN' },
          'MN': { name: 'Mongolia', flag: '🇲🇳', worldBankCode: 'MNG', currency: 'MNT' },
          'AF': { name: 'Afghanistan', flag: '🇦🇫', worldBankCode: 'AFG', currency: 'AFN' },
          'KZ': { name: 'Kazakhstan', flag: '🇰🇿', worldBankCode: 'KAZ', currency: 'KZT' },
          'UZ': { name: 'Uzbekistan', flag: '🇺🇿', worldBankCode: 'UZB', currency: 'UZS' },
          'TM': { name: 'Turkmenistan', flag: '🇹🇲', worldBankCode: 'TKM', currency: 'TMT' },
          'TJ': { name: 'Tajikistan', flag: '🇹🇯', worldBankCode: 'TJK', currency: 'TJS' },
          'KG': { name: 'Kyrgyzstan', flag: '🇰🇬', worldBankCode: 'KGZ', currency: 'KGS' },
          
          // Africa
          'ZA': { name: 'South Africa', flag: '🇿🇦', worldBankCode: 'ZAF', currency: 'ZAR' },
          'NG': { name: 'Nigeria', flag: '🇳🇬', worldBankCode: 'NGA', currency: 'NGN' },
          'KE': { name: 'Kenya', flag: '🇰🇪', worldBankCode: 'KEN', currency: 'KES' },
          'ET': { name: 'Ethiopia', flag: '🇪🇹', worldBankCode: 'ETH', currency: 'ETB' },
          'GH': { name: 'Ghana', flag: '🇬🇭', worldBankCode: 'GHA', currency: 'GHS' },
          'TZ': { name: 'Tanzania', flag: '🇹🇿', worldBankCode: 'TZA', currency: 'TZS' },
          'UG': { name: 'Uganda', flag: '🇺🇬', worldBankCode: 'UGA', currency: 'UGX' },
          'MZ': { name: 'Mozambique', flag: '🇲🇿', worldBankCode: 'MOZ', currency: 'MZN' },
          'MG': { name: 'Madagascar', flag: '🇲🇬', worldBankCode: 'MDG', currency: 'MGA' },
          'CM': { name: 'Cameroon', flag: '🇨🇲', worldBankCode: 'CMR', currency: 'XAF' },
          'CI': { name: 'Côte d\'Ivoire', flag: '🇨🇮', worldBankCode: 'CIV', currency: 'XOF' },
          'BF': { name: 'Burkina Faso', flag: '🇧🇫', worldBankCode: 'BFA', currency: 'XOF' },
          'ML': { name: 'Mali', flag: '🇲🇱', worldBankCode: 'MLI', currency: 'XOF' },
          'NE': { name: 'Niger', flag: '🇳🇪', worldBankCode: 'NER', currency: 'XOF' },
          'SN': { name: 'Senegal', flag: '🇸🇳', worldBankCode: 'SEN', currency: 'XOF' },
          'GN': { name: 'Guinea', flag: '🇬🇳', worldBankCode: 'GIN', currency: 'GNF' },
          'SL': { name: 'Sierra Leone', flag: '🇸🇱', worldBankCode: 'SLE', currency: 'SLL' },
          'LR': { name: 'Liberia', flag: '🇱🇷', worldBankCode: 'LBR', currency: 'LRD' },
          'TG': { name: 'Togo', flag: '🇹🇬', worldBankCode: 'TGO', currency: 'XOF' },
          'BJ': { name: 'Benin', flag: '🇧🇯', worldBankCode: 'BEN', currency: 'XOF' },
          'GW': { name: 'Guinea-Bissau', flag: '🇬🇼', worldBankCode: 'GNB', currency: 'XOF' },
          'CV': { name: 'Cape Verde', flag: '🇨🇻', worldBankCode: 'CPV', currency: 'CVE' },
          'GM': { name: 'Gambia', flag: '🇬🇲', worldBankCode: 'GMB', currency: 'GMD' },
          'MR': { name: 'Mauritania', flag: '🇲🇷', worldBankCode: 'MRT', currency: 'MRU' },
          'LY': { name: 'Libya', flag: '🇱🇾', worldBankCode: 'LBY', currency: 'LYD' },
          'SD': { name: 'Sudan', flag: '🇸🇩', worldBankCode: 'SDN', currency: 'SDG' },
          'SS': { name: 'South Sudan', flag: '🇸🇸', worldBankCode: 'SSD', currency: 'SSP' },
          'CF': { name: 'Central African Republic', flag: '🇨🇫', worldBankCode: 'CAF', currency: 'XAF' },
          'TD': { name: 'Chad', flag: '🇹🇩', worldBankCode: 'TCD', currency: 'XAF' },
          'CG': { name: 'Republic of the Congo', flag: '🇨🇬', worldBankCode: 'COG', currency: 'XAF' },
          'CD': { name: 'Democratic Republic of the Congo', flag: '🇨🇩', worldBankCode: 'COD', currency: 'CDF' },
          'GA': { name: 'Gabon', flag: '🇬🇦', worldBankCode: 'GAB', currency: 'XAF' },
          'GQ': { name: 'Equatorial Guinea', flag: '🇬🇶', worldBankCode: 'GNQ', currency: 'XAF' },
          'ST': { name: 'São Tomé and Príncipe', flag: '🇸🇹', worldBankCode: 'STP', currency: 'STN' },
          'AO': { name: 'Angola', flag: '🇦🇴', worldBankCode: 'AGO', currency: 'AOA' },
          'ZM': { name: 'Zambia', flag: '🇿🇲', worldBankCode: 'ZMB', currency: 'ZMW' },
          'ZW': { name: 'Zimbabwe', flag: '🇿🇼', worldBankCode: 'ZWE', currency: 'ZWL' },
          'BW': { name: 'Botswana', flag: '🇧🇼', worldBankCode: 'BWA', currency: 'BWP' },
          'NA': { name: 'Namibia', flag: '🇳🇦', worldBankCode: 'NAM', currency: 'NAD' },
          'SZ': { name: 'Eswatini', flag: '🇸🇿', worldBankCode: 'SWZ', currency: 'SZL' },
          'LS': { name: 'Lesotho', flag: '🇱🇸', worldBankCode: 'LSO', currency: 'LSL' },
          'MW': { name: 'Malawi', flag: '🇲🇼', worldBankCode: 'MWI', currency: 'MWK' },
          'RW': { name: 'Rwanda', flag: '🇷🇼', worldBankCode: 'RWA', currency: 'RWF' },
          'BI': { name: 'Burundi', flag: '🇧🇮', worldBankCode: 'BDI', currency: 'BIF' },
          'DJ': { name: 'Djibouti', flag: '🇩🇯', worldBankCode: 'DJI', currency: 'DJF' },
          'ER': { name: 'Eritrea', flag: '🇪🇷', worldBankCode: 'ERI', currency: 'ERN' },
          'SO': { name: 'Somalia', flag: '🇸🇴', worldBankCode: 'SOM', currency: 'SOS' },
          'KM': { name: 'Comoros', flag: '🇰🇲', worldBankCode: 'COM', currency: 'KMF' },
          'MU': { name: 'Mauritius', flag: '🇲🇺', worldBankCode: 'MUS', currency: 'MUR' },
          'SC': { name: 'Seychelles', flag: '🇸🇨', worldBankCode: 'SYC', currency: 'SCR' },
          
          // Americas
          'AR': { name: 'Argentina', flag: '🇦🇷', worldBankCode: 'ARG', currency: 'ARS' },
          'CL': { name: 'Chile', flag: '🇨🇱', worldBankCode: 'CHL', currency: 'CLP' },
          'CO': { name: 'Colombia', flag: '🇨🇴', worldBankCode: 'COL', currency: 'COP' },
          'PE': { name: 'Peru', flag: '🇵🇪', worldBankCode: 'PER', currency: 'PEN' },
          'VE': { name: 'Venezuela', flag: '🇻🇪', worldBankCode: 'VEN', currency: 'VES' },
          'EC': { name: 'Ecuador', flag: '🇪🇨', worldBankCode: 'ECU', currency: 'USD' },
          'BO': { name: 'Bolivia', flag: '🇧🇴', worldBankCode: 'BOL', currency: 'BOB' },
          'PY': { name: 'Paraguay', flag: '🇵🇾', worldBankCode: 'PRY', currency: 'PYG' },
          'UY': { name: 'Uruguay', flag: '🇺🇾', worldBankCode: 'URY', currency: 'UYU' },
          'GY': { name: 'Guyana', flag: '🇬🇾', worldBankCode: 'GUY', currency: 'GYD' },
          'SR': { name: 'Suriname', flag: '🇸🇷', worldBankCode: 'SUR', currency: 'SRD' },
          'GT': { name: 'Guatemala', flag: '🇬🇹', worldBankCode: 'GTM', currency: 'GTQ' },
          'HN': { name: 'Honduras', flag: '🇭🇳', worldBankCode: 'HND', currency: 'HNL' },
          'NI': { name: 'Nicaragua', flag: '🇳🇮', worldBankCode: 'NIC', currency: 'NIO' },
          'CR': { name: 'Costa Rica', flag: '🇨🇷', worldBankCode: 'CRI', currency: 'CRC' },
          'PA': { name: 'Panama', flag: '🇵🇦', worldBankCode: 'PAN', currency: 'PAB' },
          'BZ': { name: 'Belize', flag: '🇧🇿', worldBankCode: 'BLZ', currency: 'BZD' },
          'SV': { name: 'El Salvador', flag: '🇸🇻', worldBankCode: 'SLV', currency: 'USD' },
          'CU': { name: 'Cuba', flag: '🇨🇺', worldBankCode: 'CUB', currency: 'CUP' },
          'DO': { name: 'Dominican Republic', flag: '🇩🇴', worldBankCode: 'DOM', currency: 'DOP' },
          'HT': { name: 'Haiti', flag: '🇭🇹', worldBankCode: 'HTI', currency: 'HTG' },
          'JM': { name: 'Jamaica', flag: '🇯🇲', worldBankCode: 'JAM', currency: 'JMD' },
          'TT': { name: 'Trinidad and Tobago', flag: '🇹🇹', worldBankCode: 'TTO', currency: 'TTD' },
          'BB': { name: 'Barbados', flag: '🇧🇧', worldBankCode: 'BRB', currency: 'BBD' },
          'BS': { name: 'Bahamas', flag: '🇧🇸', worldBankCode: 'BHS', currency: 'BSD' },
          'AG': { name: 'Antigua and Barbuda', flag: '🇦🇬', worldBankCode: 'ATG', currency: 'XCD' },
          'DM': { name: 'Dominica', flag: '🇩🇲', worldBankCode: 'DMA', currency: 'XCD' },
          'GD': { name: 'Grenada', flag: '🇬🇩', worldBankCode: 'GRD', currency: 'XCD' },
          'KN': { name: 'Saint Kitts and Nevis', flag: '🇰🇳', worldBankCode: 'KNA', currency: 'XCD' },
          'LC': { name: 'Saint Lucia', flag: '🇱🇨', worldBankCode: 'LCA', currency: 'XCD' },
          'VC': { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', worldBankCode: 'VCT', currency: 'XCD' }
        };

        const selectedCountry = countryMapping[countryCode] || countryMapping['US'];
        const wbCode = selectedCountry.worldBankCode;

        // Fetch real economic data from World Bank API (free, authentic government data)
        const [gdpResponse, inflationResponse, unemploymentResponse] = await Promise.all([
          fetch(`https://api.worldbank.org/v2/country/${wbCode}/indicator/NY.GDP.MKTP.CD?date=2020:2024&format=json&per_page=5`),
          fetch(`https://api.worldbank.org/v2/country/${wbCode}/indicator/FP.CPI.TOTL.ZG?date=2020:2024&format=json&per_page=5`),
          fetch(`https://api.worldbank.org/v2/country/${wbCode}/indicator/SL.UEM.TOTL.ZS?date=2020:2024&format=json&per_page=5`)
        ]);

        // Check if API calls were successful
        if (!gdpResponse.ok || !inflationResponse.ok || !unemploymentResponse.ok) {
          return res.status(503).json({
            error: 'World Bank API unavailable',
            message: 'Economic data service temporarily unavailable.',
            statusCodes: {
              gdp: gdpResponse.status,
              inflation: inflationResponse.status,
              unemployment: unemploymentResponse.status
            }
          });
        }

        const [gdpData, inflationData, unemploymentData] = await Promise.all([
          gdpResponse.json(),
          inflationResponse.json(),
          unemploymentResponse.json()
        ]);

        // Extract real values from World Bank API responses
        let gdp = null;
        let gdpGrowth = null;
        let inflation = null;
        let unemployment = null;

        // Parse GDP data (World Bank returns [metadata, data])
        if (gdpData[1] && gdpData[1].length > 0) {
          const latestGDP = gdpData[1].find(item => item.value !== null);
          if (latestGDP) {
            gdp = latestGDP.value;
            
            // Calculate GDP growth if we have previous year data
            const previousGDP = gdpData[1].find(item => 
              item.value !== null && parseInt(item.date) < parseInt(latestGDP.date)
            );
            if (previousGDP) {
              gdpGrowth = ((latestGDP.value - previousGDP.value) / previousGDP.value) * 100;
            }
          }
        }

        // Parse inflation data
        if (inflationData[1] && inflationData[1].length > 0) {
          const latestInflation = inflationData[1].find(item => item.value !== null);
          if (latestInflation) {
            inflation = latestInflation.value;
          }
        }

        // Parse unemployment data
        if (unemploymentData[1] && unemploymentData[1].length > 0) {
          const latestUnemployment = unemploymentData[1].find(item => item.value !== null);
          if (latestUnemployment) {
            unemployment = latestUnemployment.value;
          }
        }

        // Determine market sentiment based on real indicators
        let marketSentiment = "neutral";
        if (gdpGrowth !== null && unemployment !== null && inflation !== null) {
          if (gdpGrowth > 2.5 && unemployment < 5 && inflation < 3) {
            marketSentiment = "optimistic";
          } else if (gdpGrowth < 0 || unemployment > 8 || inflation > 5) {
            marketSentiment = "pessimistic";
          } else {
            marketSentiment = "cautiously optimistic";
          }
        }

        // Only return data if we have real values from World Bank
        if (gdp === null || inflation === null || unemployment === null) {
          return res.status(503).json({
            error: 'Incomplete economic data',
            message: `Unable to retrieve complete economic dataset for ${selectedCountry.name} from World Bank`,
            availableData: {
              gdp: gdp !== null,
              inflation: inflation !== null,
              unemployment: unemployment !== null
            }
          });
        }

        const economicData = {
          gdp: Math.round(gdp),
          gdpGrowth: gdpGrowth ? Math.round(gdpGrowth * 10) / 10 : null,
          inflation: Math.round(inflation * 10) / 10,
          unemployment: Math.round(unemployment * 10) / 10,
          interestRate: null, // World Bank doesn't provide interest rates in free tier
          marketSentiment,
          lastUpdated: new Date().toISOString(),
          dataSource: "World Bank Open Data",
          country: selectedCountry.name,
          countryCode: countryCode,
          currency: selectedCountry.currency,
          isAuthenticated: true
        };

        console.log(`[BasicTier] Successfully retrieved real economic data for ${selectedCountry.name}:`, economicData);
        res.json(economicData);

      } catch (error) {
        console.error('[BasicTier] Error fetching real economic data:', error);
        res.status(503).json({ 
          error: 'Economic data service error',
          message: 'Unable to connect to World Bank API.',
          technicalDetails: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Team Financial Health API
    app.get("/api/teams/financial-health", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const userId = req.user.id;
        
        // Get user's teams
        const teams = await storage.getUserFinancialTeams(userId);
        
        if (teams.length === 0) {
          return res.json({
            monthlyBudget: 0,
            currentSpending: 0,
            teamSize: 0,
            budgetUtilization: 0,
            savingsGoal: 0,
            actualSavings: 0,
            costPerEmployee: 0,
            projectedBurnRate: 0
          });
        }

        // Calculate aggregated team financial health
        let totalBudget = 0;
        let totalSpending = 0;
        let totalTeamSize = 0;

        for (const team of teams) {
          totalBudget += team.monthlyBudget || 0;
          
          // Get team members count
          const members = await storage.getTeamMembers(team.id);
          totalTeamSize += members.length;
          
          // Calculate estimated spending (80% of budget utilization)
          const estimatedSpending = (team.monthlyBudget || 0) * 0.8;
          totalSpending += estimatedSpending;
        }

        const budgetUtilization = totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;
        const costPerEmployee = totalTeamSize > 0 ? totalSpending / totalTeamSize : 0;
        const savingsGoal = totalBudget * 0.2; // 20% savings target
        const actualSavings = totalBudget - totalSpending;

        const healthData = {
          monthlyBudget: totalBudget,
          currentSpending: totalSpending,
          teamSize: totalTeamSize,
          budgetUtilization: Math.round(budgetUtilization),
          savingsGoal: Math.round(savingsGoal),
          actualSavings: Math.round(actualSavings),
          costPerEmployee: Math.round(costPerEmployee),
          projectedBurnRate: Math.round(totalSpending)
        };

        res.json(healthData);
      } catch (error) {
        console.error('Error fetching team financial health:', error);
        res.status(500).json({ error: 'Failed to fetch team financial health' });
      }
    });

    // MapBox token endpoint for business map functionality
    app.get("/api/map-token", (req, res) => {
      try {
        const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
        if (mapboxToken) {
          res.json({ token: mapboxToken });
        } else {
          res.status(404).json({ error: 'MapBox token not configured' });
        }
      } catch (error) {
        console.error('Error retrieving MapBox token:', error);
        res.status(500).json({ error: 'Failed to retrieve MapBox token' });
      }
    });

    // Business map economic data endpoint - connects to authentic World Bank API
    app.get("/api/business-map/economic-data/:countryCode", async (req, res) => {
      try {
        const { countryCode } = req.params;
        
        // Use the same World Bank API integration that works in the basic dashboard
        const worldBankResponse = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.CD;FP.CPI.TOTL.ZG;SL.UEM.TOTL.ZS;NY.GDP.MKTP.KD.ZG;SP.POP.TOTL?format=json&per_page=100&date=2020:2023`
        );
        
        if (!worldBankResponse.ok) {
          throw new Error('World Bank API request failed');
        }
        
        const worldBankData = await worldBankResponse.json();
        
        if (!worldBankData || !Array.isArray(worldBankData) || worldBankData.length < 2) {
          return res.json({
            indicators: {
              gdp: null,
              inflation: null,
              unemployment: null,
              gdpGrowth: null,
              population: null
            },
            message: 'No World Bank data available for this country'
          });
        }
        
        const indicators = worldBankData[1] || [];
        
        // Process authentic World Bank data
        const processedData = {
          gdp: null,
          inflation: null,
          unemployment: null,
          gdpGrowth: null,
          population: null
        };
        
        indicators.forEach(item => {
          if (item && item.value !== null) {
            switch (item.indicator.id) {
              case 'NY.GDP.MKTP.CD': // GDP (current US$)
                processedData.gdp = item.value;
                break;
              case 'FP.CPI.TOTL.ZG': // Inflation, consumer prices (annual %)
                processedData.inflation = parseFloat(item.value.toFixed(2));
                break;
              case 'SL.UEM.TOTL.ZS': // Unemployment, total (% of total labor force)
                processedData.unemployment = parseFloat(item.value.toFixed(2));
                break;
              case 'NY.GDP.MKTP.KD.ZG': // GDP growth (annual %)
                processedData.gdpGrowth = parseFloat(item.value.toFixed(2));
                break;
              case 'SP.POP.TOTL': // Population, total
                processedData.population = item.value;
                break;
            }
          }
        });
        
        res.json({
          indicators: processedData,
          source: 'World Bank API',
          lastUpdated: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error fetching economic data:', error);
        res.status(500).json({ 
          error: 'Failed to fetch economic data',
          indicators: {
            gdp: null,
            inflation: null,
            unemployment: null,
            gdpGrowth: null,
            population: null
          }
        });
      }
    });

    // ===== PHASE 3: MULTI-AGENT SYSTEM ROUTES (PREMIUM) =====
    
    // Investment Strategist Agent (Premium Users)
    app.post("/api/agents/investment-strategist", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.user.id);
      const isPremium = (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'elite' || user?.subscriptionTier === 'enterprise') && 
                       user?.subscriptionStartDate && 
                       user?.subscriptionEndDate && 
                       new Date(user.subscriptionEndDate) > new Date();

      if (!isPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required for Investment Strategist analysis" 
        });
      }

      try {
        const { marketData } = req.body;
        const userProfile = {
          skills: user.skills,
          assets: user.assets,
          riskTolerance: user.riskTolerance,
          investmentGoals: user.investmentGoals,
          country: user.country
        };

        const analysis = await multiAgentSystem.getInvestmentStrategistAnalysis(userProfile, marketData);
        res.json(analysis);
      } catch (error) {
        console.error("Investment Strategist analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate investment analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Geopolitical Analyst Agent (Premium Users)
    app.post("/api/agents/geopolitical-analyst", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.user.id);
      const isPremium = (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'elite' || user?.subscriptionTier === 'enterprise') && 
                       user?.subscriptionStartDate && 
                       user?.subscriptionEndDate && 
                       new Date(user.subscriptionEndDate) > new Date();

      if (!isPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required for Geopolitical analysis" 
        });
      }

      try {
        const { country, region, timeframe } = req.body;
        const analysis = await multiAgentSystem.getGeopoliticalAnalysis(country, region, timeframe);
        res.json(analysis);
      } catch (error) {
        console.error("Geopolitical analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate geopolitical analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Opportunity Mapper Agent (Premium Users)
    app.post("/api/agents/opportunity-mapper", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.user.id);
      const isPremium = (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'elite' || user?.subscriptionTier === 'enterprise') && 
                       user?.subscriptionStartDate && 
                       user?.subscriptionEndDate && 
                       new Date(user.subscriptionEndDate) > new Date();

      if (!isPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required for Opportunity Mapping" 
        });
      }

      try {
        const { 
          sector, 
          region, 
          investmentRange, 
          timeHorizon, 
          riskTolerance, 
          interests,
          marketData 
        } = req.body;
        
        const userSkills = user.skills || [];
        
        // Provide default market data if none is provided
        const defaultMarketData = {
          gdpGrowth: 2.1,
          marketSize: 25000000000,
          industryTrends: ['Technology Growth', 'Digital Transformation', 'Sustainable Innovation'],
          inflation: 3.2,
          unemployment: 3.8
        };
        
        const analysis = await multiAgentSystem.getOpportunityMapping(
          userSkills, 
          marketData || defaultMarketData, 
          [region || 'Global Markets'],
          {
            sector,
            investmentRange,
            timeHorizon,
            riskTolerance,
            interests
          }
        );
        res.json(analysis);
      } catch (error) {
        console.error("Opportunity mapping failed:", error);
        res.status(500).json({ 
          error: "Failed to generate opportunity mapping",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Opportunity Mapper Agent (Premium Users)
    app.post("/api/agents/opportunity-mapper", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.user.id);
      const isPremium = (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'elite' || user?.subscriptionTier === 'enterprise') && 
                       user?.subscriptionStartDate && 
                       user?.subscriptionEndDate && 
                       new Date(user.subscriptionEndDate) > new Date();

      if (!isPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required for Opportunity Mapper analysis" 
        });
      }

      try {
        const { sector, region, investmentRange, timeHorizon, riskTolerance, interests } = req.body;
        const analysis = await multiAgentSystem.getOpportunityMapping(
          user.skills || [],
          { economicGrowth: '3.2%', employmentRate: '96.5%' },
          [region || 'Global'],
          { 
            sector,
            investmentRange,
            timeHorizon,
            riskTolerance,
            interests
          }
        );
        res.json(analysis);
      } catch (error) {
        console.error("Opportunity Mapper analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate opportunity analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Scenario Simulation Agent (Premium Users)
    app.post("/api/agents/scenario-simulation", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.user.id);
      const isPremium = (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'elite' || user?.subscriptionTier === 'enterprise') && 
                       user?.subscriptionStartDate && 
                       user?.subscriptionEndDate && 
                       new Date(user.subscriptionEndDate) > new Date();

      if (!isPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required for Scenario Simulation analysis" 
        });
      }

      try {
        const { region, timeframe, assumptions } = req.body;
        const analysis = await multiAgentSystem.runScenarioSimulation(
          'Economic Analysis',
          region || 'Global',
          { 
            timeframe,
            assumptions,
            volatility: 'Medium',
            gdpGrowth: '2.1%',
            inflation: '2.8%'
          }
        );
        res.json(analysis);
      } catch (error) {
        console.error("Scenario simulation failed:", error);
        res.status(500).json({ 
          error: "Failed to generate scenario simulation",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== COMPANY PREMIUM MULTI-AGENT ROUTES =====

    // Startup Health Analyzer (Premium Companies)
    app.post("/api/company/agents/startup-health", companyAuthMiddleware, async (req, res) => {
      try {
        const company = await storage.getCompany(req.session.company.id);
        
        if (!company || !isHighTier(company.subscriptionTier)) {
          return res.status(403).json({ 
            error: "Elite company subscription required for Startup Health analysis" 
          });
        }

        const { marketData } = req.body;
        const companyData = {
          industry: company.industry,
          employeeCount: company.employeeCount,
          revenue: company.revenue,
          country: company.country,
          businessModel: company.businessModel
        };

        const analysis = await multiAgentSystem.getStartupHealthAnalysis(companyData, marketData);
        res.json(analysis);
      } catch (error) {
        console.error("Startup health analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate startup health analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Trade Flow Analyzer (Premium Companies)
    app.post("/api/company/agents/trade-flow", companyAuthMiddleware, async (req, res) => {
      try {
        const company = await storage.getCompany(req.session.company.id);
        
        if (!company || !isHighTier(company.subscriptionTier)) {
          return res.status(403).json({ 
            error: "Elite company subscription required for Trade Flow analysis" 
          });
        }

        const { tradingPartners, sectors } = req.body;
        const country = company.country || 'Global';

        const analysis = await multiAgentSystem.getTradeFlowAnalysis(country, tradingPartners, sectors);
        res.json(analysis);
      } catch (error) {
        console.error("Trade flow analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate trade flow analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Market Risk Analyzer (Premium Companies)
    app.post("/api/company/agents/market-risk", companyAuthMiddleware, async (req, res) => {
      try {
        const company = await storage.getCompany(req.session.company?.id);
        
        if (!company || !isHighTier(company.subscriptionTier)) {
          return res.status(403).json({ 
            error: "Elite company subscription required for Market Risk analysis" 
          });
        }

        const { industry, country } = req.body;
        const analysisIndustry = industry || company.industry || 'Technology';
        const analysisCountry = country || company.country || 'Global';

        const analysis = await multiAgentSystem.getMarketRiskAnalysis(analysisIndustry, analysisCountry);
        res.json(analysis);
      } catch (error) {
        console.error("Market risk analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate market risk analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Performance Metrics Analyzer (Premium Companies)
    app.post("/api/company/agents/performance-metrics", companyAuthMiddleware, async (req, res) => {
      try {
        const company = await storage.getCompany(req.session.company?.id);
        
        if (!company || !isHighTier(company.subscriptionTier)) {
          return res.status(403).json({ 
            error: "Elite company subscription required for Performance Metrics analysis" 
          });
        }

        const { industry, country } = req.body;
        const analysisIndustry = industry || company.industry || 'Technology';
        const analysisCountry = country || company.country || 'Global';

        const companyData = {
          industry: analysisIndustry,
          country: analysisCountry,
          employeeCount: 50,
          revenue: 1000000
        };
        const marketData = {
          industryGrowth: '12%',
          marketSize: 50000000,
          competitionLevel: 'High'
        };
        const analysis = await multiAgentSystem.getCompanyPerformanceMetrics(companyData, marketData);
        res.json(analysis);
      } catch (error) {
        console.error("Performance metrics analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to generate performance metrics analysis",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // LinkedIn verification endpoint
    app.post("/api/verify-linkedin", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      try {
        const { profile } = req.body;
        
        if (!profile || !profile.includes('linkedin.com')) {
          return res.status(400).json({ 
            error: "Please provide a valid LinkedIn profile URL" 
          });
        }

        // Update user's LinkedIn profile and mark as verified
        const updatedUser = await storage.updateUser(req.user.id, {
          linkedinProfile: profile,
          linkedinVerified: true
        });

        // Update the session with the new user data
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session error during LinkedIn verification:", err);
            return res.status(500).json({ error: "Session update failed" });
          }
          
          res.json({ 
            success: true, 
            message: "LinkedIn profile verified successfully",
            linkedinProfile: profile,
            linkedinVerified: true
          });
        });

      } catch (error) {
        console.error("LinkedIn verification error:", error);
        res.status(500).json({ 
          error: "Failed to verify LinkedIn profile",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Deep Research API Routes (Premium Features)
    
    // Enhanced Market Research with Deep Analysis
    app.post("/api/deep-research/market-analysis", async (req, res) => {
      console.log('[DeepResearch API] Request received:', req.body);
      try {
        // Check authentication for both users and companies
        const isUserAuthenticated = req.isAuthenticated();
        const isCompanyAuthenticated = req.session?.company;
        console.log('[DeepResearch API] Auth status - User:', isUserAuthenticated, 'Company:', !!isCompanyAuthenticated);
        
        if (!isUserAuthenticated && !isCompanyAuthenticated) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Check premium access for individual users, all companies have access
        if (isUserAuthenticated && !isCompanyAuthenticated) {
          const user = req.user;
          if (!isHighTier(user.subscriptionTier)) {
            return res.status(403).json({ error: "Elite subscription required for Deep Research" });
          }
        }

        const { country, industry, focusAreas } = req.body;
        
        if (!country || !industry) {
          return res.status(400).json({ error: "Country and industry are required" });
        }

        // Get profile info from user or company
        let profileSize = 'medium';
        if (isUserAuthenticated && req.user) {
          profileSize = req.user.assets?.includes('small_business') ? 'small' : 'medium';
        } else if (isCompanyAuthenticated && req.session.company) {
          // Companies are typically medium to large
          profileSize = 'medium';
        }

        const research = await deepResearchService.generateEnhancedMarketReport(
          country,
          industry,
          {
            size: profileSize,
            focusAreas: focusAreas || [],
            goals: ['Market expansion', 'Competitive analysis']
          }
        );

        res.json(research);
      } catch (error: any) {
        console.error("Deep research market analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to conduct deep research analysis",
          details: error.message
        });
      }
    });

    // Funding Opportunities Deep Research
    app.post("/api/deep-research/funding-opportunities", async (req, res) => {
      try {
        // Check authentication for both users and companies
        const isUserAuthenticated = req.isAuthenticated();
        const isCompanyAuthenticated = req.session?.company;
        
        if (!isUserAuthenticated && !isCompanyAuthenticated) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Check premium access for individual users, all companies have access
        if (isUserAuthenticated && !isCompanyAuthenticated) {
          const user = req.user;
          if (!isHighTier(user.subscriptionTier)) {
            return res.status(403).json({ error: "Elite subscription required for Deep Research" });
          }
        }

        const { industry, country, companySize, focusAreas } = req.body;
        
        if (!industry || !country) {
          return res.status(400).json({ error: "Industry and country are required" });
        }

        const research = await deepResearchService.researchFundingOpportunities(
          industry,
          country,
          companySize || 'small',
          focusAreas || []
        );

        res.json(research);
      } catch (error: any) {
        console.error("Deep research funding analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to research funding opportunities",
          details: error.message
        });
      }
    });

    // Competitor Intelligence Deep Research
    app.post("/api/deep-research/competitor-analysis", async (req, res) => {
      try {
        // Check authentication for both users and companies
        const isUserAuthenticated = req.isAuthenticated();
        const isCompanyAuthenticated = req.session?.company;
        
        if (!isUserAuthenticated && !isCompanyAuthenticated) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Check premium access for individual users, all companies have access
        if (isUserAuthenticated && !isCompanyAuthenticated) {
          const user = req.user;
          if (!isHighTier(user.subscriptionTier)) {
            return res.status(403).json({ error: "Elite subscription required for Deep Research" });
          }
        }

        const { industry, country, marketSegment } = req.body;
        
        if (!industry || !country) {
          return res.status(400).json({ error: "Industry and country are required" });
        }

        const research = await deepResearchService.analyzeCompetitorLandscape(
          industry,
          country,
          marketSegment || 'general'
        );

        res.json(research);
      } catch (error: any) {
        console.error("Deep research competitor analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to analyze competitor landscape",
          details: error.message
        });
      }
    });

    // Economic Impact Analysis
    app.post("/api/deep-research/economic-impact", async (req, res) => {
      try {
        // Check authentication for both users and companies
        const isUserAuthenticated = req.isAuthenticated();
        const isCompanyAuthenticated = req.session?.company;
        
        if (!isUserAuthenticated && !isCompanyAuthenticated) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Check premium access for individual users, all companies have access
        if (isUserAuthenticated && !isCompanyAuthenticated) {
          const user = req.user;
          if (!isHighTier(user.subscriptionTier)) {
            return res.status(403).json({ error: "Elite subscription required for Deep Research" });
          }
        }

        const { topic, region, timeframe } = req.body;
        
        console.log(`[DeepResearch API] Economic Impact request - Topic: "${topic}", Region: "${region}", Timeframe: "${timeframe}"`);
        
        if (!topic || !region) {
          return res.status(400).json({ error: "Topic and region are required" });
        }

        // Extract industry from topic for debugging
        const industry = topic.replace(/\s*(sector\s+development|development|sector)\s*/gi, '').trim() || 'Technology';
        console.log(`[DeepResearch API] Extracted industry from topic: "${industry}"`);
        
        // Call the enhanced service which has quota-resistant fallbacks

        const research = await deepResearchService.analyzeEconomicImpact(
          topic,
          region,
          timeframe || '5 years'
        );

        res.json(research);
      } catch (error: any) {
        console.error("Deep research economic impact analysis failed:", error);
        res.status(500).json({ 
          error: "Failed to analyze economic impact",
          details: error.message
        });
      }
    });

    // ─── Finnhub: Live stock quotes ───────────────────────────────────────
    app.get("/api/finnhub/quote", async (req, res) => {
      try {
        const symbol = (req.query.symbol as string || "AAPL").toUpperCase();
        const key = process.env.FINNHUB_API_KEY;
        if (!key) return res.status(503).json({ error: "Finnhub API not configured" });
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
        if (!r.ok) return res.status(r.status).json({ error: "Finnhub error" });
        const data = await r.json();
        res.json({ symbol, current: data.c, change: data.d, changePercent: data.dp, high: data.h, low: data.l, open: data.o, prevClose: data.pc, timestamp: data.t });
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch quote", details: error.message });
      }
    });

    // ─── Finnhub: Market news ──────────────────────────────────────────────
    app.get("/api/finnhub/news", async (req, res) => {
      try {
        const category = (req.query.category as string) || "general";
        const key = process.env.FINNHUB_API_KEY;
        if (!key) return res.status(503).json({ error: "Finnhub API not configured" });
        const r = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${key}`);
        if (!r.ok) return res.status(r.status).json({ error: "Finnhub error" });
        const data = await r.json();
        // Return top 10 articles
        const news = (Array.isArray(data) ? data.slice(0, 10) : []).map((n: any) => ({
          id: n.id,
          headline: n.headline,
          summary: n.summary,
          source: n.source,
          url: n.url,
          image: n.image,
          datetime: n.datetime,
          category: n.category,
        }));
        res.json(news);
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch news", details: error.message });
      }
    });

    // ─── Finnhub: Company profile ──────────────────────────────────────────
    app.get("/api/finnhub/company/:symbol", async (req, res) => {
      try {
        const symbol = req.params.symbol.toUpperCase();
        const key = process.env.FINNHUB_API_KEY;
        if (!key) return res.status(503).json({ error: "Finnhub API not configured" });
        const [profileRes, metricsRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
          fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
        ]);
        const profile = await profileRes.json();
        const metrics = await metricsRes.json();
        res.json({ profile, metrics: metrics.metric });
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch company profile", details: error.message });
      }
    });

    // ─── Finnhub: Multiple quotes (for dashboard) ─────────────────────────
    app.get("/api/finnhub/quotes", async (req, res) => {
      try {
        const symbols = ((req.query.symbols as string) || "AAPL,MSFT,GOOGL,AMZN,META").split(",").slice(0, 10);
        const key = process.env.FINNHUB_API_KEY;
        if (!key) return res.status(503).json({ error: "Finnhub API not configured" });
        const quotes = await Promise.all(
          symbols.map(async (sym) => {
            const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym.trim()}&token=${key}`);
            const d = await r.json();
            return { symbol: sym.trim(), current: d.c, change: d.d, changePercent: d.dp, high: d.h, low: d.l, prevClose: d.pc };
          })
        );
        res.json(quotes);
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch quotes", details: error.message });
      }
    });

    // ─── API Aliases (audit alignment) ─────────────────────────────────
    app.get("/api/finnhub/market-news", (req, res, next) => {
      req.url = `/api/finnhub/news?${new URL(req.url, 'http://localhost').searchParams}`;
      app.handle(req, res);
    });

    app.post("/api/create-subscription", (req, res, next) => {
      req.url = "/api/checkout-session";
      app.handle(req, res);
    });

    app.get("/api/subscription-plans", (_req, res) => {
      res.json([
        { id: "free", name: "Explorer", price: 0, interval: "month", features: ["Limited AI agent access", "Basic summarized insights", "3D opportunity map (view-only)", "Basic alerts", "Limited daily queries"] },
        { id: "professional", name: "Professional", price: 4900, interval: "month", features: ["Full multi-agent system", "Advanced deep analysis", "Interactive 3D opportunity map", "Scenario simulations", "Personalized tracking", "Priority AI processing"] },
        { id: "elite", name: "Elite", price: 14900, interval: "month", features: ["Everything in Professional", "Predictive modeling", "Multi-agent collaboration", "Real-time global signals", "Custom dashboards", "Lead generation & contracts"] },
        { id: "enterprise", name: "Enterprise", price: null, interval: "month", features: ["Everything in Elite", "API integrations", "Dedicated AI models", "Team roles & collaboration", "Private data integration", "Dedicated account manager"] },
      ]);
    });

    app.post("/api/ai-agent", (req, res, next) => {
      req.url = "/api/agents/investment-strategist";
      app.handle(req, res);
    });

    app.get("/api/world-bank/GDP/:country", async (req, res) => {
      try {
        const country = req.params.country.toUpperCase();
        const r = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.MKTP.CD?format=json&date=2020:2024&per_page=5`);
        const data = await r.json();
        if (!Array.isArray(data) || data.length < 2) return res.json({ country, data: [] });
        const entries = data[1]?.map((e: any) => ({ year: e.date, value: e.value })) || [];
        res.json({ country, indicator: "GDP (current US$)", data: entries });
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch World Bank GDP data", details: error.message });
      }
    });

    const exchangeRateCache: { rates: Record<string, number>; fetchedAt: number } = { rates: {}, fetchedAt: 0 };
    const RATE_CACHE_TTL = 60 * 60 * 1000;

    app.get("/api/currency/rates", async (_req, res) => {
      try {
        if (Date.now() - exchangeRateCache.fetchedAt < RATE_CACHE_TTL && Object.keys(exchangeRateCache.rates).length > 0) {
          return res.json({ rates: exchangeRateCache.rates, cached: true });
        }

        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
          if (Object.keys(exchangeRateCache.rates).length > 0) {
            return res.json({ rates: exchangeRateCache.rates, cached: true });
          }
          return res.status(503).json({ error: 'Exchange rate service unavailable' });
        }

        const data = await response.json() as any;
        if (data.rates) {
          exchangeRateCache.rates = data.rates;
          exchangeRateCache.fetchedAt = Date.now();
          return res.json({ rates: data.rates, cached: false });
        }

        res.status(503).json({ error: 'Invalid exchange rate response' });
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        if (Object.keys(exchangeRateCache.rates).length > 0) {
          return res.json({ rates: exchangeRateCache.rates, cached: true });
        }
        res.status(503).json({ error: 'Exchange rate service unavailable' });
      }
    });

    return httpServer;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}