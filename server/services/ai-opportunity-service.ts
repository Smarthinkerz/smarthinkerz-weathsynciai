import OpenAI from 'openai';
import { youApiService } from './you-api-service.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIOpportunityService {
  private youApi = youApiService;

  async generatePersonalizedOpportunities(userSkills: string[], userAssets: string[], preferredRegion?: string) {
    try {
      // Get live market data from You.com
      const marketQuery = `${userSkills.join(' ')} market opportunities ${preferredRegion || 'global'} 2025`;
      const searchResults = await this.youApi.searchWeb(marketQuery, 10);
      
      // Get investment news
      const newsQuery = `${userSkills.join(' ')} startup funding venture capital 2025`;
      const newsResults = await this.youApi.searchNews(newsQuery, 5);

      // Combine data for AI analysis
      const contextData = {
        userProfile: {
          skills: userSkills,
          assets: userAssets,
          region: preferredRegion
        },
        liveMarketData: searchResults.slice(0, 5).map((r: any) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.url
        })),
        recentNews: newsResults.slice(0, 3).map((n: any) => ({
          title: n.title,
          snippet: n.snippet,
          source: n.source
        }))
      };

      const prompt = `
You are an AI business opportunity analyst. Based on the user's profile and live market data, generate 10 personalized opportunity recommendations.

User Profile:
- Skills: ${userSkills.join(', ')}
- Assets: ${userAssets.join(', ')}
- Preferred Region: ${preferredRegion || 'Global'}

Live Market Data:
${searchResults.slice(0, 5).map((r: any) => `- ${r.title || 'No title'}: ${r.snippet || 'No snippet'}`).join('\n')}

Recent Investment News:
${newsResults.slice(0, 3).map((n: any) => `- ${n.title || 'No title'} (${n.source || 'Unknown source'})`).join('\n')}

Generate opportunities in JSON format:
{
  "opportunities": [
    {
      "title": "Opportunity Name",
      "description": "Detailed description",
      "category": "startup|freelance|investment|partnership|grant",
      "matchScore": 85,
      "reasoning": "Why this matches user's profile",
      "actionSteps": ["Step 1", "Step 2", "Step 3"],
      "estimatedRevenue": "Revenue potential",
      "timeToMarket": "Timeline estimate",
      "requiredSkills": ["skill1", "skill2"],
      "riskLevel": "low|medium|high",
      "marketTrend": "Current market trend supporting this"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"opportunities": []}');
      return result.opportunities || [];

    } catch (error) {
      console.error('AI Opportunity Service error:', error);
      throw error;
    }
  }

  async generateCompetitiveIntelligence(industry: string, region: string) {
    try {
      const competitorQuery = `${industry} competitors analysis ${region} market leaders 2025`;
      const searchResults = await this.youApi.searchWeb(competitorQuery, 8);

      const prompt = `
Analyze the competitive landscape based on live market data:

Industry: ${industry}
Region: ${region}

Live Market Data:
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Provide competitive intelligence in JSON format:
{
  "analysis": {
    "marketLeaders": [{"name": "Company", "marketShare": "X%", "strengths": ["strength1"]}],
    "emergingPlayers": [{"name": "Company", "growthRate": "X%", "innovations": ["innovation1"]}],
    "marketGaps": ["gap1", "gap2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "threatLevel": "low|medium|high",
    "recommendations": ["rec1", "rec2"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Competitive Intelligence error:', error);
      throw error;
    }
  }

  async generateInvestmentOpportunities(sector: string, riskTolerance: 'low' | 'medium' | 'high') {
    try {
      const investmentQuery = `${sector} investment opportunities ${riskTolerance} risk 2025 venture capital`;
      const searchResults = await this.youApi.searchWeb(investmentQuery, 6);
      const newsResults = await this.youApi.searchNews(`${sector} funding rounds investment 2025`, 4);

      const prompt = `
Generate investment opportunities based on live market data:

Sector: ${sector}
Risk Tolerance: ${riskTolerance}

Live Market Data:
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Recent Investment News:
${newsResults.map(n => `- ${n.title}`).join('\n')}

Provide investment analysis in JSON format:
{
  "opportunities": [
    {
      "investmentType": "startup|fund|stock|crypto|real-estate",
      "name": "Investment Name",
      "description": "Detailed description",
      "minimumInvestment": "Amount",
      "expectedReturns": "X-Y%",
      "riskLevel": "low|medium|high",
      "timeHorizon": "Timeline",
      "marketTrends": ["trend1", "trend2"],
      "exitStrategy": "How to exit",
      "confidenceScore": 85
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Investment Opportunities error:', error);
      throw error;
    }
  }

  async generateTrendAnalysis(industry: string) {
    try {
      const trendQuery = `${industry} trends 2025 future predictions market analysis`;
      const searchResults = await this.youApi.searchWeb(trendQuery, 8);

      const prompt = `
Analyze industry trends based on live data:

Industry: ${industry}

Live Market Data:
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Provide trend analysis in JSON format:
{
  "analysis": {
    "emergingTrends": [{"trend": "Name", "impact": "high|medium|low", "timeline": "Timeline"}],
    "decliningTrends": [{"trend": "Name", "reason": "Why declining"}],
    "disruptiveTechnologies": ["tech1", "tech2"],
    "marketPredictions": ["prediction1", "prediction2"],
    "actionableInsights": ["insight1", "insight2"],
    "confidenceLevel": 85
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Trend Analysis error:', error);
      throw error;
    }
  }
}

export const aiOpportunityService = new AIOpportunityService();