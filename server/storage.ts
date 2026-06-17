import { User, InsertUser, Opportunity, InsertOpportunity, SmartContract, InsertSmartContract,
  smartContracts, Bookmark, InsertBookmark, FundingOpportunity, InsertFundingOpportunity,
  fundingOpportunities, WorkHistory, InsertWorkHistory, ReferenceCheck, InsertReferenceCheck,
  Certificate, InsertCertificate, Project, InsertProject, workHistory, referenceChecks,
  certificates, projects, Company, InsertCompany, companies, CompanyService, InsertCompanyService, companyServices,
  CompanyReview, InsertCompanyReview, companyReviews, CompanyMember, InsertCompanyMember, companyMembers,
  Directory, InsertDirectory, directories, BusinessLocation, InsertBusinessLocation, businessLocations,
  Budget, InsertBudget, budgets, BudgetCategory, InsertBudgetCategory, budgetCategories,
  Transaction, InsertTransaction, transactions, SavingsGoal, InsertSavingsGoal, savingsGoals,
  FinancialInsight, InsertFinancialInsight, financialInsights,
  FinancialTeam, InsertFinancialTeam, financialTeams, TeamMember, InsertTeamMember, teamMembers,
  TeamFinancialMetric, InsertTeamFinancialMetric, teamFinancialMetrics,
  TeamFinancialInsight, InsertTeamFinancialInsight, teamFinancialInsights,
  marketReports, insertMarketReportSchema,
  ChatbotPreset, InsertChatbotPreset, chatbotPresets,
  ChatbotInteraction, InsertChatbotInteraction, chatbotInteractions,
  ClientRequest, InsertClientRequest, clientRequests,
  CompanyAnalytic, InsertCompanyAnalytic, companyAnalytics,
  EmployeeVerification, InsertEmployeeVerification, employeeVerifications,
  Endorsement, InsertEndorsement, endorsements,
  PortfolioItem, InsertPortfolioItem, portfolioItems,
  ClientFeedback, InsertClientFeedback, clientFeedback,
  ConversationHistory, InsertConversationHistory, conversationHistory,
  ComplianceReport, InsertComplianceReport, complianceReports,
  StrategyBrief, InsertStrategyBrief, strategyBriefs,
  FraudAlert, InsertFraudAlert, fraudAlerts,
  ThreatSimulation, InsertThreatSimulation, threatSimulations,
  MarketplacePlugin, InsertMarketplacePlugin, marketplacePlugins,
  InstalledPlugin, InsertInstalledPlugin, installedPlugins,
  CommunityPost, InsertCommunityPost, communityPosts,
  CommunityReply, InsertCommunityReply, communityReplies,
  ApiKey, InsertApiKey, apiKeys,
  AffiliateLink, InsertAffiliateLink, affiliateLinks,
  LearningTrack, InsertLearningTrack, learningTracks,
  LearningProgressRecord, InsertLearningProgress, learningProgress,
  AdaptiveAiProfile, InsertAdaptiveAiProfile, adaptiveAiProfiles } from "@shared/schema";
import session from "express-session";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, ne, or, lt, sql, desc, and, isNull, gte, count } from "drizzle-orm";
import postgres from "postgres";
import { users, opportunities, bookmarks } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunityById(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opp: InsertOpportunity): Promise<Opportunity>;
  updateOpportunityStatus(id: number, status: string): Promise<Opportunity>;
  updateOpportunity(id: number, opp: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<void>;
  upgradeToPremium(userId: number): Promise<User>;
  sessionStore: session.Store;
  initialize(): Promise<void>;
  getOpportunityByExternalId(externalId: string): Promise<Opportunity | undefined>;
  getBasicMatchingOpportunities(skills: string[]): Promise<Opportunity[]>;
  // Smart Contract methods
  createSmartContract(contract: any): Promise<SmartContract>;
  getSmartContract(id: number): Promise<SmartContract | undefined>;
  getSmartContractsByUser(userId: number): Promise<SmartContract[]>;
  updateSmartContractStatus(id: number, status: string): Promise<SmartContract>;
  executeSmartContract(id: number): Promise<SmartContract>;
  getAllUsers(excludeUserId?: number): Promise<User[]>;
  // Bookmark methods
  createBookmark(bookmark: InsertBookmark & { user_id: number }): Promise<Bookmark>;
  getBookmarksByUser(userId: number): Promise<Bookmark[]>;
  getBookmark(id: number): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<void>;
  // Funding opportunity methods
  createFundingOpportunity(opportunity: InsertFundingOpportunity): Promise<FundingOpportunity>;
  getFundingOpportunities(country?: string): Promise<FundingOpportunity[]>;
  getFundingOpportunitiesByCountry(country: string): Promise<FundingOpportunity[]>;
  getFundingOpportunityById(id: number): Promise<FundingOpportunity | undefined>;
  getMatchingFundingOpportunities(user: User, country?: string): Promise<FundingOpportunity[]>;
  updateFundingOpportunity(id: number, updates: Partial<InsertFundingOpportunity>): Promise<FundingOpportunity>;
  deleteSmartContract(id: number): Promise<void>;
  clearStaleJobs(): Promise<void>;
  storeJobEmbedding(opportunityId: number, embedding: number[]): Promise<void>;
  // Work History methods
  getWorkHistory(id: number): Promise<WorkHistory | undefined>;
  getWorkHistoryById(id: number): Promise<WorkHistory | undefined>;
  getWorkHistoryByUser(userId: number): Promise<WorkHistory[]>;
  createWorkHistory(history: InsertWorkHistory & { userId: number }): Promise<WorkHistory>;
  updateWorkHistory(id: number, updates: Partial<WorkHistory>): Promise<WorkHistory>;
  deleteWorkHistory(id: number): Promise<void>;
  // Reference methods
  getReferenceCheck(id: number): Promise<ReferenceCheck | undefined>;
  getReferenceChecksByUser(userId: number): Promise<ReferenceCheck[]>;
  createReferenceCheck(reference: InsertReferenceCheck): Promise<ReferenceCheck>;
  updateReferenceCheck(id: number, updates: Partial<ReferenceCheck>): Promise<ReferenceCheck>;
  deleteReferenceCheck(id: number): Promise<void>;
  // Certificate methods
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateById(id: number): Promise<Certificate | undefined>;
  getUserCertificates(userId: number): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, updates: Partial<Certificate>): Promise<Certificate>;
  deleteCertificate(id: number): Promise<void>;
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectById(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company>;
  getCompaniesByIndustry(industry: string): Promise<Company[]>;
  getActiveCompanies(): Promise<Company[]>;
  getAllCompanies(): Promise<Company[]>;

  // Company service methods
  createCompanyService(service: InsertCompanyService): Promise<CompanyService>;
  getCompanyService(id: number): Promise<CompanyService | undefined>;
  getCompanyServiceById(id: number): Promise<CompanyService | undefined>;
  getCompanyServices(companyId: number): Promise<CompanyService[]>;
  updateCompanyService(id: number, updates: Partial<CompanyService>): Promise<CompanyService>;
  deleteCompanyService(id: number): Promise<void>;

  // Company review methods
  createCompanyReview(review: InsertCompanyReview): Promise<CompanyReview>;
  getCompanyReviews(companyId: number): Promise<CompanyReview[]>;
  updateCompanyReview(id: number, updates: Partial<CompanyReview>): Promise<CompanyReview>;

  // Company member methods
  createCompanyMember(member: InsertCompanyMember): Promise<CompanyMember>;
  getCompanyMembers(companyId: number): Promise<CompanyMember[]>;
  updateCompanyMember(id: number, updates: Partial<CompanyMember>): Promise<CompanyMember>;
  removeCompanyMember(id: number): Promise<void>;
  // Add new company auth methods
  getCompanyByName(name: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Directory listing methods
  createDirectoryListing(listing: InsertDirectory): Promise<Directory>;
  getDirectoryListing(companyId: number): Promise<Directory | undefined>;
  getAllDirectoryListings(): Promise<Directory[]>;
  updateDirectoryListing(companyId: number, updates: Partial<Directory>): Promise<Directory>;
  incrementDirectoryViews(id: number): Promise<void>;
  incrementDirectoryClicks(id: number): Promise<void>;
  deleteDirectoryListing(companyId: number): Promise<void>;
  
  // Business Location methods for interactive map
  createBusinessLocation(location: InsertBusinessLocation): Promise<BusinessLocation>;
  getBusinessLocation(id: number): Promise<BusinessLocation | undefined>;
  getAllBusinessLocations(): Promise<BusinessLocation[]>;
  getBusinessLocationsByType(type: string): Promise<BusinessLocation[]>;
  getBusinessLocationsByCountry(country: string): Promise<BusinessLocation[]>;
  getBusinessLocationsByCompany(companyId: number): Promise<BusinessLocation[]>;
  updateBusinessLocation(id: number, updates: Partial<BusinessLocation>): Promise<BusinessLocation>;
  deleteBusinessLocation(id: number): Promise<void>;
  
  // Credential methods
  createCredential(credential: any): Promise<any>;

  // Investment Strategist for premium users
  createInvestmentProfile(profileData: any): Promise<any>;
  getInvestmentProfile(userId: number): Promise<any>;
  updateInvestmentProfile(userId: number, updates: any): Promise<any>;
  saveInvestmentAnalysis(userId: number, analysis: any): Promise<any>;
  getInvestmentAnalyses(userId: number): Promise<any[]>;
  addPortfolioHolding(holdingData: any): Promise<any>;
  getPortfolioHoldings(userId: number): Promise<any[]>;
  updatePortfolioHolding(holdingId: number, updates: any): Promise<any>;
  deletePortfolioHolding(holdingId: number): Promise<void>;

  // Personal Finance Management for basic tier users
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudget(id: number): Promise<Budget | undefined>;
  getUserBudgets(userId: number): Promise<Budget[]>;
  updateBudget(id: number, updates: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;
  
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  getBudgetCategories(budgetId: number): Promise<BudgetCategory[]>;
  updateBudgetCategory(id: number, updates: Partial<BudgetCategory>): Promise<BudgetCategory>;
  deleteBudgetCategory(id: number): Promise<void>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getBudgetTransactions(budgetId: number): Promise<Transaction[]>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  getSavingsGoal(id: number): Promise<SavingsGoal | undefined>;
  getUserSavingsGoals(userId: number): Promise<SavingsGoal[]>;
  updateSavingsGoal(id: number, updates: Partial<SavingsGoal>): Promise<SavingsGoal>;
  deleteSavingsGoal(id: number): Promise<void>;
  
  createFinancialInsight(insight: InsertFinancialInsight): Promise<FinancialInsight>;
  getUserFinancialInsights(userId: number): Promise<FinancialInsight[]>;

  // Team Financial Health Management
  createFinancialTeam(team: InsertFinancialTeam): Promise<FinancialTeam>;
  getFinancialTeam(id: number): Promise<FinancialTeam | undefined>;
  getUserFinancialTeams(userId: number): Promise<FinancialTeam[]>;
  updateFinancialTeam(id: number, updates: Partial<FinancialTeam>): Promise<FinancialTeam>;
  deleteFinancialTeam(id: number): Promise<void>;

  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember>;
  removeTeamMember(id: number): Promise<void>;

  createTeamFinancialMetric(metric: InsertTeamFinancialMetric): Promise<TeamFinancialMetric>;
  getTeamFinancialMetrics(teamId: number): Promise<TeamFinancialMetric[]>;
  updateTeamFinancialMetric(id: number, updates: Partial<TeamFinancialMetric>): Promise<TeamFinancialMetric>;
  deleteTeamFinancialMetric(id: number): Promise<void>;

  createTeamFinancialInsight(insight: InsertTeamFinancialInsight): Promise<TeamFinancialInsight>;
  getTeamFinancialInsights(teamId: number): Promise<TeamFinancialInsight[]>;
  dismissFinancialInsight(id: number): Promise<void>;

  // Market reports methods
  createMarketReport(companyId: number, reportData: any): Promise<any>;
  getMarketReportsByCompany(companyId: number): Promise<any[]>;
  getMarketReport(id: number): Promise<any | undefined>;
  deleteMarketReport(id: number): Promise<void>;

  // Chatbot methods
  createChatbotPreset(preset: InsertChatbotPreset): Promise<ChatbotPreset>;
  getChatbotPresets(companyId: number): Promise<ChatbotPreset[]>;
  updateChatbotPreset(id: number, updates: Partial<ChatbotPreset>): Promise<ChatbotPreset>;
  deleteChatbotPreset(id: number): Promise<void>;
  createChatbotInteraction(interaction: InsertChatbotInteraction): Promise<ChatbotInteraction>;
  getChatbotInteractions(companyId: number): Promise<ChatbotInteraction[]>;
  getChatbotInteractionCount(companyId: number, since: Date): Promise<number>;

  // Client Request methods
  createClientRequest(request: InsertClientRequest): Promise<ClientRequest>;
  getClientRequests(companyId: number): Promise<ClientRequest[]>;
  getClientRequest(id: number): Promise<ClientRequest | undefined>;
  updateClientRequest(id: number, updates: Partial<ClientRequest>): Promise<ClientRequest>;

  // Company Analytics methods
  createCompanyAnalytic(analytic: InsertCompanyAnalytic): Promise<CompanyAnalytic>;
  getCompanyAnalytics(companyId: number, eventType?: string): Promise<CompanyAnalytic[]>;
  getCompanyAnalyticsSummary(companyId: number): Promise<any>;
  getCompanyAnalyticsTrend(companyId: number, days?: number): Promise<any[]>;

  // Notifications
  getNotifications(userId?: number, companyId?: number): Promise<any[]>;
  createNotification(n: any): Promise<any>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId?: number, companyId?: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  getUnreadCount(userId?: number, companyId?: number): Promise<number>;

  // Password reset
  getUserByResetToken(token: string): Promise<User | undefined>;
  setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  clearPasswordResetToken(userId: number): Promise<void>;

  // Employee Verification methods
  createEmployeeVerification(verification: InsertEmployeeVerification): Promise<EmployeeVerification>;
  getEmployeeVerifications(companyId: number): Promise<EmployeeVerification[]>;
  getEmployeeVerification(id: number): Promise<EmployeeVerification | undefined>;
  updateEmployeeVerification(id: number, updates: Partial<EmployeeVerification>): Promise<EmployeeVerification>;
  deleteEmployeeVerification(id: number): Promise<void>;

  getFinancialGoals(userId: number): Promise<any[]>;
  getTeamHealthReport(userId: number): Promise<any | null>;
  getTeamInsights(teamId: number, userId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.Store;
  private initialized = false;

  constructor() {
    console.log("Initializing DatabaseStorage...");
    try {
      const client = postgres(process.env.DATABASE_URL!);
      this.db = drizzle(client);
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      });
      console.log("Database connection established");
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  }

  safeJsonParse(jsonString: any, defaultValue: any = null): any {
    if (!jsonString || jsonString === '') {
      return defaultValue;
    }
    
    // If it's already an object, return it
    if (typeof jsonString === 'object') {
      return jsonString;
    }
    
    // Check for the problematic "[object Object]" string
    if (typeof jsonString === 'string' && jsonString === '[object Object]') {
      console.warn('Detected [object Object] string, returning defaultValue');
      return defaultValue;
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('JSON parse error:', error, 'for string:', jsonString);
      return defaultValue;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("Storage already initialized");
      return;
    }

    try {
      console.log("Starting storage initialization...");
      await this.initializeAdmin();
      this.initialized = true;
      console.log("Storage initialization completed successfully");
    } catch (error) {
      console.error("Storage initialization failed:", error);
      throw error;
    }
  }

  private async initializeAdmin() {
    // No seed data - all users and companies are created through normal registration
    console.log("Storage ready - no seed data to initialize");
  }

  // Add method to get all users except the current user
  async getAllUsers(excludeUserId?: number): Promise<User[]> {
    try {
      console.log("Getting all users, excluding:", excludeUserId);
      let query = this.db.select().from(users);

      if (excludeUserId) {
        query = query.where(
          ne(users.id, excludeUserId)
        );
      }

      const result = await query;
      console.log("Found users:", result.length, result);
      return result;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log("Looking up user by email:", email);
      const results = await this.db.select().from(users).where(eq(users.email, email));
      return results[0];
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Convert timestamp to seconds for PostgreSQL integer
      const timestamp = Math.floor(Date.now() / 1000);

      const [result] = await this.db.insert(users).values({
        ...user,
        trialStartedAt: timestamp,
        isPremium: false,
      }).returning();

      return result;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getOpportunities(): Promise<Opportunity[]> {
    return await this.db.select().from(opportunities);
  }

  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    const results = await this.db.select().from(opportunities).where(eq(opportunities.id, id));
    return results[0];
  }

  async createOpportunity(opp: InsertOpportunity): Promise<Opportunity> {
    try {
      console.log("Storage: Creating opportunity with data:", opp);
      const [result] = await this.db.insert(opportunities).values({
        ...opp,
        userId: null,
      }).returning();
      console.log("Storage: Successfully created opportunity:", result);
      return result;
    } catch (error) {
      console.error("Storage: Failed to create opportunity:", error);
      throw error;
    }
  }

  async updateOpportunityStatus(id: number, status: string): Promise<Opportunity> {
    const [result] = await this.db
      .update(opportunities)
      .set({ status })
      .where(eq(opportunities.id, id))
      .returning();
    return result;
  }

  async updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [result] = await this.db
      .update(opportunities)
      .set(updates)
      .where(eq(opportunities.id, id))
      .returning();
    return result;
  }

  async deleteOpportunity(id: number): Promise<void> {
    await this.db.delete(opportunities).where(eq(opportunities.id, id));
  }

  async upgradeToPremium(userId: number): Promise<User> {
    try {
      console.log("Starting free trial for user ID:", userId);
      
      // Set trial start time to current timestamp (in seconds)
      const trialStartedAt = Math.floor(Date.now() / 1000);
      
      // Update user with trial information
      const [result] = await this.db
        .update(users)
        .set({ 
          trialStartedAt: trialStartedAt,
          isPremium: true,
          subscriptionTier: 'elite' as const
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log("Free trial started successfully for user:", result.username);
      return result;
    } catch (error) {
      console.error("Error starting free trial:", error);
      throw error;
    }
  }
  async getOpportunityByExternalId(externalId: string): Promise<Opportunity | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(opportunities)
        .where(eq(opportunities.externalId, externalId));
      return result;
    } catch (error) {
      console.error("Error getting opportunity by external ID:", error);
      throw error;
    }
  }
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      console.log('Updating user profile with:', {
        id,
        updates: {
          ...updates,
          password: updates.password ? '[REDACTED]' : undefined
        }
      });

      // Ensure all fields match the schema exactly
      const validUpdates = {
        ...updates,
        pendingSubscriptionTier: updates.pendingSubscriptionTier || null,
        pendingSubscriptionId: updates.pendingSubscriptionId || null
      };

      const [result] = await this.db
        .update(users)
        .set(validUpdates)
        .where(eq(users.id, id))
        .returning();

      if (!result) {
        throw new Error("User not found");
      }

      console.log('Updated user profile:', {
        id: result.id,
        subscriptionTier: result.subscriptionTier,
        pendingSubscriptionTier: result.pendingSubscriptionTier,
        pendingSubscriptionId: result.pendingSubscriptionId
      });

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  async getBasicMatchingOpportunities(skills: string[]): Promise<Opportunity[]> {
    try {
      const opportunities = await this.getOpportunities();

      // Only consider available opportunities
      const availableOpps = opportunities.filter(opp => opp.status === "available");

      // Enhanced skill matching with synonyms and related terms
      const getSkillSynonyms = (skill: string): string[] => {
        const skillLower = skill.toLowerCase();
        const synonymMap: { [key: string]: string[] } = {
          'vr': ['virtual reality', 'immersive', 'mixed reality', 'metaverse', 'gaming', 'simulation', '3d', 'augmented reality', 'tech', 'technology', 'innovation', 'digital', 'development', 'startup', 'entertainment'],
          'xr': ['extended reality', 'virtual reality', 'augmented reality', 'mixed reality', 'immersive', 'metaverse', 'tech', 'technology', 'innovation', 'digital'],
          'ar': ['augmented reality', 'mixed reality', 'immersive', 'tech', 'technology', 'innovation', 'digital', 'development'],
          'software': ['programming', 'development', 'coding', 'app', 'application', 'tech', 'technology', 'digital', 'saas', 'platform', 'system', 'solution', 'startup', 'innovation', 'web', 'mobile', 'enterprise'],
          'programming': ['coding', 'development', 'software', 'app', 'application', 'tech', 'technology', 'digital', 'system', 'platform', 'startup', 'innovation'],
          'web developer': ['web development', 'frontend', 'backend', 'programming', 'coding', 'software', 'tech', 'technology', 'digital', 'app', 'platform'],
          'web development': ['web developer', 'frontend', 'backend', 'programming', 'coding', 'software', 'tech', 'technology'],
          'technology': ['tech', 'digital', 'innovation', 'development', 'business', 'solutions', 'startup'],
          'javascript': ['js', 'web development', 'programming', 'software', 'technology'],
          'react': ['frontend', 'web development', 'ui', 'javascript', 'technology']
        };
        return synonymMap[skillLower] || [];
      };

      const matchedOpps = availableOpps.filter(opp => {
        const text = `${opp.name} ${opp.description} ${opp.sector || ''}`.toLowerCase();
        
        const matchingSkills = skills.filter(skill => {
          const skillLower = skill.toLowerCase();
          
          // Direct skill match
          if (text.includes(skillLower)) {
            return true;
          }
          
          // Check synonyms
          const synonyms = getSkillSynonyms(skill);
          return synonyms.some(synonym => text.includes(synonym.toLowerCase()));
        });

        return matchingSkills.length > 0;
      });

      return matchedOpps;
    } catch (error) {
      console.error('Error in getBasicMatchingOpportunities:', error);
      return [];
    }
  }
  // Implement Smart Contract methods
  async createSmartContract(contract: any): Promise<SmartContract> {
    try {
      console.log("Creating smart contract with data:", JSON.stringify(contract, null, 2));

      // Ensure required fields have default values
      const defaultValidationRules = {
        required: ["hasValidParties", "hasValidTerms"],
        optional: []
      };

      const defaultExecutionConditions = {
        triggers: ["completion"],
        prerequisites: ["contractSigned"],
        automationRules: [
          {
            condition: "milestoneCompleted",
            action: "releaseMilestonePayment"
          }
        ]
      };

      // Insert with handling for required fields
      const [result] = await this.db
        .insert(smartContracts)
        .values({
          name: contract.name,
          description: contract.description,
          creator_id: contract.creator_id,
          counterparty_id: contract.counterparty_id,
          status: contract.status || 'draft',
          terms: contract.terms,
          validation_rules: contract.validation_rules || defaultValidationRules,
          execution_conditions: contract.execution_conditions || defaultExecutionConditions,
          created_at: contract.created_at || new Date()
        })
        .returning();

      console.log("Successfully created contract:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("Database error creating smart contract:", error);
      throw new Error(`Failed to create smart contract in database: ${error.message}`);
    }
  }

  async getSmartContract(id: number): Promise<SmartContract | undefined> {
    const results = await this.db.select().from(smartContracts).where(eq(smartContracts.id, id));
    return results[0];
  }

  async getSmartContractsByUser(userId: number): Promise<SmartContract[]> {
    try {
      console.log(`Fetching contracts for user ${userId}`);
      const contracts = await this.db
        .select()
        .from(smartContracts)
        .where(
          or(
            eq(smartContracts.creator_id, userId),
            eq(smartContracts.counterparty_id, userId)
          )
        );
      console.log(`Found ${contracts.length} contracts:`, JSON.stringify(contracts, null, 2));
      return contracts;
    } catch (error) {
      console.error("Error fetching user contracts:", error);
      throw error;
    }
  }

  async updateSmartContractStatus(id: number, status: string): Promise<SmartContract> {
    const [result] = await this.db
      .update(smartContracts)
      .set({ status })
      .where(eq(smartContracts.id, id))
      .returning();
    return result;
  }

  async executeSmartContract(id: number): Promise<SmartContract> {
    const [contract] = await this.db
      .update(smartContracts)
      .set({
        last_executed_at: new Date(),
        status: 'completed'
      })
      .where(eq(smartContracts.id, id))
      .returning();
    return contract;
  }
  async deleteSmartContract(id: number): Promise<void> {
    try {
      console.log(`Attempting to delete smart contract ${id}`);
      const [result] = await this.db
        .delete(smartContracts)
        .where(eq(smartContracts.id, id))
        .returning();

      if (!result) {
        throw new Error(`No contract found with id ${id}`);
      }
      console.log(`Successfully deleted smart contract ${id}`);
    } catch (error) {
      console.error("Error deleting smart contract:", error);
      throw error;
    }
  }
  async createBookmark(bookmark: InsertBookmark & { user_id: number }): Promise<Bookmark> {
    try {
      console.log('Creating bookmark:', bookmark);
      const [result] = await this.db
        .insert(bookmarks)
        .values(bookmark)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  }

  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    try {
      return await this.db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.user_id, userId));
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      throw error;
    }
  }

  async getBookmark(id: number): Promise<Bookmark | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.id, id));
      return result;
    } catch (error) {
      console.error('Error getting bookmark:', error);
      throw error;
    }
  }

  async deleteBookmark(id: number): Promise<void> {
    try {
      await this.db
        .delete(bookmarks)
        .where(eq(bookmarks.id, id));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }
  async createFundingOpportunity(opportunity: InsertFundingOpportunity): Promise<FundingOpportunity> {
    try {
      const [result] = await this.db
        .insert(fundingOpportunities)
        .values(opportunity)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating funding opportunity:", error);
      throw error;
    }
  }

  async getFundingOpportunities(country?: string): Promise<FundingOpportunity[]> {
    try {
      console.log("Fetching funding opportunities:", { requestedCountry: country });

      // If no country is specified, return all active opportunities
      if (!country) {
        const opportunities = await this.db
          .select()
          .from(fundingOpportunities)
          .where(
            or(
              eq(fundingOpportunities.status, 'active'),
              eq(fundingOpportunities.status, 'open')
            )
          );
        console.log(`Found ${opportunities.length} total opportunities (no country filter)`);
        return opportunities;
      }

      console.log(`Filtering opportunities for country: ${country}`);
      
      // Get country-specific opportunities
      const countrySpecific = await this.db
        .select()
        .from(fundingOpportunities)
        .where(
          and(
            or(
              eq(fundingOpportunities.status, 'active'),
              eq(fundingOpportunities.status, 'open')
            ),
            sql`LOWER(${fundingOpportunities.country}) = LOWER(${country})`
          )
        );

      // Get regional matches (where region matches country)
      const regionalMatches = await this.db
        .select()
        .from(fundingOpportunities)
        .where(
          and(
            or(
              eq(fundingOpportunities.status, 'active'),
              eq(fundingOpportunities.status, 'open')
            ),
            sql`LOWER(${fundingOpportunities.region}) LIKE LOWER(${'%' + country + '%'})`
          )
        );

      // Get global opportunities (null country or 'Global' region)
      const globalOpportunities = await this.db
        .select()
        .from(fundingOpportunities)
        .where(
          and(
            or(
              eq(fundingOpportunities.status, 'active'),
              eq(fundingOpportunities.status, 'open')
            ),
            or(
              isNull(fundingOpportunities.country),
              eq(fundingOpportunities.region, 'Global')
            )
          )
        );

      // Combine and deduplicate opportunities
      const allOpportunities = [...countrySpecific, ...regionalMatches, ...globalOpportunities];
      const uniqueOpportunities = allOpportunities.filter((opp, index, self) => 
        index === self.findIndex(o => o.id === opp.id)
      );

      console.log(`Found ${countrySpecific.length} country-specific, ${regionalMatches.length} regional, ${globalOpportunities.length} global opportunities for ${country}`);
      console.log(`Returning ${uniqueOpportunities.length} total filtered opportunities`);

      return uniqueOpportunities;
    } catch (error) {
      console.error("Error fetching funding opportunities:", error);
      throw error;
    }
  }

  async getFundingOpportunityById(id: number): Promise<FundingOpportunity | undefined> {
    const [result] = await this.db
      .select()
      .from(fundingOpportunities)
      .where(eq(fundingOpportunities.id, id));
    return result;
  }

  async getFundingOpportunitiesByCountry(country: string): Promise<FundingOpportunity[]> {
    try {
      console.log(`🌍 Fetching funding opportunities specifically for country: ${country}`);
      
      const results = await this.db
        .select()
        .from(fundingOpportunities)
        .where(
          and(
            eq(fundingOpportunities.country, country),
            or(
              eq(fundingOpportunities.status, 'active'),
              eq(fundingOpportunities.status, 'open')
            )
          )
        )
        .orderBy(desc(fundingOpportunities.amount));

      console.log(`💰 Found ${results.length} funding opportunities for ${country}:`, 
        results.map(r => ({ name: r.name, amount: r.amount, provider: r.provider })));
      
      return results;
    } catch (error) {
      console.error(`Error fetching funding opportunities for ${country}:`, error);
      throw error;
    }
  }

  async getMatchingFundingOpportunities(user: User, country?: string): Promise<FundingOpportunity[]> {
    try {
      console.log('Starting funding opportunity matching:', {
        userId: user.id,
        targetCountry: country,
        userSkills: user.skills,
        userAssets: user.assets
      });

      // Build base query for active/open opportunities
      let baseQuery = this.db
        .select()
        .from(fundingOpportunities)
        .where(
          or(
            eq(fundingOpportunities.status, 'active'),
            eq(fundingOpportunities.status, 'open')
          )
        );

      let opportunities: FundingOpportunity[] = [];

      // If country is specified, prioritize country-specific opportunities
      if (country) {
        console.log(`Filtering by country: ${country}`);
        
        // First, get exact country matches
        const countrySpecific = await this.db
          .select()
          .from(fundingOpportunities)
          .where(
            and(
              or(
                eq(fundingOpportunities.status, 'active'),
                eq(fundingOpportunities.status, 'open')
              ),
              sql`LOWER(${fundingOpportunities.country}) = LOWER(${country})`
            )
          );

        // Then get regional matches
        const regionalMatches = await this.db
          .select()
          .from(fundingOpportunities)
          .where(
            and(
              or(
                eq(fundingOpportunities.status, 'active'),
                eq(fundingOpportunities.status, 'open')
              ),
              sql`LOWER(${fundingOpportunities.region}) = LOWER(${country})`
            )
          );

        // Finally get global opportunities
        const globalOpportunities = await this.db
          .select()
          .from(fundingOpportunities)
          .where(
            and(
              or(
                eq(fundingOpportunities.status, 'active'),
                eq(fundingOpportunities.status, 'open')
              ),
              eq(fundingOpportunities.region, 'Global')
            )
          );

        // Combine and deduplicate
        const allOpportunities = [...countrySpecific, ...regionalMatches, ...globalOpportunities];
        const uniqueOpportunities = allOpportunities.filter((opp, index, self) => 
          index === self.findIndex(o => o.id === opp.id)
        );

        opportunities = uniqueOpportunities;
        console.log(`Found ${countrySpecific.length} country-specific, ${regionalMatches.length} regional, ${globalOpportunities.length} global opportunities for ${country}`);
      } else {
        // No country filter - get all opportunities
        opportunities = await baseQuery;
        console.log(`Found ${opportunities.length} total opportunities (no country filter)`);
      }

      // Calculate match scores and filter out zero-score opportunities
      const scoredOpportunities = opportunities
        .map(opp => ({
          ...opp,
          matchScore: this.calculateMatchScore(user, opp, country)
        }))
        .filter(opp => {
          // Filter out opportunities with zero match score (completely irrelevant)
          if (opp.matchScore === 0) {
            console.log(`🚫 REMOVING zero-score opportunity: "${opp.name}" (${opp.sector})`);
            return false;
          }
          return true;
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log(`Returning ${scoredOpportunities.length} funding opportunities for ${country || 'all countries'} (after filtering out zero-score)`);
      if (scoredOpportunities.length > 0) {
        console.log("Top 3 opportunities:", scoredOpportunities.slice(0, 3).map(opp => ({
          name: opp.name,
          country: opp.country,
          region: opp.region,
          sector: opp.sector,
          matchScore: opp.matchScore
        })));
      }

      // Phase 6: never return a dead-end empty list. If every opportunity scored zero
      // (typically a brand-new user with no skills/assets/industry on their profile),
      // surface the top 5 opportunities anyway so the UI can show real options plus a
      // "complete your profile to personalize" prompt.
      if (scoredOpportunities.length === 0 && opportunities.length > 0) {
        const fallback = opportunities
          .slice()
          .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
          .slice(0, 5)
          .map(opp => ({ ...opp, matchScore: 0, isFallbackSuggestion: true }));
        console.log(`Returning ${fallback.length} fallback funding opportunities (no profile match)`);
        return fallback as any;
      }

      return scoredOpportunities;
    } catch (error) {
      console.error("Error in getMatchingFundingOpportunities:", error);
      throw error;
    }
  }

  private calculateMatchScore(user: User, opp: FundingOpportunity, country?: string): number {
    let score = 0;
    let skillScore = 0;

    // Enhanced Skill Matching (40 points max) - Calculate this FIRST
    if (user.skills?.length > 0) {
      
      const getSkillSynonyms = (skill: string) => {
        const skillLower = skill.toLowerCase();
        const synonymMap: Record<string, string[]> = {
          // VR/AR/XR Technologies
          'vr': ['virtual reality', 'immersive', 'mixed reality', 'metaverse', 'gaming', 'simulation', '3d', 'tech', 'technology', 'innovation', 'digital', 'development', 'startup', 'entertainment'],
          'ar': ['augmented reality', 'mixed reality', 'immersive', 'tech', 'technology', 'innovation', 'digital', 'development'],
          'xr': ['extended reality', 'virtual reality', 'augmented reality', 'mixed reality', 'immersive', 'metaverse', 'tech', 'technology', 'innovation', 'digital'],
          'virtual reality': ['vr', 'immersive', 'mixed reality', 'metaverse', 'gaming', '3d', 'tech', 'technology'],
          'augmented reality': ['ar', 'mixed reality', 'immersive', 'tech', 'technology', 'innovation'],
          
          // Software/Programming
          'software': ['programming', 'development', 'coding', 'app', 'application', 'tech', 'technology', 'digital', 'saas', 'platform', 'system', 'solution', 'startup', 'innovation', 'web', 'mobile'],
          'programming': ['coding', 'development', 'software', 'app', 'application', 'tech', 'technology', 'digital', 'system', 'platform', 'startup', 'innovation'],
          'web developer': ['web development', 'frontend', 'backend', 'programming', 'coding', 'software', 'tech', 'technology', 'digital', 'app', 'platform'],
          'web development': ['web developer', 'frontend', 'backend', 'programming', 'coding', 'software', 'tech', 'technology'],
          
          // Technology & General
          'technology': ['tech', 'digital', 'innovation', 'development', 'business', 'solutions', 'startup'],
          'javascript': ['js', 'web development', 'programming', 'software', 'technology'],
          'react': ['frontend', 'web development', 'ui', 'javascript', 'technology'],
          'node': ['nodejs', 'backend', 'server', 'javascript', 'technology'],
          
          // Architecture (keeping for legacy)
          'architectural engineering': ['architecture', 'engineering', 'structural', 'building', 'construction', 'design', 'innovation', 'technology', 'development', 'infrastructure'],
          'architecture': ['building', 'design', 'construction', 'planning', 'structural', 'engineering'],
          'engineering': ['technical', 'design', 'development', 'innovation', 'technology', 'construction'],
          'civil engineering': ['infrastructure', 'construction', 'structural', 'building'],
          'structural': ['building', 'construction', 'engineering', 'design'],
          'construction': ['building', 'infrastructure', 'development', 'engineering']
        };
        
        return synonymMap[skillLower] || [];
      };

      // CRITICAL: Filter out architectural opportunities for tech users immediately
      const sectorLower = (opp.sector || '').toLowerCase();
      const isArchitecturalSector = sectorLower.includes('architecture') || 
                                    sectorLower.includes('building') || 
                                    sectorLower.includes('construction') ||
                                    sectorLower.includes('urban');
      
      if (isArchitecturalSector) {
        const hasTechSkills = user.skills.some(skill => {
          const skillLower = skill.toLowerCase();
          return skillLower.includes('software') || skillLower.includes('programming') ||
                 skillLower.includes('web developer') || skillLower.includes('vr') ||
                 skillLower.includes('ar') || skillLower.includes('xr');
        });
        
        if (hasTechSkills) {
          console.log(`🚫 SECTOR EXCLUSION: Filtering out "${opp.name}" - architectural sector (${opp.sector}) for tech user`);
          return 0;
        }
      }

      user.skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        const oppText = `${opp.description || ''} ${opp.sector || ''} ${opp.name || ''}`.toLowerCase();
        
        // STRICT skill matching - only award points for highly relevant matches
        let matchPoints = 0;
        
        // Direct skill match (25 points - highest priority)
        if (oppText.includes(skillLower)) {
          matchPoints = 25;
          console.log(`Direct skill match for "${skill}" in "${opp.name}"`);
        }
        // VR/AR/XR specific matching - enhanced for tech funding opportunities
        else if (skillLower.includes('vr') || skillLower.includes('virtual reality') || 
                 skillLower.includes('ar') || skillLower.includes('augmented reality') ||
                 skillLower.includes('xr') || skillLower.includes('extended reality')) {
          // Match VR/AR terms OR general tech/innovation funding (since VR/AR is cutting-edge tech)
          if (oppText.includes('virtual reality') || oppText.includes('augmented reality') || 
              oppText.includes('mixed reality') || oppText.includes('vr') ||
              oppText.includes('ar ') || oppText.includes('xr') ||
              oppText.includes('immersive') || oppText.includes('metaverse') ||
              oppText.includes('gaming') || oppText.includes('3d') || 
              oppText.includes('simulation') ||
              // ENHANCED: VR/AR skills match with Technology sector funding
              oppText.includes('technology') || oppText.includes('innovation') ||
              oppText.includes('digital') || oppText.includes('tech') ||
              oppText.includes('startup') || oppText.includes('development') ||
              opp.sector?.toLowerCase() === 'technology') {
            matchPoints = 22;
            console.log(`VR/AR match for "${skill}" in "${opp.name}"`);
          }
        }
        // Software/Programming/Tech specific matching - enhanced for authentic funding
        else if (skillLower.includes('software') || skillLower.includes('programming') ||
                 skillLower.includes('web developer') || skillLower.includes('web development')) {
          // Match explicit software/programming terms OR tech sector opportunities
          if (oppText.includes('software') || oppText.includes('programming') ||
              oppText.includes('development') || oppText.includes('coding') ||
              oppText.includes('app') || oppText.includes('application') ||
              oppText.includes('web') || oppText.includes('mobile') || 
              oppText.includes('platform') || oppText.includes('system') ||
              // ENHANCED: Also match Technology sector funding (authentic Romanian programs)
              oppText.includes('technology') || oppText.includes('digital') ||
              oppText.includes('tech') || oppText.includes('innovation') ||
              oppText.includes('digitalization') || oppText.includes('digitization') ||
              opp.sector?.toLowerCase() === 'technology') {
            matchPoints = 22;
            console.log(`Software/Programming match for "${skill}" in "${opp.name}"`);
          }
        }
        // Architectural engineering - strict matching
        else if (skillLower.includes('architectural engineering') || skillLower.includes('architecture')) {
          // Only match actual architecture/construction opportunities
          if (oppText.includes('architectural') || oppText.includes('architecture') || 
              oppText.includes('building') || oppText.includes('construction') || 
              oppText.includes('infrastructure') || oppText.includes('structural') ||
              oppText.includes('sustainable') || oppText.includes('urban')) {
            matchPoints = 22;
            console.log(`Architecture match for "${skill}" in "${opp.name}"`);
          }
        }
        // NO synonym matching to prevent false positives
        
        skillScore += matchPoints;
      });
      
      score += Math.min(40, skillScore);
    }

    // CRITICAL: If user has skills but this opportunity has zero skill relevance, 
    // filter it out completely to prevent irrelevant opportunities from appearing
    if (user.skills?.length > 0 && skillScore === 0) {
      console.log(`🚫 FILTERING OUT "${opp.name}" - sector: "${opp.sector}" - NO SKILL RELEVANCE (skillScore: ${skillScore})`);
      console.log(`   Opportunity text analyzed: "${`${opp.description || ''} ${opp.sector || ''} ${opp.name || ''}`.toLowerCase()}"`);
      console.log(`   User skills: ${JSON.stringify(user.skills)}`);
      return 0; // Zero score means this opportunity won't appear in results
    }

    // Country/Region Matching (40 points max) - Only award location points if skills match
    if (skillScore > 0) {
      if (country) {
        if (opp.country?.toLowerCase() === country.toLowerCase()) {
          score += 40;
        } else if (opp.region?.toLowerCase() === country.toLowerCase()) {
          score += 35;
        } else if (opp.region === 'Global') {
          score += 20;
        }
      } else if (opp.region === 'Global') {
        score += 30;
      }
    }

    // Asset Matching (30 points max)
    if (user.assets?.length > 0 && opp.eligibilityCriteria?.requiredAssets) {
      const assetMatches = user.assets.filter(asset =>
        opp.eligibilityCriteria.requiredAssets.some((req: string) =>
          asset.toLowerCase().includes(req.toLowerCase())
        )
      );
      score += Math.min(30, (assetMatches.length / opp.eligibilityCriteria.requiredAssets.length) * 30);
    }

    return Math.round(score);
  }

  async updateFundingOpportunity(id: number, updates: Partial<InsertFundingOpportunity>): Promise<FundingOpportunity> {
    const [result] = await this.db
      .update(fundingOpportunities)
      .set(updates)
      .where(eq(fundingOpportunities.id, id))
      .returning();
    return result;
  }

  async clearStaleJobs(): Promise<void> {
    try {
      console.log("Clearing stale jobs...");
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await this.db.delete(opportunities)
        .where(and(eq(opportunities.source, "indeed"), lt(opportunities.lastSynced, oneDayAgo)));

      console.log("Successfully cleared stale jobs");
    } catch (error) {
      console.error("Error clearing stale jobs:", error);
      throw error;
    }
  }

  async storeJobEmbedding(opportunityId: number, embedding: number[]): Promise<void> {
    try {
      await this.db.update(opportunities)
        .set({ embedding: embedding } as any)
        .where(eq(opportunities.id, opportunityId));
    } catch (error) {
      console.error("Error storing job embedding:", error);
      throw error;
    }
  }
  // Work History methods
  async getWorkHistory(id: number): Promise<WorkHistory | undefined> {
    const [result] = await this.db
      .select()
      .from(workHistory)
      .where(eq(workHistory.id, id));
    return result;
  }

  async createWorkHistory(history: InsertWorkHistory & { userId: number }): Promise<WorkHistory> {
    console.log('Creating work history with input:', history);
    
    // Convert string dates to Date objects for database storage
    const workHistoryData = {
      ...history,
      startDate: new Date(history.startDate),
      endDate: history.endDate ? new Date(history.endDate) : null,
      verificationStatus: history.verificationStatus || 'pending'
    };
    
    console.log('Converted work history data:', workHistoryData);
    
    const [result] = await this.db
      .insert(workHistory)
      .values(workHistoryData)
      .returning();
      
    console.log('Work history created in database:', result);
    return result;
  }

  async updateWorkHistory(id: number, updates: Partial<WorkHistory>): Promise<WorkHistory> {
    const [result] = await this.db
      .update(workHistory)
      .set(updates)
      .where(eq(workHistory.id, id))
      .returning();
    return result;
  }

  async getWorkHistoryByUser(userId: number): Promise<WorkHistory[]> {
    try {
      console.log('Fetching work history for user:', userId);
      const results = await this.db
        .select()
        .from(workHistory)
        .where(eq(workHistory.userId, userId));
      return results;
    } catch (error) {
      console.error('Error getting user work history:', error);
      throw error;
    }
  }

  async getWorkHistoryById(id: number): Promise<WorkHistory | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(workHistory)
        .where(eq(workHistory.id, id));
      return result;
    } catch (error) {
      console.error('Error getting work history by ID:', error);
      throw error;
    }
  }

  async deleteWorkHistory(id: number): Promise<void> {
    try {
      await this.db
        .delete(workHistory)
        .where(eq(workHistory.id, id));
    } catch (error) {
      console.error('Error deleting work history:', error);
      throw error;
    }
  }

  // Reference methods
  async getReferenceCheck(id: number): Promise<ReferenceCheck | undefined> {
    const [result] = await this.db
      .select()
      .from(referenceChecks)
      .where(eq(referenceChecks.id, id));
    return result;
  }

  async createReferenceCheck(reference: InsertReferenceCheck): Promise<ReferenceCheck> {
    const [result] = await this.db
      .insert(referenceChecks)
      .values(reference as any)
      .returning();
    return result;
  }

  async getReferenceChecksByUser(userId: number): Promise<ReferenceCheck[]> {
    const results = await this.db
      .select()
      .from(referenceChecks)
      .where(eq(referenceChecks.userId, userId));
    return results;
  }

  async updateReferenceCheck(id: number, updates: Partial<ReferenceCheck>): Promise<ReferenceCheck> {
    const [result] = await this.db
      .update(referenceChecks)
      .set(updates)
      .where(eq(referenceChecks.id, id))
      .returning();
    return result;
  }

  async deleteReferenceCheck(id: number): Promise<void> {
    await this.db
      .delete(referenceChecks)
      .where(eq(referenceChecks.id, id));
  }

  // Certificate methods
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [result] = await this.db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id));
    return result;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const c: any = certificate;
    const dbData = {
      ...c,
      userId: c.userId,
      issueDate: new Date(c.issueDate),
      expiryDate: c.expiryDate ? new Date(c.expiryDate) : null,
      verificationStatus: "pending",
      verifiedAt: null,
      metadata: null,
    };

    const [result] = await this.db
      .insert(certificates)
      .values(dbData as any)
      .returning();
    return result;
  }

  async updateCertificate(id: number, updates: Partial<Certificate>): Promise<Certificate> {
    const [result] = await this.db
      .update(certificates)
      .set(updates)
      .where(eq(certificates.id, id))
      .returning();
    return result;
  }

  async getCertificateById(id: number): Promise<Certificate | undefined> {
    const [result] = await this.db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id));
    return result;
  }

  async getUserCertificates(userId: number): Promise<Certificate[]> {
    const results = await this.db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(certificates.issueDate);
    return results;
  }

  async deleteCertificate(id: number): Promise<void> {
    await this.db
      .delete(certificates)
      .where(eq(certificates.id, id));
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [result] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await this.db
      .insert(projects)
      .values(project as any)
      .returning();
    return result;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [result] = await this.db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [result] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return result;
  }

  async deleteProject(id: number): Promise<void> {
    await this.db
      .delete(projects)
      .where(eq(projects.id, id));
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    try {
      console.log('Fetching projects for user:', userId);
      const results = await this.db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId));
      return results;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const [result] = await this.db
        .insert(companies)
        .values(company)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async getCompany(id: number): Promise<Company | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(companies)
        .where(eq(companies.id, id));
      return result;
    } catch (error) {
      console.error('Error getting company:', error);
      throw error;
    }
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company> {
    try {
      const [result] = await this.db
        .update(companies)
        .set(updates)
        .where(eq(companies.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async getCompaniesByIndustry(industry: string): Promise<Company[]> {
    try {
      return await this.db
        .select()
        .from(companies)
        .where(sql`${companies.industries} @> ARRAY[${industry}]::text[]`);
    } catch (error) {
      console.error('Error getting companies by industry:', error);
      throw error;
    }
  }

  async getActiveCompanies(): Promise<Company[]> {
    try {
      return await this.db
        .select()
        .from(companies)
        .where(eq(companies.isActive, true));
    } catch (error) {
      console.error('Error getting active companies:', error);
      throw error;
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      return await this.db.select().from(companies).orderBy(companies.name);
    } catch (error) {
      console.error('Error getting all companies:', error);
      throw error;
    }
  }

  // Company service methods
  async createCompanyService(service: InsertCompanyService): Promise<CompanyService> {
    try {
      console.log('Creating company service with data:', JSON.stringify(service, null, 2));
      
      // Use pool directly to get correct result structure
      const pgPool = pool; // Use the pool directly for raw SQL queries
      
      // Prepare the SQL query with proper parameter handling to avoid SQL injection
      const query = `
        INSERT INTO company_services (
          company_id, 
          name, 
          description, 
          type,                    -- Required NOT NULL field in database 
          service_type,            -- Modern field that maps to type
          pricing_model, 
          price_amount, 
          base_price,              -- Legacy field that maps to priceAmount
          price_unit, 
          lead_time,
          delivery_timeframe,      -- Legacy field that maps to leadTime
          availability, 
          features,
          currency,
          custom_pricing_details,
          requirements,
          is_active, 
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *;
      `;
      
      // Prepare the values array with proper escaping
      const values = [
        service.companyId,
        service.name,
        service.description,
        service.serviceType,                      // Set type field
        service.serviceType,                      // Set service_type field to the same value
        service.pricingModel,
        service.priceAmount || 0,
        service.priceAmount || 0,                 // Set base_price to same value as priceAmount
        service.priceUnit || "per_service",
        service.leadTime || "standard",
        service.leadTime || "standard",           // Set delivery_timeframe to same as leadTime
        service.availability || "standard",
        service.features || [],                   // Features array
        'USD',
        service.pricingModel === 'custom' ? service.description : null,
        null, // requirements
        true, // is_active
        new Date() // created_at
      ];
      
      // Execute the query
      const result = await pgPool.query(query, values);
      
      console.log('Successfully created company service:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating company service:', error);
      throw error;
    }
  }

  async getCompanyService(id: number): Promise<CompanyService | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(companyServices)
        .where(eq(companyServices.id, id));
      return result;
    } catch (error) {
      console.error('Error getting company service:', error);
      throw error;
    }
  }

  async getCompanyServices(companyId: number): Promise<CompanyService[]> {
    try {
      return await this.db
        .select()
        .from(companyServices)
        .where(eq(companyServices.companyId, companyId));
    } catch (error) {
      console.error('Error getting company services:', error);
      throw error;
    }
  }

  async updateCompanyService(id: number, updates: Partial<CompanyService>): Promise<CompanyService> {
    try {
      console.log('Updating company service with data:', JSON.stringify(updates, null, 2));
      
      // Use pool directly to get correct result structure
      const pgPool = pool; // Use the pool directly for raw SQL queries
      
      // Build the SET clause for our SQL statement
      const setParts = [];
      const params: any[] = [];
      
      // Add each updated field to the SQL SET clause with proper mapping to database columns
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle special field mappings
          if (key === 'serviceType') {
            // Update both serviceType and type fields
            setParts.push(`service_type = $${params.length + 1}`);
            params.push(value);
            setParts.push(`type = $${params.length + 1}`);
            params.push(value);
          } else if (key === 'priceAmount') {
            // Update both priceAmount and base_price fields
            setParts.push(`price_amount = $${params.length + 1}`);
            params.push(value);
            setParts.push(`base_price = $${params.length + 1}`);
            params.push(value);
          } else if (key === 'leadTime') {
            // Update both leadTime and delivery_timeframe fields
            setParts.push(`lead_time = $${params.length + 1}`);
            params.push(value);
            setParts.push(`delivery_timeframe = $${params.length + 1}`);
            params.push(value);
          } else {
            // Convert camelCase to snake_case for database column names
            const dbFieldName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            setParts.push(`${dbFieldName} = $${params.length + 1}`);
            params.push(value);
          }
        }
      });
      
      // Add updatedAt field
      setParts.push(`updated_at = $${params.length + 1}`);
      params.push(new Date());
      
      // Only proceed if there are fields to update
      if (setParts.length === 0) {
        const service = await this.getCompanyServiceById(id);
        return service as CompanyService;
      }
      
      // Execute SQL UPDATE with all the fields
      const sqlQuery = `
        UPDATE company_services 
        SET ${setParts.join(', ')} 
        WHERE id = $${params.length + 1}
        RETURNING *;
      `;
      
      console.log('Executing update query:', sqlQuery, 'with params:', params);
      
      params.push(id);
      const result = await pgPool.query(sqlQuery, params);
      
      console.log('Successfully updated company service:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating company service:', error);
      throw error;
    }
  }
  
  async getCompanyServiceById(id: number): Promise<CompanyService | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(companyServices)
        .where(eq(companyServices.id, id));
      return result;
    } catch (error) {
      console.error("Error getting company service by ID:", error);
      throw error;
    }
  }
  
  async deleteCompanyService(id: number): Promise<void> {
    try {
      await this.db
        .delete(companyServices)
        .where(eq(companyServices.id, id));
    } catch (error) {
      console.error("Error deleting company service:", error);
      throw error;
    }
  }

  // Company review methods
  async createCompanyReview(review: InsertCompanyReview): Promise<CompanyReview> {
    try {
      const [result] = await this.db
        .insert(companyReviews)
        .values(review)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating company review:', error);
      throw error;
    }
  }

  async getCompanyReviews(companyId: number): Promise<CompanyReview[]> {
    try {
      return await this.db
        .select()
        .from(companyReviews)
        .where(eq(companyReviews.companyId, companyId));
    } catch (error) {
      console.error('Error getting company reviews:', error);
      throw error;
    }
  }

  async updateCompanyReview(id: number, updates: Partial<CompanyReview>): Promise<CompanyReview> {
    try {
      const [result] = await this.db
        .update(companyReviews)
        .set(updates)
        .where(eq(companyReviews.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating company review:', error);
      throw error;
    }
  }

  // Company member methods
  async createCompanyMember(member: InsertCompanyMember): Promise<CompanyMember> {
    try {
      const [result] = await this.db
        .insert(companyMembers)
        .values(member)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating company member:', error);
      throw error;
    }
  }

  async getCompanyMembers(companyId: number): Promise<CompanyMember[]> {
    try {
      return await this.db
        .select()
        .from(companyMembers)
        .where(eq(companyMembers.companyId, companyId));
    } catch (error) {
      console.error('Error getting company members:', error);
      throw error;
    }
  }

  async updateCompanyMember(id: number, updates: Partial<CompanyMember>): Promise<CompanyMember> {
    try {
      const [result] = await this.db
        .update(companyMembers)
        .set(updates)
        .where(eq(companyMembers.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating company member:', error);
      throw error;
    }
  }

  async removeCompanyMember(id: number): Promise<void> {
    try {
      await this.db
        .delete(companyMembers)
        .where(eq(companyMembers.id, id));
    } catch (error) {
      console.error('Error removing company member:', error);
      throw error;
    }
  }
  // Implement new company auth methods
  async getCompanyByName(name: string): Promise<Company | undefined> {
    try {
      console.log('Looking up company by name:', name);
      const [result] = await this.db
        .select()
        .from(companies)
        .where(eq(companies.name, name));
      return result;
    } catch (error) {
      console.error('Error getting company by name:', error);
      throw error;
    }
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    try {
      console.log('Looking up company by email:', email);
      const [result] = await this.db
        .select()
        .from(companies)
        .where(eq(companies.primaryContactEmail, email));
      return result;
    } catch (error) {
      console.error('Error getting company by email:', error);
      throw error;
    }
  }

  // Directory listing methods
  async createDirectoryListing(listing: InsertDirectory): Promise<Directory> {
    try {
      console.log('Creating directory listing:', listing);
      const [result] = await this.db
        .insert(directories)
        .values({
          ...listing,
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 0,
          clicks: 0
        })
        .returning();
      
      console.log('Created directory listing:', result);
      return result;
    } catch (error) {
      console.error('Error creating directory listing:', error);
      throw error;
    }
  }

  async getDirectoryListing(companyId: number): Promise<Directory | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(directories)
        .where(eq(directories.companyId, companyId));
      return result;
    } catch (error) {
      console.error('Error getting directory listing:', error);
      throw error;
    }
  }

  async getAllDirectoryListings(): Promise<Directory[]> {
    try {
      const results = await this.db
        .select()
        .from(directories)
        .orderBy(desc(directories.featuredHighlight), desc(directories.views));
      return results;
    } catch (error) {
      console.error('Error getting all directory listings:', error);
      throw error;
    }
  }

  async updateDirectoryListing(companyId: number, updates: Partial<Directory>): Promise<Directory> {
    try {
      console.log('Updating directory listing for company:', companyId, updates);
      
      // Ensure updatedAt is set
      const updateValues = {
        ...updates,
        updatedAt: new Date()
      };
      
      const [result] = await this.db
        .update(directories)
        .set(updateValues)
        .where(eq(directories.companyId, companyId))
        .returning();
      
      if (!result) {
        throw new Error(`No directory listing found for company ID ${companyId}`);
      }
      
      console.log('Updated directory listing:', result);
      return result;
    } catch (error) {
      console.error('Error updating directory listing:', error);
      throw error;
    }
  }

  async incrementDirectoryViews(id: number): Promise<void> {
    try {
      await this.db
        .update(directories)
        .set({
          views: sql`${directories.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(directories.id, id));
    } catch (error) {
      console.error('Error incrementing directory views:', error);
      throw error;
    }
  }

  async incrementDirectoryClicks(id: number): Promise<void> {
    try {
      await this.db
        .update(directories)
        .set({
          clicks: sql`${directories.clicks} + 1`,
          updatedAt: new Date()
        })
        .where(eq(directories.id, id));
    } catch (error) {
      console.error('Error incrementing directory clicks:', error);
      throw error;
    }
  }

  async deleteDirectoryListing(companyId: number): Promise<void> {
    try {
      await this.db
        .delete(directories)
        .where(eq(directories.companyId, companyId));
    } catch (error) {
      console.error('Error deleting directory listing:', error);
      throw error;
    }
  }

  // Business Location methods implementation
  async createBusinessLocation(location: InsertBusinessLocation): Promise<BusinessLocation> {
    try {
      console.log('Creating business location:', location);
      const [result] = await this.db
        .insert(businessLocations)
        .values({
          ...location,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating business location:', error);
      throw error;
    }
  }

  async getBusinessLocation(id: number): Promise<BusinessLocation | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(businessLocations)
        .where(eq(businessLocations.id, id));
      return result;
    } catch (error) {
      console.error('Error getting business location:', error);
      throw error;
    }
  }

  async getAllBusinessLocations(): Promise<BusinessLocation[]> {
    try {
      return await this.db
        .select()
        .from(businessLocations);
    } catch (error) {
      console.error('Error getting all business locations:', error);
      throw error;
    }
  }

  async getBusinessLocationsByType(type: string): Promise<BusinessLocation[]> {
    try {
      return await this.db
        .select()
        .from(businessLocations)
        .where(eq(businessLocations.type, type));
    } catch (error) {
      console.error(`Error getting business locations by type ${type}:`, error);
      throw error;
    }
  }

  async getBusinessLocationsByCountry(country: string): Promise<BusinessLocation[]> {
    try {
      return await this.db
        .select()
        .from(businessLocations)
        .where(eq(businessLocations.country, country));
    } catch (error) {
      console.error(`Error getting business locations by country ${country}:`, error);
      throw error;
    }
  }

  async getBusinessLocationsByCompany(companyId: number): Promise<BusinessLocation[]> {
    try {
      return await this.db
        .select()
        .from(businessLocations)
        .where(and(eq(businessLocations.entityId, companyId), eq(businessLocations.type, 'company')));
    } catch (error) {
      console.error(`Error getting business locations by company ${companyId}:`, error);
      throw error;
    }
  }

  async updateBusinessLocation(id: number, updates: Partial<BusinessLocation>): Promise<BusinessLocation> {
    try {
      const [result] = await this.db
        .update(businessLocations)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(businessLocations.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating business location:', error);
      throw error;
    }
  }

  async deleteBusinessLocation(id: number): Promise<void> {
    try {
      await this.db
        .delete(businessLocations)
        .where(eq(businessLocations.id, id));
    } catch (error) {
      console.error('Error deleting business location:', error);
      throw error;
    }
  }

  async createCredential(credential: any): Promise<any> {
    try {
      console.log('Creating credential with data:', JSON.stringify(credential, null, 2));
      
      // Use raw SQL to avoid timestamp conversion issues
      const query = `
        INSERT INTO company_credentials (
          company_id, credential_type, title, issuing_organization, 
          issue_date, expiry_date, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING *;
      `;
      
      const values = [
        credential.companyId,
        credential.credentialType,
        credential.title,
        credential.issuingOrganization,
        credential.issueDate ? credential.issueDate.toISOString() : null,
        credential.expiryDate ? credential.expiryDate.toISOString() : null,
        credential.status || 'pending'
      ];
      
      const result = await pool.query(query, values);
      console.log('Successfully created credential:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  // Investment Strategist methods implementation
  async createInvestmentProfile(profileData: any): Promise<any> {
    try {
      console.log('Creating investment profile:', profileData);
      
      // Use raw SQL for investment profile creation
      const query = `
        INSERT INTO investment_profiles (
          user_id, age, income, investment_experience, risk_tolerance, 
          investment_goals, time_horizon, current_investments, monthly_investment_budget,
          emergency_fund_months, debt_amount, preferred_investment_types,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) 
        ON CONFLICT (user_id) 
        DO UPDATE SET
          age = EXCLUDED.age,
          income = EXCLUDED.income,
          investment_experience = EXCLUDED.investment_experience,
          risk_tolerance = EXCLUDED.risk_tolerance,
          investment_goals = EXCLUDED.investment_goals,
          time_horizon = EXCLUDED.time_horizon,
          current_investments = EXCLUDED.current_investments,
          monthly_investment_budget = EXCLUDED.monthly_investment_budget,
          emergency_fund_months = EXCLUDED.emergency_fund_months,
          debt_amount = EXCLUDED.debt_amount,
          preferred_investment_types = EXCLUDED.preferred_investment_types,
          updated_at = NOW()
        RETURNING *;
      `;
      
      const values = [
        profileData.userId,
        profileData.currentAge || profileData.age,
        profileData.monthlyIncome || profileData.income,
        profileData.investmentExperience,
        profileData.riskTolerance,
        JSON.stringify(profileData.investmentGoals || []),
        profileData.investmentHorizon || profileData.timeHorizon,
        profileData.totalAssets || profileData.currentInvestments,
        profileData.monthlyInvestmentCapacity || profileData.monthlyInvestmentBudget,
        profileData.hasEmergencyFund ? 6 : 0,
        profileData.debtAmount || 0,
        JSON.stringify(profileData.preferredInvestmentTypes || [])
      ];
      
      const result = await pool.query(query, values);
      console.log('Successfully created investment profile:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating investment profile:', error);
      throw error;
    }
  }

  async getInvestmentProfile(userId: number): Promise<any> {
    try {
      const query = `SELECT * FROM investment_profiles WHERE user_id = $1`;
      const result = await pool.query(query, [userId]);
      
      if (result.rows[0]) {
        // Map database fields to frontend expected format
        const profile = result.rows[0];
        return {
          id: profile.id,
          userId: profile.user_id,
          currentAge: profile.age,
          retirementAge: 65, // Default, could be stored separately
          monthlyIncome: profile.income,
          investmentExperience: profile.investment_experience,
          riskTolerance: profile.risk_tolerance,
          investmentGoals: this.safeJsonParse(profile.investment_goals, []),
          investmentHorizon: profile.time_horizon,
          totalAssets: profile.current_investments,
          monthlyInvestmentCapacity: profile.monthly_investment_budget,
          hasEmergencyFund: profile.emergency_fund_months > 0,
          emergencyFundMonths: profile.emergency_fund_months,
          debtAmount: profile.debt_amount,
          preferredInvestmentTypes: this.safeJsonParse(profile.preferred_investment_types, []),
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting investment profile:', error);
      throw error;
    }
  }

  async updateInvestmentProfile(userId: number, updates: any): Promise<any> {
    try {
      const query = `
        UPDATE investment_profiles 
        SET age = $2, income = $3, investment_experience = $4, risk_tolerance = $5,
            investment_goals = $6, time_horizon = $7, current_investments = $8,
            monthly_investment_budget = $9, emergency_fund_months = $10, debt_amount = $11,
            preferred_investment_types = $12, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *;
      `;
      
      const values = [
        userId,
        updates.age,
        updates.income,
        updates.investmentExperience,
        updates.riskTolerance,
        JSON.stringify(updates.investmentGoals),
        updates.timeHorizon,
        updates.currentInvestments,
        updates.monthlyInvestmentBudget,
        updates.emergencyFundMonths,
        updates.debtAmount,
        JSON.stringify(updates.preferredInvestmentTypes)
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating investment profile:', error);
      throw error;
    }
  }

  async saveInvestmentAnalysis(userId: number, analysis: any): Promise<any> {
    try {
      console.log('=== SAVING INVESTMENT ANALYSIS ===');
      console.log('User ID:', userId);
      console.log('Analysis keys:', Object.keys(analysis));
      console.log('Recommended Portfolio:', analysis.recommendedPortfolio);
      console.log('Specific Investments Count:', analysis.specificInvestments?.length || 0);
      console.log('First Investment:', analysis.specificInvestments?.[0]);
      
      // For now, use the old table structure but store complete data
      const query = `
        INSERT INTO investment_analyses (
          user_id, analysis_type, recommendations, risk_assessment,
          portfolio_allocation, market_opportunities, rebalancing_suggestions,
          analysis_data, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW()
        ) RETURNING *;
      `;
      
      // Ensure we're storing the complete analysis properly
      const analysisDataToStore = {
        riskProfile: analysis.riskProfile,
        recommendedPortfolio: analysis.recommendedPortfolio,
        specificInvestments: analysis.specificInvestments || [],
        monthlyInvestmentPlan: analysis.monthlyInvestmentPlan,
        marketOpportunities: analysis.marketOpportunities || [],
        portfolioOptimization: analysis.portfolioOptimization,
        aiInsights: analysis.aiInsights || [],
        nextSteps: analysis.nextSteps || []
      };
      
      console.log('Data being stored in analysis_data field:', analysisDataToStore);
      console.log('Specific investments being stored:', analysis.specificInvestments);
      console.log('Recommended portfolio being stored:', analysis.recommendedPortfolio);
      
      // Store all data ONLY in analysis_data field to avoid [object Object] issues
      const values = [
        userId,
        analysis.analysisType || 'comprehensive', 
        null, // Skip individual columns that cause [object Object] errors
        null,
        null,
        null,
        null,
        JSON.stringify(analysisDataToStore) // Store ALL comprehensive data here
      ];
      
      console.log('Final values being inserted:', values.map((v, i) => `${i}: ${typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v}`));
      
      const result = await pool.query(query, values);
      console.log('Analysis saved successfully with ID:', result.rows[0].id);
      console.log('Stored analysis_data preview:', result.rows[0].analysis_data);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error saving investment analysis:', error);
      throw error;
    }
  }

  async getInvestmentAnalyses(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM investment_analyses 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      const result = await pool.query(query, [userId]);
      
      console.log(`Retrieved ${result.rows.length} investment analyses for user ${userId}`);
      
      return result.rows.map(row => {
        try {
          // Parse the complete stored analysis data
          let analysisData = this.safeJsonParse(row.analysis_data, {});
          
          console.log('Raw analysis_data from DB:', row.analysis_data);
          console.log('Parsed analysis_data:', analysisData);
          
          // If analysis_data is empty or invalid, return empty structure for now
          if (!analysisData || Object.keys(analysisData).length === 0) {
            console.log('analysis_data is empty or invalid, creating default structure');
            
            analysisData = {
              specificInvestments: [],
              recommendedPortfolio: null,
              marketOpportunities: [],
              portfolioOptimization: null,
              riskProfile: 'Assessment complete',
              monthlyInvestmentPlan: null,
              aiInsights: [],
              nextSteps: []
            };
          }
          
          console.log('Final parsing analysis data:', {
            id: row.id,
            hasRecommendedPortfolio: !!analysisData.recommendedPortfolio,
            hasSpecificInvestments: !!(analysisData.specificInvestments && analysisData.specificInvestments.length),
            investmentCount: analysisData.specificInvestments?.length || 0,
            hasMarketOpportunities: !!(analysisData.marketOpportunities && analysisData.marketOpportunities.length),
            rawDataKeys: Object.keys(analysisData),
            dataPreview: {
              riskProfile: analysisData.riskProfile,
              portfolioKeys: analysisData.recommendedPortfolio ? Object.keys(analysisData.recommendedPortfolio) : null,
              investmentSample: analysisData.specificInvestments?.[0]?.symbol || null
            }
          });
          
          return {
            id: row.id,
            userId: row.user_id,
            analysisType: row.analysis_type,
            createdAt: row.created_at,
            riskProfile: analysisData.riskProfile || 'Assessment complete',
            recommendedPortfolio: analysisData.recommendedPortfolio || null,
            specificInvestments: analysisData.specificInvestments || [],
            monthlyInvestmentPlan: analysisData.monthlyInvestmentPlan || null,
            aiInsights: analysisData.aiInsights || [],
            nextSteps: analysisData.nextSteps || [],
            marketOpportunities: analysisData.marketOpportunities || [],
            portfolioOptimization: analysisData.portfolioOptimization || null
          };
        } catch (parseError) {
          console.error('Error parsing analysis data:', parseError, 'Raw data:', row.analysis_data);
          return {
            id: row.id,
            userId: row.user_id,
            analysisType: row.analysis_type,
            createdAt: row.created_at,
            riskProfile: 'Analysis parsing error',
            recommendedPortfolio: null,
            specificInvestments: [],
            monthlyInvestmentPlan: null,
            aiInsights: [],
            nextSteps: [],
            marketOpportunities: [],
            portfolioOptimization: null
          };
        }
      });
    } catch (error) {
      console.error('Error getting investment analyses:', error);
      throw error;
    }
  }

  async addPortfolioHolding(holdingData: any): Promise<any> {
    try {
      const query = `
        INSERT INTO portfolio_holdings (
          user_id, symbol, name, shares, purchase_price, current_price,
          purchase_date, holding_type, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        ) RETURNING *;
      `;
      
      const values = [
        holdingData.userId,
        holdingData.symbol,
        holdingData.name,
        holdingData.shares,
        holdingData.purchasePrice,
        holdingData.currentPrice,
        holdingData.purchaseDate,
        holdingData.holdingType
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding portfolio holding:', error);
      throw error;
    }
  }

  async getPortfolioHoldings(userId: number): Promise<any[]> {
    try {
      const query = `SELECT * FROM portfolio_holdings WHERE user_id = $1 ORDER BY created_at DESC`;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting portfolio holdings:', error);
      throw error;
    }
  }

  async updatePortfolioHolding(holdingId: number, updates: any): Promise<any> {
    try {
      const query = `
        UPDATE portfolio_holdings 
        SET shares = $2, current_price = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;
      
      const values = [holdingId, updates.shares, updates.currentPrice];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating portfolio holding:', error);
      throw error;
    }
  }

  async deletePortfolioHolding(holdingId: number): Promise<void> {
    try {
      const query = `DELETE FROM portfolio_holdings WHERE id = $1`;
      await pool.query(query, [holdingId]);
    } catch (error) {
      console.error('Error deleting portfolio holding:', error);
      throw error;
    }
  }

  // Team Financial Health Management Implementation
  async createFinancialTeam(team: InsertFinancialTeam): Promise<FinancialTeam> {
    try {
      const [result] = await this.db.insert(financialTeams).values(team as any).returning();
      return result;
    } catch (error) {
      console.error('Error creating financial team:', error);
      throw error;
    }
  }

  async getFinancialTeam(id: number): Promise<FinancialTeam | undefined> {
    try {
      const [result] = await this.db.select().from(financialTeams).where(eq(financialTeams.id, id));
      return result;
    } catch (error) {
      console.error('Error getting financial team:', error);
      throw error;
    }
  }

  async getUserFinancialTeams(userId: number): Promise<FinancialTeam[]> {
    try {
      // Get teams where user is a member
      const teams = await this.db
        .select({
          id: financialTeams.id,
          name: financialTeams.name,
          description: financialTeams.description,
          ownerId: financialTeams.ownerId,
          teamType: financialTeams.teamType,
          industry: financialTeams.industry,
          monthlyBudget: financialTeams.monthlyBudget,
          goals: financialTeams.goals,
          settings: financialTeams.settings,
          createdAt: financialTeams.createdAt,
          updatedAt: financialTeams.updatedAt
        })
        .from(financialTeams)
        .innerJoin(teamMembers, eq(teamMembers.teamId, financialTeams.id))
        .where(eq(teamMembers.userId, userId));
      
      return teams;
    } catch (error) {
      console.error('Error getting user financial teams:', error);
      throw error;
    }
  }

  async updateFinancialTeam(id: number, updates: Partial<FinancialTeam>): Promise<FinancialTeam> {
    try {
      const [result] = await this.db
        .update(financialTeams)
        .set(updates)
        .where(eq(financialTeams.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating financial team:', error);
      throw error;
    }
  }

  async deleteFinancialTeam(id: number): Promise<void> {
    try {
      await this.db.delete(financialTeams).where(eq(financialTeams.id, id));
    } catch (error) {
      console.error('Error deleting financial team:', error);
      throw error;
    }
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    try {
      const [result] = await this.db.insert(teamMembers).values(member).returning();
      return result;
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    try {
      const result = await this.db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));
      return result;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  async updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember> {
    try {
      const [result] = await this.db
        .update(teamMembers)
        .set(updates)
        .where(eq(teamMembers.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  async removeTeamMember(id: number): Promise<void> {
    try {
      await this.db.delete(teamMembers).where(eq(teamMembers.id, id));
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  async createTeamFinancialMetric(metric: InsertTeamFinancialMetric): Promise<TeamFinancialMetric> {
    try {
      const [result] = await this.db.insert(teamFinancialMetrics).values(metric).returning();
      return result;
    } catch (error) {
      console.error('Error creating team financial metric:', error);
      throw error;
    }
  }

  async getTeamFinancialMetrics(teamId: number): Promise<TeamFinancialMetric[]> {
    try {
      const result = await this.db
        .select()
        .from(teamFinancialMetrics)
        .where(eq(teamFinancialMetrics.teamId, teamId));
      return result;
    } catch (error) {
      console.error('Error getting team financial metrics:', error);
      throw error;
    }
  }

  async updateTeamFinancialMetric(id: number, updates: Partial<TeamFinancialMetric>): Promise<TeamFinancialMetric> {
    try {
      const [result] = await this.db
        .update(teamFinancialMetrics)
        .set(updates)
        .where(eq(teamFinancialMetrics.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating team financial metric:', error);
      throw error;
    }
  }

  async deleteTeamFinancialMetric(id: number): Promise<void> {
    try {
      await this.db.delete(teamFinancialMetrics).where(eq(teamFinancialMetrics.id, id));
    } catch (error) {
      console.error('Error deleting team financial metric:', error);
      throw error;
    }
  }

  async createTeamFinancialInsight(insight: InsertTeamFinancialInsight): Promise<TeamFinancialInsight> {
    try {
      const [result] = await this.db.insert(teamFinancialInsights).values(insight as any).returning();
      return result;
    } catch (error) {
      console.error('Error creating team financial insight:', error);
      throw error;
    }
  }

  async getTeamFinancialInsights(teamId: number): Promise<TeamFinancialInsight[]> {
    try {
      const result = await this.db
        .select()
        .from(teamFinancialInsights)
        .where(eq(teamFinancialInsights.teamId, teamId));
      return result;
    } catch (error) {
      console.error('Error getting team financial insights:', error);
      throw error;
    }
  }

  async dismissFinancialInsight(id: number): Promise<void> {
    try {
      await this.db
        .update(teamFinancialInsights)
        .set({ isRead: true })
        .where(eq(teamFinancialInsights.id, id));
    } catch (error) {
      console.error('Error dismissing financial insight:', error);
      throw error;
    }
  }

  // Market reports methods
  async createMarketReport(companyId: number, reportData: any): Promise<any> {
    try {
      console.log('Creating market report with data:', {
        companyId,
        title: reportData.title,
        industry: reportData.industry,
        regions: reportData.regions,
        timeframe: reportData.timeframe,
        reportData: reportData.data
      });

      const [result] = await this.db
        .insert(marketReports)
        .values({
          companyId,
          title: reportData.title,
          industry: reportData.industry,
          regions: reportData.regions || ["Global"],
          timeframe: reportData.timeframe || "12months",
          reportData: reportData.data,
          status: "completed"
        })
        .returning();
      
      console.log('Market report saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating market report:', error);
      throw error;
    }
  }

  async getMarketReportsByCompany(companyId: number): Promise<any[]> {
    try {
      const result = await this.db
        .select()
        .from(marketReports)
        .where(eq(marketReports.companyId, companyId))
        .orderBy(desc(marketReports.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting market reports by company:', error);
      throw error;
    }
  }

  async getMarketReport(id: number): Promise<any | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(marketReports)
        .where(eq(marketReports.id, id));
      return result;
    } catch (error) {
      console.error('Error getting market report:', error);
      throw error;
    }
  }

  async deleteMarketReport(id: number): Promise<void> {
    try {
      await this.db.delete(marketReports).where(eq(marketReports.id, id));
    } catch (error) {
      console.error('Error deleting market report:', error);
      throw error;
    }
  }

  // Chatbot methods
  async createChatbotPreset(preset: InsertChatbotPreset): Promise<ChatbotPreset> {
    try {
      const [result] = await this.db.insert(chatbotPresets).values(preset).returning();
      return result;
    } catch (error) {
      console.error('Error creating chatbot preset:', error);
      throw error;
    }
  }

  async getChatbotPresets(companyId: number): Promise<ChatbotPreset[]> {
    try {
      const result = await this.db
        .select()
        .from(chatbotPresets)
        .where(eq(chatbotPresets.companyId, companyId));
      return result;
    } catch (error) {
      console.error('Error getting chatbot presets:', error);
      throw error;
    }
  }

  async updateChatbotPreset(id: number, updates: Partial<ChatbotPreset>): Promise<ChatbotPreset> {
    try {
      const [result] = await this.db
        .update(chatbotPresets)
        .set(updates)
        .where(eq(chatbotPresets.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating chatbot preset:', error);
      throw error;
    }
  }

  async deleteChatbotPreset(id: number): Promise<void> {
    try {
      await this.db.delete(chatbotPresets).where(eq(chatbotPresets.id, id));
    } catch (error) {
      console.error('Error deleting chatbot preset:', error);
      throw error;
    }
  }

  async createChatbotInteraction(interaction: InsertChatbotInteraction): Promise<ChatbotInteraction> {
    try {
      const [result] = await this.db.insert(chatbotInteractions).values(interaction).returning();
      return result;
    } catch (error) {
      console.error('Error creating chatbot interaction:', error);
      throw error;
    }
  }

  async getChatbotInteractions(companyId: number): Promise<ChatbotInteraction[]> {
    try {
      const result = await this.db
        .select()
        .from(chatbotInteractions)
        .where(eq(chatbotInteractions.companyId, companyId))
        .orderBy(desc(chatbotInteractions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting chatbot interactions:', error);
      throw error;
    }
  }

  async getChatbotInteractionCount(companyId: number, since: Date): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(chatbotInteractions)
        .where(
          and(
            eq(chatbotInteractions.companyId, companyId),
            gte(chatbotInteractions.createdAt, since)
          )
        );
      return result[0]?.count ?? 0;
    } catch (error) {
      console.error('Error getting chatbot interaction count:', error);
      throw error;
    }
  }

  // Client Request methods
  async createClientRequest(request: InsertClientRequest): Promise<ClientRequest> {
    try {
      const [result] = await this.db.insert(clientRequests).values(request).returning();
      return result;
    } catch (error) {
      console.error('Error creating client request:', error);
      throw error;
    }
  }

  async getClientRequests(companyId: number): Promise<ClientRequest[]> {
    try {
      const result = await this.db
        .select()
        .from(clientRequests)
        .where(eq(clientRequests.companyId, companyId))
        .orderBy(desc(clientRequests.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting client requests:', error);
      throw error;
    }
  }

  async getClientRequest(id: number): Promise<ClientRequest | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(clientRequests)
        .where(eq(clientRequests.id, id));
      return result;
    } catch (error) {
      console.error('Error getting client request:', error);
      throw error;
    }
  }

  async updateClientRequest(id: number, updates: Partial<ClientRequest>): Promise<ClientRequest> {
    try {
      const [result] = await this.db
        .update(clientRequests)
        .set(updates)
        .where(eq(clientRequests.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating client request:', error);
      throw error;
    }
  }

  // Company Analytics methods
  async createCompanyAnalytic(analytic: InsertCompanyAnalytic): Promise<CompanyAnalytic> {
    try {
      const [result] = await this.db.insert(companyAnalytics).values(analytic).returning();
      return result;
    } catch (error) {
      console.error('Error creating company analytic:', error);
      throw error;
    }
  }

  async getCompanyAnalytics(companyId: number, eventType?: string): Promise<CompanyAnalytic[]> {
    try {
      const conditions = [eq(companyAnalytics.companyId, companyId)];
      if (eventType) {
        conditions.push(eq(companyAnalytics.eventType, eventType));
      }
      const result = await this.db
        .select()
        .from(companyAnalytics)
        .where(and(...conditions))
        .orderBy(desc(companyAnalytics.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting company analytics:', error);
      throw error;
    }
  }

  async getCompanyAnalyticsSummary(companyId: number): Promise<any> {
    try {
      const result = await this.db
        .select({
          eventType: companyAnalytics.eventType,
          count: count(),
        })
        .from(companyAnalytics)
        .where(eq(companyAnalytics.companyId, companyId))
        .groupBy(companyAnalytics.eventType);
      return result;
    } catch (error) {
      console.error('Error getting company analytics summary:', error);
      throw error;
    }
  }

  async getCompanyAnalyticsTrend(companyId: number, days: number = 30): Promise<any[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const events = await this.db
        .select()
        .from(companyAnalytics)
        .where(
          and(
            eq(companyAnalytics.companyId, companyId),
            gte(companyAnalytics.createdAt, since)
          )
        )
        .orderBy(companyAnalytics.createdAt);

      // Group by date string (YYYY-MM-DD) and event type
      const byDate: Record<string, Record<string, number>> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        byDate[key] = { date: key as any, profile_view: 0, chatbot_interaction: 0, client_request: 0, directory_click: 0 };
      }
      for (const ev of events) {
        const key = ev.createdAt ? new Date(ev.createdAt).toISOString().slice(0, 10) : null;
        if (key && byDate[key] && ev.eventType in byDate[key]) {
          byDate[key][ev.eventType]++;
        }
      }
      return Object.values(byDate);
    } catch (error) {
      console.error('Error getting company analytics trend:', error);
      throw error;
    }
  }

  // Employee Verification methods
  async createEmployeeVerification(verification: InsertEmployeeVerification): Promise<EmployeeVerification> {
    try {
      const [result] = await this.db.insert(employeeVerifications).values(verification).returning();
      return result;
    } catch (error) {
      console.error('Error creating employee verification:', error);
      throw error;
    }
  }

  async getEmployeeVerifications(companyId: number): Promise<EmployeeVerification[]> {
    try {
      const result = await this.db
        .select()
        .from(employeeVerifications)
        .where(eq(employeeVerifications.companyId, companyId));
      return result;
    } catch (error) {
      console.error('Error getting employee verifications:', error);
      throw error;
    }
  }

  async getEmployeeVerification(id: number): Promise<EmployeeVerification | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(employeeVerifications)
        .where(eq(employeeVerifications.id, id));
      return result;
    } catch (error) {
      console.error('Error getting employee verification:', error);
      throw error;
    }
  }

  async updateEmployeeVerification(id: number, updates: Partial<EmployeeVerification>): Promise<EmployeeVerification> {
    try {
      const [result] = await this.db
        .update(employeeVerifications)
        .set(updates)
        .where(eq(employeeVerifications.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating employee verification:', error);
      throw error;
    }
  }

  async deleteEmployeeVerification(id: number): Promise<void> {
    try {
      await this.db.delete(employeeVerifications).where(eq(employeeVerifications.id, id));
    } catch (error) {
      console.error('Error deleting employee verification:', error);
      throw error;
    }
  }

  // ── Notifications ────────────────────────────────────────────────────────
  async getNotifications(userId?: number, companyId?: number): Promise<any[]> {
    try {
      const { notifications } = await import('@shared/schema');
      let q = this.db.select().from(notifications);
      if (userId) q = q.where(eq(notifications.userId, userId)) as any;
      else if (companyId) q = q.where(eq(notifications.companyId, companyId)) as any;
      return await (q as any).orderBy(desc(notifications.createdAt)).limit(50);
    } catch (e) { console.error('getNotifications error:', e); return []; }
  }

  async createNotification(n: any): Promise<any> {
    try {
      const { notifications } = await import('@shared/schema');
      const [result] = await this.db.insert(notifications).values(n).returning();
      return result;
    } catch (e) { console.error('createNotification error:', e); throw e; }
  }

  async markNotificationRead(id: number): Promise<void> {
    try {
      const { notifications } = await import('@shared/schema');
      await this.db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    } catch (e) { console.error('markNotificationRead error:', e); }
  }

  async markAllNotificationsRead(userId?: number, companyId?: number): Promise<void> {
    try {
      const { notifications } = await import('@shared/schema');
      if (userId) await this.db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
      else if (companyId) await this.db.update(notifications).set({ isRead: true }).where(eq(notifications.companyId, companyId));
    } catch (e) { console.error('markAllNotificationsRead error:', e); }
  }

  async deleteNotification(id: number): Promise<void> {
    try {
      const { notifications } = await import('@shared/schema');
      await this.db.delete(notifications).where(eq(notifications.id, id));
    } catch (e) { console.error('deleteNotification error:', e); }
  }

  async getUnreadCount(userId?: number, companyId?: number): Promise<number> {
    try {
      const { notifications } = await import('@shared/schema');
      const conds: any[] = [eq(notifications.isRead, false)];
      if (userId) conds.push(eq(notifications.userId, userId));
      else if (companyId) conds.push(eq(notifications.companyId, companyId));
      const [row] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conds));
      return Number(row?.count ?? 0);
    } catch (e) { return 0; }
  }

  // ── Password Reset ───────────────────────────────────────────────────────
  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(users).where(eq(users.passwordResetToken, token));
      return user;
    } catch (e) { console.error('getUserByResetToken error:', e); return undefined; }
  }

  async setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    try {
      await this.db.update(users).set({ passwordResetToken: token, passwordResetExpiry: expiry }).where(eq(users.id, userId));
    } catch (e) { console.error('setPasswordResetToken error:', e); throw e; }
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    try {
      await this.db.update(users).set({ passwordResetToken: null, passwordResetExpiry: null }).where(eq(users.id, userId));
    } catch (e) { console.error('clearPasswordResetToken error:', e); }
  }

  async getUserSavingsGoals(userId: number): Promise<SavingsGoal[]> {
    try {
      return await this.db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
    } catch (e) { console.error('getUserSavingsGoals error:', e); return []; }
  }

  async getFinancialGoals(userId: number): Promise<any[]> {
    return this.getUserSavingsGoals(userId);
  }

  async getTeamHealthReport(userId: number): Promise<any | null> {
    const teams = await this.getUserFinancialTeams(userId);
    if (!teams || teams.length === 0) return null;
    const team = teams[0];
    const metrics = await this.getTeamFinancialMetrics(team.id);
    if (!metrics || metrics.length === 0) return null;
    const totalIncome = metrics
      .filter(m => m.metricType === 'income')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalExpenses = metrics
      .filter(m => m.metricType === 'expenses')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalSavings = totalIncome - totalExpenses;
    const score = totalIncome > 0 ? Math.min(100, Math.round((totalSavings / totalIncome) * 100)) : 0;
    return {
      overallScore: score,
      financialHealth: score >= 70 ? 'good' : score >= 40 ? 'fair' : 'needs_attention',
      summary: `Financial health based on ${metrics.length} data point(s).`,
      keyMetrics: { totalIncome, totalExpenses, totalSavings, burnRate: totalExpenses, cashRunway: totalExpenses > 0 ? Math.round(totalSavings / totalExpenses) : 0 },
      insights: [],
      recommendations: [],
      trends: { income: 'neutral', expenses: 'neutral', savings: 'neutral' }
    };
  }

  async getTeamInsights(teamId: number, userId: number): Promise<any[]> {
    const teams = await this.getUserFinancialTeams(userId);
    const isMember = teams.some(t => t.id === teamId);
    if (!isMember) return [];
    return this.getTeamFinancialInsights(teamId);
  }

  // ===== ENDORSEMENTS =====
  async getUserEndorsements(userId: number): Promise<Endorsement[]> {
    return this.db.select().from(endorsements).where(eq(endorsements.userId, userId)).orderBy(desc(endorsements.createdAt));
  }
  async createEndorsement(data: any): Promise<Endorsement> {
    const [result] = await this.db.insert(endorsements).values(data).returning();
    return result;
  }
  async deleteEndorsement(id: number): Promise<void> {
    await this.db.delete(endorsements).where(eq(endorsements.id, id));
  }

  // ===== PORTFOLIO ITEMS =====
  async getUserPortfolioItems(userId: number): Promise<PortfolioItem[]> {
    return this.db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.createdAt));
  }
  async createPortfolioItem(data: any): Promise<PortfolioItem> {
    const [result] = await this.db.insert(portfolioItems).values(data).returning();
    return result;
  }
  async updatePortfolioItem(id: number, updates: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const [result] = await this.db.update(portfolioItems).set(updates).where(eq(portfolioItems.id, id)).returning();
    return result;
  }
  async deletePortfolioItem(id: number): Promise<void> {
    await this.db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }
  async getPortfolioItem(id: number): Promise<PortfolioItem | undefined> {
    const [result] = await this.db.select().from(portfolioItems).where(eq(portfolioItems.id, id));
    return result;
  }

  // ===== CLIENT FEEDBACK =====
  async getUserClientFeedback(userId: number): Promise<ClientFeedback[]> {
    return this.db.select().from(clientFeedback).where(eq(clientFeedback.userId, userId)).orderBy(desc(clientFeedback.createdAt));
  }
  async createClientFeedback(data: any): Promise<ClientFeedback> {
    const [result] = await this.db.insert(clientFeedback).values(data).returning();
    return result;
  }
  async deleteClientFeedback(id: number): Promise<void> {
    await this.db.delete(clientFeedback).where(eq(clientFeedback.id, id));
  }

  // ===== CONVERSATION HISTORY =====
  async getConversationHistory(userId: number, agentType: string, limit = 20): Promise<ConversationHistory[]> {
    return this.db.select().from(conversationHistory)
      .where(and(eq(conversationHistory.userId, userId), eq(conversationHistory.agentType, agentType)))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(limit);
  }
  async addConversationMessage(data: any): Promise<ConversationHistory> {
    const [result] = await this.db.insert(conversationHistory).values(data).returning();
    return result;
  }
  async clearConversationHistory(userId: number, agentType: string): Promise<void> {
    await this.db.delete(conversationHistory)
      .where(and(eq(conversationHistory.userId, userId), eq(conversationHistory.agentType, agentType)));
  }

  // ===== COMPLIANCE REPORTS =====
  async getCompanyComplianceReports(companyId: number): Promise<ComplianceReport[]> {
    return this.db.select().from(complianceReports).where(eq(complianceReports.companyId, companyId)).orderBy(desc(complianceReports.createdAt));
  }
  async createComplianceReport(data: any): Promise<ComplianceReport> {
    const [result] = await this.db.insert(complianceReports).values(data).returning();
    return result;
  }
  async getComplianceReport(id: number): Promise<ComplianceReport | undefined> {
    const [result] = await this.db.select().from(complianceReports).where(eq(complianceReports.id, id));
    return result;
  }
  async updateComplianceReport(id: number, updates: Partial<ComplianceReport>): Promise<ComplianceReport> {
    const [result] = await this.db.update(complianceReports).set(updates).where(eq(complianceReports.id, id)).returning();
    return result;
  }

  // ===== STRATEGY BRIEFS =====
  async getCompanyStrategyBriefs(companyId: number): Promise<StrategyBrief[]> {
    return this.db.select().from(strategyBriefs).where(eq(strategyBriefs.companyId, companyId)).orderBy(desc(strategyBriefs.createdAt));
  }
  async createStrategyBrief(data: any): Promise<StrategyBrief> {
    const [result] = await this.db.insert(strategyBriefs).values(data).returning();
    return result;
  }
  async getStrategyBrief(id: number): Promise<StrategyBrief | undefined> {
    const [result] = await this.db.select().from(strategyBriefs).where(eq(strategyBriefs.id, id));
    return result;
  }
  async updateStrategyBrief(id: number, updates: Partial<StrategyBrief>): Promise<StrategyBrief> {
    const [result] = await this.db.update(strategyBriefs).set(updates).where(eq(strategyBriefs.id, id)).returning();
    return result;
  }

  // ===== FRAUD ALERTS =====
  async getFraudAlerts(userId?: number, companyId?: number): Promise<FraudAlert[]> {
    if (companyId) return this.db.select().from(fraudAlerts).where(eq(fraudAlerts.companyId, companyId)).orderBy(desc(fraudAlerts.createdAt));
    if (userId) return this.db.select().from(fraudAlerts).where(eq(fraudAlerts.userId, userId)).orderBy(desc(fraudAlerts.createdAt));
    return [];
  }
  async createFraudAlert(data: any): Promise<FraudAlert> {
    const [result] = await this.db.insert(fraudAlerts).values(data).returning();
    return result;
  }
  async updateFraudAlert(id: number, updates: Partial<FraudAlert>): Promise<FraudAlert> {
    const [result] = await this.db.update(fraudAlerts).set(updates).where(eq(fraudAlerts.id, id)).returning();
    return result;
  }

  // ===== THREAT SIMULATIONS =====
  async getThreatSimulations(userId?: number, companyId?: number): Promise<ThreatSimulation[]> {
    if (companyId) return this.db.select().from(threatSimulations).where(eq(threatSimulations.companyId, companyId)).orderBy(desc(threatSimulations.createdAt));
    if (userId) return this.db.select().from(threatSimulations).where(eq(threatSimulations.userId, userId)).orderBy(desc(threatSimulations.createdAt));
    return [];
  }
  async createThreatSimulation(data: any): Promise<ThreatSimulation> {
    const [result] = await this.db.insert(threatSimulations).values(data).returning();
    return result;
  }
  async getThreatSimulation(id: number): Promise<ThreatSimulation | undefined> {
    const [result] = await this.db.select().from(threatSimulations).where(eq(threatSimulations.id, id));
    return result;
  }
  async updateThreatSimulation(id: number, updates: Partial<ThreatSimulation>): Promise<ThreatSimulation> {
    const [result] = await this.db.update(threatSimulations).set(updates).where(eq(threatSimulations.id, id)).returning();
    return result;
  }

  // ===== MARKETPLACE PLUGINS =====
  async getAllPlugins(): Promise<MarketplacePlugin[]> {
    return this.db.select().from(marketplacePlugins).where(eq(marketplacePlugins.isActive, true)).orderBy(desc(marketplacePlugins.installCount));
  }
  async getPlugin(id: number): Promise<MarketplacePlugin | undefined> {
    const [result] = await this.db.select().from(marketplacePlugins).where(eq(marketplacePlugins.id, id));
    return result;
  }
  async getPluginBySlug(slug: string): Promise<MarketplacePlugin | undefined> {
    const [result] = await this.db.select().from(marketplacePlugins).where(eq(marketplacePlugins.slug, slug));
    return result;
  }
  async createPlugin(data: any): Promise<MarketplacePlugin> {
    const [result] = await this.db.insert(marketplacePlugins).values(data).returning();
    return result;
  }
  async getUserInstalledPlugins(userId: number): Promise<InstalledPlugin[]> {
    return this.db.select().from(installedPlugins).where(eq(installedPlugins.userId, userId));
  }
  async installPlugin(data: any): Promise<InstalledPlugin> {
    const [result] = await this.db.insert(installedPlugins).values(data).returning();
    await this.db.update(marketplacePlugins).set({ installCount: sql`install_count + 1` }).where(eq(marketplacePlugins.id, data.pluginId));
    return result;
  }
  async uninstallPlugin(id: number): Promise<void> {
    const [plugin] = await this.db.select().from(installedPlugins).where(eq(installedPlugins.id, id));
    if (plugin) {
      await this.db.delete(installedPlugins).where(eq(installedPlugins.id, id));
      await this.db.update(marketplacePlugins).set({ installCount: sql`GREATEST(install_count - 1, 0)` }).where(eq(marketplacePlugins.id, plugin.pluginId));
    }
  }

  // ===== COMMUNITY =====
  async getCommunityPosts(category?: string, limit = 50): Promise<CommunityPost[]> {
    if (category) {
      return this.db.select().from(communityPosts).where(eq(communityPosts.category, category)).orderBy(desc(communityPosts.createdAt)).limit(limit);
    }
    return this.db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(limit);
  }
  async getCommunityPost(id: number): Promise<CommunityPost | undefined> {
    const [result] = await this.db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return result;
  }
  async createCommunityPost(data: any): Promise<CommunityPost> {
    const [result] = await this.db.insert(communityPosts).values(data).returning();
    return result;
  }
  async updateCommunityPost(id: number, updates: Partial<CommunityPost>): Promise<CommunityPost> {
    const [result] = await this.db.update(communityPosts).set({ ...updates, updatedAt: new Date() }).where(eq(communityPosts.id, id)).returning();
    return result;
  }
  async deleteCommunityPost(id: number): Promise<void> {
    await this.db.delete(communityReplies).where(eq(communityReplies.postId, id));
    await this.db.delete(communityPosts).where(eq(communityPosts.id, id));
  }
  async upvoteCommunityPost(id: number): Promise<void> {
    await this.db.update(communityPosts).set({ upvotes: sql`upvotes + 1` }).where(eq(communityPosts.id, id));
  }
  async getCommunityReplies(postId: number): Promise<CommunityReply[]> {
    return this.db.select().from(communityReplies).where(eq(communityReplies.postId, postId)).orderBy(communityReplies.createdAt);
  }
  async createCommunityReply(data: any): Promise<CommunityReply> {
    const [result] = await this.db.insert(communityReplies).values(data).returning();
    await this.db.update(communityPosts).set({ replyCount: sql`reply_count + 1` }).where(eq(communityPosts.id, data.postId));
    return result;
  }
  async upvoteCommunityReply(id: number): Promise<void> {
    await this.db.update(communityReplies).set({ upvotes: sql`upvotes + 1` }).where(eq(communityReplies.id, id));
  }

  // ===== API KEYS =====
  async getUserApiKeys(userId: number): Promise<ApiKey[]> {
    return this.db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }
  async createApiKey(data: any): Promise<ApiKey> {
    const [result] = await this.db.insert(apiKeys).values(data).returning();
    return result;
  }
  async getApiKeyByHash(hash: string): Promise<ApiKey | undefined> {
    const [result] = await this.db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash));
    return result;
  }
  async updateApiKeyUsage(id: number): Promise<void> {
    await this.db.update(apiKeys).set({ usageCount: sql`usage_count + 1`, lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }
  async deleteApiKey(id: number): Promise<void> {
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // ===== AFFILIATE LINKS =====
  async getUserAffiliateLinks(userId: number): Promise<AffiliateLink[]> {
    return this.db.select().from(affiliateLinks).where(eq(affiliateLinks.userId, userId)).orderBy(desc(affiliateLinks.createdAt));
  }
  async createAffiliateLink(data: any): Promise<AffiliateLink> {
    const [result] = await this.db.insert(affiliateLinks).values(data).returning();
    return result;
  }
  async getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined> {
    const [result] = await this.db.select().from(affiliateLinks).where(eq(affiliateLinks.code, code));
    return result;
  }
  async trackAffiliateClick(code: string): Promise<void> {
    await this.db.update(affiliateLinks).set({ clicks: sql`clicks + 1` }).where(eq(affiliateLinks.code, code));
  }
  async deleteAffiliateLink(id: number): Promise<void> {
    await this.db.delete(affiliateLinks).where(eq(affiliateLinks.id, id));
  }

  // ===== LEARNING TRACKS =====
  async getAllLearningTracks(): Promise<LearningTrack[]> {
    return this.db.select().from(learningTracks).where(eq(learningTracks.isActive, true)).orderBy(learningTracks.category);
  }
  async getLearningTrack(id: number): Promise<LearningTrack | undefined> {
    const [result] = await this.db.select().from(learningTracks).where(eq(learningTracks.id, id));
    return result;
  }
  async createLearningTrack(data: any): Promise<LearningTrack> {
    const [result] = await this.db.insert(learningTracks).values(data).returning();
    return result;
  }
  async getUserLearningProgress(userId: number): Promise<LearningProgressRecord[]> {
    return this.db.select().from(learningProgress).where(eq(learningProgress.userId, userId));
  }
  async getLearningProgressForTrack(userId: number, trackId: number): Promise<LearningProgressRecord | undefined> {
    const [result] = await this.db.select().from(learningProgress)
      .where(and(eq(learningProgress.userId, userId), eq(learningProgress.trackId, trackId)));
    return result;
  }
  async createLearningProgress(data: any): Promise<LearningProgressRecord> {
    const [result] = await this.db.insert(learningProgress).values(data).returning();
    await this.db.update(learningTracks).set({ enrollmentCount: sql`enrollment_count + 1` }).where(eq(learningTracks.id, data.trackId));
    return result;
  }
  async updateLearningProgress(id: number, updates: Partial<LearningProgressRecord>): Promise<LearningProgressRecord> {
    const [result] = await this.db.update(learningProgress).set({ ...updates, lastActivityAt: new Date() }).where(eq(learningProgress.id, id)).returning();
    return result;
  }

  // ===== ADAPTIVE AI PROFILES =====
  async getAdaptiveAiProfile(userId: number): Promise<AdaptiveAiProfile | undefined> {
    const [result] = await this.db.select().from(adaptiveAiProfiles).where(eq(adaptiveAiProfiles.userId, userId));
    return result;
  }
  async upsertAdaptiveAiProfile(userId: number, updates: Partial<AdaptiveAiProfile>): Promise<AdaptiveAiProfile> {
    const existing = await this.getAdaptiveAiProfile(userId);
    if (existing) {
      const [result] = await this.db.update(adaptiveAiProfiles)
        .set({ ...updates, totalInteractions: sql`total_interactions + 1`, lastUpdated: new Date() })
        .where(eq(adaptiveAiProfiles.userId, userId)).returning();
      return result;
    }
    const [result] = await this.db.insert(adaptiveAiProfiles).values({ userId, ...updates, totalInteractions: 1 }).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();