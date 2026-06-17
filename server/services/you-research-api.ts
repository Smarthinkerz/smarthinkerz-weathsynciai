import fetch from 'node-fetch';

export interface YouResearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  source: string;
  relevanceScore?: number;
}

export interface YouResearchResponse {
  query: string;
  results: YouResearchResult[];
  totalResults: number;
  searchTime: number;
  unavailable?: boolean;
  reason?: string;
}

const EMPTY_RESPONSE = (query: string, reason: string): YouResearchResponse => ({
  query,
  results: [],
  totalResults: 0,
  searchTime: Date.now(),
  unavailable: true,
  reason,
});

export class YouResearchService {
  private apiKey: string;
  private baseUrl = 'https://api.ydc-index.io';
  private keyExpired = false;

  constructor() {
    this.apiKey = process.env.YOU_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[YouResearchService] YOU_API_KEY not configured — research features disabled');
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !this.keyExpired;
  }

  async searchFinancialResearch(query: string, options?: {
    count?: number;
    country?: string;
    freshness?: 'day' | 'week' | 'month' | 'year';
    domains?: string[];
  }): Promise<YouResearchResponse> {
    if (!this.apiKey) {
      return EMPTY_RESPONSE(query, 'YOU_API_KEY not configured');
    }
    if (this.keyExpired) {
      return EMPTY_RESPONSE(query, 'YOU_API_KEY is expired or invalid — please renew');
    }

    try {
      const params = new URLSearchParams({
        query,
        count: (options?.count || 10).toString(),
        ...(options?.country && { country: options.country }),
        ...(options?.freshness && { freshness: options.freshness }),
        ...(options?.domains && { domains: options.domains.join(',') })
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 401 || response.status === 403) {
        this.keyExpired = true;
        console.warn(`[YouResearchService] API key rejected (${response.status}) — marking as expired`);
        return EMPTY_RESPONSE(query, 'YOU_API_KEY is expired or unauthorized — please renew in Secrets');
      }

      if (!response.ok) {
        console.error(`[YouResearchService] API error: ${response.status} ${response.statusText}`);
        return EMPTY_RESPONSE(query, `API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        query,
        results: data.hits?.map((hit: any) => ({
          title: hit.title || '',
          url: hit.url || '',
          content: hit.snippets?.join(' ') || hit.description || '',
          publishedDate: hit.published_date,
          source: hit.domain || 'Unknown',
          relevanceScore: hit.score
        })) || [],
        totalResults: data.hits?.length || 0,
        searchTime: Date.now()
      };
    } catch (error) {
      console.error('[YouResearchService] Network error:', error);
      return EMPTY_RESPONSE(query, 'Network error reaching You.com API');
    }
  }

  async getMarketNews(symbol?: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<YouResearchResponse> {
    const query = symbol
      ? `${symbol} stock market news analysis financial performance ${timeframe}`
      : `stock market news financial markets analysis ${timeframe}`;
    return this.searchFinancialResearch(query, {
      count: 15,
      freshness: timeframe,
      domains: ['bloomberg.com', 'reuters.com', 'marketwatch.com', 'yahoo.com', 'wsj.com']
    });
  }

  async researchInvestment(investmentType: string, riskLevel: string, sector?: string): Promise<YouResearchResponse> {
    let query = `${investmentType} investment opportunities ${riskLevel} risk`;
    if (sector) query += ` ${sector} sector`;
    query += ' analysis recommendations 2025';
    return this.searchFinancialResearch(query, {
      count: 12,
      freshness: 'month',
      domains: ['morningstar.com', 'fool.com', 'seekingalpha.com', 'investopedia.com']
    });
  }

  async getEconomicInsights(country: string = 'US'): Promise<YouResearchResponse> {
    const query = `${country} economic indicators GDP inflation unemployment market trends 2025`;
    return this.searchFinancialResearch(query, {
      count: 10,
      freshness: 'month',
      country: country.toLowerCase(),
      domains: ['fed.gov', 'bls.gov', 'census.gov', 'imf.org', 'worldbank.org']
    });
  }

  async researchCompany(companyName: string, includeCompetitors: boolean = false): Promise<YouResearchResponse> {
    let query = `${companyName} financial analysis earnings revenue growth prospects`;
    if (includeCompetitors) query += ' competitors market position';
    return this.searchFinancialResearch(query, {
      count: 12,
      freshness: 'month',
      domains: ['sec.gov', 'bloomberg.com', 'reuters.com', 'marketwatch.com']
    });
  }

  async getFinancialEducation(topic: string): Promise<YouResearchResponse> {
    const query = `${topic} financial education guide tutorial basics investing`;
    return this.searchFinancialResearch(query, {
      count: 8,
      domains: ['investopedia.com', 'nerdwallet.com', 'kiplinger.com', 'fool.com']
    });
  }

  async searchFundingOpportunities(businessType: string, country: string = 'US'): Promise<YouResearchResponse> {
    const query = `${businessType} business funding grants loans opportunities ${country} 2025`;
    return this.searchFinancialResearch(query, {
      count: 15,
      freshness: 'month',
      country: country.toLowerCase(),
      domains: ['sba.gov', 'grants.gov', 'score.org']
    });
  }
}

export const youResearchService = new YouResearchService();
