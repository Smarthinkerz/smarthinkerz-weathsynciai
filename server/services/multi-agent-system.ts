import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AgentResponse {
  agentType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  data: any;
  timestamp: Date;
}

export interface ScenarioSimulation {
  scenario: string;
  timeframe: string;
  economicImpact: {
    gdpChange: number;
    inflationChange: number;
    marketVolatility: number;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class MultiAgentSystem {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
  }

  async getInvestmentStrategistAnalysis(userProfile: any, marketData: any): Promise<AgentResponse> {
    try {
      const prompt = `As an expert Investment Strategist AI, analyze investment opportunities and portfolio optimization.

User Profile:
- Risk Tolerance: ${userProfile.riskTolerance || 'moderate'}
- Investment Goals: ${userProfile.investmentGoals || 'long-term growth'}
- Time Horizon: ${userProfile.timeHorizon || '10 years'}
- Current Assets: ${userProfile.currentAssets || '$100,000'}
- Age: ${userProfile.age || '35'}

Market Context:
- Market Volatility: ${marketData.volatility || 'Medium'}
- Interest Rates: ${marketData.interestRates || '3.5%'}
- Inflation Rate: ${marketData.inflation || '2.8%'}
- Economic Growth: ${marketData.gdpGrowth || '2.1%'}

Provide comprehensive investment analysis in JSON format:
{
  "analysis": "Investment strategy analysis based on user profile and market conditions",
  "portfolioAllocation": {
    "stocks": 60,
    "bonds": 25,
    "alternatives": 10,
    "cash": 5
  },
  "recommendedInvestments": [
    {
      "type": "ETF",
      "name": "Vanguard Total Stock Market",
      "allocation": 30,
      "rationale": "Broad market exposure"
    }
  ],
  "riskAssessment": {
    "overallRisk": "moderate",
    "volatilityExpectation": 15,
    "maxDrawdown": -20
  },
  "expectedReturns": {
    "annual": 7.5,
    "fiveYear": 8.2,
    "tenYear": 7.8
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Investment Strategist',
        analysis: analysis.analysis || 'Investment analysis completed',
        recommendations: [
          "Diversify across asset classes",
          "Consider low-cost index funds",
          "Rebalance portfolio quarterly",
          "Monitor market conditions regularly"
        ],
        confidence: 91,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Investment analysis failed:', error);
      throw new Error('Failed to generate investment analysis');
    }
  }

  async getGeopoliticalAnalysis(country: string, region: string, timeframe: string = '12 months'): Promise<AgentResponse> {
    try {
      const prompt = `As an expert Geopolitical Analyst AI, analyze political and economic stability.

Analysis Parameters:
- Country: ${country}
- Region: ${region}
- Timeframe: ${timeframe}

Provide geopolitical analysis in JSON format:
{
  "analysis": "Geopolitical risk assessment and stability analysis",
  "stabilityScore": 75,
  "politicalRisks": [
    {
      "risk": "Election uncertainty",
      "probability": 30,
      "impact": "medium"
    }
  ],
  "economicIndicators": {
    "gdpGrowth": 2.8,
    "inflation": 3.1,
    "unemployment": 4.2
  },
  "tradeRelations": {
    "majorPartners": ["USA", "China", "EU"],
    "tradeSurplus": true,
    "sanctions": false
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Geopolitical Analyst',
        analysis: analysis.analysis || 'Geopolitical analysis completed',
        recommendations: analysis.recommendations || [
          "Monitor regional political developments",
          "Assess regulatory compliance requirements",
          "Evaluate market entry strategies",
          "Consider geopolitical risk mitigation"
        ],
        confidence: analysis.confidence || 75,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Geopolitical analysis failed:', error);
      throw new Error('Failed to generate geopolitical analysis');
    }
  }

  async getOpportunityMapping(userSkills: string[], marketData: any, targetRegions: string[], parameters?: any): Promise<AgentResponse> {
    try {
      const skillsStr = userSkills.join(', ');
      const regionsStr = targetRegions.join(', ');
      
      const prompt = `As an expert Opportunity Mapper AI, analyze career and business opportunities.

User Profile:
- Skills: ${skillsStr}
- Target Regions: ${regionsStr}
- Experience Level: ${parameters?.experienceLevel || 'Mid-level'}
- Industry Focus: ${parameters?.industryFocus || 'Technology'}

Market Context:
- Economic Growth: ${marketData.economicGrowth || '3.2%'}
- Employment Rate: ${marketData.employmentRate || '96.5%'}
- Industry Trends: ${marketData.industryTrends || 'Digital transformation, AI adoption'}

Parameters:
- Risk Tolerance: ${parameters?.riskTolerance || 'moderate'}
- Investment Capacity: ${parameters?.investmentCapacity || '$50,000'}
- Timeline: ${parameters?.timeline || '12 months'}

Provide opportunity mapping analysis in JSON format:
{
  "analysis": "Personalized opportunity analysis based on user profile and market conditions",
  "careerOpportunities": [
    {
      "role": "Senior Software Engineer",
      "company": "Tech Innovators Inc",
      "location": "Singapore",
      "salaryRange": "$80,000 - $120,000",
      "matchScore": 92,
      "growthPotential": "high",
      "requirements": ["5+ years experience", "React expertise"],
      "benefits": "Remote work, equity options"
    }
  ],
  "businessOpportunities": [
    {
      "sector": "FinTech",
      "opportunity": "Digital payment solutions",
      "marketSize": "$15B",
      "competitionLevel": "medium",
      "investmentRequired": "$25,000",
      "timeToMarket": "8 months",
      "successProbability": 75
    }
  ],
  "skillDevelopment": [
    {
      "skill": "Machine Learning",
      "relevance": "high",
      "timeToAcquire": "6 months",
      "marketDemand": "very high",
      "courses": ["Coursera ML Specialization"],
      "certifications": ["AWS ML Specialty"]
    }
  ],
  "marketTrends": [
    {
      "trend": "AI Integration",
      "impact": "high",
      "relevantSkills": ["Python", "TensorFlow"],
      "timeframe": "2024-2026"
    }
  ],
  "riskAssessment": {
    "overallRisk": "moderate",
    "marketVolatility": "low",
    "regulatoryRisk": "low",
    "technicalRisk": "medium"
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Ensure data safety for React rendering
      const safeAnalysis = {
        ...analysis,
        careerOpportunities: Array.isArray(analysis.careerOpportunities) ? analysis.careerOpportunities : [],
        businessOpportunities: Array.isArray(analysis.businessOpportunities) ? analysis.businessOpportunities : [],
        skillDevelopment: Array.isArray(analysis.skillDevelopment) ? analysis.skillDevelopment : [],
        marketTrends: Array.isArray(analysis.marketTrends) ? analysis.marketTrends : [],
        riskAssessment: typeof analysis.riskAssessment === 'object' ? analysis.riskAssessment : {}
      };

      return {
        agentType: 'Opportunity Mapper',
        analysis: analysis.analysis || 'Opportunity mapping analysis completed',
        recommendations: [
          "Focus on high-demand skills in target markets",
          "Consider market entry strategies for identified opportunities",
          "Build network connections in target regions",
          "Develop risk mitigation strategies for ventures"
        ],
        confidence: 88,
        data: safeAnalysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Opportunity mapping failed:', error);
      throw new Error('Failed to generate opportunity mapping analysis');
    }
  }

  async runScenarioSimulation(scenario: string, country: string, marketData: any): Promise<ScenarioSimulation> {
    try {
      const prompt = `As an expert Scenario Simulation AI, model potential economic scenarios.

Scenario: ${scenario}
Country: ${country}
Current Market Data: ${JSON.stringify(marketData)}

Provide comprehensive scenario simulation in JSON format:
{
  "scenario": "${scenario}",
  "timeframe": "12-24 months",
  "economicImpact": {
    "gdpChange": -2.5,
    "inflationChange": 1.8,
    "marketVolatility": 35
  },
  "recommendations": [
    "Diversify investment portfolio",
    "Monitor inflation indicators",
    "Consider defensive asset allocation"
  ],
  "riskLevel": "medium"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const simulation = JSON.parse(response.choices[0].message.content || '{}');

      return {
        scenario: simulation.scenario || scenario,
        timeframe: simulation.timeframe || '12 months',
        economicImpact: simulation.economicImpact || {
          gdpChange: 0,
          inflationChange: 0,
          marketVolatility: 0
        },
        recommendations: simulation.recommendations || [
          "Monitor market conditions",
          "Maintain diversified approach",
          "Regular strategy review"
        ],
        riskLevel: simulation.riskLevel || 'medium'
      };
    } catch (error) {
      console.error('Scenario simulation failed:', error);
      throw new Error('Failed to run scenario simulation');
    }
  }

  // Company-specific AI agents for premium features
  async getStartupHealthAnalysis(companyData: any, marketData: any): Promise<any> {
    try {
      const prompt = `As an expert Startup Health Analyzer AI, perform a comprehensive health assessment for a company.

Company Profile:
- Industry: ${companyData.industry || 'Technology'}
- Employee Count: ${companyData.employeeCount || 50}
- Revenue: $${companyData.revenue?.toLocaleString() || '1,000,000'}
- Country: ${companyData.country || 'Global'}
- Business Model: ${companyData.businessModel || 'SaaS'}

Market Context:
- Industry Growth: ${marketData.industryGrowth || '12%'}
- Market Size: $${marketData.marketSize?.toLocaleString() || '50B'}
- Competition Level: ${marketData.competitionLevel || 'High'}

Provide a comprehensive startup health analysis in JSON format:
{
  "analysis": "Executive summary of company health",
  "overallHealthScore": 85,
  "financialHealth": {
    "score": 88,
    "cashFlow": 250000,
    "burnRate": 45000,
    "runway": 18,
    "revenue": 1200000,
    "revenueGrowth": 23.5,
    "status": "excellent"
  },
  "operationalHealth": {
    "score": 82,
    "efficiency": 87,
    "customerAcquisition": 78,
    "retention": 94,
    "satisfaction": 8.7,
    "status": "good"
  },
  "marketHealth": {
    "score": 79,
    "marketShare": 12.8,
    "competitivePosition": 74,
    "growthPotential": 85,
    "marketSentiment": 76,
    "status": "good"
  },
  "teamHealth": {
    "score": 91,
    "productivity": 89,
    "satisfaction": 92,
    "retention": 94,
    "skillGaps": ["AI/ML expertise", "Data Science"],
    "status": "excellent"
  },
  "riskFactors": [
    {
      "name": "Market Competition",
      "severity": "medium",
      "impact": "Increasing competition may pressure margins",
      "mitigation": "Focus on product differentiation and customer loyalty"
    }
  ],
  "actionItems": [
    {
      "priority": "high",
      "category": "Growth",
      "action": "Accelerate market expansion",
      "timeline": "Q2 2025",
      "impact": "30% revenue increase potential"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Startup Health Analyzer',
        analysis: analysis.analysis || 'Health analysis completed',
        recommendations: [
          "Focus on improving operational efficiency",
          "Strengthen market position through strategic partnerships",
          "Invest in team development and retention programs",
          "Optimize financial management and cash flow"
        ],
        confidence: 92,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Startup health analysis failed:', error);
      throw new Error('Failed to generate startup health analysis');
    }
  }

  async getTradeFlowAnalysis(country: string, tradingPartners: string[], sectors: string[]): Promise<any> {
    try {
      const partnersStr = tradingPartners.join(', ');
      const sectorsStr = sectors.join(', ');

      const prompt = `As an expert Trade Flow Analyzer AI, analyze international trade patterns and supply chain optimization.

Analysis Parameters:
- Base Country: ${country}
- Trading Partners: ${partnersStr || 'Major global partners'}
- Key Sectors: ${sectorsStr || 'Technology, Manufacturing, Services'}

Provide comprehensive trade flow analysis in JSON format:
{
  "analysis": "Trade flow analysis summary",
  "tradeVolume": {
    "totalImports": 2500000000,
    "totalExports": 3200000000,
    "tradeBalance": 700000000,
    "yearOverYearGrowth": 8.5
  },
  "partnerAnalysis": [
    {
      "country": "United States",
      "importVolume": 800000000,
      "exportVolume": 1200000000,
      "mainProducts": ["Technology", "Manufacturing"],
      "growthTrend": "increasing"
    }
  ],
  "sectorBreakdown": [
    {
      "sector": "Technology",
      "exportValue": 1500000000,
      "importValue": 800000000,
      "competitiveAdvantage": "high",
      "growthPotential": 15
    }
  ],
  "supplyChainRisks": [
    {
      "risk": "Shipping delays",
      "severity": "medium",
      "affectedSectors": ["Manufacturing", "Electronics"],
      "mitigation": "Diversify shipping routes"
    }
  ],
  "opportunities": [
    {
      "type": "Market expansion",
      "region": "Southeast Asia",
      "potential": "$500M",
      "timeframe": "18 months"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Trade Flow Analyzer',
        analysis: analysis.analysis || 'Trade flow analysis completed',
        recommendations: [
          "Optimize supply chain logistics",
          "Diversify trading partner portfolio",
          "Monitor regulatory changes in key markets",
          "Leverage emerging market opportunities"
        ],
        confidence: 89,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Trade flow analysis failed:', error);
      throw new Error('Failed to generate trade flow analysis');
    }
  }

  async getMarketRiskAnalysis(companyData: any, marketData: any): Promise<any> {
    try {
      const prompt = `As an expert Market Risk Analyzer AI, assess market risks and vulnerabilities for a company.

Company Profile:
- Industry: ${companyData.industry || 'Technology'}
- Country: ${companyData.country || 'Global'}
- Revenue: $${companyData.revenue?.toLocaleString() || '1,000,000'}
- Market Position: ${companyData.marketPosition || 'Growing'}

Market Context:
- Market Volatility: ${marketData.volatility || 'Medium'}
- Economic Indicators: ${marketData.economicIndicators || 'Stable'}
- Competition Level: ${marketData.competitionLevel || 'High'}

Provide comprehensive market risk analysis in JSON format:
{
  "analysis": "Market risk assessment summary",
  "overallRiskScore": 72,
  "riskLevel": "moderate",
  "marketVolatility": {
    "score": 68,
    "trend": "increasing",
    "factors": ["Economic uncertainty", "Currency fluctuations"]
  },
  "currencyRisk": {
    "score": 45,
    "exposures": [
      {
        "currency": "USD",
        "exposure": 60,
        "volatility": 15,
        "hedging": "partial"
      }
    ]
  },
  "regulatoryRisk": {
    "score": 55,
    "changes": [
      {
        "regulation": "Data Protection Laws",
        "impact": "medium",
        "timeline": "Q3 2025",
        "compliance": "In progress"
      }
    ]
  },
  "competitiveRisk": {
    "score": 80,
    "threats": [
      {
        "competitor": "Market Leader",
        "threat": "Price competition",
        "probability": 75,
        "impact": "high"
      }
    ]
  },
  "economicRisk": {
    "score": 60,
    "indicators": [
      {
        "indicator": "GDP Growth",
        "current": 2.8,
        "forecast": 2.5,
        "impact": "Revenue may slow"
      }
    ]
  },
  "mitigationStrategies": [
    {
      "risk": "Currency Exposure",
      "strategy": "Implement currency hedging",
      "cost": 50000,
      "effectiveness": 85,
      "timeline": "3 months"
    }
  ],
  "stressScenarios": [
    {
      "scenario": "Economic Recession",
      "probability": 25,
      "impact": 80,
      "description": "Major economic downturn affecting demand",
      "preparation": ["Build cash reserves", "Diversify revenue streams"]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Market Risk Analyzer',
        analysis: analysis.analysis || 'Market risk analysis completed',
        recommendations: [
          "Implement comprehensive risk management framework",
          "Diversify market exposure and revenue sources",
          "Monitor regulatory changes and compliance requirements",
          "Develop contingency plans for high-impact scenarios"
        ],
        confidence: 87,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Market risk analysis failed:', error);
      throw new Error('Failed to generate market risk analysis');
    }
  }

  async getCompanyPerformanceMetrics(companyData: any, marketData: any): Promise<any> {
    try {
      const prompt = `As an expert Company Performance Metrics AI, analyze comprehensive business performance indicators.

Company Profile:
- Industry: ${companyData.industry || 'Technology'}
- Employee Count: ${companyData.employeeCount || 50}
- Revenue: $${companyData.revenue?.toLocaleString() || '1,000,000'}
- Country: ${companyData.country || 'Global'}

Market Context:
- Industry Growth: ${marketData.industryGrowth || '12%'}
- Market Size: $${marketData.marketSize?.toLocaleString() || '50B'}
- Competition Level: ${marketData.competitionLevel || 'High'}

Provide comprehensive performance metrics analysis in JSON format:
{
  "analysis": "Performance metrics analysis summary",
  "overallPerformance": 85,
  "financialMetrics": {
    "revenue": 1200000,
    "revenueGrowth": 23.5,
    "profitMargin": 18.5,
    "burnRate": 45000,
    "cashFlow": 250000,
    "ebitda": 320000,
    "revenuePerEmployee": 24000
  },
  "operationalMetrics": {
    "efficiency": 87,
    "productivity": 92,
    "customerAcquisitionCost": 150,
    "customerLifetimeValue": 2500,
    "retentionRate": 94,
    "satisfactionScore": 8.7,
    "timeToMarket": 4.2
  },
  "marketMetrics": {
    "marketShare": 12.8,
    "competitivePosition": 74,
    "brandValue": 15000000,
    "customerGrowth": 35,
    "marketPenetration": 18
  },
  "teamMetrics": {
    "employeeCount": 50,
    "productivityIndex": 89,
    "employeeSatisfaction": 92,
    "turnoverRate": 6,
    "skillDevelopment": 85,
    "diversity": 68
  },
  "trendAnalysis": [
    {
      "metric": "Revenue Growth",
      "trend": "upward",
      "changePercent": 23.5,
      "forecast": 28,
      "confidence": 85
    }
  ],
  "benchmarking": [
    {
      "category": "Revenue Growth",
      "ourValue": 23.5,
      "industryAverage": 15.2,
      "topPerformer": 35.8,
      "percentile": 78
    }
  ],
  "kpis": [
    {
      "name": "Monthly Recurring Revenue",
      "current": 100000,
      "target": 120000,
      "unit": "$",
      "status": "on-track",
      "trend": "improving"
    }
  ],
  "alerts": [
    {
      "type": "opportunity",
      "metric": "Customer Acquisition",
      "message": "Strong acquisition momentum detected",
      "action": "Scale marketing efforts"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        agentType: 'Company Performance Metrics',
        analysis: analysis.analysis || 'Performance metrics analysis completed',
        recommendations: [
          "Focus on scaling high-performing metrics",
          "Address operational efficiency gaps",
          "Benchmark against industry leaders",
          "Implement data-driven performance monitoring"
        ],
        confidence: 90,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Performance metrics analysis failed:', error);
      throw new Error('Failed to generate performance metrics analysis');
    }
  }
}

export const multiAgentSystem = new MultiAgentSystem();