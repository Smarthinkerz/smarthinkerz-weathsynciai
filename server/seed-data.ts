import { storage } from './storage';
import { hashPassword } from './auth';
import { SubscriptionTier, CompanyVerificationStatus, type InsertFundingOpportunity } from '@shared/schema';

const SEED_PLUGINS = [
  {
    name: "CRM Sync Pro", slug: "crm-sync-pro",
    description: "Sync leads and opportunities with Salesforce, HubSpot, and Pipedrive in real-time.",
    category: "Integration", author: "WealthSync", version: "1.2.0",
    requiredTier: "professional", isActive: true, rating: 5,
    configSchema: {
      fields: [
        { key: "apiKey", label: "CRM API Key", type: "password", required: true },
        { key: "crmType", label: "CRM Provider", type: "select", options: ["Salesforce", "HubSpot", "Pipedrive"], required: true },
        { key: "syncInterval", label: "Sync Interval (minutes)", type: "number", default: 30 },
      ]
    }
  },
  {
    name: "ESG Compliance Checker", slug: "esg-compliance-checker",
    description: "Automated ESG scoring and compliance reports aligned with global standards (GRI, SASB, TCFD).",
    category: "Compliance", author: "WealthSync", version: "1.0.5",
    requiredTier: "elite", isActive: true, rating: 5,
    configSchema: {
      fields: [
        { key: "framework", label: "Reporting Framework", type: "select", options: ["GRI", "SASB", "TCFD", "All"], default: "All" },
        { key: "autoReport", label: "Auto-generate quarterly reports", type: "boolean", default: true },
      ]
    }
  },
  {
    name: "AI Pitch Generator", slug: "ai-pitch-generator",
    description: "Create investor-ready pitch decks and one-pagers from your business data using GPT-4.",
    category: "AI Tools", author: "WealthSync", version: "2.1.0",
    requiredTier: "professional", isActive: true, rating: 4,
    configSchema: {
      fields: [
        { key: "tone", label: "Pitch Tone", type: "select", options: ["Professional", "Bold", "Storytelling"], default: "Professional" },
        { key: "slideCount", label: "Default slide count", type: "number", default: 12 },
      ]
    }
  },
  {
    name: "Fraud Risk Analyzer", slug: "fraud-risk-analyzer",
    description: "Continuous fraud monitoring with AI-driven anomaly detection across transactions and counterparties.",
    category: "Security", author: "WealthSync", version: "1.3.2",
    requiredTier: "elite", isActive: true, rating: 5,
    configSchema: {
      fields: [
        { key: "sensitivity", label: "Detection sensitivity", type: "select", options: ["Low", "Medium", "High"], default: "Medium" },
        { key: "alertEmail", label: "Alert email", type: "text" },
      ]
    }
  },
  {
    name: "Startup Valuation Tool", slug: "startup-valuation-tool",
    description: "Multi-method startup valuation (DCF, comparables, Berkus, Scorecard) with industry benchmarks.",
    category: "Finance", author: "WealthSync", version: "1.1.0",
    requiredTier: "professional", isActive: true, rating: 4,
    configSchema: {
      fields: [
        { key: "industry", label: "Default industry", type: "text" },
        { key: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP", "AED"], default: "USD" },
      ]
    }
  },
  {
    name: "Market Pulse Dashboard", slug: "market-pulse-dashboard",
    description: "Real-time global market sentiment, sector heatmaps, and economic indicators.",
    category: "Market Data", author: "WealthSync", version: "1.0.0",
    requiredTier: "free", isActive: true, rating: 4,
    configSchema: {
      fields: [
        { key: "regions", label: "Watch regions", type: "text", default: "US, EU, MENA, APAC" },
      ]
    }
  },
  {
    name: "Investor Outreach Assistant", slug: "investor-outreach-assistant",
    description: "AI-drafted outreach emails with investor matching based on stage, sector, and check size.",
    category: "AI Tools", author: "WealthSync", version: "1.4.0",
    requiredTier: "elite", isActive: true, rating: 5,
    configSchema: {
      fields: [
        { key: "stage", label: "Funding stage", type: "select", options: ["Pre-seed", "Seed", "Series A", "Series B+"] },
        { key: "checkSize", label: "Target check size (USD)", type: "number" },
      ]
    }
  },
  {
    name: "Slack Notifier", slug: "slack-notifier",
    description: "Push key alerts (fraud, opportunities, threats) directly to your Slack workspace.",
    category: "Integration", author: "WealthSync", version: "1.0.0",
    requiredTier: "professional", isActive: true, rating: 4,
    configSchema: {
      fields: [
        { key: "webhookUrl", label: "Slack Webhook URL", type: "password", required: true },
        { key: "channel", label: "Default channel", type: "text", default: "#wealthsync" },
      ]
    }
  },
];

const SEED_TRACKS = [
  {
    title: "Investor Outreach Basics", category: "Fundraising", difficulty: "beginner",
    requiredTier: "free", estimatedHours: 3,
    description: "Master the fundamentals of reaching out to investors, crafting your story, and securing meetings.",
    certificationName: "Certified Investor Outreach Associate",
    modules: [
      { title: "Investor Landscape Overview", description: "Understand angels, VCs, family offices, and corporate investors." },
      { title: "Crafting Your Elevator Pitch", description: "30-second pitch frameworks that get responses." },
      { title: "Cold Email Best Practices", description: "Subject lines, opening hooks, and follow-up cadence." },
      { title: "The Investor Meeting", description: "Prepare for first meetings and answer tough questions." },
      { title: "Closing & Negotiation", description: "Term sheets, valuations, and next steps." },
    ],
    isActive: true,
  },
  {
    title: "AI-Driven Market Analysis", category: "Intelligence", difficulty: "intermediate",
    requiredTier: "professional", estimatedHours: 5,
    description: "Use AI agents and data sources to identify market opportunities and predict trends.",
    certificationName: "Certified AI Market Analyst",
    modules: [
      { title: "Intro to AI Market Intelligence", description: "How AI transforms business intelligence." },
      { title: "Data Sources & Quality", description: "Working with World Bank, Finnhub, and proprietary feeds." },
      { title: "Using the Multi-Agent System", description: "Orchestrating market, risk, and trade agents." },
      { title: "Scenario Modeling", description: "Build and compare what-if scenarios." },
      { title: "Reporting & Decisions", description: "Turn analysis into actionable strategies." },
      { title: "Capstone: Live Market Report", description: "Produce a full report on a sector of your choice." },
    ],
    isActive: true,
  },
  {
    title: "Compliance & ESG Reporting", category: "Compliance", difficulty: "intermediate",
    requiredTier: "elite", estimatedHours: 6,
    description: "Build defensible compliance and ESG reports aligned with GRI, SASB, and TCFD frameworks.",
    certificationName: "Certified ESG & Compliance Specialist",
    modules: [
      { title: "Regulatory Landscape", description: "Global regulators and frameworks at a glance." },
      { title: "ESG Fundamentals", description: "Environmental, Social, Governance pillars explained." },
      { title: "Data Privacy & Security", description: "GDPR, CCPA, and SOC 2 essentials." },
      { title: "Building Your Report", description: "Templates, evidence, and disclosures." },
      { title: "Audit Readiness", description: "Prepare for internal and external audits." },
      { title: "Capstone: Full ESG Report", description: "Generate a complete ESG report for your organization." },
    ],
    isActive: true,
  },
  {
    title: "Fraud Detection & Threat Modeling", category: "Security", difficulty: "advanced",
    requiredTier: "elite", estimatedHours: 4,
    description: "Detect fraud patterns and run enterprise-grade threat simulations.",
    certificationName: "Certified Fraud & Threat Analyst",
    modules: [
      { title: "Fraud Patterns 101", description: "Common fraud signals across finance and operations." },
      { title: "Anomaly Detection with AI", description: "Using ML to surface outliers." },
      { title: "Threat Simulation Workflows", description: "Building market crash, supply chain, and cyber scenarios." },
      { title: "Response & Mitigation", description: "Playbooks for severity-ranked incidents." },
    ],
    isActive: true,
  },
  {
    title: "Smart Contracts for Business", category: "Legal", difficulty: "beginner",
    requiredTier: "professional", estimatedHours: 2,
    description: "Use AI-generated smart contracts to automate agreements, milestones, and payments.",
    certificationName: "Certified Smart Contracts Practitioner",
    modules: [
      { title: "Smart Contracts Explained", description: "What they are and when to use them." },
      { title: "Drafting with AI", description: "Generate clauses and milestones with WealthSync." },
      { title: "Lifecycle Management", description: "Activate, monitor, complete, and pay out." },
      { title: "Risk & Disputes", description: "Mitigate edge cases and handle disputes." },
    ],
    isActive: true,
  },
];

const SEED_FUNDING: InsertFundingOpportunity[] = [
  {
    name: "MENA Climate Tech Grant",
    description: "Non-dilutive grant for early-stage climate and clean-energy startups operating in the MENA region. Covers R&D, pilot deployments, and team expansion.",
    provider: "Regional Development Fund",
    amount: 250000,
    type: "grant",
    sector: "Clean Energy",
    eligibilityCriteria: {
      businessType: ["startup", "sme"],
      maxRevenue: 1000000,
      requiredDocuments: ["pitch deck", "financial statements", "incorporation certificate"],
      location: ["MENA"],
    },
    region: "MENA",
    country: "Saudi Arabia",
    applicationUrl: "https://example.org/mena-climate-grant",
  },
  {
    name: "Global Fintech Seed Fund",
    description: "Equity investment for pre-seed and seed fintech companies building payments, lending, or wealth-management infrastructure with a live product.",
    provider: "Horizon Ventures",
    amount: 500000,
    type: "venture_capital",
    sector: "Fintech",
    eligibilityCriteria: {
      businessType: ["startup"],
      requiredDocuments: ["pitch deck", "cap table"],
      location: ["Global"],
    },
    region: "Global",
    country: "Global",
    applicationUrl: "https://example.org/global-fintech-seed",
  },
  {
    name: "Women Founders Accelerator Grant",
    description: "Grant plus mentorship program for women-led technology startups across emerging markets, including a 12-week structured program.",
    provider: "Empower Foundation",
    amount: 100000,
    type: "grant",
    sector: "Technology",
    eligibilityCriteria: {
      businessType: ["startup", "sme"],
      requiredDocuments: ["application form", "founder identification"],
      location: ["Emerging Markets"],
    },
    region: "Emerging Markets",
    country: "Global",
    applicationUrl: "https://example.org/women-founders-grant",
  },
  {
    name: "Deep Tech Innovation Fund",
    description: "Government-backed funding for deep-tech ventures in AI, robotics, and advanced manufacturing with proprietary technology and a clear runway.",
    provider: "National Innovation Agency",
    amount: 1000000,
    type: "government_funding",
    sector: "Deep Tech",
    eligibilityCriteria: {
      businessType: ["startup", "scaleup"],
      yearsInBusiness: 2,
      requiredDocuments: ["patent or IP documentation", "technical roadmap", "financial statements"],
      location: ["GCC"],
    },
    region: "GCC",
    country: "United Arab Emirates",
    applicationUrl: "https://example.org/deeptech-innovation-fund",
  },
];

const SEED_FORUM = [
  {
    title: "How are you sourcing seed-stage deal flow in 2026?",
    content: "Curious what channels are working best this year — warm intros, accelerators, or platforms like this one. Share what's actually converting for you.",
    category: "investing",
    tags: ["deal-flow", "seed", "sourcing"],
  },
  {
    title: "Best frameworks for early-stage market sizing",
    content: "Working on a TAM/SAM/SOM for a fintech idea. Do you prefer top-down or bottom-up, and how do you defend the numbers to investors?",
    category: "market-analysis",
    tags: ["market-sizing", "tam", "research"],
  },
  {
    title: "Lessons learned raising a pre-seed round",
    content: "Just closed our pre-seed after 4 months. Happy to share what worked, what I'd do differently, and the metrics investors actually cared about.",
    category: "general",
    tags: ["fundraising", "pre-seed", "lessons"],
  },
  {
    title: "Which AI agents do you find most useful here?",
    content: "Trying to get the most out of the platform. Which of the market, risk, and trade-flow agents have given you the most actionable output so far?",
    category: "fintech",
    tags: ["ai", "agents", "tips"],
  },
];

async function seedDemoAccounts() {
  const userSeeds = [
    {
      username: 'demo', password: 'demo1234', name: 'Demo Admin',
      email: 'demo@wealthsync.test', tier: SubscriptionTier.ENTERPRISE, isAdmin: true,
    },
    {
      username: 'testuser', password: 'test123', name: 'Test User (Basic)',
      email: 'testuser@wealthsync.test', tier: SubscriptionTier.EXPLORER, isAdmin: false,
    },
    {
      username: 'premiumuser', password: 'test123', name: 'Premium User',
      email: 'premiumuser@wealthsync.test', tier: SubscriptionTier.ELITE, isAdmin: false,
    },
  ];

  for (const u of userSeeds) {
    try {
      const existing = await storage.getUserByUsername(u.username);
      if (!existing) {
        const hashed = await hashPassword(u.password);
        await storage.createUser({
          username: u.username,
          password: hashed,
          name: u.name,
          email: u.email,
          subscriptionTier: u.tier,
          isAdmin: u.isAdmin,
          preferredLanguage: 'en',
          preferredCurrency: 'USD',
          skills: [],
          assets: [],
        } as any);
        console.log(`[seed] Created user: ${u.username} / ${u.password} (${u.tier})`);
      }
    } catch (e: any) {
      console.warn(`[seed] user ${u.username} skipped:`, e.message);
    }
  }

  const companySeeds = [
    {
      email: 'demo-company@wealthsync.test', password: 'demo1234',
      name: 'Demo Holdings Ltd', contact: 'Demo Admin',
      tier: SubscriptionTier.ENTERPRISE, isPremium: true,
    },
    {
      email: 'john@basic-company.example.com', password: 'company123',
      name: 'Basic Company Ltd', contact: 'John Smith',
      tier: SubscriptionTier.BASIC, isPremium: false,
    },
    {
      email: 'jane@premium-enterprise.example.com', password: 'test123',
      name: 'Premium Enterprise Inc', contact: 'Jane Doe',
      tier: SubscriptionTier.ENTERPRISE, isPremium: true,
    },
  ];

  for (const c of companySeeds) {
    try {
      const existing = await storage.getCompanyByEmail(c.email);
      if (!existing) {
        const hashed = await hashPassword(c.password);
        await storage.createCompany({
          name: c.name,
          description: `Seeded ${c.tier} company account for WealthSync testing and demonstration purposes.`,
          password: hashed,
          primaryContact: c.contact,
          primaryContactEmail: c.email,
          primaryContactPhone: '+15555550100',
          headquarters: 'Riyadh, Saudi Arabia',
          foundedYear: 2024,
          employeeCount: 25,
          industries: ['Technology', 'Finance'],
          subscriptionTier: c.tier,
          verificationStatus: CompanyVerificationStatus.VERIFIED,
          isActive: true,
          isPremium: c.isPremium,
        } as any);
        console.log(`[seed] Created company: ${c.email} / ${c.password} (${c.tier})`);
      }
    } catch (e: any) {
      console.warn(`[seed] company ${c.email} skipped:`, e.message);
    }
  }
}

let seeded = false;

export async function seedPlatformData() {
  if (seeded) return;
  seeded = true;
  try {
    const existingPlugins = await storage.getAllPlugins();
    if (existingPlugins.length === 0) {
      for (const p of SEED_PLUGINS) {
        try { await storage.createPlugin(p); } catch (e: any) {
          console.warn(`[seed] plugin ${p.slug} skipped:`, e.message);
        }
      }
      console.log(`[seed] Inserted ${SEED_PLUGINS.length} marketplace plugins`);
    }

    await seedDemoAccounts();

    const existingTracks = await storage.getAllLearningTracks();
    if (existingTracks.length === 0) {
      for (const t of SEED_TRACKS) {
        try { await storage.createLearningTrack(t); } catch (e: any) {
          console.warn(`[seed] track ${t.title} skipped:`, e.message);
        }
      }
      console.log(`[seed] Inserted ${SEED_TRACKS.length} learning tracks`);
    }

    const existingFunding = await storage.getFundingOpportunities();
    if (!existingFunding || existingFunding.length === 0) {
      let fundingInserted = 0;
      for (const f of SEED_FUNDING) {
        try { await storage.createFundingOpportunity(f); fundingInserted++; } catch (e: any) {
          console.warn(`[seed] funding ${f.name} skipped:`, e.message);
        }
      }
      console.log(`[seed] Inserted ${fundingInserted}/${SEED_FUNDING.length} funding opportunities`);
    }

    const existingPosts = await storage.getCommunityPosts();
    if (!existingPosts || existingPosts.length === 0) {
      const author = await storage.getUserByUsername('demo');
      if (author) {
        let postsInserted = 0;
        for (const p of SEED_FORUM) {
          try { await storage.createCommunityPost({ ...p, userId: author.id }); postsInserted++; } catch (e: any) {
            console.warn(`[seed] forum post "${p.title}" skipped:`, e.message);
          }
        }
        console.log(`[seed] Inserted ${postsInserted}/${SEED_FORUM.length} community posts`);
      }
    }
  } catch (e: any) {
    console.error('[seed] error:', e.message);
  }
}
