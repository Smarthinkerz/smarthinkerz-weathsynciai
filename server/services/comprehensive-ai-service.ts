import OpenAI from 'openai';
import { youApiService } from './you-api-service.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PersonalizedOpportunity {
  title: string;
  description: string;
  category: 'startup' | 'freelance' | 'investment' | 'partnership' | 'grant';
  matchScore: number;
  reasoning: string;
  actionSteps: string[];
  estimatedRevenue: string;
  timeToMarket: string;
  requiredSkills: string[];
  riskLevel: 'low' | 'medium' | 'high';
  marketTrend: string;
}

interface CompetitiveAnalysis {
  marketLeaders: Array<{name: string; marketShare: string; strengths: string[]}>;
  emergingPlayers: Array<{name: string; growthRate: string; innovations: string[]}>;
  marketGaps: string[];
  opportunities: string[];
  threatLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface InvestmentOpportunity {
  investmentType: 'startup' | 'fund' | 'stock' | 'crypto' | 'real-estate';
  name: string;
  description: string;
  minimumInvestment: string;
  expectedReturns: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: string;
  marketTrends: string[];
  exitStrategy: string;
  confidenceScore: number;
}

interface TrendAnalysis {
  emergingTrends: Array<{trend: string; impact: 'high' | 'medium' | 'low'; timeline: string}>;
  decliningTrends: Array<{trend: string; reason: string}>;
  disruptiveTechnologies: string[];
  marketPredictions: string[];
  actionableInsights: string[];
  confidenceLevel: number;
}

interface SmartNewsItem {
  title: string;
  summary: string;
  relevanceScore: number;
  category: 'funding' | 'market' | 'competition' | 'trend';
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
  url?: string;
}

export class ComprehensiveAIService {
  private youApi = youApiService;

  // 1. Personalized Business Opportunities
  async generatePersonalizedOpportunities(
    userSkills: string[], 
    userAssets: string[], 
    preferredRegion: string = 'Global'
  ): Promise<PersonalizedOpportunity[]> {
    try {
      console.log(`🤖 Generating personalized opportunities for skills: ${userSkills.join(', ')}`);
      
      // Get live market data
      const marketQuery = `${userSkills.join(' ')} business opportunities ${preferredRegion} 2025 startup`;
      const searchResults = await this.youApi.searchWeb(marketQuery, 8);
      
      // Get investment news
      const newsQuery = `${userSkills.join(' ')} startup funding venture capital ${preferredRegion} 2025`;
      const newsResults = await this.youApi.searchNews(newsQuery, 5);

      const prompt = `
You are an AI business opportunity analyst. Generate 8 personalized business opportunities based on the user's profile and live market data.

User Profile:
- Skills: ${userSkills.join(', ')}
- Assets: ${userAssets.join(', ')}
- Preferred Region: ${preferredRegion}

Live Market Data:
${searchResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 150)}`).join('\n')}

Recent Investment News:
${newsResults.map((n: any) => `- ${n.title || 'No title'}`).join('\n')}

Generate opportunities in JSON format with this exact structure:
{
  "opportunities": [
    {
      "title": "VR Training Platform for Healthcare",
      "description": "Create immersive VR training simulations for medical professionals",
      "category": "startup",
      "matchScore": 95,
      "reasoning": "Combines your VR/AR expertise with growing healthcare digitization trend",
      "actionSteps": ["Market research", "MVP development", "Pilot partnerships"],
      "estimatedRevenue": "$50K-200K first year",
      "timeToMarket": "6-12 months",
      "requiredSkills": ["VR", "Software", "Programming"],
      "riskLevel": "medium",
      "marketTrend": "Healthcare digital transformation accelerating"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"opportunities": []}');
      console.log(`✅ Generated ${result.opportunities?.length || 0} personalized opportunities`);
      return result.opportunities || [];

    } catch (error) {
      console.error('Personalized opportunities error:', error);
      return [];
    }
  }

  // 2. Real-Time Competitive Intelligence
  async generateCompetitiveIntelligence(industry: string, region: string): Promise<CompetitiveAnalysis> {
    try {
      console.log(`🎯 Analyzing competitive landscape for ${industry} in ${region}`);
      
      const competitorQuery = `${industry} market leaders competitors analysis ${region} 2025`;
      const searchResults = await this.youApi.searchWeb(competitorQuery, 10);

      const prompt = `
Analyze the competitive landscape for ${industry} in ${region} based on live market data:

Live Market Data:
${searchResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 120)}`).join('\n')}

Provide competitive intelligence in JSON format:
{
  "analysis": {
    "marketLeaders": [{"name": "Google", "marketShare": "35%", "strengths": ["AI expertise", "Global scale"]}],
    "emergingPlayers": [{"name": "Emerging Corp", "growthRate": "150%", "innovations": ["New tech"]}],
    "marketGaps": ["Underserved segment A", "Unmet need B"],
    "opportunities": ["Market expansion", "New technology adoption"],
    "threatLevel": "medium",
    "recommendations": ["Focus on niche", "Leverage partnerships"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"analysis": {}}');
      console.log(`✅ Generated competitive analysis for ${industry}`);
      return result.analysis || {};

    } catch (error) {
      console.error('Competitive intelligence error:', error);
      return {
        marketLeaders: [],
        emergingPlayers: [],
        marketGaps: [],
        opportunities: [],
        threatLevel: 'medium',
        recommendations: []
      };
    }
  }

  // 3. Investment Opportunity Scanner
  async generateInvestmentOpportunities(
    sector: string, 
    riskTolerance: 'low' | 'medium' | 'high'
  ): Promise<InvestmentOpportunity[]> {
    try {
      console.log(`💰 Scanning investment opportunities in ${sector} (${riskTolerance} risk)`);
      
      const investmentQuery = `${sector} investment opportunities ${riskTolerance} risk venture capital 2025`;
      const searchResults = await this.youApi.searchWeb(investmentQuery, 8);
      
      const newsQuery = `${sector} funding rounds startup investment 2025`;
      const newsResults = await this.youApi.searchNews(newsQuery, 5);

      const prompt = `
Generate investment opportunities for ${sector} with ${riskTolerance} risk tolerance:

Live Market Data:
${searchResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 120)}`).join('\n')}

Recent Investment News:
${newsResults.map((n: any) => `- ${n.title || 'No title'}`).join('\n')}

Provide investment analysis in JSON format:
{
  "opportunities": [
    {
      "investmentType": "startup",
      "name": "AI Healthcare Startup",
      "description": "Early-stage company developing AI diagnostic tools",
      "minimumInvestment": "$10,000",
      "expectedReturns": "15-25%",
      "riskLevel": "medium",
      "timeHorizon": "3-5 years",
      "marketTrends": ["Healthcare AI growth", "Regulatory approval increasing"],
      "exitStrategy": "IPO or acquisition by major healthcare company",
      "confidenceScore": 85
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"opportunities": []}');
      console.log(`✅ Found ${result.opportunities?.length || 0} investment opportunities`);
      return result.opportunities || [];

    } catch (error) {
      console.error('Investment opportunities error:', error);
      return [];
    }
  }

  // 4. Market Trend Analysis
  async generateTrendAnalysis(industry: string): Promise<TrendAnalysis> {
    try {
      console.log(`📈 Analyzing trends for ${industry}`);
      
      const trendQuery = `${industry} trends 2025 future predictions market analysis technology`;
      const searchResults = await this.youApi.searchWeb(trendQuery, 10);

      const prompt = `
Analyze industry trends for ${industry} based on live data:

Live Market Data:
${searchResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 120)}`).join('\n')}

Provide trend analysis in JSON format:
{
  "analysis": {
    "emergingTrends": [{"trend": "AI Integration", "impact": "high", "timeline": "2025-2027"}],
    "decliningTrends": [{"trend": "Legacy Systems", "reason": "Replaced by cloud solutions"}],
    "disruptiveTechnologies": ["Artificial Intelligence", "Blockchain", "IoT"],
    "marketPredictions": ["50% growth in AI adoption", "Remote work normalization"],
    "actionableInsights": ["Invest in AI capabilities", "Focus on automation"],
    "confidenceLevel": 85
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"analysis": {}}');
      console.log(`✅ Generated trend analysis for ${industry}`);
      return result.analysis || {};

    } catch (error) {
      console.error('Trend analysis error:', error);
      return {
        emergingTrends: [],
        decliningTrends: [],
        disruptiveTechnologies: [],
        marketPredictions: [],
        actionableInsights: [],
        confidenceLevel: 0
      };
    }
  }

  // 5. Smart Business News Feed
  async generateSmartNewsFeed(userSkills: string[], userIndustries: string[]): Promise<SmartNewsItem[]> {
    try {
      console.log(`📰 Generating smart news feed for: ${userSkills.join(', ')}`);
      
      const newsQueries = [
        `${userSkills.join(' ')} startup funding news 2025`,
        `${userIndustries.join(' ')} market disruption trends 2025`,
        `${userSkills.join(' ')} investment opportunities venture capital`
      ];

      const allNews: any[] = [];
      for (const query of newsQueries) {
        const news = await this.youApi.searchNews(query, 5);
        allNews.push(...news);
      }

      const prompt = `
Generate a personalized news feed based on user profile and recent news:

User Skills: ${userSkills.join(', ')}
User Industries: ${userIndustries.join(', ')}

Recent News:
${allNews.map((n: any, i) => `${i+1}. ${n.title || 'No title'}: ${(n.snippet || n.description || 'No description').substring(0, 100)}`).join('\n')}

Analyze and categorize news by relevance in JSON format:
{
  "news": [
    {
      "title": "VR Startup Raises $50M Series B",
      "summary": "Company developing enterprise VR training raises significant funding",
      "relevanceScore": 95,
      "category": "funding",
      "actionable": true,
      "impact": "high",
      "url": "https://example.com"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"news": []}');
      console.log(`✅ Generated ${result.news?.length || 0} personalized news items`);
      return result.news || [];

    } catch (error) {
      console.error('Smart news feed error:', error);
      return [];
    }
  }

  // Company Intelligence (for businesses)
  async generateCompanyIntelligence(companyName: string, industry: string) {
    try {
      console.log(`🏢 Analyzing company intelligence for ${companyName}`);
      
      const companyQuery = `${companyName} ${industry} financial performance market position 2025`;
      const searchResults = await this.youApi.searchWeb(companyQuery, 6);
      
      const competitorQuery = `${companyName} competitors market analysis ${industry}`;
      const competitorResults = await this.youApi.searchWeb(competitorQuery, 4);

      const prompt = `
Analyze company intelligence for ${companyName} in ${industry}:

Company Data:
${searchResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 120)}`).join('\n')}

Competitive Landscape:
${competitorResults.map((r: any) => `- ${r.title || 'No title'}: ${(r.snippet || 'No snippet').substring(0, 120)}`).join('\n')}

Provide analysis in JSON format:
{
  "intelligence": {
    "marketPosition": "Market leader/challenger/follower",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "threats": ["Threat 1", "Threat 2"],
    "financialHealth": "strong/moderate/weak",
    "growthPotential": "high/medium/low",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"intelligence": {}}');
      console.log(`✅ Generated company intelligence for ${companyName}`);
      return result.intelligence || {};

    } catch (error) {
      console.error('Company intelligence error:', error);
      return {};
    }
  }
}

export const comprehensiveAIService = new ComprehensiveAIService();