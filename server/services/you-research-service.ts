import fetch from 'node-fetch';

interface YouResearchResponse {
  hits: Array<{
    title: string;
    description: string;
    url: string;
    age: string;
    language: string;
    score: number;
    snippets: string[];
  }>;
  latency: number;
}

export class YouResearchService {
  private apiKey: string;
  private baseUrl = 'https://api.you.com/search';

  constructor() {
    this.apiKey = process.env.YOU_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[YouResearchService] YOU_API_KEY not configured — research features disabled');
    }
  }

  async searchMarketResearch(query: string): Promise<YouResearchResponse> {
    try {
      console.log(`[YouResearchService] Searching for: ${query}`);
      
      const response = await fetch(`${this.baseUrl}?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        console.warn(`[YouResearchService] API key rejected (${response.status}) — key may be expired`);
        return { hits: [], latency: 0 };
      }
      if (!response.ok) {
        console.error(`[YouResearchService] API error: ${response.status}`);
        return { hits: [], latency: 0 };
      }

      const data = await response.json() as YouResearchResponse;
      console.log(`[YouResearchService] Found ${data.hits?.length || 0} research sources`);
      
      return data;
    } catch (error) {
      console.error('[YouResearchService] Search error:', error);
      throw error;
    }
  }

  async generateInvestmentResearch(sector: string, timeframe: string = '2024'): Promise<string[]> {
    try {
      const query = `${sector} investment analysis ${timeframe} market trends financial research`;
      const results = await this.searchMarketResearch(query);
      
      if (!results.hits || results.hits.length === 0) {
        return [`No recent research found for ${sector}`];
      }

      // Extract key insights from top research sources
      const insights = results.hits.slice(0, 10).map(hit => {
        const snippet = hit.snippets?.[0] || hit.description || '';
        return `• ${hit.title}: ${snippet.substring(0, 200)}... (Source: ${new URL(hit.url).hostname})`;
      });

      return insights;
    } catch (error) {
      console.error('[YouResearchService] Research generation error:', error);
      return [`Research service temporarily unavailable for ${sector}`];
    }
  }

  async getMarketTrends(markets: string[]): Promise<Record<string, string[]>> {
    const trends: Record<string, string[]> = {};
    
    for (const market of markets) {
      try {
        const research = await this.generateInvestmentResearch(market, '2024-2025');
        trends[market] = research;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[YouResearchService] Error fetching trends for ${market}:`, error);
        trends[market] = [`Unable to fetch current trends for ${market}`];
      }
    }
    
    return trends;
  }
}

export const youResearchService = new YouResearchService();