import { pgTable, text, serial, integer, bigint, boolean, timestamp, jsonb, doublePrecision, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SubscriptionTier = {
  FREE: 'free',
  EXPLORER: 'explorer',
  PROFESSIONAL: 'professional',
  ELITE: 'elite',
  ENTERPRISE: 'enterprise',
  BASIC: 'basic',
  PREMIUM: 'premium',
} as const;

export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: 'Explorer',
  explorer: 'Explorer',
  professional: 'Professional',
  elite: 'Elite',
  enterprise: 'Enterprise',
  basic: 'Professional',
  premium: 'Elite',
};

export function isHighTier(tier: string | null | undefined): boolean {
  return tier === 'elite' || tier === 'enterprise' || tier === 'premium';
}

export function isPaidTier(tier: string | null | undefined): boolean {
  return !!tier && tier !== 'free' && tier !== 'explorer';
}

export function normalizeTier(tier: string | null | undefined): 'free' | 'professional' | 'elite' | 'enterprise' {
  if (!tier) return 'free';
  const t = tier.toLowerCase();
  if (t === 'basic') return 'professional';
  if (t === 'premium') return 'elite';
  if (t === 'explorer') return 'free';
  if (t === 'professional' || t === 'elite' || t === 'enterprise') return t;
  return 'free';
}

// Add verification status enum
export const VerificationStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
} as const;

export type VerificationStatus = typeof VerificationStatus[keyof typeof VerificationStatus];

// Add new enums for company status and service types
export const CompanyVerificationStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
} as const;

export type CompanyVerificationStatus = typeof CompanyVerificationStatus[keyof typeof CompanyVerificationStatus];

export const ServiceType = {
  FINANCIAL_CONSULTING: 'financial_consulting',
  INVESTMENT_MANAGEMENT: 'investment_management',
  LEGAL_ADVISORY: 'legal_advisory',
  TAX_PLANNING: 'tax_planning',
  BUSINESS_STRATEGY: 'business_strategy',
  RISK_MANAGEMENT: 'risk_management',
  CONSULTING: 'consulting',
  DEVELOPMENT: 'development',
  DESIGN: 'design',
  MARKETING: 'marketing',
  TRAINING: 'training',
  SUPPORT: 'support',
  OTHER: 'other',
  CUSTOM: 'custom'
} as const;

export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

// Personal Finance Management Tables
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  totalAmount: integer("total_amount").notNull(), // in cents
  period: text("period").notNull(), // 'monthly', 'weekly', 'yearly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  categories: jsonb("categories").notNull(), // Array of category allocations
  status: text("status").notNull().default('active'), // 'active', 'completed', 'paused'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  name: text("name").notNull(),
  allocatedAmount: integer("allocated_amount").notNull(), // in cents
  spentAmount: integer("spent_amount").notNull().default(0), // in cents
  color: text("color").default('#3B82F6'),
  icon: text("icon").default('💰'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  budgetId: integer("budget_id"),
  categoryId: integer("category_id"),
  amount: integer("amount").notNull(), // in cents, negative for expenses
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // 'income', 'expense', 'transfer'
  tags: jsonb("tags"), // Array of strings
  recurring: boolean("recurring").default(false),
  recurringPattern: jsonb("recurring_pattern"), // {frequency, interval, endDate}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: integer("target_amount").notNull(), // in cents
  currentAmount: integer("current_amount").notNull().default(0), // in cents
  targetDate: timestamp("target_date"),
  description: text("description"),
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high'
  category: text("category").notNull(), // 'emergency', 'vacation', 'house', 'car', 'retirement', 'other'
  autoSaveAmount: integer("auto_save_amount").default(0), // in cents
  autoSaveFrequency: text("auto_save_frequency"), // 'daily', 'weekly', 'monthly'
  status: text("status").notNull().default('active'), // 'active', 'completed', 'paused'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financialInsights = pgTable("financial_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  insightType: text("insight_type").notNull(), // 'spending_pattern', 'budget_alert', 'savings_opportunity', 'bill_reminder'
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionable: boolean("actionable").default(true),
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high'
  category: text("category"), // Related budget category
  amount: integer("amount"), // Relevant amount in cents
  metadata: jsonb("metadata"), // Additional context data
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add badge types for company verification
export const BadgeType = {
  VERIFIED_COMPANY: 'verified_company',
  PREMIUM_PARTNER: 'premium_partner',
  CERTIFIED_PROVIDER: 'certified_provider',
  EXCELLENCE_AWARD: 'excellence_award',
  INDUSTRY_EXPERT: 'industry_expert',
  CLIENT_CHAMPION: 'client_champion',
  INNOVATION_LEADER: 'innovation_leader',
  QUALITY_ASSURED: 'quality_assured'
} as const;

export type BadgeType = typeof BadgeType[keyof typeof BadgeType];

// Add credential types
export const CredentialType = {
  CERTIFICATION: 'certification',
  LICENSE: 'license',
  DEGREE: 'degree',
  PROFESSIONAL_MEMBERSHIP: 'professional_membership',
  AWARD: 'award',
  ACCREDITATION: 'accreditation',
  TRAINING_COMPLETION: 'training_completion'
} as const;

export type CredentialType = typeof CredentialType[keyof typeof CredentialType];

// Add case study status
export const CaseStudyStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published'
} as const;

export type CaseStudyStatus = typeof CaseStudyStatus[keyof typeof CaseStudyStatus];

export const PricingModel = {
  FIXED: 'fixed',
  HOURLY: 'hourly',
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  SUBSCRIPTION: 'subscription',
  CUSTOM: 'custom'
} as const;

export type PricingModel = typeof PricingModel[keyof typeof PricingModel];

// Update users table to include LinkedIn and verification fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  skills: text("skills").array().notNull(),
  assets: text("assets").array().notNull(),
  linkedinProfile: text("linkedin_profile"),
  linkedinVerified: boolean("linkedin_verified").default(false),
  skillsVerified: boolean("skills_verified").default(false),
  trialStartedAt: integer("trial_started_at"),
  isPremium: boolean("is_premium").default(false),
  subscriptionTier: text("subscription_tier").default(SubscriptionTier.FREE),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  pendingSubscriptionTier: text("pending_subscription_tier"),
  pendingSubscriptionId: text("pending_subscription_id"),
  preferredLanguage: text("preferred_language").default("en"),
  preferredCurrency: text("preferred_currency").default("USD"),
  preferredRegion: text("preferred_region"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  isAdmin: boolean("is_admin").default(false),
  isSuspended: boolean("is_suspended").default(false),
});

// Add work history table
export const workHistory = pgTable("work_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  position: text("position").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description").notNull(),
  verificationStatus: text("verification_status").default(VerificationStatus.PENDING),
  verifiedAt: timestamp("verified_at"),
  verificationProof: text("verification_proof"),
  currentlyWorking: boolean("currently_working").default(false),
});

// Update references table name to reference_checks
export const referenceChecks = pgTable("reference_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  workHistoryId: integer("work_history_id").references(() => workHistory.id),
  referentName: text("referent_name").notNull(),
  referentPosition: text("referent_position").notNull(),
  referentEmail: text("referent_email").notNull(),
  referentPhone: text("referent_phone"),
  relationshipType: text("relationship_type").notNull(),
  verificationStatus: text("verification_status").default(VerificationStatus.PENDING),
  verifiedAt: timestamp("verified_at"),
  feedback: text("feedback"),
});

// Add certificates table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  issuingAuthority: text("issuing_authority").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  certificateUrl: text("certificate_url"),
  verificationId: text("verification_id"),
  verificationStatus: text("verification_status").default(VerificationStatus.PENDING),
  verifiedAt: timestamp("verified_at"),
  metadata: jsonb("metadata"),
});

// Add projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  projectUrl: text("project_url"),
  repositoryUrl: text("repository_url"),
  technologies: text("technologies").array(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  verificationStatus: text("verification_status").default(VerificationStatus.PENDING),
  verifiedAt: timestamp("verified_at"),
  demoUrl: text("demo_url"),
  screenshots: text("screenshots").array(),
  metadata: jsonb("metadata"),
});

// Update companies table definition to include password
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  password: text("password").notNull(), // Add password field
  businessLicense: text("business_license"),
  taxId: text("tax_id"),
  website: text("website"),
  logo: text("logo"),
  profileVideo: text("profile_video"),  // New field for premium company profile video
  verificationStatus: text("verification_status").default(CompanyVerificationStatus.PENDING),
  verifiedAt: timestamp("verified_at"),
  foundedYear: integer("founded_year"),
  employeeCount: integer("employee_count"),
  headquarters: text("headquarters"),
  primaryContact: text("primary_contact").notNull(),
  primaryContactEmail: text("primary_contact_email").notNull(),
  primaryContactPhone: text("primary_contact_phone"),
  industries: text("industries").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  averageRating: integer("average_rating"),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  subscriptionTier: text("subscription_tier").default(SubscriptionTier.FREE),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  pendingSubscriptionTier: text("pending_subscription_tier"),  // For storing pending subscription change
  pendingSubscriptionId: text("pending_subscription_id"),      // For storing Stripe session ID
  monthlyOpportunityLimit: integer("monthly_opportunity_limit").default(5),  // Basic plan: 5 requests/month
  currentMonthOpportunities: integer("current_month_opportunities").default(0),
  lastOpportunityResetDate: timestamp("last_opportunity_reset_date"),
  // Basic company plan limits
  serviceLimit: integer("service_limit").default(3),  // Basic plan: 3 services
  monthlyReportLimit: integer("monthly_report_limit").default(1), // Basic plan: 1 report/month
  currentMonthReports: integer("current_month_reports").default(0),
  lastReportResetDate: timestamp("last_report_reset_date"),
  dailyAIEmailLimit: integer("daily_ai_email_limit").default(2), // Basic plan: 2 emails/day
  currentDayAIEmails: integer("current_day_ai_emails").default(0),
  lastAIEmailResetDate: timestamp("last_ai_email_reset_date"),
  isPremium: boolean("is_premium").default(false), // Shorthand for subscriptionTier === 'premium'
});

// Add company services table
export const companyServices = pgTable("company_services", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull(),  // Changed from 'type' to 'serviceType'
  pricingModel: text("pricing_model").notNull(),
  priceAmount: integer("price_amount").default(0),  // Renamed from basePrice
  priceUnit: text("price_unit"),  // Added for "per hour", "per project", etc.
  leadTime: text("lead_time"),  // Added for delivery timeframe
  availability: text("availability"),  // Added for service availability
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Add company reviews table
export const companyReviews = pgTable("company_reviews", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  serviceId: integer("service_id").references(() => companyServices.id),
  verifiedPurchase: boolean("verified_purchase").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Add company members table for multi-user access
export const companyMembers = pgTable("company_members", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // admin, manager, staff
  permissions: text("permissions").array(),
  invitedBy: integer("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active"),
  isActive: boolean("is_active").default(true),
});

// Add business directory listings table
export const directories = pgTable("directories", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull().unique(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  industry: text("industry").notNull(),
  website: text("website"),
  location: text("location").notNull(),
  phone: text("phone"),
  publicEmail: text("public_email"),
  featuredHighlight: boolean("featured_highlight").default(true),
  showContactInfo: boolean("show_contact_info").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  searchVector: text("search_vector"), // For full-text search capabilities
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

// Investment Strategist tables for premium users
export const userInvestmentProfiles = pgTable("user_investment_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riskTolerance: text("risk_tolerance").notNull(), // conservative, moderate, aggressive
  investmentHorizon: integer("investment_horizon").notNull(), // years
  monthlyInvestmentCapacity: integer("monthly_investment_capacity").notNull(),
  currentAge: integer("current_age").notNull(),
  retirementAge: integer("retirement_age").notNull().default(65),
  totalAssets: integer("total_assets").notNull().default(0),
  monthlyIncome: integer("monthly_income").notNull(),
  hasEmergencyFund: boolean("has_emergency_fund").notNull().default(false),
  investmentExperience: text("investment_experience").notNull(), // beginner, intermediate, advanced
  investmentGoals: jsonb("investment_goals").notNull().default('[]'), // array of goals
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const investmentAnalyses = pgTable("investment_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => userInvestmentProfiles.id),
  riskProfile: text("risk_profile").notNull(),
  recommendedAllocation: jsonb("recommended_allocation").notNull(),
  specificInvestments: jsonb("specific_investments").notNull(),
  marketOpportunities: jsonb("market_opportunities").notNull(),
  portfolioOptimization: jsonb("portfolio_optimization").notNull(),
  monthlyInvestmentPlan: jsonb("monthly_investment_plan").notNull(),
  aiInsights: jsonb("ai_insights").notNull(),
  nextSteps: jsonb("next_steps").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const userPortfolioHoldings = pgTable("user_portfolio_holdings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ETF, Stock, Bond, REIT, etc.
  shares: integer("shares").notNull(),
  averageCost: integer("average_cost").notNull(),
  currentValue: integer("current_value"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  addedAt: timestamp("added_at").defaultNow()
});

// Team financial health monitoring tables
export const financialTeams = pgTable("financial_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  teamType: text("team_type").notNull(), // 'startup', 'small_business', 'department', 'family'
  industry: text("industry"),
  monthlyBudget: bigint("monthly_budget", { mode: "number" }), // in cents
  goals: jsonb("goals").$type<string[]>().default([]),
  settings: jsonb("settings").$type<{
    currency: string;
    timezone: string;
    notifications: boolean;
    shareLevel: 'basic' | 'detailed' | 'full';
  }>().default({
    currency: 'USD',
    timezone: 'UTC',
    notifications: true,
    shareLevel: 'basic'
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => financialTeams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'owner', 'admin', 'member', 'viewer'
  permissions: jsonb("permissions").$type<string[]>().default([]),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true)
});

export const teamFinancialMetrics = pgTable("team_financial_metrics", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => financialTeams.id),
  userId: integer("user_id").references(() => users.id), // null for aggregated team metrics
  metricType: text("metric_type").notNull(), // 'income', 'expenses', 'savings', 'debt', 'emergency_fund'
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default('USD'),
  category: text("category"), // 'housing', 'food', 'transportation', etc.
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  frequency: text("frequency"), // 'weekly', 'monthly', 'quarterly', 'yearly'
  recordedAt: timestamp("recorded_at").defaultNow(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull()
});

export const teamFinancialInsights = pgTable("team_financial_insights", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => financialTeams.id),
  insightType: text("insight_type").notNull(), // 'budget_alert', 'savings_opportunity', 'spending_pattern', 'goal_progress'
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // 'low', 'medium', 'high', 'critical'
  actionItems: jsonb("action_items").$type<string[]>().default([]),
  metrics: jsonb("metrics").$type<{
    current: number;
    target?: number;
    trend: 'up' | 'down' | 'stable';
    changePercent?: number;
  }>(),
  isRead: boolean("is_read").default(false),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow()
});

// Add business locations table for the interactive map
export const businessLocations = pgTable("business_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // company, opportunity, funding, etc.
  entityId: integer("entity_id").notNull(), // ID of the related entity (company, opportunity, etc.)
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  industry: text("industry"),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Market reports table for company reports functionality
export const marketReports = pgTable("market_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  industry: text("industry"),
  regions: jsonb("regions").$type<string[]>().default([]),
  timeframe: text("timeframe").default("12months"),
  reportData: jsonb("report_data").$type<{
    marketSize: Record<string, { size: string; growth: string }>;
    investmentActivity: Record<string, { deals: number; amount: string }>;
    competitorDensity: Record<string, string>;
    insights?: string[];
    recommendations?: string[];
  }>(),
  status: text("status").default("completed"), // completed, processing, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Market reports insert schema
export const insertMarketReportSchema = createInsertSchema(marketReports)
  .omit({ id: true, companyId: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(5, "Report title must be at least 5 characters"),
    industry: z.string().optional(),
    regions: z.array(z.string()).default(["Global"]),
    timeframe: z.enum(["6months", "12months", "24months"]).default("12months"),
  });

// Team financial monitoring insert schemas
export const insertFinancialTeamSchema = createInsertSchema(financialTeams)
  .extend({
    name: z.string().min(2, "Team name must be at least 2 characters"),
    teamType: z.enum(['startup', 'small_business', 'department', 'family']),
    monthlyBudget: z.number().positive().optional(),
    goals: z.array(z.string()).optional(),
  });

export const insertTeamMemberSchema = createInsertSchema(teamMembers)
  .extend({
    role: z.enum(['owner', 'admin', 'member', 'viewer']),
    permissions: z.array(z.string()).optional(),
  });

export const insertTeamFinancialMetricSchema = createInsertSchema(teamFinancialMetrics)
  .extend({
    metricType: z.enum(['income', 'expenses', 'savings', 'debt', 'emergency_fund']),
    amount: z.number().int(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    periodStart: z.date(),
    periodEnd: z.date(),
  });

export const insertTeamFinancialInsightSchema = createInsertSchema(teamFinancialInsights)
  .extend({
    insightType: z.enum(['budget_alert', 'savings_opportunity', 'spending_pattern', 'goal_progress']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    actionItems: z.array(z.string()).optional(),
  });

// Create insert schemas for new tables
export const insertWorkHistorySchema = createInsertSchema(workHistory)
  .extend({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    verificationStatus: z.enum([VerificationStatus.PENDING, VerificationStatus.VERIFIED, VerificationStatus.REJECTED]).optional(),
    verificationProof: z.string().url().optional().or(z.literal("")).or(z.null()).optional(),
  });

// Update the insert schema
export const insertReferenceCheckSchema = createInsertSchema(referenceChecks)
  .omit({ id: true, userId: true, workHistoryId: true, verificationStatus: true, verifiedAt: true, feedback: true })
  .extend({
    referentName: z.string().min(1, "Reference name is required"),
    referentPosition: z.string().min(1, "Reference position is required"),
    referentEmail: z.string().email("Please enter a valid email address"),
    referentPhone: z.string().optional(),
    relationshipType: z.enum(['manager', 'colleague', 'client', 'other']),
  });

export const insertCertificateSchema = createInsertSchema(certificates)
  .omit({ id: true, userId: true, verificationStatus: true, verifiedAt: true, metadata: true })
  .extend({
    name: z.string().min(1, "Certificate name is required"),
    issuingAuthority: z.string().min(1, "Issuing authority is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().optional(),
    verificationId: z.string().optional(),
  });

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, userId: true, verificationStatus: true, verifiedAt: true, metadata: true })
  .extend({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(1, "Project description is required"),
    projectUrl: z.string().url().optional().or(z.literal("")),
    repositoryUrl: z.string().url().optional().or(z.literal("")),
    technologies: z.array(z.string()).default([]),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    demoUrl: z.string().url().optional().or(z.literal("")),
    screenshots: z.array(z.string().url()).optional().default([]),
  });

// Modify the company registration schema section
export const insertCompanySchema = createInsertSchema(companies)
  .extend({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    businessLicense: z.string().optional(),
    taxId: z.string().optional(),
    website: z.string().url().optional(),
    logo: z.string().url().optional(),
    profileVideo: z.string().url().optional(),
    verificationStatus: z.enum([
      CompanyVerificationStatus.PENDING,
      CompanyVerificationStatus.VERIFIED,
      CompanyVerificationStatus.REJECTED
    ]).optional(),
    industries: z.union([
      z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean)),
      z.array(z.string())
    ]).transform(val => Array.isArray(val) ? val : [val]),
    primaryContactEmail: z.string().email("Invalid email format"),
  });

// Personal Finance Type Definitions and Schemas
export const insertBudgetSchema = createInsertSchema(budgets)
  .extend({
    totalAmount: z.number().positive(),
    period: z.enum(['monthly', 'weekly', 'yearly']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['active', 'completed', 'paused']).optional(),
  });

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories)
  .extend({
    allocatedAmount: z.number().positive(),
    spentAmount: z.number().nonnegative().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .extend({
    amount: z.number().int(),
    date: z.string().datetime(),
    type: z.enum(['income', 'expense', 'transfer']),
    tags: z.array(z.string()).optional(),
  });

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals)
  .extend({
    targetAmount: z.number().positive(),
    currentAmount: z.number().nonnegative().optional(),
    targetDate: z.string().datetime().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    category: z.enum(['emergency', 'vacation', 'house', 'car', 'retirement', 'other']),
    autoSaveAmount: z.number().nonnegative().optional(),
    autoSaveFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    status: z.enum(['active', 'completed', 'paused']).optional(),
  });

export const insertFinancialInsightSchema = createInsertSchema(financialInsights)
  .extend({
    insightType: z.enum(['spending_pattern', 'budget_alert', 'savings_opportunity', 'bill_reminder']),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    amount: z.number().optional(),
  });

// Type exports for Personal Finance
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type FinancialInsight = typeof financialInsights.$inferSelect;
export type InsertFinancialInsight = z.infer<typeof insertFinancialInsightSchema>;

export const insertCompanyServiceSchema = createInsertSchema(companyServices)
  .extend({
    name: z.string().min(3, "Service name must be at least 3 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]]),
    pricingModel: z.enum(Object.values(PricingModel) as [string, ...string[]]),
    priceAmount: z.number().min(0).optional(),
    priceUnit: z.string().optional(),
    leadTime: z.string().optional(),
    availability: z.string().optional(),
    features: z.array(z.string()).optional(),
  });

export const insertCompanyReviewSchema = createInsertSchema(companyReviews)
  .extend({
    rating: z.number().min(1).max(5),
    review: z.string().min(10, "Review must be at least 10 characters").optional(),
  });

export const insertCompanyMemberSchema = createInsertSchema(companyMembers)
  .extend({
    role: z.enum(['admin', 'manager', 'staff']),
    permissions: z.array(z.string()),
  });

// Create insert schema for directory listings
export const insertDirectorySchema = createInsertSchema(directories)
  .extend({
    displayName: z.string().min(3, "Business name must be at least 3 characters"),
    tagline: z.string().max(100, "Tagline must be 100 characters or less"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    industry: z.string().min(1, "Please select an industry"),
    website: z.string().url("Please enter a valid URL").or(z.string().length(0)),
    location: z.string().min(3, "Please enter your business location"),
    phone: z.string().optional(),
    publicEmail: z.string().email("Please enter a valid email").optional(),
    featuredHighlight: z.boolean().default(true),
    showContactInfo: z.boolean().default(true),
  });

// Export types for all new tables
export type WorkHistory = typeof workHistory.$inferSelect;
export type InsertWorkHistory = z.infer<typeof insertWorkHistorySchema>;
export type ReferenceCheck = typeof referenceChecks.$inferSelect;
export type InsertReferenceCheck = z.infer<typeof insertReferenceCheckSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyService = typeof companyServices.$inferSelect;
export type InsertCompanyService = z.infer<typeof insertCompanyServiceSchema>;
export type CompanyReview = typeof companyReviews.$inferSelect;
export type InsertCompanyReview = z.infer<typeof insertCompanyReviewSchema>;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
// Create insert schema for business locations
export const insertBusinessLocationSchema = createInsertSchema(businessLocations)
  .extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.string().min(2, "Type must be at least 2 characters"),
    entityId: z.number().int().positive("Entity ID must be a positive number"),
    latitude: z.string().min(1, "Latitude is required"),
    longitude: z.string().min(1, "Longitude is required"),
    country: z.string().min(2, "Country is required"),
    city: z.string().min(2, "City is required"),
    address: z.string().optional(),
    industry: z.string().optional(),
    description: z.string().optional(),
    logo: z.string().optional(),
    website: z.string().optional(),
    contactEmail: z.string().email("Invalid email format").optional(),
    contactPhone: z.string().optional(),
    isPremium: z.boolean().default(false),
  });

export type Directory = typeof directories.$inferSelect;
export type InsertDirectory = z.infer<typeof insertDirectorySchema>;
export type BusinessLocation = typeof businessLocations.$inferSelect;
export type InsertBusinessLocation = z.infer<typeof insertBusinessLocationSchema>;

// Team financial monitoring types
export type FinancialTeam = typeof financialTeams.$inferSelect;
export type InsertFinancialTeam = z.infer<typeof insertFinancialTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamFinancialMetric = typeof teamFinancialMetrics.$inferSelect;
export type InsertTeamFinancialMetric = z.infer<typeof insertTeamFinancialMetricSchema>;
export type TeamFinancialInsight = typeof teamFinancialInsights.$inferSelect;
export type InsertTeamFinancialInsight = z.infer<typeof insertTeamFinancialInsightSchema>;

// Keep existing exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type SmartContract = typeof smartContracts.$inferSelect;
export type InsertSmartContract = z.infer<typeof insertSmartContractSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type FundingOpportunity = typeof fundingOpportunities.$inferSelect;
export type InsertFundingOpportunity = z.infer<typeof insertFundingOpportunitySchema>;

// Lead data model (not stored in database for now)
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  source: string;
  contactAttempts: number;
  status: 'new' | 'contacted' | 'qualified' | 'not-qualified' | 'converted';
  notes: string;
  url: string;
  lastContacted: Date | null;
  verifiedSource: boolean;  // Indicates if the contact comes from a verified API source
}

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  earnings: integer("earnings").notNull(),
  status: text("status").notNull().default("available"),
  userId: integer("user_id").references(() => users.id),
  externalId: text("external_id"),
  source: text("source"),
  url: text("url"),
  location: text("location"),
  company: text("company"),
  lastSynced: timestamp("last_synced"),
  clientEmail: text("client_email"),
  clientSubmitted: boolean("client_submitted").default(false),
  matchScore: integer("match_score"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const smartContracts = pgTable("smart_contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  creator_id: integer("creator_id").references(() => users.id),
  counterparty_id: integer("counterparty_id").references(() => users.id),
  status: text("status").notNull().default("draft"),
  terms: jsonb("terms").notNull(),
  validation_rules: jsonb("validation_rules").notNull(),
  execution_conditions: jsonb("execution_conditions").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  expires_at: timestamp("expires_at"),
  last_executed_at: timestamp("last_executed_at"),
  metadata: jsonb("metadata")
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  type: text("type").notNull().default("location"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata")
});

export const fundingOpportunities = pgTable("funding_opportunities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  provider: text("provider").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  sector: text("sector").notNull(),
  eligibilityCriteria: jsonb("eligibility_criteria").notNull(),
  applicationDeadline: timestamp("application_deadline"),
  region: text("region"),
  country: text("country").notNull().default('Global'), // Ensure country is required with default
  applicationUrl: text("application_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSynced: timestamp("last_synced"),
  requirementScore: integer("requirement_score"),
  matchScore: integer("match_score"),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    email: true,
    skills: true,
    assets: true,
    preferredLanguage: true,
    preferredCurrency: true,
    preferredRegion: true,
    latitude: true,
    longitude: true,
    subscriptionTier: true,
    subscriptionStartDate: true,
    subscriptionEndDate: true,
    pendingSubscriptionTier: true,
    pendingSubscriptionId: true,
    linkedinProfile: true,
    linkedinVerified: true,
    skillsVerified: true
  })
  .extend({
    email: z.string().email(),
    skills: z.array(z.string()).min(1),
    assets: z.array(z.string()).min(1),
    preferredLanguage: z.string().default("en"),
    preferredCurrency: z.string().default("USD"),
    preferredRegion: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    subscriptionTier: z.enum([SubscriptionTier.FREE, SubscriptionTier.EXPLORER, SubscriptionTier.PROFESSIONAL, SubscriptionTier.ELITE, SubscriptionTier.ENTERPRISE, SubscriptionTier.BASIC, SubscriptionTier.PREMIUM]).optional(),
    subscriptionStartDate: z.string().datetime().optional(),
    subscriptionEndDate: z.string().datetime().optional(),
    pendingSubscriptionTier: z.enum([SubscriptionTier.FREE, SubscriptionTier.EXPLORER, SubscriptionTier.PROFESSIONAL, SubscriptionTier.ELITE, SubscriptionTier.ENTERPRISE, SubscriptionTier.BASIC, SubscriptionTier.PREMIUM]).nullable().optional(),
    pendingSubscriptionId: z.string().nullable().optional(),
    linkedinProfile: z.string().url().optional(),
    linkedinVerified: z.boolean().optional(),
    skillsVerified: z.boolean().optional()
  });

export const insertOpportunitySchema = createInsertSchema(opportunities)
  .pick({
    name: true,
    description: true,
    earnings: true,
    url: true,
    location: true,
    company: true,
    source: true,
    clientEmail: true,
    latitude: true,
    longitude: true,
  })
  .extend({
    name: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    earnings: z.number().min(1, "Earnings must be greater than 0"),
    url: z.string().url("Invalid URL format").optional(),
    location: z.string().min(2, "Location must be at least 2 characters").optional(),
    company: z.string().min(2, "Company name must be at least 2 characters").optional(),
    source: z.string().optional(),
    clientEmail: z.string().email("Invalid email format").optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional()
  });

export const insertSmartContractSchema = createInsertSchema(smartContracts)
  .pick({
    name: true,
    description: true,
    counterparty_id: true,
    terms: true
  })
  .extend({
    name: z.string().min(3, "Contract name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    counterparty_id: z.number().int().positive("Counterparty ID must be a positive number"),
    terms: z.object({
      agreement: z.string().min(1, "Agreement terms are required"),
      conditions: z.array(z.string()).default([]),
      compensation: z.object({
        amount: z.number().min(0),
        currency: z.string(),
        paymentSchedule: z.string()
      })
    })
  });

export const insertBookmarkSchema = createInsertSchema(bookmarks)
  .pick({
    name: true,
    description: true,
    latitude: true,
    longitude: true,
    type: true,
    metadata: true
  })
  .extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
    latitude: z.string().min(1, "Latitude is required"),
    longitude: z.string().min(1, "Longitude is required"),
    type: z.enum(["location", "opportunity", "business"]),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  });

export const insertFundingOpportunitySchema = createInsertSchema(fundingOpportunities)
  .pick({
    name: true,
    description: true,
    provider: true,
    amount: true,
    type: true,
    sector: true,
    eligibilityCriteria: true,
    applicationDeadline: true,
    region: true,
    country: true,
    applicationUrl: true,
  })
  .extend({
    name: z.string().min(5, "Name must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    amount: z.number().min(1, "Amount must be greater than 0"),
    type: z.enum(["grant", "venture_capital", "government_funding"]),
    sector: z.string().min(2, "Sector must be at least 2 characters"),
    eligibilityCriteria: z.object({
      businessType: z.array(z.string()),
      minRevenue: z.number().optional(),
      maxRevenue: z.number().optional(),
      yearsInBusiness: z.number().optional(),
      requiredDocuments: z.array(z.string()),
      location: z.array(z.string()).optional(),
    }),
    applicationDeadline: z.string().datetime().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    applicationUrl: z.string().url("Invalid URL format").optional(),
  });

// Company Verification Badges Table
export const companyBadges = pgTable("company_badges", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  badgeType: text("badge_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  awardedDate: timestamp("awarded_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  verificationId: text("verification_id").unique(),
  badgeUrl: text("badge_url"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
});

// Company Case Studies Table
export const companyCaseStudies = pgTable("company_case_studies", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientName: text("client_name"),
  industry: text("industry"),
  projectDuration: text("project_duration"),
  budget: integer("budget"),
  results: text("results").notNull(),
  technologies: text("technologies").array(),
  challenges: text("challenges"),
  solution: text("solution").notNull(),
  testimonial: text("testimonial"),
  status: text("status").notNull().default('draft'),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  publishedAt: timestamp("published_at"),
  attachments: jsonb("attachments"),
  metrics: jsonb("metrics"),
});

// Company Credentials Table
export const companyCredentials = pgTable("company_credentials", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  credentialType: text("credential_type").notNull(),
  title: text("title").notNull(),
  issuingOrganization: text("issuing_organization").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  credentialId: text("credential_id"),
  verificationUrl: text("verification_url"),
  description: text("description"),
  status: text("status").notNull().default('pending'),
  documentUrl: text("document_url"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by"),
  metadata: jsonb("metadata"),
});

// Verification Requests Table
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  requestType: text("request_type").notNull(), // 'badge', 'credential', 'case_study'
  targetId: integer("target_id").notNull(), // ID of the item being verified
  submittedBy: integer("submitted_by").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  status: text("status").notNull().default('pending'),
  reviewNotes: text("review_notes"),
  supportingDocuments: jsonb("supporting_documents"),
});

// Types and schemas for verification system
export type CompanyBadge = typeof companyBadges.$inferSelect;
export type InsertCompanyBadge = typeof companyBadges.$inferInsert;
export const insertCompanyBadgeSchema = createInsertSchema(companyBadges);

export type CompanyCaseStudy = typeof companyCaseStudies.$inferSelect;
export type InsertCompanyCaseStudy = typeof companyCaseStudies.$inferInsert;
export const insertCompanyCaseStudySchema = createInsertSchema(companyCaseStudies);

export type CompanyCredential = typeof companyCredentials.$inferSelect;
export type InsertCompanyCredential = typeof companyCredentials.$inferInsert;
export const insertCompanyCredentialSchema = createInsertSchema(companyCredentials);

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;
export const insertVerificationRequestSchema = createInsertSchema(verificationRequests);

// ===== CHATBOT SYSTEM =====

export const chatbotPresets = pgTable("chatbot_presets", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").default('general'),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatbotInteractions = pgTable("chatbot_interactions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  message: text("message").notNull(),
  response: text("response").notNull(),
  matchedPresetId: integer("matched_preset_id"),
  satisfaction: text("satisfaction"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChatbotPreset = typeof chatbotPresets.$inferSelect;
export type InsertChatbotPreset = typeof chatbotPresets.$inferInsert;
export const insertChatbotPresetSchema = createInsertSchema(chatbotPresets)
  .extend({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    category: z.string().optional(),
  })
  .omit({ id: true, createdAt: true });

export type ChatbotInteraction = typeof chatbotInteractions.$inferSelect;
export type InsertChatbotInteraction = typeof chatbotInteractions.$inferInsert;
export const insertChatbotInteractionSchema = createInsertSchema(chatbotInteractions)
  .omit({ id: true, createdAt: true });

// ===== CLIENT REQUESTS / BOOKING =====

export const clientRequests = pgTable("client_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  serviceType: text("service_type"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  budget: text("budget"),
  timeline: text("timeline"),
  status: text("status").notNull().default('pending'),
  companyResponse: text("company_response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ClientRequest = typeof clientRequests.$inferSelect;
export type InsertClientRequest = typeof clientRequests.$inferInsert;
export const insertClientRequestSchema = createInsertSchema(clientRequests)
  .extend({
    clientName: z.string().min(2, "Name must be at least 2 characters"),
    clientEmail: z.string().email("Valid email is required"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
  })
  .omit({ id: true, createdAt: true, respondedAt: true, companyResponse: true, status: true });

// ===== COMPANY ANALYTICS =====

export const companyAnalytics = pgTable("company_analytics", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  visitorId: text("visitor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CompanyAnalytic = typeof companyAnalytics.$inferSelect;
export type InsertCompanyAnalytic = typeof companyAnalytics.$inferInsert;
export const insertCompanyAnalyticSchema = createInsertSchema(companyAnalytics)
  .omit({ id: true, createdAt: true });

// ===== EMPLOYEE VERIFICATIONS =====

export const employeeVerifications = pgTable("employee_verifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  employeeName: text("employee_name").notNull(),
  employeeRole: text("employee_role").notNull(),
  skills: text("skills").array(),
  licenseType: text("license_type"),
  licenseNumber: text("license_number"),
  issuingAuthority: text("issuing_authority"),
  documentUrl: text("document_url"),
  status: text("status").notNull().default('pending'),
  verifiedAt: timestamp("verified_at"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmployeeVerification = typeof employeeVerifications.$inferSelect;
export type InsertEmployeeVerification = typeof employeeVerifications.$inferInsert;
export const insertEmployeeVerificationSchema = createInsertSchema(employeeVerifications)
  .extend({
    employeeName: z.string().min(2, "Name must be at least 2 characters"),
    employeeRole: z.string().min(2, "Role must be at least 2 characters"),
    skills: z.array(z.string()).optional(),
  })
  .omit({ id: true, createdAt: true, verifiedAt: true, status: true });

// ===== NOTIFICATIONS =====

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  type: text("type").notNull().default("system"), // 'lead', 'client_request', 'funding', 'system', 'verification'
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true });

// ===== USER ENDORSEMENTS =====

export const endorsements = pgTable("endorsements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endorserId: integer("endorser_id").references(() => users.id).notNull(),
  skill: text("skill").notNull(),
  message: text("message"),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Endorsement = typeof endorsements.$inferSelect;
export type InsertEndorsement = typeof endorsements.$inferInsert;
export const insertEndorsementSchema = createInsertSchema(endorsements)
  .omit({ id: true, createdAt: true })
  .extend({
    skill: z.string().min(1, "Skill is required"),
    rating: z.number().min(1).max(5).optional(),
  });

// ===== USER PORTFOLIO ITEMS =====

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull(),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(2, "Title is required"),
    itemType: z.enum(["report", "deck", "model", "article", "other"]),
    tags: z.array(z.string()).optional(),
  });

// ===== CLIENT/DEAL FEEDBACK =====

export const clientFeedback = pgTable("client_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  projectName: text("project_name").notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ClientFeedback = typeof clientFeedback.$inferSelect;
export type InsertClientFeedback = typeof clientFeedback.$inferInsert;
export const insertClientFeedbackSchema = createInsertSchema(clientFeedback)
  .omit({ id: true, createdAt: true })
  .extend({
    projectName: z.string().min(2),
    rating: z.number().min(1).max(5),
  });

// ===== AI CONVERSATION HISTORY (Phase 4 - Smart Memory) =====

export const conversationHistory = pgTable("conversation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  agentType: text("agent_type").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ConversationHistory = typeof conversationHistory.$inferSelect;
export type InsertConversationHistory = typeof conversationHistory.$inferInsert;
export const insertConversationHistorySchema = createInsertSchema(conversationHistory)
  .omit({ id: true, createdAt: true });

// ===== COMPLIANCE REPORTS (Phase 6) =====

export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  findings: jsonb("findings"),
  riskLevel: text("risk_level").notNull().default("low"),
  status: text("status").notNull().default("draft"),
  generatedBy: text("generated_by").default("ai"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = typeof complianceReports.$inferInsert;
export const insertComplianceReportSchema = createInsertSchema(complianceReports)
  .omit({ id: true, createdAt: true, reviewedAt: true });

// ===== STRATEGY BRIEFS (Phase 6) =====

export const strategyBriefs = pgTable("strategy_briefs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  marketAnalysis: jsonb("market_analysis"),
  recommendations: jsonb("recommendations"),
  riskAssessment: jsonb("risk_assessment"),
  financialProjections: jsonb("financial_projections"),
  timeline: jsonb("timeline"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type StrategyBrief = typeof strategyBriefs.$inferSelect;
export type InsertStrategyBrief = typeof strategyBriefs.$inferInsert;
export const insertStrategyBriefSchema = createInsertSchema(strategyBriefs)
  .omit({ id: true, createdAt: true, updatedAt: true });

// ===== FRAUD ALERTS (Phase 7) =====

export const fraudAlerts = pgTable("fraud_alerts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  indicators: jsonb("indicators"),
  status: text("status").notNull().default("active"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;
export const insertFraudAlertSchema = createInsertSchema(fraudAlerts)
  .omit({ id: true, createdAt: true, resolvedAt: true });

// ===== THREAT SIMULATIONS (Phase 7) =====

export const threatSimulations = pgTable("threat_simulations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  scenarioName: text("scenario_name").notNull(),
  scenarioType: text("scenario_type").notNull(),
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results"),
  riskScore: integer("risk_score"),
  recommendations: jsonb("recommendations"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ThreatSimulation = typeof threatSimulations.$inferSelect;
export type InsertThreatSimulation = typeof threatSimulations.$inferInsert;
export const insertThreatSimulationSchema = createInsertSchema(threatSimulations)
  .omit({ id: true, createdAt: true });

// ===== MARKETPLACE PLUGINS (Phase 8) =====

export const marketplacePlugins = pgTable("marketplace_plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  version: text("version").notNull().default("1.0.0"),
  icon: text("icon"),
  requiredTier: text("required_tier").notNull().default("free"),
  isActive: boolean("is_active").default(true),
  installCount: integer("install_count").default(0),
  rating: integer("rating"),
  configSchema: jsonb("config_schema"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type MarketplacePlugin = typeof marketplacePlugins.$inferSelect;
export type InsertMarketplacePlugin = typeof marketplacePlugins.$inferInsert;
export const insertMarketplacePluginSchema = createInsertSchema(marketplacePlugins)
  .omit({ id: true, createdAt: true, updatedAt: true, installCount: true });

// ===== USER INSTALLED PLUGINS =====

export const installedPlugins = pgTable("installed_plugins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  pluginId: integer("plugin_id").references(() => marketplacePlugins.id).notNull(),
  config: jsonb("config"),
  isActive: boolean("is_active").default(true),
  installedAt: timestamp("installed_at").defaultNow(),
});

export type InstalledPlugin = typeof installedPlugins.$inferSelect;
export type InsertInstalledPlugin = typeof installedPlugins.$inferInsert;
export const insertInstalledPluginSchema = createInsertSchema(installedPlugins)
  .omit({ id: true, installedAt: true });

// ===== COMMUNITY POSTS (Phase 9) =====

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  upvotes: integer("upvotes").default(0),
  replyCount: integer("reply_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;
export const insertCommunityPostSchema = createInsertSchema(communityPosts)
  .omit({ id: true, createdAt: true, updatedAt: true, upvotes: true, replyCount: true, isPinned: true })
  .extend({
    title: z.string().min(5, "Title must be at least 5 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    category: z.enum(["general", "investing", "market-analysis", "fintech", "career", "help"]),
  });

// ===== COMMUNITY REPLIES =====

export const communityReplies = pgTable("community_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CommunityReply = typeof communityReplies.$inferSelect;
export type InsertCommunityReply = typeof communityReplies.$inferInsert;
export const insertCommunityReplySchema = createInsertSchema(communityReplies)
  .omit({ id: true, createdAt: true, upvotes: true })
  .extend({
    content: z.string().min(2, "Reply must be at least 2 characters"),
  });

// ===== DEVELOPER API KEYS (Phase 9) =====

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  name: text("name").notNull(),
  permissions: text("permissions").array(),
  rateLimit: integer("rate_limit").default(1000),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export const insertApiKeySchema = createInsertSchema(apiKeys)
  .omit({ id: true, createdAt: true, usageCount: true, lastUsedAt: true });

// ===== AFFILIATE PROGRAM (Phase 9) =====

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  code: text("code").notNull().unique(),
  campaignName: text("campaign_name").notNull(),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  commissionRate: integer("commission_rate").default(10),
  totalEarnings: integer("total_earnings").default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = typeof affiliateLinks.$inferInsert;
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks)
  .omit({ id: true, createdAt: true, clicks: true, conversions: true, totalEarnings: true })
  .extend({
    campaignName: z.string().min(3, "Campaign name is required"),
    commissionRate: z.number().min(1).max(50).optional(),
  });

// ===== LEARNING TRACKS (Phase 9) =====

export const learningTracks = pgTable("learning_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  requiredTier: text("required_tier").notNull().default("free"),
  modules: jsonb("modules").notNull(),
  estimatedHours: integer("estimated_hours").default(1),
  certificationName: text("certification_name"),
  isActive: boolean("is_active").default(true),
  enrollmentCount: integer("enrollment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type LearningTrack = typeof learningTracks.$inferSelect;
export type InsertLearningTrack = typeof learningTracks.$inferInsert;
export const insertLearningTrackSchema = createInsertSchema(learningTracks)
  .omit({ id: true, createdAt: true, enrollmentCount: true });

// ===== USER LEARNING PROGRESS =====

export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  trackId: integer("track_id").references(() => learningTracks.id).notNull(),
  currentModule: integer("current_module").default(0),
  completedModules: jsonb("completed_modules"),
  quizScores: jsonb("quiz_scores"),
  progress: integer("progress").default(0),
  certificateEarned: boolean("certificate_earned").default(false),
  certificateDate: timestamp("certificate_date"),
  startedAt: timestamp("started_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
});

export type LearningProgressRecord = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;
export const insertLearningProgressSchema = createInsertSchema(learningProgress)
  .omit({ id: true, startedAt: true, lastActivityAt: true, certificateEarned: true, certificateDate: true });

// ===== ADAPTIVE AI PROFILES (Phase 10) =====

export const adaptiveAiProfiles = pgTable("adaptive_ai_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  preferredAgents: text("preferred_agents").array(),
  queryPatterns: jsonb("query_patterns"),
  industryFocus: text("industry_focus").array(),
  regionFocus: text("region_focus").array(),
  riskPreference: text("risk_preference").default("moderate"),
  communicationStyle: text("communication_style").default("balanced"),
  totalInteractions: integer("total_interactions").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdaptiveAiProfile = typeof adaptiveAiProfiles.$inferSelect;
export type InsertAdaptiveAiProfile = typeof adaptiveAiProfiles.$inferInsert;
export const insertAdaptiveAiProfileSchema = createInsertSchema(adaptiveAiProfiles)
  .omit({ id: true, createdAt: true, lastUpdated: true, totalInteractions: true });

// ===== POLICY MODELS (Phase 10 - Co-Policy Modeling) =====

export const policyModels = pgTable("policy_models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  policyType: text("policy_type").notNull(),
  scenarios: jsonb("scenarios").notNull(),
  baseAssumptions: jsonb("base_assumptions"),
  comparativeResults: jsonb("comparative_results"),
  recommendations: text("recommendations").array(),
  confidenceScore: integer("confidence_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type PolicyModel = typeof policyModels.$inferSelect;
export type InsertPolicyModel = typeof policyModels.$inferInsert;
export const insertPolicyModelSchema = createInsertSchema(policyModels)
  .omit({ id: true, createdAt: true, updatedAt: true });

// ===== MULTI-AGENT COLLABORATIONS (Phase 10) =====

export const agentCollaborations = pgTable("agent_collaborations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  query: text("query").notNull(),
  participatingAgents: text("participating_agents").array(),
  agentResponses: jsonb("agent_responses"),
  aggregatedResult: text("aggregated_result"),
  confidenceScore: integer("confidence_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AgentCollaboration = typeof agentCollaborations.$inferSelect;
export type InsertAgentCollaboration = typeof agentCollaborations.$inferInsert;
// ===== AUDIT LOGS =====
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  companyId: integer("company_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// ===== INVOICES =====
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  companyId: integer("company_id"),
  externalId: text("external_id").unique(),
  tier: text("tier").notNull(),
  cycle: text("cycle").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull(),
  invoiceUrl: text("invoice_url"),
  paidAt: timestamp("paid_at"),
  failedReason: text("failed_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });

// ===== PRICE HISTORY CACHE =====
// Caches daily price bars fetched from a HistoricalPriceProvider (e.g. Alpha
// Vantage) so repeated /api/portfolio/metrics calls don't re-hit a rate-limited
// API. Each row is one real trading day for one symbol. `source` records which
// provider the bar came from and `priceBasis` records whether `close` is the
// split/dividend ADJUSTED close ("adjusted") or the raw close ("raw_close") —
// surfaced as provenance so methodology is never hidden. NEVER store guesses.
export const priceHistoryCache = pgTable(
  "price_history_cache",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    date: text("date").notNull(), // trading day, ISO "YYYY-MM-DD"
    open: doublePrecision("open"),
    high: doublePrecision("high"),
    low: doublePrecision("low"),
    close: doublePrecision("close").notNull(), // adjusted or raw close (see priceBasis)
    source: text("source").notNull(),
    priceBasis: text("price_basis").notNull().default("raw_close"), // "adjusted" | "raw_close"
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (t) => ({
    symbolDateUnq: uniqueIndex("price_history_symbol_date_unq").on(t.symbol, t.date),
  }),
);
export type PriceHistoryBar = typeof priceHistoryCache.$inferSelect;
export type InsertPriceHistoryBar = typeof priceHistoryCache.$inferInsert;
export const insertPriceHistoryBarSchema = createInsertSchema(priceHistoryCache).omit({
  id: true,
  fetchedAt: true,
});
